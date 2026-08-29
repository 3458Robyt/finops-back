# Roadmap de Producto — FinOps Inteligente

> **Consolidación técnica inicial 2026-08-11:** la beta integrada ya tiene núcleo FinOps, OCI real, IA
> gobernada, métricas técnicas, presupuestos, asignación, realización de valor y RLS verificados.
> Los pendientes se gestionan en `docs/DEUDA_TECNICA.md` con estados `ABIERTO`, `BLOQUEADO`,
> `DIFERIDO` o `CERRADO`. FOCUS sigue como fuente operativa primaria; OCI Usage API es
> redundancia; AWS real requiere una cuenta/rol externo.
>
> Componentes permanentes añadidos: gobernanza de releases/configuración, higiene de jobs y datos,
> mantenimiento de Supabase, rendimiento de dependencias, calificación periódica del proveedor IA
> y operación productiva activable cuando exista destino de despliegue.

## Roadmap vigente — corte 2026-08-29

### Cierre de la iteración P0/P1

- Estabilizado: reconciliación de leases stale de ingesta, administración
  central y runtime local explícito para que la interfaz no dispare backfills.
- Gobernado: compuerta única de auditoría IA con score mínimo 80/100, checks
  determinísticos, abstención ante evidencia débil, botón de generación durable
  en Dashboard/Consola y pruebas de chat/generación.
- Preparado para AWS: STS AssumeRole/External ID, regiones, EC2/EBS, nombres
  de recursos, CloudWatch con discovery/paginación, Cost Explorer y FOCUS S3
  con manifiestos. Falta únicamente ejecutar contra una cuenta real.
- Probado: backend 529 pruebas unitarias aprobadas, 25 escenarios IA offline,
  arquitectura 403/403 y Playwright mock 10/10; la suite Playwright real de
  solo lectura está implementada pero requiere credenciales locales.

### Siguiente orden consecuente

1. Ejecutar la suite real de Playwright contra Tak 2.0 en modo solo lectura y
   registrar errores por módulo, tenant, viewport y endpoint.
2. Auditar el backfill local de Tak 2.0 con cobertura diaria y por job, y
   resolver INVENTORY_RESOURCE_NOT_FOUND completando el inventario sin
   eliminar costos válidos.
3. Repetir el canary IA live aislado cuando el proveedor esté disponible y
   registrar latencia, tokens, score del auditor, bloqueadores y abstenciones.
4. Aplicar migraciones al destino definitivo cuando deje de ser read-only;
   después ejecutar el canary de OCI Usage API sin duplicar FOCUS.
5. Con una cuenta AWS autorizada, ejecutar el canary de STS/EC2/EBS/CloudWatch/
   Cost Explorer/FOCUS y ajustar únicamente con métricas reales de latencia,
   rate limits y cobertura.
6. Antes de beta operativa, activar secret manager, rate limiting compartido,
   observabilidad, healthchecks, backup/restore y workers supervisados.

### Completado y verificado localmente

- Núcleo multi-tenant, onboarding OCI, inventario normalizado, costos FOCUS/Usage
  API, métricas técnicas con estadísticas nativas, uPlot, rollups y raw
  conservado para drilldown.
- Recomendaciones IA gobernadas: evidencia determinística previa, auditor IA,
  decisiones, planes separados por recomendación, trazabilidad y aprendizaje
  por aprobación/rechazo sin bloquear la operación humana.
- Presupuestos, asignación de costos, ejecución manual, ahorro verificado,
  realización de valor, notificaciones y RLS runtime.
- Backfill técnico raw-first y proyección asíncrona: 2.123.297 muestras raw y
  3.105.765 rollups para Tak 2.0 en el último corte local, con cobertura
  `COVERED`/`PARTIAL`/`NO_DATA` auditable.
- Seguridad y calidad local: 20 helpers FinOps sin exposición a roles API,
  0 vulnerabilidades altas de producción, arquitectura 403/1 excepción,
  suite unitaria 529/11 y suite PostgreSQL aislada aprobadas.

### Cierre técnico inmediato

1. Aplicar las migraciones locales 202608280001–007 en el destino PostgreSQL
   definitivo. Supabase está read-only; no reintentar ni declarar el despliegue
   hasta que el administrador habilite escritura o se seleccione otro destino.
2. Auditar y continuar el backfill de Tak 2.0 por cobertura diaria y por job;
   no declarar 90/90 mientras existan `NO_DATA`, `PARTIAL`, jobs pendientes o
   ausencia de FOCUS actual.
3. Mantener FOCUS como fuente primaria y completar el canary de OCI Usage API
   solo con la policy oficial y permisos externos; evitar duplicar fuentes.
4. Mantener el worker y scheduler manuales durante desarrollo. Antes de operar
   24/7, ejecutar el diseño de despliegue, secret manager, rate limiting
   compartido, healthchecks, logging/alertas y rehearsal de backup/restore.
5. Ejecutar canary IA live con fixtures `persist=false` y registrar latencia,
   tokens, auditoría y abstenciones; no exponer secretos ni cerrar la calidad
   por una indisponibilidad del proveedor. El intento del 2026-08-28 recibió
   HTTP 503 en `/ai/chat`; repetirlo cuando el proveedor esté disponible.

### Bloqueados externamente o diferidos

- AWS real: requiere cuenta, rol `AssumeRole` y permisos de prueba.
- OCI Usage API: requiere policy de `usage-report` y canary read-only si la
  cuenta actual no puede administrarla.
- IA live: `AI-001` queda bloqueado temporalmente por indisponibilidad HTTP 503
  del proveedor; los escenarios offline y las compuertas determinísticas siguen
  siendo la validación vigente.
- Mensajería SMTP/Telegram real: requiere proveedores y credenciales de prueba.
- Operación productiva, secret manager externo, observabilidad centralizada,
  Azure/GCP, distribución de costos compartidos y chargeback financiero.

> **Fuente temporal:** las secciones de corte fechado que aparecen debajo son
> bitácora histórica. Para el estado y el trabajo pendiente se deben usar este
> bloque, `docs/ESTADO_ACTUAL_FINOPS.md` y `docs/DEUDA_TECNICA.md`.

## Corte de implementación 2026-08-24 — backfill, moneda y rendimiento de lecturas

### Entregado en este corte

- PostgreSQL local queda como base de desarrollo para backfills grandes; Supabase
  permanece intacta como staging/rollback.
- El planificador de gaps técnicos ya trabaja oldest-first por ventanas de seis
  horas, con cuatro workers concurrentes, persistencia bounded, reintentos
  controlados y outcomes explícitos (`DATA_WRITTEN`/`NO_DATA`).
- La persistencia de métricas conserva MEAN, MIN, MAX y P95 como observaciones
  independientes; el clon local verificado contiene 1.871.897 muestras raw entre
  el 4 de mayo y el 24 de agosto de 2026.
- `resource_metric_rollups` conserva ventanas agregadas de 30 minutos, una hora
  y un día sin sustituir las muestras raw. El overview de `Tak 2.0` bajó de
  aproximadamente 23,4 s a 0,75 s en su resumen y a 264 ms en una repetición
  local con buffers calientes; percentiles y drilldown mantienen el camino
  exacto raw.
- La visualización de costos dejó de asumir USD: el backend entrega totales nativos,
  convierte a la moneda de reporte mediante `fx_rates`, conserva huecos como
  `null` y la UI advierte conversiones faltantes.

### Estado abierto verificable

1. La cobertura de Tak 2.0 debe seguir verificándose por cobertura diaria y por
   job. El backfill local tiene 22 jobs técnicos `PENDING` porque el worker no
   permanece activo cuando se apaga la aplicación; no declararlo como ingesta
   24/7 ni como cobertura completa hasta procesarlos con `npm run dev:local`.
2. La cuenta personal no tiene capacidad `COSTS` autorizada y su FOCUS actual no
   está disponible; el estado de facturación sigue siendo `PARTIAL`.
3. FOCUS de Tak 2.0 tiene evidencia histórica, pero no se afirma completitud de
   reportes actuales hasta verificar objetos y filas por periodo.
4. AWS real continúa bloqueado hasta contar con una cuenta y rol de prueba.

## Corte de desarrollo 2026-08-23 — PostgreSQL local y cierre operativo de ingesta

Para desarrollo, la base operativa se puede ejecutar ahora en PostgreSQL 17 nativo
(`127.0.0.1:5433/finops_local`). Supabase permanece como origen de clonación,
staging y rollback; no se sustituyó ni se modificó por esta operación. La razón de
usar PostgreSQL local es controlar el almacenamiento durante backfills grandes sin
perder un snapshot reproducible.

### Entregado

- Clon reproducible del esquema `public` y datos de aplicación, con dump inmutable,
  SHA-256, manifiesto y migraciones Prisma posteriores a la restauración.
- Persistencia durable de `ingestion_job_parts` e `ingestion_coverage_segments`;
  nuevas métricas, objetos y filas FOCUS conservan `ingestion_job_id` cuando la
  fuente lo permite.
- Streaming de métricas OCI por lotes acotados, estadísticas nativas MEAN/MIN/MAX/P95,
  progreso por parte, resumen incremental y control de concurrencia sin cargar todo
  el periodo en memoria.
- Scheduler con advisory lock transaccional, recuperación técnica configurable de
  1–90 días (90 por defecto) y worker local coordinado por `dev:local`.
- Verificación local con 8 tenants, 10 conexiones, 737.609 muestras técnicas y
  9.762 filas FOCUS heredadas; la conexión personal alcanzó 183.561 muestras del
  4 de mayo al 23 de agosto de 2026. La prueba de una ventana nueva produjo 44
  llamadas y 44 muestras sin jobs pendientes.

### Límites y siguiente orden

1. Completar la cobertura de costos de la cuenta personal cuando exista la policy
   `COSTS` o se publiquen objetos FOCUS actuales; el estado actual es `PARTIAL`.
2. Revalidar las demás conexiones antes de programar backfills: el scheduler omite
   conexiones sin validación/capacidades vigentes por diseño.
3. Medir el backfill empresarial en el PostgreSQL local por ventanas y conservar
   cobertura por job antes de considerar completa una fecha.
4. Mantener el worker/scheduler manual durante desarrollo; la operación 24/7,
   secret manager externo, observabilidad centralizada y alertas siguen diferidos
   hasta definir un destino de despliegue.
5. AWS real continúa bloqueado hasta disponer de una cuenta y rol de prueba.

Los comandos y la política de snapshots están en
`docs/OPERACION_POSTGRES_LOCAL_INGESTA.md`.

## Corte de implementación 2026-08-19 — ingesta OCI/FOCUS y métricas nativas

La implementación del flujo de ingesta se validó con datos reales de `Tak 2.0` y dejó
la plataforma preparada para continuar el backfill sin mezclar fuentes ni perder la
identidad de los streams. El catálogo contiene 296 definiciones confirmadas de 663
descubiertas, el inventario normalizado tiene 994 recursos, y Supabase conserva 82.400
muestras técnicas separadas en MEAN, MIN, MAX y P95. La conexión ya puede descubrir el
FOCUS administrado por OCI; cuando el periodo solicitado no tiene objetos FOCUS, `AUTO`
usa OCI Usage API como fallback exclusivo.

### Completado en este corte

- Consultas OCI Monitoring consolidadas por tenancy con `compartmentIdInSubtree=true`
  y fallback por compartimento solo ante una denegación explícita.
- Rate limiting compartido por tenancy para descubrimiento, métricas y jobs concurrentes;
  dos jobs reales procesaron 19.776 muestras cada uno con 100 % de enlace a recursos.
- Descubrimiento de namespaces sin lista fija, normalización de OCIDs y preservación de
  dimensiones/hash de stream en persistencia y agregados.
- FOCUS autodetectado en `bling/<tenancy>/FOCUS Reports`, filtrado por periodo antes de
  persistir y fallback Usage API sin sumar ambas fuentes.
- Validación OCI con deadline, señales cancelables y cliente Usage API sin el
  circuit-breaker incompatible; las cinco capacidades de la conexión empresarial están
  disponibles en el canary controlado.
- Separación del helper de metadatos de definiciones para mantener el repositorio de
  jobs bajo el límite arquitectónico sin cambiar contratos.
- Backend `test:all` (495 pruebas, 11 omitidas), frontend build y Graphify actualizados.

### Pendiente inmediato

1. Continuar y observar los 129 jobs técnicos `PENDING` del backfill de Tak 2.0; no
   declarar cobertura histórica completa hasta que finalicen o se documenten sus
   ventanas sin datos.
2. Perfilar la persistencia bulk en Supabase remoto: la consulta OCI ya está optimizada,
   pero la actualización de resúmenes/transacciones sigue siendo el cuello de botella.
3. Enriquecer los 19 recursos sin nombre legible y medir la cobertura por namespace,
   recurso y periodo antes de habilitar nuevas recomendaciones técnicas.
4. Resolver `QA-003` ejecutando la integración PostgreSQL aislada por archivo y
   cerrando todos los pools en `finally`.

## Corte histórico de implementación 2026-08-18 — validación con Tak 2.0

La fase de estabilización de datos reales quedó ejecutada para la conexión OCI de
`Tak 2.0`: inventario multirregión de 953 recursos, proyección de 3.267 filas reales
de Usage API, reconciliación de referencias históricas y 21.536 muestras técnicas
vinculadas. El producto ya puede cruzar costos, inventario y métricas sin inventar
recursos; la readiness queda `PARTIAL` cuando la evidencia no permite un vínculo o una
recomendación técnica segura.

### Completado en este corte

- Inventario OCI normalizado y reconciliación de OCID históricos ausentes del
  Resource Search.
- Proyección de costos por fuente, período, región, servicio, SKU y recurso con
  clasificación explícita de filas enlazadas, históricas, agregadas y no soportadas.
- Catálogo OCI de métricas descubierto y confirmación segura solo para recursos
  presentes en el inventario.
- Persistencia bulk de muestras técnicas con identidad por estadística, granularidad,
  timestamp y dimensiones.
- Compuerta de evidencia y normalizador de recomendaciones reforzados para impedir
  recomendaciones ejecutables cuando faltan métricas técnicas o el vínculo de
  recurso es débil.
- En el corte 2026-08-18 el canary live aislado de chat/recomendaciones/auditoría IA
  había sido aprobado; el estado posterior y vigente conserva el bloqueo cuando
  el proveedor devuelve HTTP 503.
- Backend y frontend verificados con typecheck, pruebas unitarias/offline, lint,
  arquitectura y build.

### Siguiente orden recomendado

1. Resolver `QA-003`: evitar transacciones abiertas y cleanup bloqueado en la suite
   PostgreSQL aislada remota; ejecutar por archivo y cerrar siempre clientes/pools.
2. Perfilar la persistencia de muestras técnicas en Supabase (transacción, triggers,
   índices, pool y capacidad) antes de ampliar el backfill de Tak 2.0.
3. Mejorar la cobertura técnica real de OCI donde el tenant la exponga y mantener la
   abstención para CPU/memoria no disponibles.
4. Convertir la falta de tags y los costos no enlazables en oportunidades visibles,
   sin convertirlas en ahorro estimado ni recomendación ejecutable.
5. Mantener FOCUS como fuente operativa primaria y documentar OCI Usage API como
   redundancia validada; AWS permanece bloqueado hasta disponer de cuenta y rol reales.

### Estado de beta

La beta es funcional para desarrollo manual y para validar el flujo empresarial con
Tak 2.0, pero todavía no se considera lista para operación 24/7. Persisten como
trabajo abierto la latencia de persistencia y la suite de integración remota; los
workers continuos, secret manager externo, observabilidad centralizada y AWS siguen
diferidos o bloqueados según `docs/DEUDA_TECNICA.md`.

> Documento de **propuesta y planificación de producto**. Traza el camino desde el estado actual
> hacia una versión terminada, por fases y con dependencias explícitas.
>
> **No reemplaza** a `REFACTOR_PLAN.md` (plan de refactor de código, ya completado) ni a
> `PROGRESO_ROADMAP_FINOPS.md` (bitácora de avance). Este documento es el **mapa hacia adelante**;
> la bitácora registra lo que ya se hizo.
>
> Última revisión: 2026-08-19.

> **Corte de implementación 2026-08-16:** la ingesta técnica OCI de la conexión personal
> fue reejecutada para 90 días con estadísticas nativas MEAN, MIN, MAX y P95. Se eliminó
> el índice único legado que descartaba estadísticas distintas de MEAN y se alinearon las
> ventanas futuras al límite de 30 minutos. La capacidad directa de costos OCI sigue
> bloqueada por IAM; FOCUS continúa operativo como fuente de costos.

> **Corte de validación 2026-08-13:** se reconstruyó `dist` antes de repetir el canary comparativo de aprendizaje.
> El proveedor respondió y ambos brazos fueron válidos (3/3 recomendaciones aprobadas, ahorros no negativos), pero
> el candidato obtuvo 90 frente a 92 del baseline. La promoción GLOBAL permaneció bloqueada por la compuerta estricta;
> no se interpreta una corrida válida sin mejora como éxito del aprendizaje.

> **Corte de implementación 2026-08-12:** se añadieron escenarios de pronóstico en analítica,
> resumen ejecutivo encolado para correo/Telegram, desactivación reversible de memorias del agente
> y un catálogo determinista de oportunidades de calidad de datos derivado de la trazabilidad. También
> se añadió el reporte protegido `/api/v1/agent/quality` con calibración por tipo, regla y proveedor,
> ahorro estimado frente a verificado y consumo operativo del LLM; las métricas se abstienen de inventar
> precisión o coste si no hay ground truth o precios configurados.
> La evidencia no se convierte en ahorro ni acción cloud automáticamente; AWS real y OCI Usage API
> continúan bloqueados por dependencias externas.

> **Aprendizaje global 2026-08-13:** los patrones recurrentes se mantienen como candidatos `SHADOW` y las memorias
> GLOBAL activas se consultan por alcance, sin depender de FTS. `GlobalLearningPromotionService` exige `MASTER_ADMIN`,
> evidencia comparativa live, mejora estricta, auditoría durable y rollback. El canary reconstruido autenticó correctamente
> tras la migración portable `202608120006_schema_portable_rls_helpers` y produjo 3/3 recomendaciones aprobadas por brazo,
> pero candidate obtuvo 90 frente a 92 de baseline; `AI-008` sigue abierto y no se activó ninguna memoria GLOBAL.

> La sanitización de errores también consume los valores completos de headers `Authorization`/`Proxy-Authorization`
> y `Cookie`/`Set-Cookie`, incluyendo bearer tokens, antes de persistirlos o devolverlos. La regresión está cubierta
> en la suite vigente.

> Los errores de proveedores se sanitizan además en la frontera de persistencia para trazas IA, aprendizaje, ingesta,
> contexto, Telegram e inventario OCI. Los flujos de autenticación, sesiones, recuperación, MFA, notificaciones y
> lectura de oportunidades ya reutilizan el mapeo HTTP compartido; `AUTHENTICATION_FAILED` conserva 401.

> El reporte de calibración consulta recomendaciones y trazas con paginación keyset acotada y agrega los
> resultados por páginas, evitando respuestas históricas sin límite en una sola consulta o respuesta de BD.
> La migración `202608120001_quality_report_keyset_indexes` ya fue aplicada en Supabase y verificada con
> `npm run db:verify:quality-indexes`; ambos planes remotos usan `Index Only Scan Backward`.
> La configuración IA heredada `NVIDIA_*`/`NIM_*` fue retirada después de comprobar que el código vigente
> utiliza la familia `AI_*`; las instalaciones antiguas deben migrar sus variables antes de arrancar.

> **Higiene de autenticación 2026-08-12:** el proceso `scheduler` puede ejecutar una limpieza bounded de sesiones,
> refresh tokens, recuperación y desafíos MFA expirados mediante `AUTH_CLEANUP_SCHEDULER_ENABLED`; el contexto RLS
> es exclusivo de `finops-maintenance:auth-lifecycle`, las consultas están indexadas por `expires_at` y no se
> eliminan registros aún vigentes.

> **Observabilidad de procesos 2026-08-12:** API, workers y schedulers registran un heartbeat durable por instancia
> en `runtime_process_heartbeats`, con estados `RUNNING`/`STOPPED`, RLS por `app.worker_id` e intervalos configurables.
> La integración aislada de PostgreSQL comprobó el propietario, el aislamiento entre procesos y el shutdown ordenado;
> la detección de stale queda disponible aunque un proceso termine abruptamente.

> **Readiness operativo 2026-08-12:** `GET /ready` comprueba base de datos, rol runtime, migración esperada,
> capacidad de advisory lease y heartbeat fresco; informa la IA como capacidad opcional sin bloquear endpoints
> determinísticos. `DB_EXPECTED_MIGRATION` es obligatorio en producción. El runbook de backup/restore, rotación,
> pérdida de worker y rollback RLS está en `docs/OPERACION_RECUPERACION.md`; el rehearsal formal permanece diferido.

> **Roles operativos granulares 2026-08-12:** el mismo artefacto puede aislar
> `ingestion-worker`, `learning-worker`, `recommendation-analysis-worker`,
> `savings-reconciliation-worker`, `ingestion-scheduler`,
> `recommendation-analysis-scheduler` y `notification-scheduler`, además de
> `auth-cleanup-scheduler` y `budget-scheduler`. Los alias `worker`, `scheduler`
> y `all` permanecen
> para compatibilidad; esta separación no implica que el desarrollo local deba
> mantener procesos permanentes.
>
> **Cierre incremental 2026-08-12:** la suite PostgreSQL aislada completa aplicó las 64 migraciones locales y pasó
> 10 archivos/17 pruebas más auth cleanup y heartbeat/readiness; se corrigieron la rama DELETE del worker de limpieza
> en `202608120007` y los grants API residuales en `202608120008`. Supabase principal tiene 64 migraciones aplicadas,
> con ACL de helpers FinOps verificada sin exposición a roles API. No se ejecutaron pruebas destructivas contra datos de negocio.

> **Smoke API 2026-08-12:** `npm run test:api:smoke:isolated` pasó 35 verificaciones generales y el smoke de
> onboarding: autenticación HTTP, lecturas operativas, asignación/presupuestos, cambio de tenant, mutaciones
> denegadas al viewer, aislamiento cross-tenant y redacción de secretos. El schema y las credenciales temporales
> se eliminaron al finalizar.
>
> **Cierre incremental 2026-08-11:** se completó el ciclo persistido de sesiones, el saneamiento de logs,
> la cobertura explícita del inventario OCI, la frescura de validación del scheduler y controles determinísticos
> adicionales para utilización, alcance de planes, idioma, ahorro máximo, payloads ejecutables y salida sensible.
> El corte vigente es `npm run test:all`: 109 archivos aprobados, 5 omitidos, 451 pruebas pasadas y 11 omitidas; IA offline 25/25. AWS real, OCI Usage API, rate limiting distribuido, secret manager externo y operación 24/7 siguen
> bloqueados o diferidos según la deuda técnica; no se simulan para declarar el roadmap completo.
>
> Las secciones con fecha conservan snapshots históricos y no deben usarse para inferir conteos actuales.
> Para el estado vigente prevalecen la sección 1, la sección 3, `docs/ESTADO_ACTUAL_FINOPS.md` y
> `docs/DEUDA_TECNICA.md`.

> **Modularización vigente:** los últimos refactors separaron valor realizado, procesamiento de análisis IA y
> motor determinístico de asignación sin cambiar contratos HTTP, puertos de dominio ni invariantes financieras.

> **Estabilización empresarial 2026-08-14:** ya están implementados los controles de
> estadísticas nativas OCI/AWS, filtros server-side del inventario, invitaciones
> de portal cliente con entrega SMTP opcional y auto-vinculación segura de Telegram. Las seis migraciones
> nuevas ya fueron aplicadas en Supabase; `prisma migrate status` confirma 70/70,
> Security Advisor no tiene lints y Performance Advisor no tiene WARN. El canary RLS remoto pasó. La validación de la cuenta
> empresarial queda pendiente de rotación de credenciales; AWS continúa en standby.

---

## 1. Estado actual (qué está hecho de verdad)

Incluye presupuestos mensuales persistentes por tenant, cuenta o servicio, evaluación manual de umbrales y alertas idempotentes. Existe un `budget-scheduler` opt-in, tenant-scoped e idempotente; permanece apagado en desarrollo y su operación continua se difiere hasta disponer de un destino productivo (OPS-002).

### Núcleo funcional y verificado
- **Arquitectura:** Clean Architecture (domain / application / infrastructure / presentation), ESM,
  TypeScript estricto. Backend Node.js + Express; frontend Vite + React + Tailwind.
- **Multi-tenant MSP:** modelo jerárquico (organización operadora → clientes contratantes → usuarios).
  JWT + roles (`ADMIN`, `VIEWER`, `OPERATOR_ADMIN`, `FINOPS_TECHNICIAN`, `CLIENT_APPROVER`,
  `CLIENT_VIEWER`). Aislamiento por `tenantId` aplicado en servicios y repositorios.
- **Datos:** Prisma sobre Supabase/PostgreSQL; migración de fundación MSP aplicada; `provider_catalog`
  con `aws` y `oci`.
- **Analítica:** costos, forecast, tendencias, consumo, costo unitario e insights de eficiencia.
- **IA:** generación de recomendaciones mediante API OpenAI-compatible con **auditor IA independiente**; planes de
  ejecución auditados; aprobación/rechazo con aprendizaje asíncrono; Context Engine, memoria,
reglas TAK y trazas de contexto. El grafo visual fue retirado por baja utilidad practica.
- **Evaluación de calidad IA:** rúbrica determinista + golden scenarios (sin llamar al modelo).
- **Inteligencia por recurso:** inventario cloud, detalle 360, oportunidades relacionadas y análisis IA aislado por
  identidad canónica (`cloudResourceId` con `cloudConnectionId + externalResourceId`); las corridas durables
  también persisten `cloudResourceId`.
- **Canales:** notificaciones in-app; Telegram MVP; correo SMTP y cola outbound durable con scheduler opcional,
  leases, reintentos y estados auditables. La migración de la cola está aplicada en Supabase; los canaries
  externos siguen deshabilitados por defecto hasta configurar proveedores reales.
- **Gobernanza financiera:** reglas DIRECT/SPLIT, preview determinista, cierres por tenant/período/moneda,
  versiones correctivas, snapshot de líneas y distribución por destino para presupuestos y valor realizado.
- **Frontend:** 10 vistas conectadas a endpoints reales (dashboard, consola técnica, detalle de
  recomendación, chat, historial, agente IA, ingesta/calidad, métricas técnicas, perfil, login).
- **Operación del agente:** el feedback humano y el resultado de la auditoría se observan por tenant;
  el resumen no confunde decisión aprobada con memoria aprobada y conserva los estados `PENDING`, `APPROVED`,
  `REJECTED`, `SKIPPED` y `ERROR`. Las memorias LOCAL auditadas pueden activarse; los patrones GLOBAL recurrentes
  pasan primero por un candidato `SHADOW` con golden scenarios y esperan un canary live antes de afectar el contexto.
  La promoción manual está protegida por `GlobalLearningPromotionService`, exige `MASTER_ADMIN`, comparación estricta
  y rollback; el canary live más reciente fue rechazado por no demostrar mejora estricta (90 vs. 92), no por una falla
  de seguridad (`AI-008`).

### Base estructural lista, con validaciones productivas aún pendientes
- **Ingesta:** existen workers persistentes, scheduler, lectura S3/OCI, parser FOCUS streaming y
  persistencia idempotente hacia `focus_cost_line_items`/`cost_metrics`. AWS y OCI tienen adaptadores
  SDK; falta validar con cuentas reales, volumen y credenciales de producción.
- **Métricas técnicas:** OCI Monitoring y AWS CloudWatch ya alimentan `resource_metric_samples`; el
  inventario OCI Compute puede poblar `cloud_resources` y el scheduler ya programa su refresco con validación
  vigente. Falta validar cobertura real histórica, frecuencia operativa y cruces completos por recurso.
- **Onboarding cloud:** flujo reanudable integrado en Ingesta para OCI/AWS, con credenciales
  operativas cifradas, validación por capacidad, FOCUS/API directa, métricas, activación y jobs.
  El stub `provisionWithTemporaryAdmin` fue retirado; FinOps no aprovisiona IAM ni recibe admins
  temporales.
- **Gobierno de datos:** el readiness de lineage muestra cobertura de etiquetas obligatorias por recurso;
  la falta de tags reduce la confiabilidad de asignación y no se oculta como éxito.

### Decisiones firmes (no reabrir sin motivo)
Texto de usuario en español; en UI se dice "oportunidades", no "anomalías"; **sin remediación
automática cloud**; ejecución manual, gobernada y auditable; FOCUS aporta costo y consumo facturado,
**nunca** CPU/memoria/IOPS/throughput; Supabase en desarrollo / PostgreSQL portable; sin
n8n/MCP/Inngest (workers propios con jobs persistidos); el onboarding no solicita administradores
temporales ni modifica IAM del cliente.

---

## 2. Relación con los documentos existentes

| Documento | Qué es | Estado |
|---|---|---|
| `REFACTOR_PLAN.md` | Plan de refactor a <200 líneas efectivas (T-01…T-12) | **Histórico/completado**. No contiene trabajo activo; se conserva como evidencia del refactor. |
| `PROGRESO_ROADMAP_FINOPS.md` | Bitácora de avance (cronológica inversa) | Vigente. Refleja los bloques entregados. |
| `docs/CONTEXTO_INGESTA_DATOS.md` | Contexto histórico de la primera arquitectura de ingesta | **Histórico**; `ONBOARDING_CLOUD.md` describe el flujo vigente. |
| `docs/ONBOARDING_CLOUD.md` | Operación, seguridad, API, readiness y troubleshooting OCI/AWS | **Autoritativo y vigente**. |
| `docs/COST_ALLOCATION_SHARED_CLOSURES.md` | Modelo, invariantes y API de asignación compartida y cierres | **Autoritativo y vigente**. |
| **Este documento** | Roadmap de producto por fases | Nuevo. Llena el vacío: ningún doc previo trazaba el camino producto-completo. |

---

## 3. Roadmap por fases

Las fases se ordenan por dependencia y por si requieren credenciales cloud reales. Las Fases 0 y 1
son ejecutables **sin credenciales**; las Fases 2–4 las requieren.

### Fase 0 — Cierre de lo actual (sin credenciales) · CORTO
- **Hardening base:** `helmet`, rate limiting, CORS configurable, logging estructurado, heartbeat durable por proceso, runtime RLS,
  funciones Supabase endurecidas e índices FK están implementados y verificados. El canary runtime RLS
  pasó con `DB_RUNTIME_ENFORCE=true` y `DB_RUNTIME_ROLE=finops_runtime`; la activación permanente queda
  diferida hasta disponer de un destino de despliegue.
- **Seed/demo sintético** para `ingestion_jobs`, `data_quality_checks`, `cloud_resources`,
  `resource_metric_samples` (claramente marcado como demo) para que las vistas nuevas muestren datos.
- **Verificación en vivo** del stack local cuando Docker esté disponible; CI ya valida PostgreSQL/API de forma aislada.
- **Endurecimiento de prompts medido** contra la rúbrica y los golden scenarios ya construidos.
- **Aprendizaje observable:** el resumen IA por tenant muestra decisiones humanas, estados de auditoría, memorias
  activas y candidatos globales en shadow; el agente no aprende cuando el auditor falla o la evidencia es insuficiente.
  La promoción global requiere comparar calidad con y sin el candidato en un canary live aislado (`AI-008`). El
  mecanismo de promoción y rollback ya está implementado, pero no se habilita sin evidencia válida de ambos brazos.
- **Recuperación MFA:** códigos aleatorios de un solo uso, almacenados como hash, rotables y consumidos
  atómicamente con el challenge; las políticas pre-auth ya no contienen recursión RLS.
- Mantener `REFACTOR_PLAN.md` como referencia histórica; no abrir nuevas tareas allí.

### Fase 1 — Robustez y confianza (sin credenciales) · CORTO/MEDIO
- Tests de integración contra BD real aislada: verificados en un schema Supabase efímero; Docker
  local sigue siendo opcional y CI conserva la ruta PostgreSQL.
- RLS a nivel de base de datos: el contexto Prisma/pg, rol `finops_runtime`, políticas para los 36
  modelos tenant, funciones con `search_path` seguro y permisos API revocados están aplicados y
  verificados en Supabase principal. El canary de aislamiento, workers y rollback está documentado;
  la activación operativa productiva se difiere hasta existir despliegue.
- Permisos multi-cliente reales con `tenant_access_assignments` (técnicos FinOps multi-tenant).
- Autorización backend central para siete roles y dieciséis capacidades, con matriz exhaustiva y guardas
  separadas para decisión, ejecución y ahorro; el frontend permanece como control de experiencia, no de seguridad.
- Gestión/rotación de secretos fuera de `.env` plano y observabilidad centralizada.

### Fase 2 — Validación AWS productiva (requiere credenciales) · MEDIO
El adaptador SDK, STS `AssumeRole`, EC2, CloudWatch, Cost Explorer, FOCUS/S3, worker y onboarding
están implementados y cubiertos con fixtures. La validación real permanece bloqueada por falta de
cuenta/rol AWS; no se usarán admins temporales. Las credenciales AWS de entorno son bootstrap de la
plataforma para `AssumeRole`, no credenciales de los tenants.

### Fase 3 — Consolidación OCI productiva (requiere credenciales) · MEDIO
OCI real está validado para identidad, Compute, Monitoring y Object Storage/FOCUS. La importación
OCI se redujo a módulos específicos y una mediana aproximada de 2,13 s. Usage API permanece como
redundancia requerida, bloqueada hasta aplicar la policy mínima oficial; AUTO opera con FOCUS.

### Fase 4 — Métricas técnicas reales (requiere credenciales) · MEDIO/LARGO · EN CIERRE
Colector de inventario y métricas cada 30 min (SDK/API de AWS/OCI) → `cloud_resources` /
`resource_metric_samples`; agentes opcionales. La trazabilidad normalizada ya está implementada para
costos, métricas y recomendaciones: vínculo exacto por conexión + identificador externo, razones de no
vínculo, backfill paginado/idempotente, cobertura visible en Ingesta y guardrail IA que exige
`cloudResourceId` para evidencia técnica. El análisis por recurso persiste el vínculo canónico y sus
índices ya están aplicados en Supabase. La cobertura histórica OCI se cerró mediante Resource Search y
referencias históricas exactas derivadas de OCID: 8.173/8.173 costos elegibles quedaron enlazados, mientras
555 identificadores de telemetría no facturables (`INVENTORY_RESOURCE_NOT_FOUND`) y 432 costos sin conexión
(`CONNECTION_NOT_AVAILABLE`) se excluyen explícitamente del
denominador técnico. Falta validar frecuencia/volumen productivo. Habilita recomendaciones
con evidencia `COST_USAGE_AND_TECHNICAL` (rightsizing técnico con datos reales, no inferido de FOCUS).
- El job de inventario OCI controlado más reciente persistió 1 recurso en 3,4 s con 2 llamadas SDK.
  El scheduler no encola conexiones cuya validación o capacidades estén vencidas. La gobernanza de tags
  requerida (`environment`, `owner`, `application`, `cost_center`) ya se calcula y se visualiza por tenant.
- La UI de Ingesta explica el denominador elegible, diferencia recursos vivos de referencias históricas y
  muestra clasificación por servicio y conexión sin usar coincidencias fuzzy.

### Fase 5 — Expansión y gobernanza avanzada · LARGO
- Proveedores Azure y GCP (la arquitectura ya los soporta como capacidad de catálogo).
- WhatsApp como canal (Telegram es el MVP); scheduler de notificaciones de ahorro.
- TimescaleDB hypertable para `cost_metrics` (`prisma/timescale.sql` ya existe).
- Paneles de gobernanza y trazabilidad ampliados.
- **La remediación automática cloud queda explícitamente fuera del alcance.**

### Fase transversal — Gobernanza de beta y producción
- Releases por PR, configuración auditable y secretos fuera del repositorio.
- Higiene periódica de jobs, datos E2E y migraciones; revisión de Supabase Advisors.
- Benchmark de dependencias/arranque y consultas con evidencia antes de retirar índices.
- Calificación periódica del proveedor IA con canary, auditor, snapshots y estimación de tokens.
- Workers, healthchecks, observabilidad y alertas 24/7 únicamente cuando exista destino de despliegue.
### Fase 5.1 — Realización de valor · IMPLEMENTADA
- Centro `Valor realizado` con resumen por moneda, embudo del ciclo, tendencia, portafolio paginado, filtros, exportación CSV y enlace al detalle.
- Conciliación determinística e idempotente sobre `recommendation_savings_measurements`, manual y opcional posterior a ingesta; sin ledger paralelo ni llamadas LLM.
- Notificaciones in-app con dedupe específico por medición/estado y canales email/Telegram opcionales mediante el servicio outbound existente. Ver `docs/VALUE_REALIZATION_CENTER.md`.
- Migración aplicada en Supabase, integración PostgreSQL aislada y benchmark con 5 tenants/10.000 recomendaciones/20.000 mediciones verificados. La validación visual E2E autenticada queda como actividad manual de interfaz, no como requisito para habilitar la operación backend.

### Fase 5.2 — Asignación compartida auditable · IMPLEMENTADA · 2026-08-04
- El mismo módulo `CostAllocation` soporta `DIRECT` y `SPLIT`, con porcentajes `Decimal` exactos,
  primera coincidencia determinista, separación por moneda y destino `UNALLOCATED` explícito.
- El cierre es reproducible e idempotente por tenant/período/moneda. Una corrección crea una versión
  nueva y conserva la anterior como `REPLACED`; un cierre `CLOSED` no se edita.
- El preview y la UI exponen fuente, asignado, compartido, no asignado, reglas, período anterior, impacto
  presupuestal por destino y ahorros con evidencia cerrada (sin proyectarlos). La UI muestra estado ABIERTO,
  LISTO, CERRADO o REEMPLAZADO y checklist de cierre. Las líneas preservan recurso canónico, hash de métrica y montos para auditoría.
- Presupuesto y valor realizado por destino reutilizan cierres cerrados y no duplican cálculos. La atribución
  de ahorro requiere evidencia exacta; cuando falta, el sistema no inventa ni distribuye el ahorro.
- Las migraciones `202608040001` a `202608040008` están aplicadas en Supabase; los cierres antiguos sin
  snapshot de líneas conservan sus agregados, pero no habilitan atribución histórica por línea.

---

## 4. Criterio de "versión terminada"

Se considera terminada cuando, además del núcleo actual: la ingesta es productiva y automática para
al menos un proveedor real (Fase 2); existen métricas técnicas reales que enriquecen las
recomendaciones (Fase 4); el aislamiento multi-tenant está aplicado y verificado también en la BD
principal (Fase 1); y el sistema tiene hardening de producción (Fase 0/1). Todo manteniendo las
decisiones firmes de la §1.

## Actualización 2026-08-04 — Distribución compartida y cierre financiero

- Se cerró la fase de asignación compartida sobre el módulo existente: `DIRECT` conserva el comportamiento
  actual y `SPLIT` distribuye exactamente el 100 % con aritmética monetaria Decimal.
- El cierre valida fuente, reglas, consistencia de tenant, moneda, período y estado de ingesta; persiste
  hashes, responsable, versión y líneas de evidencia. El flujo no permite mutar cierres cerrados.
- La página `Asignación de costos` incorpora construcción de reglas, preview, historial/comparación, resumen
  financiero por destino (costo actual/anterior, variación, presupuesto consumido y ahorro) y valor realizado.
  Cuando existe un cierre usa sus resultados; con filtros parciales identifica el costo como dato en vivo.
  Presupuestos por destino consultan el mismo cierre cerrado.
- Se sustituyó el limitador de dependencia vulnerable por una ventana fija en memoria; `npm audit --omit=dev`
  quedó en cero vulnerabilidades. El store compartido para varias instancias sigue siendo requisito de despliegue.
- Supabase quedó al día con 44 migraciones. Las validaciones locales dirigidas, 255 pruebas unitarias pasadas,
  typecheck, build,
  frontend TypeScript y auditoría de dependencias están verdes; no se declara AWS real ni OCI Usage API sin
  prerrequisitos externos.
- El benchmark del cálculo determinista con 10.000 costos y 10 reglas tuvo mediana de 66,98 ms en cinco
  iteraciones. La integración end-to-end con 10.000 costos persistidos midió preview 1.647,36 ms y cierre
  6.604,64 ms en el Supabase actual; el snapshot conserva 10.000 líneas. La compuerta revalida la huella
  canónica de la fuente además de conteo y total. `EXPLAIN (ANALYZE, BUFFERS)` confirmó el uso de
  `cost_metrics_tenant_period_idx` con 10,35 ms de ejecución SQL. Se optimizó el insert masivo y se
  documentó la brecha frente a los objetivos orientativos de 500 ms/2 s, que debe reevaluarse con un entorno
  de despliegue representativo antes de fijar un SLA.
- La integración desde schema vacío pasó 5/5 con las 44 migraciones y el hardening de RLS; readiness tuvo
  mediana de 212,80 ms en cinco lecturas, con un outlier de 607,78 ms que debe reevaluarse con volumen estable.
- La integración específica de asignación pasó 3/3 contra un schema temporal: flujo completo de costos,
  regla, preview, activación, cierre idempotente, FK tenant-aware y bloqueo de mutación de evidencia cerrada.

## Actualización 2026-08-03 — Canaries internos cerrados

- Los PRs frontend #19 (`11fb31c`) y backend #16 (`cb78e4c`) se fusionaron en ese orden, con CI verde;
  `main` local se actualizó por fast-forward y los cambios posteriores viven en
  ramas de cierre independientes (`feat/post-beta-canary-closure` y
  `feat/resource-lineage-readiness`).
- El canary runtime RLS pasó contra Supabase principal con `finops_runtime`: dos tenants, contexto de
  usuario/worker, consultas operativas y conteo cross-tenant cero. La activación permanente está diferida
  hasta disponer de un entorno desplegado; el procedimiento de rollback está en `docs/RUNTIME_RLS_CANARY.md`.
- El canary IA real pasó en schema aislado y con `persist=false`: chat en español, tres recomendaciones,
  snapshot canónico, evidencia determinística, auditoría, trazabilidad y ahorros no negativos. La última
  generación tardó 54.662 s y registró una estimación de 4.093 tokens; el schema/fixtures se eliminaron al finalizar.
- `AI-001` y `SEC-001` quedan cerrados técnicamente. No se declara producción permanente, AWS real ni OCI
  Usage API resueltos sin sus prerrequisitos externos.

## Actualización 2026-08-03 — Trazabilidad canónica cerrada en la rama de entrega

- El trabajo continúa en `feat/resource-lineage-readiness`, sin merge directo a `main`; PR backend #18 y
  frontend #20 contienen los cambios de esta fase.
- Las migraciones `202608030003_resource_lineage_readiness_indexes` y
  `202608030004_analysis_run_canonical_resource` están aplicadas en Supabase y en schemas aislados.
- El vínculo válido entre inventario, costos, métricas y recomendaciones es exacto por conexión e identificador;
  los duplicados de `externalResourceId` se bloquean hasta resolver `cloudResourceId` canónico. El readiness
  por tenant/conexión expone frescura, bloqueadores y contadores de reconciliación.
- La integración PostgreSQL pasó 5/5 y la mediana de readiness fue 186,46 ms con volumen representativo.
- El canary IA real con `gpt-5.4-mini` pasó generación, auditoría y persistencia aislada; el canary OCI read-only
  leyó Compute, Monitoring, Object Storage/FOCUS y dejó explícitamente `COSTS=DENIED`.

## Actualización 2026-07-28 — Beta integrada y segura (histórica)

- La rama de trabajo integrada consolida el valor realizado, onboarding, análisis gobernado y el
  contexto runtime tenant-aware sin alterar la baseline aprobada.
- La batería reproducible validó login, cambio de tenant, recomendaciones, análisis IA fixture,
  inventario, métricas, evidencia, decisión y ejecución manual con RLS runtime activo.
- Las cinco migraciones runtime/RLS ya fueron aplicadas y resueltas en Supabase `public`; la
  prueba de contexto pasó contra la base principal y el E2E completo pasó en schema aislado.
- Este bloque fue cerrado posteriormente por los canaries del 2026-08-03; la activación permanente sigue
  diferida por no existir todavía un destino de despliegue.

---

## 5. Actualizacion 2026-06-05 - Ingesta SDK OCI/AWS (histórica)

Estado actualizado del roadmap general:

- Ya existe una base de worker persistente sobre ingestion_jobs, activable con INGESTION_WORKER_ENABLED=true, con claim por FOR UPDATE SKIP LOCKED, reintentos, started_at, completed_at y
result_summary.
- Ya existe una primera rebanada de conectores SDK:
  - OCI: OciSdkIngestionProvider recolecta TECHNICAL_METRIC via OCI Monitoring usando metadata.ociMetricDefinitions.
  - AWS: AwsSdkIngestionProvider recolecta TECHNICAL_METRIC via STS AssumeRole + CloudWatch GetMetricData usando metadata.awsMetricDefinitions.
- Avance 2026-06-05: ya existe parser FOCUS comun y lectura por objetos configurados para AWS S3 (awsFocusExportObjects) y OCI Object Storage (ociFocusReportObjects). Queda pendiente discovery automatico de particiones/exports y benchmark con cuentas reales.
- Sigue pendiente la parte canonica de costos/consumo FOCUS productiva:
  - OCI Cost Reports/Object Storage hacia focus_cost_line_items.
  - AWS Data Exports/S3 hacia focus_cost_line_items.
- Sigue pendiente benchmark SDK vs CLI con cuenta real: duracion total, llamadas API, muestras por segundo, errores y cobertura.
- No se debe inferir CPU/memoria/IOPS desde FOCUS. Memoria en AWS/OCI solo se considera evidencia tecnica cuando exista agente/namespace que la entregue.
- Hallazgo de seguridad:
npm install reporto 174 vulnerabilidades transitivas. No se ejecuto
npm audit fix --force para evitar cambios destructivos; queda como tarea controlada.

- Avance 2026-06-05 adicional: AWS/OCI ya soportan discovery por prefijo (awsFocusExportLocations, ociFocusReportLocations) con limite maxObjects para evitar barridos gigantes. Se agrego
npm run ingestion:worker:once para benchmark manual de un job pendiente.

- Avance 2026-06-05 adicional 2: OCI TECHNICAL_METRIC ya fue probado contra Supabase con credencial OCI cifrada. Se agregaron scripts operativos `npm run oci:register-profile` y `npm run ingestion:create-job`. El benchmark historico sobre OCI Monitoring proceso 11 metricas y normalizo 429 muestras en 660 ms internos. El principal hallazgo fue de integracion SDK: la respuesta TypeScript expone `items`; leer `summarizedMetricsData` producia 0 muestras aunque OCI CLI si devolvia datos. Queda pendiente prueba AWS real y ejecucion con ventana diaria viva.

- Avance 2026-06-05 adicional 3: se agrego base operativa AWS con `npm run aws:register-role` para credencial cifrada basada en `AssumeRole` + `ExternalId`, y prueba unitaria del mapeo CloudWatch `GetMetricData` hacia muestras tecnicas. Falta credencial/rol real para benchmark AWS productivo; la estrategia se mantiene separada: AWS Data Exports FOCUS para costo/uso facturado y CloudWatch para CPU/red/disco/memoria cuando haya agente.

- Avance 2026-06-05 adicional 4: se agrego `npm run ingestion:schedule` como programador seguro de jobs recurrentes. Corre en dry-run por defecto y requiere `--apply` para crear registros en `ingestion_jobs`. Tambien puede correr dentro del backend con `INGESTION_SCHEDULER_ENABLED=true`. Evalua conexiones activas AWS/OCI, credenciales activas, metadata real de metricas/FOCUS y cooldowns para evitar duplicados. Esto completa la base operativa scheduler + worker: el scheduler encola y el worker procesa. Sigue pendiente definir frecuencia productiva y configurar FOCUS real/AWS real.

- Evidencia adicional: scheduler `--apply` + worker procesaron un job OCI vivo de `TECHNICAL_METRIC` con 11 llamadas OCI y 11 muestras normalizadas; un dry-run posterior no creo duplicados por cobertura reciente. Esto valida la ruta automatizable scheduler -> job persistido -> worker -> `resource_metric_samples`.

- Avance 2026-06-05 adicional 5: el readiness de ingesta ya no depende solo del CLI. Existe `GET /api/v1/ingestion/readiness` y la vista `Ingesta` muestra preparacion productiva por tenant: conexiones, credenciales, metadata, jobs recientes e issues. Esto mejora la gobernanza operativa para saber exactamente que falta antes de activar ingesta automatica por cliente.

- Avance 2026-06-11: OCI FOCUS real ya esta conectado de punta a punta hasta la capa analitica. El worker `BILLING_EXPORT` descarga reportes FOCUS desde Object Storage, guarda `focus_cost_line_items`, proyecta idempotentemente a `cost_metrics`, actualiza watermark/readiness y conserva quality check. Evidencia: job `cmq91sgea0000fc52feo0c6rh`, 20 objetos, 533 filas FOCUS, 533 metricas analiticas proyectadas, 432 nuevas insertadas, 0 warnings. Pendiente critico: AWS real sigue bloqueado por falta de rol/conexion y la persistencia FOCUS requiere optimizacion por lotes antes de subir volumen.

- Avance 2026-06-11 adicional: la Fase 4 ya tiene capa visual/analitica para metricas tecnicas. La seccion `Metricas de uso` muestra KPIs, series temporales, filtros por recurso/grupo/metrica/rango/granularidad, oportunidades tecnicas y costo asociado solo con match exacto por recurso. Sigue pendiente mejorar ingesta viva y normalizar inventario para poblar `cloud_resources` de forma consistente.

## 6. Actualizacion 2026-06-17 - Reconciliacion del estado real

Estos puntos sustituyen las afirmaciones antiguas del documento que decian que no existian conectores reales o que las metricas tecnicas estaban vacias:

- La ingesta productiva ya tiene base real para OCI FOCUS y OCI Monitoring; AWS tiene base de proveedor SDK y queda pendiente prueba con rol/cuenta real.
- `cloud_resources` ya no depende solo de datos manuales: los jobs de ingesta crean recursos desde inventario declarativo y, si falta inventario completo, desde las metricas tecnicas recolectadas.
- `resource_metric_samples.cloudResourceId` se enlaza durante la persistencia y se reconcilia para muestras previas de la misma conexion/recurso, habilitando cruces costo-metrica-recomendacion mas confiables.
- Las recomendaciones `COST_USAGE_AND_TECHNICAL` ahora tienen guardrails: requieren referencias tecnicas, recurso enlazado, cobertura/muestras suficientes y frescura. Si no, deben quedar como validacion tecnica pendiente.
- El hardening ya no parte de cero: existen `helmet`, CORS configurable multi-origen, rate limits globales/especificos, logging estructurado por request y RLS runtime aplicado en Supabase principal. En la fecha de esta entrada quedaban pendientes la activación/canary del enforcement, gestión externa de secretos, observabilidad centralizada y benchmark con volumen representativo; el canary se cerró el 2026-08-03.
- Pendiente critico vigente: validar inventario SDK Compute/EC2 con cuentas reales y benchmark, AWS productivo, activación RLS runtime, observabilidad centralizada y cierre de documentos históricos que aun usen terminos anteriores.

## 7. Actualizacion 2026-07-11 - Ciclo operacional de recomendaciones

- El núcleo de recomendaciones ya cubre preview/persistencia auditada, deduplicación por período factual, plan manual auditado, decisión humana estructurada, aprendizaje durable, ejecución manual, KPIs, recordatorios calculados y timeline.
- La aprobación no equivale a ejecución: el ahorro observado solo se registra mediante `recommendation_manual_executions` con estado, usuario, fecha, notas y evidencia.
- La operación automática continua continúa fuera del alcance de desarrollo: el worker de aprendizaje puede procesar eventos cuando el backend está encendido, pero no se activa ingesta diaria ni remediación cloud automática.
- Pendiente para el cierre productivo: validar el E2E completo en CI tras fusionar, inventario SDK OCI/AWS con cuentas reales y los ítems de seguridad/operación ya registrados en deuda técnica.

## 8. Actualizacion 2026-07-11 - Evidencia técnica canónica del agente

- La IA ya no depende de texto técnico reparseado: `RecommendationEvidenceSnapshot` concentra, versiona y hashea los hechos de costo/consumo, métricas agregadas, cobertura, frescura, vínculo y reglas por recurso.
- El mismo artefacto se entrega a la compuerta de readiness, prompt del generador, auditor IA, rúbrica determinística, evidencia persistida y detalle visual. Una referencia o métrica inventada, cobertura insuficiente, dato obsoleto o regla bloqueante impide una acción técnica ejecutable.
- El aprendizaje aprobado/rechazado también se incorpora en análisis aislados por recurso, pero solo como contexto auditado; los hechos siguen limitados al snapshot del recurso exacto.
- La evaluación offline cubre CPU, memoria, red, disco, evidencia escasa, datos obsoletos, señales contradictorias, costo sin métrica y referencias inventadas. El canary real descrito entonces como opcional quedó cerrado técnicamente el 2026-08-03.

## 9. Actualizacion 2026-07-12 - Asignación de costos

- El showback por centro de costo, unidad de negocio, proyecto, equipo y ambiente está implementado sobre `cost_metrics`, dimensiones FOCUS y tags existentes; no requiere credenciales cloud nuevas ni IA.
- La prioridad hace la asignación determinística y auditable: la primera regla activa coincidente recibe el gasto y el resto queda visible como `Sin asignar`.
- El siguiente incremento funcional, cuando el showback sea validado por técnicos, será decidir si se necesitan costos compartidos porcentuales; chargeback o facturación no pertenecen a esta etapa.

## 10. Actualización 2026-07-16 - Onboarding cloud integrado

- Ingesta incorpora un onboarding reanudable por tenant para OCI y AWS: conexión, credencial
  cifrada, validación por capacidad, fuente de costos, FOCUS, métricas, activación y recuperación de
  jobs. La guía vigente es `docs/ONBOARDING_CLOUD.md`.
- Se retiró el provisioning temporal incompleto. La plataforma solo registra accesos operativos
  read-only y no modifica IAM del cliente.
- La activación es idempotente, responde `202` y delega el trabajo a jobs persistentes. Se pueden
  reintentar fuentes fallidas y cancelar ventanas pendientes sin borrar histórico.
- OCI real quedó `PARTIAL`: identidad, inventario, métricas y FOCUS disponibles; Usage API denegada
  por policy. AWS conserva cobertura con fixtures y requiere una cuenta real para canary productivo.
- Supabase tiene unicidad parcial para jobs activos, acceso PostgREST directo revocado en las
  tablas operativas de onboarding y RLS runtime aplicada en las tablas del producto. La deuda
  restante era activar el enforcement desde el backend y verificarlo en canary; el canary pasó el 2026-08-03.

## 11. Actualización 2026-07-23 - Análisis gobernado post-ingesta

- El paso entre ingesta y recomendaciones ya es una operación durable: una corrida tenant-scoped
  registra selección de datos, análisis determinístico, compuerta de evidencia, generación,
  auditoría, persistencia y notificación.
- La misma evidencia canónica alimenta al generador, auditor, deduplicación y trazabilidad. Una
  corrida sin evidencia suficiente termina de forma explicable y no consume tokens de IA.
- El worker es reanudable e idempotente; el disparador automático post-ingesta está implementado
  con cooldown, pero desactivado durante desarrollo. La UI permite operación manual y consulta
  read-only.
- Estado de validación en la fecha de esta entrada: unitarias, golden scenarios offline, PostgreSQL aislado y E2E con fixtures
  aprobados; esquema aplicado en Supabase. El canary de proveedor IA real se cerró posteriormente
  (`AI-001`); AWS real continúa bloqueado externamente (`AWS-001`).
- Próximo incremento de producto recomendado: medir ahorro observado después de la ejecución manual,
  sin confundir ahorro estimado, proyectado y confirmado.

## 12. Actualización 2026-07-25 - Medición verificable post-ejecución

- Se implementó `recommendation_savings_measurements` para separar ahorro reportado por el usuario,
  ahorro observado/calculado, proyección mensual, aumentos de costo y ahorro verificado.
- El cálculo usa ventanas UTC comparables, agregación SQL por tenant/cuenta/proveedor/alcance,
  hash idempotente, historial inmutable para resultados verificados y verificación humana explícita.
- La UI de detalle permite calcular/recalcular, revisar cobertura, fuente, base de costo, método,
  unidades, evidencia técnica y verificar o rechazar el resultado.
- La evidencia técnica posterior reutiliza las reglas de saturación existentes y exige CPU/memoria
  con cobertura mínima para verificar recomendaciones ligadas a recursos; una señal crítica bloquea
  la confirmación.
- Migraciones aplicadas en Supabase: `202607250001_verified_savings_measurements` y
  `202607250002_savings_unit_normalization`. No se insertaron fixtures productivos.

## 13. Actualización 2026-08-04 - Distribución compartida y cierres reproducibles (snapshot superseded)

> **Histórico superseded:** el detalle vigente está en `Fase 5.2`, en la actualización
> 2026-08-04 de la sección anterior y en `docs/COST_ALLOCATION_SHARED_CLOSURES.md`.

- La asignación existente evolucionó sin crear un segundo módulo: las reglas conservan DIRECT y agregan SPLIT con múltiples destinos y porcentajes que suman exactamente 100 %.
- La clasificación sigue siendo determinística: primera regla coincidente, `UNALLOCATED` cuando no existe coincidencia, separación por moneda, `Decimal` interno y residuo de redondeo en el último destino.
- Se añadieron `cost_allocation_rule_targets` y `cost_allocation_closures`. Las reglas históricas se convierten en destinos DIRECT explícitos de 100 %; no se convierten automáticamente cierres históricos.
- El cierre se registra por tenant/período/moneda con hash de costos y reglas, resultados por destino, responsable, versión y estado. La repetición idéntica es idempotente; costos tardíos o correcciones generan una versión reemplazante con motivo y conservan historia.
- La sección actual `Asignación de costos` incorpora constructor DIRECT/SPLIT, suma visible, preview con reglas usadas y comparación mensual, costos compartidos, confirmación de `UNALLOCATED` e historial de cierres. Se añadieron endpoints de cierre, consulta histórica y comparación de versiones.
- Supabase reportaba 38 migraciones en este snapshot; esa cifra es histórica. El propio snapshot de
2026-08-04 registraba 44; el repositorio local contiene 55 migraciones al 2026-08-11 y las tres últimas
(`202608110009` a `202608110011`) están aplicadas/verificadas en Supabase principal. Este estado está documentado en
  `docs/ESTADO_ACTUAL_FINOPS.md` y `docs/DEUDA_TECNICA.md`.
- En este snapshot quedaba pendiente integrar presupuestos y valor por destino; ese trabajo está implementado y verificado en Fase 5.2. No se implementará contabilidad ni chargeback.
