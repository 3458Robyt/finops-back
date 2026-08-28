# Estado Actual FinOps Inteligente

Fecha: 2026-08-28

## Resumen

La plataforma ya tiene backend Node.js/TypeScript, frontend React, PostgreSQL local como base primaria de desarrollo y Supabase conservada como staging/rollback, autenticacion JWT, analitica de costos/consumo, recomendaciones IA con auditor, planes de ejecucion, aprendizaje por aprobacion/rechazo, trazabilidad, Telegram MVP, ingesta FOCUS/metricas para OCI y visualizacion de metricas tecnicas. El corte vigente distingue lo verificado localmente de las operaciones externas bloqueadas por permisos o por el estado read-only de Supabase.

## Corte vigente verificable — 2026-08-28

La evidencia actual de desarrollo corresponde a PostgreSQL 17 local en
`127.0.0.1:5433/finops_local`, con migraciones aplicadas hasta
`202608280007_restore_auth_cleanup_refresh_visibility`. El tamaño observado es
aproximadamente **14.678 MB**; el crecimiento proviene del backfill técnico y de
las proyecciones derivadas, no de una nueva copia de servicios internos de
Supabase.

### Ingesta y cobertura de Tak 2.0

- La conexión empresarial de `Tak 2.0` contiene **2.123.297 muestras raw** y
  **3.105.765 rollups**. El raw conserva **36 recursos**, **108 nombres de
  métrica**, **11 namespaces** y las cuatro estadísticas OCI verificadas
  (`MEAN`, `MIN`, `MAX` y `P95`). El rango observado va del 21 de mayo al 18 de
  agosto de 2026; esto no equivale a 90 días completos.
- Para la ventana de auditoría 2026-05-30..2026-08-30 hay **44.304 ventanas
  COVERED**, **16.157 PARTIAL** y **71.593 NO_DATA**. Los estados explícitos
  distinguen ausencia real de datos, cobertura parcial y datos completos; no se
  convierten gaps en ceros.
- El estado actual de jobs técnicos es **229 SUCCESS, 88 PENDING, 2 RUNNING,
  45 FAILED, 97 CANCELLED y 1 SKIPPED**. Los workers son manuales durante el
  desarrollo y los jobs pendientes no deben interpretarse como datos ya
  descargados.
- No hay filas FOCUS de Tak 2.0 en la ventana actual de 90 días. Se conservan
  **602 filas FOCUS históricas** de 2024 y **711 filas de costos
  `PROVIDER_API`** en COP entre el 18 de julio y el 22 de agosto de 2026. FOCUS
  continúa siendo la fuente operativa primaria; la completitud actual de
  facturación queda declarada como parcial.

### Verificación técnica del corte

- `npm run test:unit`: **120 archivos aprobados, 512 pruebas aprobadas y 11
  omitidas**.
- `npm run test:integration:isolated`: **10 archivos PostgreSQL, 17 pruebas y
  los dos scripts especializados aprobados**; el schema temporal se eliminó en
  `finally`.
- `npm run check:architecture`: **399 archivos de producción**, una excepción
  declarada para fixtures IA.
- `npm audit --omit=dev --audit-level=high`: **0 vulnerabilidades**. Frontend
  typecheck, lint, build y bundle fitness también pasan.
- Los workflows CI de los PR de backend y frontend terminaron en verde después
  de hacer los builds de contenedor independientes del repositorio Git.
- El canary local de RLS confirma **20 helpers FinOps**, ejecución runtime para
  los 20, cero exposición a roles API y cero `search_path` inseguro.

### Límites externos vigentes

- Supabase conserva sus datos, pero está en `read-only`: las migraciones locales
  202608280001–007 no pueden aplicarse remotamente hasta que el administrador
  habilite escritura o se disponga de un destino alternativo. No se afirma que
  estén desplegadas allí.
- AWS real permanece bloqueado por falta de cuenta/rol de prueba. OCI Usage API
  queda como redundancia pendiente de policy/canary externo; FOCUS no depende de
  ese bloqueo.
- La operación 24/7, secret manager externo, observabilidad centralizada y
  alertas productivas siguen diferidos hasta definir un destino de despliegue.
- La última ejecución del canary IA live aislado, el 2026-08-28, recibió HTTP
  `503 Service temporarily unavailable` del proveedor configurado en `/ai/chat`.
  No se persistieron fixtures ni se expuso la clave; por eso `AI-001` permanece
  bloqueado externamente aunque los escenarios offline sigan aprobados.

> **Nota histórica:** los cortes fechados que aparecen debajo de este aviso
> conservan evidencia y decisiones anteriores; no sustituyen el corte vigente
> anterior.

## Corte de estabilizacion de lecturas y jobs — 2026-08-24

- El dashboard consulta el ultimo periodo de costos realmente disponible cuando
  los 90 dias calendario no contienen datos; la respuesta expone `dataAsOf` y
  `staleDays` para no presentar una grafica vacia como si fuera un fallo de
  datos.
- La lectura agregada de metricas tecnicas usa la proyeccion PostgreSQL
  `resource_metric_rollups` (30m/hora/dia), preserva min/max/latest y conserva
  `resource_metric_samples` como fuente canonica para `raw` y drilldown.
- La proyeccion tiene reconstruccion controlada mediante
  `npm run metrics:rebuild-rollups` y refresco incremental por job técnico; la
  migracion es aditiva y no elimina muestras existentes.
- El worker local coopera con cancelaciones, aborta retries/llamadas OCI y la
  readiness informa si existe worker, cuantos jobs estan en cola y cuales son
  stale. `npm run dev:local` inicia API, scheduler y worker juntos.
- El frontend usa `uPlot`, cancela solicitudes obsoletas y mantiene un cache LRU
  acotado de series; al paginar, la serie completa queda cacheada sin duplicar
  solicitudes al cambiar rapidamente de metrica.
- El resumen interactivo de `Tak 2.0` pasó de aproximadamente 23,4 s con la
  agregación raw a 0,75 s mediante el lector diario; el overview completo
  quedó en 264 ms en una repetición local con buffers calientes. Los percentiles del
  detalle/serie siguen consultando raw para conservar exactitud.
- La reconstrucción local quedó verificada con 1.871.897 muestras raw y
  2.861.231 rollups derivados, con cobertura raw del 4 de mayo al 24 de agosto
  de 2026.

## Corte de implementación verificable 2026-08-24 — cobertura y monedas

- La base de desarrollo activa es `127.0.0.1:5433/finops_local`; Supabase no fue
  modificada. El tamaño local observado es **2.819 MB**.
- `Tak 2.0` tiene **1.298.248 muestras técnicas**, **63 días con datos**, desde
  `2026-05-21 04:00 -05` hasta `2026-08-18 18:00 -05`. El catch-up todavía está
  procesando ventanas; la cifra es un corte parcial y no equivale a 90/90 días.
- Distribución de estadísticas de Tak 2.0: **MEAN 325.011, MIN 325.011, MAX
  324.844 y P95 324.555**. Las estadísticas se conservan separadas y pueden
  filtrarse sin reconstruirlas en el navegador.
- El scheduler procesa oldest-first en bloques de seis horas con concurrencia 4,
  backoff/reintentos limitados y persistencia por lotes. Las ventanas fallidas con
  configuración obsoleta se reencolan; el worker también ordena por `target_start`.
  Los periodos sin datos confirmados quedan marcados como `NO_DATA`; no se
  convierten a ceros ni se reencolan indefinidamente.
- La gráfica de costos usa la moneda de reporte del tenant, conserva importes
  nativos, convierte COP/USD con tasas TRM persistidas y muestra gaps o periodos
  sin tasa como advertencia. No se suman monedas nominalmente distintas.
- Costos observados: `Tak 2.0` en COP (1.313 filas, hasta 2026-08-22), `OCI
  Personal Demo` en USD (9.160 filas, 2026-02-26 a 2026-05-05). FOCUS de Tak 2.0
  conserva 602 filas históricas; no se afirma que exista un FOCUS actual completo.
- La cuenta personal conserva 183.781 muestras entre 2026-05-04 y 2026-08-24.

El backfill empresarial continúa en segundo plano durante el desarrollo. La
fecha y los conteos anteriores del documento se conservan como historia, no como
estado vigente.

## Corte de desarrollo verificable 2026-08-23 — clon PostgreSQL local

Durante desarrollo existe una base local PostgreSQL 17 en
`127.0.0.1:5433/finops_local`. El origen Supabase permanece intacto y se conserva
como staging/rollback. El clon contiene el esquema `public` y los datos de la
aplicación; no contiene servicios internos de Supabase. La restauración crea un
snapshot inmutable y aplica las migraciones Prisma pendientes antes de habilitar
los workers.

- El clon conserva 8 tenants, 10 conexiones, 737.609 muestras técnicas y 9.762
  filas FOCUS heredadas. Los jobs `PENDING/RUNNING` importados se archivaron como
  `CANCELLED` para evitar reanudar leases de otro entorno.
- Los jobs nuevos registran partes y segmentos de cobertura. Las muestras y filas
  FOCUS nuevas quedan vinculadas a su `ingestion_job_id` para distinguir datos
  realmente persistidos de jobs solamente encolados.
- El scheduler y worker local se ejecutan con `npm run dev:local`; el scheduler
  tiene advisory lock transaccional, y las métricas técnicas pueden recuperar hasta
  90 días sin duplicar ventanas ya cubiertas.
- La cuenta personal OCI procesó una ventana con 44 llamadas, 44 muestras y
  MEAN/MIN/MAX/P95. La conexión personal conserva 183.561 muestras entre el 4 de
  mayo y el 23 de agosto de 2026.
- La capacidad `COSTS` de la cuenta personal sigue sin autorización y no se
  descubrieron objetos FOCUS actuales en la ventana probada. Por tanto, la
  facturación local se mantiene `PARTIAL` y no se presenta como un histórico
  completo.

La operación está documentada en `docs/OPERACION_POSTGRES_LOCAL_INGESTA.md`.

## Corte operativo verificable 2026-08-19 — ingesta OCI, FOCUS y métricas nativas

La implementación del flujo inventario → descubrimiento → confirmación → backfill se
validó con la conexión empresarial `Tak 2.0`, sin exponer credenciales. Los siguientes
conteos son del corte real de Supabase y deben interpretarse como cobertura disponible,
no como una afirmación de que el backfill histórico ya terminó.

### Ingesta y fuentes de costo

- La validación controlada reporta disponibles `IDENTITY`, `INVENTORY`, `COSTS`,
  `METRICS` y `STORAGE` para OCI.
- La autodetección de FOCUS encuentra el almacenamiento administrado por OCI en el
  namespace `bling`, bajo el prefijo `FOCUS Reports`. El bucket empresarial observado
  contiene objetos históricos de 2024; para periodos actuales sin objeto FOCUS el modo
  `AUTO` usa OCI Usage API como fallback.
- El corte contiene **602 líneas FOCUS** históricas y **621 métricas de costo de
  PROVIDER_API**. Las fuentes no se suman para el mismo periodo: cada corrida conserva
  una única procedencia y la cobertura registra el fallback.
- Se filtraron objetos por fecha del path y filas por `ChargePeriodStart/End` antes de
  persistir; esto evita importar reportes históricos fuera de la ventana solicitada.

### Inventario y métricas técnicas

- El inventario actual de la conexión contiene **994 recursos**: 918 provenientes de
  OCI Resource Search, 5 de OCI Compute SDK, 11 de definiciones métricas y referencias
  históricas de costos; **19** todavía no tienen nombre legible y permanecen como
  deuda de enriquecimiento, no como nombres inventados.
- Se mantienen **663 definiciones** en el catálogo: **296 confirmadas/habilitadas** y
  **380 descubiertas aún deshabilitadas**. La confirmación solo habilita streams con
  identidad y recurso suficientes.
- Hay **82.400 muestras técnicas** y **1.324 resúmenes de streams**. Las cuatro
  estadísticas OCI nativas están separadas: **20.600 MEAN, 20.600 MIN, 20.600 MAX y
  20.600 P95**; cada muestra conserva namespace, región, compartimento, dimensiones,
  hash de stream, timestamp y granularidad.
- Dos jobs concurrentes de una ventana de 24 horas a 1h procesaron cada uno 19.776
  muestras mediante 776 llamadas OCI, enlazando el 100 % de sus muestras a 27 recursos.
  El rate limiter está compartido por tenancy para no multiplicar la tasa al usar
  varias regiones o jobs en paralelo.

### Estado de operación y verificación

- El backfill empresarial continúa en cola: hay **129 jobs técnicos PENDING**, además
  de 48 técnicos SUCCESS, 6 de inventario SUCCESS, 7 de facturación SUCCESS, 1
  SKIPPED y 1 CANCELLED en el corte. No se debe presentar la cobertura actual como
  backfill completo.
- Backend: `npm run test:all` aprobó **116 archivos, 495 pruebas y 11 omitidas**;
  IA offline **25/25**, arquitectura, typecheck, build y release hygiene aprobados.
  Frontend: release hygiene, typecheck, build y presupuesto de bundle aprobados.
- `graphify update .` se ejecutó correctamente. Graphify reportó 5.299 nodos y
  14.500 relaciones; quedan advertencias de extracción SQL por dependencia opcional y
  un test de integración con sintaxis parcial, sin bloquear el build.

## Corte operativo verificable 2026-08-18 — Tak 2.0

Este fue el corte de referencia anterior para validar la plataforma con una cuenta OCI
empresarial con uso real. El corte vigente está arriba, fechado 2026-08-19. Los conteos
distinguen inventario vivo, referencias históricas de costos, muestras técnicas y
evidencia apta para recomendaciones; no se presentan como cobertura total cuando el
proveedor no entrega una relación recurso-métrica confiable.

### Inventario y costos

- La conexión OCI de `Tak 2.0` tiene **953 recursos normalizados** después de la
  sincronización multirregión.
- Una ejecución real de OCI Usage API devolvió **3.267 filas** con moneda COP y sin
  moneda faltante. La proyección persistió **3.158 filas**, creó **30 referencias
  históricas** para OCID válidos ausentes del inventario vivo y dejó **1.520 filas
  enlazadas** durante la primera reconciliación.
- El estado agregado actual de la base contiene **3.683 métricas de costo**, de las
  cuales **1.478 son elegibles**, **1.468 están enlazadas** y **10 permanecen sin
  enlace actual**. Las filas no enlazables restantes corresponden principalmente a
  identificadores lógicos de servicio, agregados de OCI o recursos que no pueden
  resolverse honestamente; no se crean recursos falsos para forzar el join.
- La cobertura de tags requeridos (`environment`, `owner`, `application` y
  `cost_center`) es actualmente **0 %** en el inventario Tak 2.0. Esto se expone como
  oportunidad de calidad de datos y limita el análisis de distribución, no bloquea la
  ingesta básica.

### Métricas técnicas

- Se almacenaron **21.536 muestras técnicas** de Tak 2.0 y el 100 % de esas muestras
  tiene vínculo con un recurso normalizado.
- La conexión tiene **197 definiciones confirmadas respaldadas por recursos** y
  **660 definiciones descubiertas/persistidas** en el catálogo. La confirmación segura
  solo habilita streams cuyo recurso existe en el inventario.
- La cuenta actual no expone definiciones suficientes de `oci_computeagent` ni
  `oci_vmi_resource_utilization`; por tanto, no se afirma que exista cobertura de
  CPU/memoria de Compute ni se generan recomendaciones de rightsizing basadas en
  esas métricas. PostgreSQL, volúmenes, VNIC y otros namespaces quedan sujetos a la
  cobertura real devuelta por OCI.
- El resultado de readiness es `PARTIAL`: hay evidencia técnica vinculada, pero no
  todos los costos tienen recurso resoluble ni todas las familias técnicas necesarias
  para una recomendación ejecutable.

### IA y recomendaciones

- El canary live aislado con `gpt-5.4-mini` pasó chat en español, generación,
  evidencia determinística, auditoría y trazas: **2 recomendaciones**, ambas
  aprobadas por el auditor, sin ahorros negativos; latencia aproximada **62,2 s** de
  generación y **68,0 s** total, con **4.025 tokens estimados**.
- Las recomendaciones técnicas sin evidencia suficiente se normalizan como
  `TECHNICAL_VALIDATION_REQUIRED`, con autorización operativa `NONE` y sin ahorro
  ejecutable inventado. Las recomendaciones financieras se mantienen separadas de
  las técnicas.

### Rendimiento y verificación

- La persistencia bulk redujo el tiempo, pero sigue siendo el principal cuello de
  botella contra Supabase remoto: aproximadamente **256,8 s para 15.848 muestras** y
  **318,2 s para 13.044 muestras**. La mejora adicional requiere perfilar transacciones,
  pool, triggers y capacidad de la base; no se debe eliminar información raw para
  ocultar la latencia.
- Backend: arquitectura, typecheck, suite unitaria, IA offline y build aprobados
  (**487 pruebas pasadas y 11 omitidas** en el corte ejecutado).
- Frontend: typecheck, lint, build y arquitectura aprobados; la verificación de
  release hygiene cubrió 135 archivos.
- La suite PostgreSQL aislada completa **no se declara aprobada**: quedó bloqueada
  después de más de 10 minutos por sesiones `idle in transaction` durante fixtures y
  cleanup en Supabase remoto. El schema temporal fue eliminado manualmente; el caso
  queda registrado como deuda `QA-003`.

## Corte operativo 2026-08-16 — Ingesta OCI personal y estadísticas nativas

- Se aplicaron en Supabase las migraciones `202608160002_oci_ingestion_configuration` y
  `202608160003_drop_legacy_metric_unique`. La unicidad efectiva de
  `resource_metric_samples` incluye ahora `statistic` y `granularity_seconds`, por lo que
  MEAN, MIN, MAX y P95 no se descartan entre sí.
- Las 11 definiciones técnicas OCI de la conexión personal quedaron configuradas con
  MEAN, MIN, MAX y P95. Se completó un backfill de 90 días dentro de la retención móvil
  del proveedor. La base contiene 56.427 muestras MEAN y 37.210 de cada estadística
  nativa MIN, MAX y P95; las estadísticas nativas cubren 2026-05-18 a 2026-08-16 19:00
  UTC y MEAN conserva histórico desde 2026-05-04.
- No quedaron trabajos `PENDING` o `RUNNING` para esa conexión. Los trabajos históricos
  fallidos o cancelados se conservaron para trazabilidad; no se borraron datos de negocio.
- Las ventanas futuras de métricas OCI se alinean al límite de 30 minutos para evitar
  duplicados por desplazamiento de minutos. La fuente de costos sigue siendo FOCUS;
  la capacidad directa `COSTS` de OCI continúa denegada por IAM, mientras Object Storage
  está disponible para los reportes FOCUS.

## Corte vigente 2026-08-13

- La observabilidad operativa ya tiene heartbeat durable por instancia en
  `runtime_process_heartbeats`: API, worker y scheduler registran `RUNNING`,
  renuevan su timestamp con intervalos configurables y marcan `STOPPED` durante
  el shutdown ordenado. RLS limita cada proceso a su propio `process_id` mediante
  `app.worker_id`; la identidad combina rol, instancia y PID para que un reinicio
  controlado reutilice la fila y restablezca su inicio. La integración aislada verificó propietario, aislamiento y
  expiración. La migración `202608120005_runtime_process_heartbeats` está aplicada
  en Supabase principal.
- `GET /ready` ahora devuelve checks independientes de base de datos, rol
  runtime, migración esperada, advisory lease, heartbeat fresco y disponibilidad
  opcional del proveedor IA. `DB_EXPECTED_MIGRATION` es obligatorio en producción
  y evita recibir tráfico con un esquema incompatible; el detalle de recuperación
  está en `docs/OPERACION_RECUPERACION.md`.
- Los loops de workers y schedulers exportan contadores de inicio, éxito,
  error, solapamiento omitido y duración por `process_role`; la etiqueta no
  incluye `process_id` ni otros valores de alta cardinalidad.
- El backend puede ejecutar responsabilidades de operación de forma granular
  mediante `APP_PROCESS_ROLE`: `ingestion-worker`, `learning-worker`,
  `recommendation-analysis-worker`, `savings-reconciliation-worker`,
  `ingestion-scheduler`,
  `recommendation-analysis-scheduler`,
  `notification-scheduler`, `auth-cleanup-scheduler` y `budget-scheduler`. Los alias `worker`,
  `scheduler` y `all` se conservan para compatibilidad de desarrollo; la
  resolución de capacidades está centralizada y probada.
- La analítica ahora expone escenarios de pronóstico comparables (base, tendencia, aprobado, ejecutado y verificado) y el dashboard los presenta sin convertir una proyección en ahorro realizado.
- La evaluación de presupuestos puede ejecutarse mediante `budget-scheduler` de
  forma opt-in para un tenant configurado; conserva la idempotencia del servicio
  y publica alertas en la cola outbound. En desarrollo permanece desactivada.
- El resumen ejecutivo FinOps se genera con evidencia tenant-scoped y se encola como entrega durable `PENDING` para correo/Telegram; el procesador existente conserva leases, reintentos y deduplicación diaria.
- Las memorias activas del agente pueden desactivarse de forma reversible mediante `PATCH /api/v1/ai/learning/memories/:memoryId/deactivate`; la operación exige autorización, respeta el alcance tenant/global y deja auditoría.
- La trazabilidad incluye un catálogo determinista de oportunidades de calidad de datos antes de la IA. Usa reglas versionadas sobre vínculos, frescura, evidencia técnica y etiquetas; no inventa ahorros ni autoriza acciones cloud.
- El módulo Agente IA expone `/api/v1/agent/quality`, un reporte tenant-scoped de calibración que separa tasa de revisión, aprobación/rechazo humano, abstenciones por evidencia débil, ahorro estimado frente a ahorro verificado, desglose por tipo/regla/proveedor y latencia/tokens del LLM. La aprobación se declara como proxy de calidad, no como precisión ML absoluta; el coste de tokens solo se estima si se configuran precios explícitos por millón de tokens.
- La migración `202608110012_executive_summary_delivery` está aplicada en Supabase. La migración 009 se regularizó con `migrate resolve` porque el enum de la cola ya existía; después se aplicaron 010, 011, 012, `202608120005` y `202608190001` sin borrar datos. Las migraciones de ingesta empresarial `202608170001`–`202608190001` también están aplicadas y `npx prisma migrate status` confirma que las 79 migraciones están al día.
- Validación posterior: backend `npm run test:all` con 110 archivos aprobados, 5 omitidos, 462 pruebas pasadas y 11 omitidas; IA offline 25/25; arquitectura (365/1), typecheck, build y release hygiene (619 rutas) aprobados. Supabase recibió las migraciones del goal y el canary `npm run test:canary:runtime-rls` pasó con dos tenants, tablas nuevas y cero visibilidad cross-tenant. Frontend typecheck, lint, build, smoke E2E y presupuesto de bundle aprobados. El E2E completo de frontend requiere el entorno de aplicación aislado.
- El smoke API reproducible `npm run test:api:smoke:isolated` pasó en un schema separado: 35 checks generales, onboarding cloud, 13 mutaciones administrativas rechazadas para `VIEWER`, cambio de tenant, aislamiento cross-tenant y redacción de secretos. El runner inicia el backend con `DB_RUNTIME_ENFORCE=true`, apaga workers no requeridos y elimina schema/fixtures en `finally`.
- En la revalidación del corte también pasaron los runners aislados de auth cleanup, agent quality, resource lineage y cost allocation; todos usan allowlist de schemas, límites de ejecución y cleanup en `finally`. La inspección final no encontró schemas `finops_e2e_*` residuales.
- `npm run test:integration` exige explícitamente `TEST_DATABASE_URL` y `ALLOW_DESTRUCTIVE_TEST_DATABASE=true`; sin esa
  infraestructura devuelve un skip seguro en lugar de presentar errores de fixtures como fallos de la aplicación.
- La lógica de calibración tiene pruebas unitarias determinísticas y una integración aislada aprobada (`npm run test:integration:agent-quality`, 1/1) para comprobar consultas reales y aislamiento entre tenants con dos fixtures separados. El reporte lee recomendaciones y trazas con paginación keyset de 1.000 filas por consulta, agregando en el servicio sin cargar una respuesta histórica ilimitada; las cifras de producción aparecerán cuando existan decisiones y mediciones verificadas en la ventana solicitada.
- La analítica expone `/api/v1/analytics/opportunities` como ruta canónica. `/api/v1/analytics/anomalies` se conserva
  solo como alias histórico deprecado y mantiene su payload legado para no romper clientes antiguos; las vistas y
  mensajes visibles usan exclusivamente “oportunidades”.
- La migración `202608120001_quality_report_keyset_indexes` está aplicada en Supabase. `npm run db:verify:quality-indexes` confirma los índices compuestos de recomendaciones y trazas y obtiene planes `Index Only Scan Backward` para el filtro tenant/fecha y la paginación keyset.
- La configuración del proveedor IA ya no acepta fallbacks `NVIDIA_*`/`NIM_*`; únicamente se leen variables `AI_*`, evitando activar silenciosamente endpoints o credenciales heredadas.
- La auditoría de aprendizaje usa por defecto un timeout de 15 segundos y producción rechaza valores fuera de 5–60 segundos; un proveedor lento no debe bloquear la decisión humana.
- La entrega de correo y Telegram está separada del orquestador en `OutboundChannelDeliveryService`, que persiste
  resultados `SENT`, `SKIPPED` o `FAILED` y sanitiza errores de proveedores. El historial y los reintentos siguen
  siendo durables; los canaries externos continúan pendientes y los canales permanecen apagados por defecto.
- Las invitaciones de cliente envían el enlace directamente por SMTP cuando el correo está habilitado; el registro
  `CLIENT_INVITATION` conserva únicamente una previsualización segura y metadatos, nunca el token de un solo uso.
- Los controladores de agente, IA, analítica, mensajería y Telegram comparten `respondWithFinOpsError`; el helper
  mantiene códigos HTTP coherentes, `diagnosticId` de auditoría IA y redacción de errores conocidos e inesperados.
  `safeErrorMessage` también consume bearer tokens y valores de cookies completos antes de que lleguen a logs o respuestas.
- Los flujos de autenticación, sesiones, recuperación, MFA, notificaciones y lectura de oportunidades reutilizan el
  mismo mapeo HTTP. Los errores de proveedores se sanitizan también antes de persistirse en trazas, trabajos,
  corridas de contexto, aprendizaje y advertencias de inventario; un error externo no debe convertir una tabla de
  operación en un canal de filtración.
- La configuración de fuentes de las conexiones cloud vive en `CloudConnectionSourceConfiguration`; el onboarding
  conserva registro, credenciales, validación y previsualización, y `CloudConnectionService` mantiene la fachada
  pública sin modificar contratos HTTP.
- La facturación OCI vive en `OciBillingCollector`, que separa FOCUS streaming y Usage API de la fachada SDK; la
  ruta Usage API ya pasó un canary read-only real con Tak 2.0. FOCUS sigue como fuente primaria y la capacidad
  directa `COSTS` continúa sin ser requisito de esta ruta.
- La generación de ventanas de backfill técnico está aislada en `CloudIngestionBackfillService`; conserva la
  idempotencia por ventana y la fachada de ingesta no cambia.
- El caso de uso de generación de recomendaciones está aislado en `FinOpsAiRecommendationRunner`; la fachada IA
  conserva contratos públicos y la secuencia evidencia → generación → auditoría → persistencia → trazas.

La superficie de amenazas de la beta está documentada en `docs/MODELO_AMENAZAS_STRIDE.md`, complementando las
matrices de autenticación y autorización. Los riesgos externos (DAST, despliegue público y AWS real)
siguen explicitamente diferenciados de los controles ya verificados.

## Cierre incremental 2026-08-11

- Las sesiones autenticadas ahora tienen ciclo de vida persistido: logout, revocación individual/global y
  cambio de tenant invalidan el acceso sin esperar a que expire el JWT. El frontend separa el transporte de
  autenticación y no guarda tokens en `localStorage` ni `sessionStorage`.
- El límite HTTP en memoria está acotado, el trust proxy es explícito y el servidor configura timeouts de
  request, headers y keep-alive. El store distribuido sigue diferido hasta desplegar varias instancias.
- Los clientes SMTP y Telegram tienen un timeout de proveedor común (`OUTBOUND_PROVIDER_TIMEOUT_MS`, 15 segundos
  por defecto) para que un canal externo lento no mantenga workers bloqueados indefinidamente.
- La higiene de autenticación ya tiene un scheduler opt-in y bounded: elimina únicamente artefactos cuyo `expiresAt`
  ya pasó (sesiones, refresh tokens, recuperación y desafíos MFA), conserva tokens usados/revocados aún no expirados,
  y accede a esas tablas mediante el contexto RLS exacto `finops-maintenance:auth-lifecycle`. Las migraciones
  `202608120002`–`202608120004` revocan grants API, restringen borrado a filas expiradas e indexan `expires_at`;
  la selección de sesiones bloquea filas y verifica refresh vigentes para evitar cascadas por carreras concurrentes.
- Los logs operativos ahora son estructurados y sanitizados mediante `safeErrorMessage`; se eliminan de los
  eventos URLs con credenciales, API keys, JWT, bearer tokens, cookies, claves AWS y PEM. Esto no sustituye un agregador/secret manager
  de producción.
- El scheduler rechaza validaciones de capacidades expiradas (por defecto 24 h), y la ingesta OCI reporta
  explícitamente la cobertura de descubrimiento recursivo de compartimentos y recursos.
- La gobernanza IA incorporó tres controles determinísticos: utilización técnica solo para métricas de porcentaje,
  alcance exacto del plan contra el recurso objetivo y techo de ahorro calculado desde la evidencia antes del LLM.
- Los prompts delimitan el contexto externo como dato no confiable para impedir instrucciones incrustadas, y la
  salida de chat, oportunidades y planes pasa por un guardia determinístico que rechaza credenciales, PEM, JWT,
  API keys, URLs autenticadas y asignaciones de secretos antes de trazar o persistir la respuesta.
- El frontend mantiene la sesión autenticada en `AuthSessionProvider`; las vistas y controladores consumen el
  access token mediante `useAccessToken` en lugar de propagarlo desde `App.tsx`. El transporte de API sigue
  recibiendo el token explícitamente para conservar pruebas y contratos aislados.
- Verificación histórica: backend `test:unit` con 89 archivos, 351 pruebas pasadas y 9 omitidas; escenarios IA
  offline 24/24; typecheck, build y audit de producción aprobados. Frontend typecheck, lint, build y audit de
  producción también pasan. El chunk principal frontend es de aproximadamente 226 kB y el presupuesto de 500 kB
  queda protegido por `check:bundle`. AWS real continúa bloqueado externamente; OCI Usage API ya tiene canary
  read-only validado en Tak 2.0.
- La modularización estructural más reciente mantiene contratos públicos y redujo tres hotspots del backend:
  `PrismaValueRealizationRepository` quedó en 47 líneas con portfolio y atribución separados;
  `RecommendationAnalysisService` quedó en 104 líneas con el procesador de corridas/auditoría separado; y
  `PrismaCostAllocationRepository` quedó en 258 líneas con el motor determinístico aislado. Además, los puertos
  de recomendaciones y conexiones cloud componen capacidades cohesivas sin superar 400 líneas. El fitness check
  backend pasa con 359 archivos de producción y 1 excepción justificada (`goldenScenarios.ts`); frontend pasa sin excepciones.

## Ingesta e inventario cloud

- OCI FOCUS real esta conectado hasta `focus_cost_line_items` y `cost_metrics`.
- OCI Monitoring ya alimenta `resource_metric_samples`.
- AWS tiene base SDK para EC2, CloudWatch y Data Exports, pendiente de credencial/rol real para validacion productiva.
- `cloud_resources` se pobla desde inventario declarativo, OCI Compute, OCI Resource Search y definiciones/muestras de métricas cuando aún no hay inventario completo. Resource Search pagina únicamente tipos OCI observados y soportados (`instance`, `bootvolume`, `bootvolumebackup`, `vnic`) y respeta los compartimentos accesibles e incluidos/excluidos por configuración.
- Las muestras tecnicas nuevas se enlazan a `cloudResourceId` y se reconcilian muestras anteriores por conexion/recurso.
- Costos, muestras y recomendaciones tienen `cloudResourceId`/`resourceLinkReason`; el enlace canónico exige `cloudConnectionId + externalResourceId` exactos, sin fuzzy matching.
- La ingesta persiste el orden inventario → costos/métricas, el resumen de linkage en cada job y el endpoint `/api/v1/ingestion/resource-linkage` muestra cobertura por tabla y por recurso en `Ingesta`.
- El backfill exacto e idempotente de referencias OCI históricas se aplicó en Supabase: creó 11 identidades derivadas de OCID (4 boot volumes, 2 backups, 2 instancias y 3 VNIC) sin sobrescribir inventario vivo. El dry-run vigente confirma 8.173/8.173 costos elegibles enlazados (100 %): 36 a recursos vivos y 8.137 a referencias históricas; además clasifica 555 identificadores de telemetría no facturables como `INVENTORY_RESOURCE_NOT_FOUND` y 432 registros sin conexión como `CONNECTION_NOT_AVAILABLE`. Estos últimos se conservan como costos financieros, pero quedan fuera del denominador técnico. Las 19.427/19.427 muestras técnicas continúan enlazadas.
- La UI de Ingesta distingue recursos vivos, referencias históricas, costos de servicio/cuenta, falta de conexión, identificadores no soportados, recursos válidos pendientes y ambigüedades. Una referencia histórica exacta no se presenta como recurso actualmente activo.
- El job controlado de inventario OCI más reciente terminó correctamente en 3,4 s: 2 llamadas SDK,
  1 recurso descubierto y 1 recurso persistido. El scheduler ahora encola INVENTORY antes de costos/métricas,
  exige validación de capacidades vigente y respeta un cooldown configurable de 24 h.
- El adaptador OCI separa contratos SDK, validación, Monitoring, descubrimiento de compartimentos, inventario,
  fuentes FOCUS y retries en módulos cohesivos de hasta 219 líneas. El coordinador principal bajó de 1.140 a
  393 líneas sin cambiar el contrato; las pruebas OCI dirigidas pasan 22/22.
- La gestión de conexiones cloud también está separada: la fachada pública conserva el contrato de la API,
  mientras onboarding/configuración, orquestación de jobs, contratos y validación de entradas viven en módulos
  independientes de máximo 400 líneas; la configuración de fuentes ahora persiste mediante
  `PrismaCloudConnectionConfigurationRepository` (110 líneas), y los 23 escenarios de caracterización continúan aprobados.
- En el frontend, el detalle de corridas de análisis y el estado de Agente IA están separados de sus vistas:
  `RecommendationAnalysisRunsPanel.tsx` tiene 257 líneas y `AgentSettings.tsx` 149; el fitness check frontend
  no conserva excepciones. El smoke Playwright del shell de login pasa 1/1 sin requerir API ni base de datos.
- La analítica técnica separa consulta, contratos, overview, cobertura y utilidades matemáticas; el servicio
  coordinador quedó en 202 líneas y conserva los 12 escenarios de series, cobertura, recursos duplicados y raw.
- La persistencia de ingesta mantiene una fachada estable y ahora delega la normalización de recursos derivados de
  métricas a `ingestionResourceNormalizer.ts`; inventario del proveedor conserva precedencia sobre recursos
  inferidos, y la regla está cubierta por pruebas unitarias de caracterización.
- La preparación de lineage expone gobierno determinista de etiquetas. En la cuenta OCI actual hay 1 recurso,
  pero 0 % de cobertura de las claves requeridas (`environment`, `owner`, `application`, `cost_center`);
  la interfaz lo muestra como incumplimiento, no como dato faltante silencioso.
- Las corridas de análisis por recurso también persisten `cloudResourceId` (`202608030004_analysis_run_canonical_resource`), por lo que el alcance durable no depende solo de `externalResourceId`.

## IA y recomendaciones

- El agente genera recomendaciones y planes en espanol usando una API OpenAI-compatible configurable.
- El auditor IA valida coherencia, realismo, idioma, no invencion de recursos y prohibicion de ejecucion automatica.
- Las recomendaciones con evidencia `COST_USAGE_AND_TECHNICAL` ahora requieren evidencia tecnica fuerte: referencias, recurso enlazado, cobertura/muestras suficientes y muestra reciente.
- La evidencia técnica se construye como un snapshot canónico hasheado: costo/consumo FOCUS, métricas agregadas en PostgreSQL, percentiles, cobertura, frescura, vínculo costo-recurso, reglas determinísticas y referencias exactas. El mismo snapshot llega al prompt, auditor, compuerta determinística, persistencia y detalle de la recomendación.
- Las recomendaciones aisladas por recurso también consumen aprendizaje auditado relevante del tenant, sin ampliar los hechos técnicos fuera del recurso solicitado.
- Las reglas técnicas determinísticas están versionadas (`technical-rules-2026-08-11.v1`) y cada evaluación conserva
  los umbrales críticos aplicados junto con la evidencia. Además de CPU y memoria, clasifican señales de baja o alta
  utilización en red, disco e IOPS cuando la unidad es porcentual; una señal auxiliar por sí sola no autoriza
  rightsizing y los picos siguen preservados en min/max/p95/p99 y drilldown raw.
- Si la evidencia tecnica es debil, la recomendacion debe marcar validacion tecnica pendiente.
- Existen golden scenarios offline para medir regresiones sin llamar al LLM.
- El resumen de aprendizaje expone por tenant el feedback humano, los estados del auditor, las memorias activas
  y las memorias globales. También expone cuántos candidatos globales están en `shadow` y todavía no afectan el
  contexto. La tasa de aprobación humana no se mezcla con el veredicto del auditor.
- Las decisiones auditadas crean memorias LOCAL activas. Los patrones recurrentes que cumplen auditoría y muestra
  mínima se guardan como candidatos GLOBAL inactivos (`learningLifecycle=SHADOW`); la compuerta ejecuta golden
  scenarios y verifica que no haya referencias tenant-specific. Las memorias GLOBAL activas se consultan por alcance
  y no dependen de que el texto coincida en FTS; las LOCAL mantienen aislamiento por tenant y búsqueda full-text.
- `GlobalLearningPromotionService` exige actor `MASTER_ADMIN`, evidencia `LIVE_COMPARATIVE_CANARY`, mejora estricta
  sin degradación y deja auditoría durable; el rollback desactiva la memoria sin borrar el historial. El canary live
  reconstruido el 2026-08-13 obtuvo 3/3 recomendaciones auditadas en ambos brazos, ahorros no negativos y scores
  baseline 92/candidate 90; la compuerta rechazó correctamente la promoción por ausencia de mejora estricta y
  `AI-008` permanece abierto. Las corridas anteriores con HTTP 422 son evidencia histórica del proveedor, no el estado
  actual de la aplicación.
- Las trazas de contexto conservan referencias sanitizadas a artefactos, memorias, reglas de tenant y conflictos; la
  generación expone únicamente metadatos de análisis para comparar latencia, tokens y auditoría.
- El análisis solicitado desde el detalle 360 se aísla por `externalResourceId`: costo, métricas, prompt, auditoría y rúbrica se limitan al recurso exacto. Las oportunidades relacionadas usan el mismo identificador exacto dentro del tenant.
- El detalle 360 comunica el nivel de evidencia y los bloqueos de las reglas técnicas; una evidencia limitada solo habilita recomendaciones de validación técnica.
- Las oportunidades persistidas tienen deduplicación por tenant, cuenta, recurso/candidato, tipo y período factual. Un plan rechazado por el auditor no se guarda ni se muestra como plan reutilizable.
- El ciclo humano diferencia aprobación de ejecución: técnico FinOps/administradores registran ejecución manual y el aprobador del cliente puede decidir sobre un plan auditado. La decisión crea un evento durable de aprendizaje sin bloquear la respuesta HTTP.

## Presupuestos FinOps

- Existe un módulo de presupuestos mensuales persistentes por tenant, cuenta cloud o servicio.
- Cada presupuesto compara únicamente costos y forecasts de su misma moneda; si no hay forecast persistido se declara no disponible.
- La evaluación manual de umbrales 80/90/100 crea eventos idempotentes, notificaciones in-app y registros outbound pendientes, sin exigir un scheduler durante desarrollo.
- Las entregas outbound de alertas ya tienen cola durable: `PENDING` se reclama con lease, pasa a `PROCESSING`, se
  reintenta con backoff limitado y termina en `SENT`, `FAILED` o `SKIPPED`. El scheduler procesa lotes acotados y
  recupera leases vencidos; el cuerpo completo no se expone en el DTO de entregas. La migración
  `202608110009_outbound_delivery_queue` ya está aplicada y verificada en Supabase; faltan canaries con SMTP/Telegram
  reales antes de habilitar envíos externos en operación.
- El dashboard ya no calcula un presupuesto inventado; muestra únicamente el presupuesto tenant real cuando existe.

## Asignación compartida y cierre financiero

- `CostAllocationRule` conserva DIRECT y agrega SPLIT con destinos porcentuales explícitos; la suma debe ser exactamente 100 %.
- El motor mantiene primera coincidencia, separa monedas y calcula con `Prisma.Decimal`; el residuo se asigna al último destino y las líneas sin regla permanecen como `UNALLOCATED`.
- Antes de cerrar, la fuente se valida con conteo, total Decimal y una segunda huella canónica de las filas dentro de la transacción; una regla SPLIT persistida con porcentajes inválidos también bloquea el cálculo.
- Los cierres son independientes por tenant, período y moneda. Guardan totales, resultados por destino, hashes de costos y reglas, versión, responsable y fecha. Una entrada idéntica es idempotente; una corrección crea una versión nueva y conserva la anterior.
- `Asignación de costos` muestra suma SPLIT, preview con período anterior, reglas usadas e impacto financiero por destino, costo compartido, confirmación auditada de `UNALLOCATED`, checklist de estado e historial de cierres. La activación exige preview de la misma configuración; la API incorpora cierre, historial, detalle y comparación de versiones.
- La interfaz añade un resumen financiero por destino que combina costo cerrado vigente (o costo live identificado como no cerrado), período anterior, variación, presupuesto consumido y ahorro potencial/aprobado/verificado/acumulado sin duplicar el motor financiero.
- El historial de cierres permite cargar bajo demanda el detalle y comparar versiones, incluyendo hashes, responsable, totales y resultados por destino. El botón `Previsualizar` no persiste reglas: el frontend distingue explícitamente la acción del formulario antes de llamar a la API.
- El repositorio local contiene 70 migraciones y Supabase registra las seis migraciones nuevas del goal después de `202608120008_revoke_login_tenant_api_grants`. Las migraciones portables de helpers, la restauración del DELETE de cleanup auth y la revocación explícita de grants API fueron verificadas desde cero en schemas aislados y en `public`. Las tablas nuevas tienen RLS, índices de tenant/período/estado, índices de expiración auth, FK tenant-aware, cierres inmutables, acceso directo revocado para roles API y compuerta de preview antes de activar.
- Los presupuestos por destino reutilizan el cierre cerrado como única fuente de actual; no recalculan distribución. Antes del cierre, el actual queda explícitamente no disponible y el preview conserva el valor como proyectado. `Valor realizado` expone el resumen por destino y solo atribuye ahorro cuando coinciden tenant, moneda, recurso canónico, hash de métrica y período; sin evidencia exacta no atribuye ahorro.
- Las líneas de cada cierre conservan un snapshot inmutable de recurso canónico, fuente, monto, destino, regla y hash de métrica. Cierres anteriores a `202608040004` pueden no tener líneas históricas y deben tratarse como agregados sin evidencia de atribución por línea.
- El detalle operativo del modelo, invariantes y API está en `docs/COST_ALLOCATION_SHARED_CLOSURES.md`.

## Seguridad y produccion

- MFA privilegiado incluye diez códigos de recuperación aleatorios de un solo uso: solo se persisten hashes,
  se muestran una vez, la regeneración revoca el lote anterior y el consumo es atómico con el challenge de login.
- El canary runtime RLS cubre ahora las seis tablas de credenciales. Se eliminó una recursión entre políticas
  pre-auth mediante helpers SECURITY DEFINER acotados; dos tenants pasaron con cero acceso cruzado.
- La autorización de aplicación usa una política central testeable para los siete roles y dieciséis capacidades.
  Cloud, ingesta, agente, recomendaciones, mediciones, presupuestos, asignación, valor, mensajería, MFA y
  administración MSP ya no mantienen listas de roles independientes; la matriz vigente está en
  `docs/MATRIZ_AUTORIZACION.md`.

Implementado:

- `helmet` para cabeceras HTTP.
- CORS configurable con multiples origenes.
- Rate limit global para `/api/v1`.
- Rate limit especifico para login, Telegram e IA.
- Logging estructurado por request con `x-request-id`.
- Validacion runtime estricta en produccion para secretos/configuracion critica.
- Compuerta `npm run check:release-hygiene` en backend y frontend: las rutas rastreadas por Git no contienen
  `.env` no permitido, claves/certificados, bases locales, logs ni artefactos E2E; `.env.example` es la excepción.

Estado de cierre:

- Las migraciones de hardening de funciones e índices FK ya están aplicadas en Supabase principal.
  La seguridad Advisor quedó sin hallazgos. El canary runtime con `DB_RUNTIME_ENFORCE=true` y
  `DB_RUNTIME_ROLE=finops_runtime` pasó contra Supabase principal, con aislamiento cross-tenant y
  contexto de workers; la activación permanente queda diferida hasta disponer de un entorno desplegado.
- Gestion externa y rotacion formal de secretos.
- Observabilidad centralizada.
- Benchmark con `EXPLAIN (ANALYZE, BUFFERS)` y volumen productivo representativo.

## Rendimiento y pruebas recientes

- Las series de métricas técnicas usan agregación SQL, cursor y carga progresiva; la UI conserva el raw
  bajo demanda y renderiza la serie principal con uPlot. La vista separa coordinación asíncrona, cache LRU,
  cancelación, modelo de rango y paneles; `MetricasTecnicas.tsx` quedó en 216 líneas sin perder granularidades.
- Los reportes FOCUS de OCI/AWS se procesan por batches asíncronos para evitar cargar el CSV completo en
  memoria; la persistencia mantiene inserción idempotente por hash.
- Backend: `npm run test:all` (109 archivos aprobados, 451 pruebas pasadas y 11 omitidas),
  `npm run test:ai:offline` (25/25), typecheck y build sin errores. `npm audit --omit=dev` permanece sin
  vulnerabilidades altas.
- Integración PostgreSQL aislada completa: `npm run test:integration:isolated` pasó 10 archivos/17 pruebas, además de
  limpieza auth y heartbeat/readiness, y eliminó su schema en `finally`. Verificó 1 registro expirado eliminado por
  cada categoría, retuvo registros futuros y evitó la cascada de un refresh vigente asociado a una sesión con TTL inconsistente.
- Integración PostgreSQL aislada de limpieza auth: `npm run test:integration:auth-cleanup` pasó y eliminó su schema
  en `finally`; verificó 1 registro expirado eliminado por cada categoría, retuvo registros futuros y evitó la
  cascada de un refresh vigente asociado a una sesión con TTL inconsistente.
- Frontend: lint, typecheck y build aprobados. La revalidación del 2026-08-12 de `test:e2e:full` aplicó las 64
  migraciones desde cero en un schema aislado, creó fixtures autenticados y aprobó 7/7 escenarios Playwright,
  incluidos el ciclo HTTP de autenticación/sesiones y la privacidad de recuperación de contraseña;
  el cleanup eliminó los dos tenants y el schema de prueba incluso con la ruta de recuperación para preparación
  incompleta. La ejecución actual exige `TEST_DATABASE_URL` apuntando a una base/schema efímero y se abstiene si
  esa variable no está presente; el smoke `test:e2e:smoke` sí funciona sin BD.
- Canary IA real aislado: chat en español, generación, auditor, snapshot canónico, rúbrica determinística,
  ahorros no negativos, trazabilidad y `persist=false` aprobados con el modelo `gpt-5.4-mini`.
  Latencia de generación: 54.662 s; estimación de contexto/trazas: 4.093 tokens; recomendaciones: 3.
- Canary comparativo de aprendizaje global: autenticación aislada corregida con `202608120006_schema_portable_rls_helpers`,
  consulta directa de contexto GLOBAL verificada y promoción controlada implementada; la corrida reconstruida con el
  `dist` vigente produjo 3/3 recomendaciones aprobadas en baseline y candidate, con scores 92 y 90 respectivamente.
  No se activó memoria GLOBAL porque el candidato no superó estrictamente la línea base; el reporte sanitizado quedó en
  `.test-artifacts/ai-audit/learning-2026-08-13T02-48-49-920Z.json`. El siguiente paso es repetir el canary con una
  corrida estable y evidencia de mejora, no relajar la compuerta.
- Canary OCI read-only de onboarding: identidad, inventario, métricas y Object Storage disponibles;
  1 recurso Compute leído en una llamada, preview FOCUS sin errores (20 objetos descubiertos, 5 retornados);
  la capacidad de costos directa quedó denegada y el resultado fue `PARTIAL`, consistente con el bloqueo
  documentado de OCI Usage API.
- Integración de trazabilidad en PostgreSQL aislado: 5/5 pruebas; readiness con 10.000 costos y 20.000
  muestras técnicas tuvo mediana de 212,80 ms en cinco lecturas (un outlier de 607,78 ms).
- Canary principal: la prueba `tenantContext.integration.test.ts` pasó con enforcement runtime contra
  Supabase `public`; el plan de métricas usa el índice `(tenant_id, sampled_at)` y la línea base
  observada fue 52.029 ms raw y 7.692 ms agregada para 660 filas/grupos.
- Benchmark del motor determinista de asignación: 10.000 costos, 10 reglas y 5 iteraciones; mediana de
  66,98 ms con invariantes de suma conservadas. Es una medición del cálculo en memoria, no un SLA completo
  de la transacción de cierre contra la base de datos.
- La integración de asignación ahora mide también el flujo persistido con 10.000 costos: preview 1.694,86 ms,
  cierre 8.712,79 ms y 10.000 líneas de evidencia en el Supabase actual. `EXPLAIN (ANALYZE, BUFFERS)` confirmó
  el uso de `cost_metrics_tenant_period_idx` con 17,27 ms de ejecución SQL en la última corrida. La compuerta revalida la huella
  canónica de la fuente además de conteo y total; el guardado masivo usa JSONB
  parametrizado y la transacción no expira por el timeout genérico de Prisma; los objetivos orientativos de
  500 ms/2 s quedan abiertos para reevaluación con un entorno de despliegue representativo.
- Integración aislada de asignación: `npm run test:integration:cost-allocation` pasó 3/3 con 49
  migraciones; validó costos → regla → preview → activación → cierre, idempotencia, FK tenant-aware
  e inmutabilidad de cierres.
- CI ejecuta integración aislada PostgreSQL/API en GitHub Actions. Docker local sigue siendo opcional para
  desarrollo; Supabase se valida mediante migraciones Prisma antes de cambios de esquema.
- Los artefactos de contenedor backend/frontend incluyen ejecución no root, healthchecks y `.dockerignore`; el build
  local de imágenes no está verificado porque Docker CLI no está instalado en esta estación.

## Pendientes principales

- Asignación de costos: DIRECT/SPLIT, preview, distribución por moneda y cierres versionados ya están disponibles; chargeback contable continúa fuera de alcance.
- Mantener canaries periódicos de OCI Compute/Resource Search y validar frecuencia/volumen del inventario cuando exista operación continua. AWS EC2 sigue bloqueado por falta de cuenta real.
- AWS productivo con rol real y bucket/prefix FOCUS.
- Mantener un canary periódico de IA real con fixtures controlados; no persistir datos de prueba en tenants normales.
- Activar permanentemente el enforcement runtime RLS solo al desplegar, usando el procedimiento de
  `docs/RUNTIME_RLS_CANARY.md` y su rollback.
- Limpieza de documentos antiguos que aún describen estados superados; las fuentes autoritativas son este archivo,
  `docs/ROADMAP_PRODUCTO.md`, `PROGRESO_ROADMAP_FINOPS.md` y `docs/DEUDA_TECNICA.md`.

## Operación durante desarrollo

- Backend, frontend y workers se ejecutan manualmente cuando se desarrolla o prueba una funcionalidad.
- La falta de ingesta diaria mientras la aplicación está apagada es una decisión temporal de desarrollo,
  no un incidente operativo. El trabajo permanente queda registrado en `docs/DEUDA_TECNICA.md`.

## Validación de inteligencia por recurso

- La CI ejecuta el flujo Playwright completo contra fixtures de PostgreSQL y la API local del job de integración.
- El flujo cubre login, cambio de tenant, inventario, detalle 360, evidencia, oportunidades relacionadas, plan auditado de fixture, decisión, timeline y ejecución manual sin depender de proveedores cloud ni de un LLM real.
- El 2026-08-03 el canary runtime RLS pasó contra Supabase principal: usuario `finops_runtime`, dos tenants,
  consultas tenant-scoped, conteo cross-tenant cero, contexto de worker y tablas operativas verificadas.
  La activación operativa permanente permanece diferida por no existir todavía un destino de despliegue.

## Corte de implementación 2026-08-14 — Estabilización empresarial

- Se incorporó la estadística nativa de OCI Monitoring y AWS CloudWatch en
  resource_metric_samples; la UI permite elegir MEAN, MIN, MAX, percentiles,
  SUM, COUNT, RATE o LATEST sin perder el drilldown raw.
- GET /api/v1/technical-metrics/resources filtra en PostgreSQL por recursos
  con costo positivo, estado, proveedor y texto de búsqueda. El cálculo de
  lineage permanece acotado al tenant y no se realiza filtrado pesado en React.
- El administrador maestro puede emitir invitaciones de cliente de un solo uso
  y el cliente puede aceptar el enlace para crear su cuenta en el tenant exacto.
  La configuración del agente y la administración MSP no están disponibles para
  roles cliente.
- Telegram admite códigos de auto-vinculación de diez minutos generados desde
  Perfil y consumidos mediante /start <código> en el webhook autenticado.
  Los códigos se almacenan únicamente como hash.
- Se aplicaron al Supabase principal las migraciones 202608140001 a
  202608140006: estadísticas nativas, invitaciones, auto-vinculación Telegram,
  tipo de entrega de invitación, índices FK/RLS y consolidación de políticas de
  refresh. Después se aplicaron el ciclo de vida de credenciales OCI, la
  configuración de ingesta, la eliminación de la unicidad estadística antigua
  y la idempotencia por fingerprint. El detalle de verificación está en
  docs/GOAL_EMPRESARIAL_ESTABILIZACION.md.
- La candidata de la cuenta empresarial OCI tuvo inicialmente un rechazo de firma
  durante la validación; ese intento no desplazó credenciales activas ni ejecutó
  ingestas. Después de corregir/renovar las credenciales, la conexión Tak 2.0 quedó
  validada y permitió inventario, Usage API y Monitoring reales. Las credenciales
  compartidas en el chat no se reutilizan y deben revocarse/rotarse fuera del
  repositorio. AWS permanece en standby.
