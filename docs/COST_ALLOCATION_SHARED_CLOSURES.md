# Asignación compartida y cierres financieros

Fecha de referencia: 2026-08-04

Este documento describe el módulo existente de `CostAllocation`. No crea un
submódulo paralelo: las reglas históricas y las nuevas reglas de distribución
comparten el mismo servicio, motor determinista, preview, auditoría y CSV.

## Propósito y límites

El módulo transforma costos fuente en un showback reproducible por tenant,
período y moneda. Está preparado para un futuro chargeback, pero no calcula
contabilidad, facturación, impuestos ni cobros.

La asignación nunca usa IA para decidir el destino. El sistema solo aplica
reglas explícitas y conserva `UNALLOCATED` cuando no encuentra una coincidencia.

## Flujo operativo

1. Un administrador o técnico autorizado crea una regla en estado `DRAFT`.
2. La regla se previsualiza contra un período y se revisan totales, destinos,
   costos compartidos, no asignados y período anterior.
3. La regla se activa; la prioridad determina la primera coincidencia.
4. El usuario consulta el resumen, presupuesto e impacto por destino.
5. Para cerrar, confirma explícitamente el costo `UNALLOCATED` y el backend
   verifica fuente, reglas, jobs de facturación, tenant y totales.
6. El cierre se guarda como `CLOSED`. Una corrección no edita esa versión:
   crea otra y marca la anterior como `REPLACED` con la razón indicada.

## Modos de regla

| Modo | Comportamiento | Destinos |
|---|---|---|
| `DIRECT` | Asigna el 100 % a un único destino, manteniendo el comportamiento legado. | Dimensiones existentes: centro de costo, unidad, proyecto, equipo y ambiente. |
| `SPLIT` | Divide cada costo coincidente entre varios destinos con porcentajes explícitos. | Dos o más destinos; la suma exacta debe ser 100 %. |

Las reglas existentes se interpretan como `DIRECT` y conservan un destino
explícito del 100 %; las nuevas reglas `DIRECT` también persisten ese destino.
Las condiciones de
coincidencia actuales (cuenta, proveedor, servicio, región, recurso y
etiqueta) se mantienen; la prioridad se ordena de forma determinista.

## Modelo de datos

### `cost_allocation_rules`

Configuración versionada de la regla: `tenant_id`, condiciones, `priority`,
`status`, `allocation_mode`, `configuration_version`, `configuration_hash`,
vigencia (`effective_from`/`effective_to`), creador y fechas.

### `cost_allocation_rule_targets`

Destinos de una regla `SPLIT`. Cada fila pertenece al mismo tenant y regla por
una relación compuesta, guarda `percentage` con cuatro decimales y las
dimensiones de negocio del destino.

### `cost_allocation_closures`

Snapshot financiero cerrado por `tenant_id + period_start + currency + version`.
Conserva `source_total`, `allocated_total`, `shared_total`,
`unallocated_total`, `source_hash`, `rules_hash`, resultados agregados,
responsable, fecha, estado y razón de reemplazo.

### `cost_allocation_closure_lines`

Snapshot inmutable por línea de costo y destino. Conserva monto fuente,
monto asignado, moneda, `metric_identity_hash`, `allocation_key`, modo,
porcentaje, regla y evidencia de recurso (`cloud_resource_id`, identificador
externo y `resource_link_reason`). En `SPLIT`, `source_amount` se repite como
referencia en cada destino; los totales se reconstruyen sumando
`allocation_amount`, no `source_amount`. Permite auditar y atribuir valor solo cuando
la evidencia exacta coincide. Los cierres anteriores a la migración de líneas
pueden conservar únicamente resultados agregados.

## Invariantes financieros

- Todos los cálculos monetarios usan `Prisma.Decimal`; no se usa `number` para
  decidir resultados financieros.
- La primera regla coincidente es la única que se aplica a una línea.
- En `SPLIT`, los porcentajes se validan con precisión decimal y suman 100 %.
- El redondeo residual se asigna al último destino en un orden estable.
- Una línea no puede asignarse dos veces.
- Los cálculos se separan por moneda.
- Por moneda se cumple:
  `totalFuente = totalAsignado + totalNoAsignado`.
- El hash de fuente incluye periodo, identidad de métrica, moneda, importe,
  proveedor, cuenta, servicio, región, recurso, vínculo canónico y etiquetas.
  Si cualquiera cambia, no se reutiliza silenciosamente un cierre anterior.
- El hash de configuración incluye únicamente la configuración funcional de la
  regla y sus destinos, no el estado de ciclo de vida ni el contador de versión;
  activar una regla después de un preview no invalida el preview. La secuencia
  ordenada de reglas, incluyendo prioridad e identificador, forma el `rules_hash`.
- `UNALLOCATED` se agrupa por recurso canónico cuando existe; nunca mezcla dos
  recursos de conexiones distintas que compartan el mismo identificador externo.
- El mismo tenant, período, fuente y configuración produce el mismo resultado;
  la misma operación de cierre es idempotente.

## API vigente

Todas las rutas están bajo `/api/v1/cost-allocation` y requieren autenticación.

| Operación | Ruta |
|---|---|
| Reglas | `GET/POST /rules`, `PATCH /rules/:id`, `POST /rules/:id/activate`, `POST /rules/:id/archive` |
| Preview y resumen | `POST /preview`, `GET /summary`, `GET /comparison`, `GET /unallocated`, `GET /resource/:resourceId` |
| Cierres | `POST /periods/close`, `GET /periods`, `GET /periods/:id`, `GET /periods/:id/compare` |
| Exportación | `GET /export.csv` |
| Valor por destino | `GET /api/v1/value-realization/destinations?period=YYYY-MM&currency=USD` |

El cierre exige `confirmUnallocated=true`. La corrección exige una razón y
genera una versión nueva. Los controladores y repositorios validan el tenant
del actor antes de leer reglas, costos, cierres o destinos.

El preview incluye `financialImpact`: consumo proyectado contra presupuestos
por destino y ahorros potenciales, aprobados y verificados que ya tengan
evidencia cerrada. Estos ahorros se muestran como históricos y no se proyectan
por la nueva regla; una atribución nueva requiere cierre, ejecución y evidencia.

La interfaz de `Asignación de costos` expone el historial de cierres y carga
bajo demanda el detalle o la comparación de una versión seleccionada. El
detalle muestra los hashes de fuente y reglas, responsables, totales, estado y
resultados por destino; la comparación identifica la versión anterior y la
razón de reemplazo. La acción `Previsualizar` se distingue del envío de la
regla mediante el botón que originó el formulario, por lo que nunca persiste
una regla accidentalmente.

## Presupuestos y valor realizado

`ALLOCATION_DESTINATION` usa el cierre cerrado como fuente de costo actual y
no vuelve a calcular una distribución diferente. Mientras no exista un cierre
para el período, el costo actual del presupuesto queda explícitamente no
disponible (el preview muestra el costo proyectado, pero no lo convierte en
actual). `Value Realization` enlaza
las líneas cerradas con recomendaciones por tenant, moneda, recurso canónico,
hash de métrica y período exactos. Si falta uno de esos elementos no atribuye
ahorro; el ahorro potencial nunca se presenta como ahorro verificado.

## Seguridad y migraciones

Las migraciones `202608040001`–`202608040008` crean enums, targets, cierres,
snapshots de líneas, grants runtime, la compuerta de preview y la inmutabilidad
tenant-aware de la evidencia. Las tablas de
asignación tienen RLS; `anon`, `authenticated` y `service_role` no tienen
acceso directo y el runtime usa `finops_runtime` con contexto tenant.

La aplicación de migraciones desde cero y sobre Supabase se verificó con 44
migraciones. Las reglas antiguas que tenían un hash de compatibilidad se
normalizan al hash canónico al ejecutar su preview; no se eliminan datos
históricos. La limpieza de fixtures E2E se realiza fuera de las migraciones.

La integración aislada reproducible se ejecuta con
`npm run test:integration:cost-allocation`: crea un schema temporal, aplica
las migraciones, prueba costos → regla → preview → activación → cierre,
idempotencia, FK tenant-aware e inmutabilidad, y elimina el schema en `finally`.

## Rendimiento y límites conocidos

El clasificador Node reutiliza el motor existente y se ejecuta en memoria por
tenant/período. El benchmark de 10.000 costos y 10 reglas tuvo mediana de
66,98 ms en cinco iteraciones, con invariantes preservadas. Para cierres con
más de 500 líneas, la evidencia se persiste mediante un `INSERT` parametrizado
con `jsonb_to_recordset`; los cierres pequeños conservan `createMany`. El
cierre usa una transacción serializable con timeout ampliado para no fallar por
el límite genérico de Prisma cuando el snapshot es grande. La compuerta de
fuente conserva el hash canónico inicial y valida, dentro de la misma
transacción, que el conteo y el total Decimal no hayan cambiado.

La integración aislada con 10.000 costos persistidos se ejecutó contra el
Supabase actual: preview `1.470,90 ms` y cierre `4.560,54 ms`, con 10.000
líneas de evidencia y las tres pruebas de la suite aprobadas. El objetivo
orientativo de 500 ms para preview y 2 s para cierre no se alcanza en esta
ruta directa/remota. `EXPLAIN (ANALYZE, BUFFERS)` confirmó el uso de
`cost_metrics_tenant_period_idx` con 9,704 ms de ejecución del plan para
10.000 filas; la latencia restante está fuera del plan SQL (transferencia y
snapshot de líneas). Debe reevaluarse con un entorno de despliegue
representativo antes de convertirlo en un SLA. El resultado no evidenció
pérdida de datos ni inconsistencia financiera.

No se implementan todavía chargeback contable, asignación automática basada en
IA, costos dinámicos de negocio ni un worker permanente.
