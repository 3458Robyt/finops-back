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

Las reglas existentes se interpretan como `DIRECT`. Las condiciones de
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
externo y `resource_link_reason`). Permite auditar y atribuir valor solo cuando
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

## Presupuestos y valor realizado

`ALLOCATION_DESTINATION` usa el cierre cerrado como fuente de costo actual y
no vuelve a calcular una distribución diferente. `Value Realization` enlaza
las líneas cerradas con recomendaciones por tenant, moneda, recurso canónico,
hash de métrica y período exactos. Si falta uno de esos elementos no atribuye
ahorro; el ahorro potencial nunca se presenta como ahorro verificado.

## Seguridad y migraciones

Las migraciones `202608040001`–`202608040006` crean enums, targets, cierres,
snapshots de líneas, grants runtime y la compuerta de preview. Las tablas de
asignación tienen RLS; `anon`, `authenticated` y `service_role` no tienen
acceso directo y el runtime usa `finops_runtime` con contexto tenant.

La aplicación de migraciones desde cero y sobre Supabase se verificó con 42
migraciones. No se eliminan datos históricos; la limpieza de fixtures E2E se
realiza fuera de las migraciones.

## Rendimiento y límites conocidos

El clasificador Node reutiliza el motor existente y se ejecuta en memoria por
tenant/período. El benchmark de 10.000 costos y 10 reglas tuvo mediana de
66,98 ms en cinco iteraciones, con invariantes preservadas. El cierre end-to-end
contra una base productiva todavía requiere un benchmark con volumen real.

No se implementan todavía chargeback contable, asignación automática basada en
IA, costos dinámicos de negocio ni un worker permanente.
