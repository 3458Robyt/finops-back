# Progreso — FinOps Inteligente (Backend)

> Bitácora viva del proyecto. Se actualiza **a medida que se avanza**, no solo al final.
> Estructura: (1) Estado actual · (2) Bitácora de avance (cronológica inversa) · (3) Próximos bloques.

## 1. Estado actual

Plataforma FinOps con IA generativa para optimización de costos cloud. Backend Node.js + TypeScript
(ESM, Clean Architecture: domain / application / infrastructure / presentation), Prisma sobre
Supabase/PostgreSQL, multi-tenant/MSP. Frontend: Vite + React + TS + Tailwind (`finops-app`).

Capacidades operativas hoy: autenticación JWT y roles; ingesta OCI FOCUS local; analítica de costos,
forecast, consumo, costo unitario e insights; recomendaciones IA mediante API OpenAI-compatible con auditor IA
independiente; planes de ejecución auditados; aprobación/rechazo con aprendizaje asíncrono; Context
Engine, memoria, reglas TAK y trazas IA; notificaciones in-app, Telegram MVP y base de correo SMTP.

Decisiones vigentes: todo el texto de usuario en español; en UI se dice "oportunidades", no
"anomalías"; n8n descartado; WhatsApp es evolución futura (Telegram MVP); sin remediación automática
cloud; ejecución manual, gobernada y auditable; FOCUS sirve para costo/consumo facturado pero **no**
para inferir CPU/memoria/IOPS/throughput; Supabase es la BD principal (arquitectura portable a
PostgreSQL).

## 2. Bitácora de avance
### 2026-07-11 - Aislamiento IA y oportunidades relacionadas por recurso
- El detalle 360 ahora consulta oportunidades persistidas por `externalResourceId` exacto dentro del tenant; recomendaciones FOCUS sin enlace a recurso no se presentan como relacionadas.
- Un análisis IA por recurso restringe tanto el snapshot de costo como las métricas técnicas antes de llegar al LLM. Para impedir mezclar datos históricos de otros recursos, omite el Context Engine y aprendizaje recuperado en esta modalidad aislada.
- La rúbrica determinística exige `evidence.externalResourceId` exacto en análisis aislados, aun si el auditor IA aprobara una salida distinta.
- Se ampliaron escenarios dorados y pruebas offline para recurso aislado correcto, recurso ajeno, ausencia de evidencia de costo, evidencia técnica filtrada y salida IA fuera de alcance.

### 2026-07-11 - Inventario cloud y detalle de evidencia por recurso
- Se agregó el registro único `docs/DEUDA_TECNICA.md` para diferenciar faltantes de producción de decisiones aceptadas durante desarrollo manual.
- El backend expone detalle y resumen por recurso bajo `technical-metrics/resources/:externalResourceId`, siempre filtrado por tenant, reutilizando métricas, cobertura y costo asociado ya existentes.
- El frontend incorpora `Inventario Cloud` y detalle 360 para consultar identidad, cobertura, métricas y costo por recurso sin inferir evidencia técnica desde FOCUS.
- La generación IA admite `externalResourceId`: reduce el snapshot factual al recurso solicitado y rechaza la solicitud si no existe evidencia de costo para ese recurso.
- El smoke API y E2E cubren inventario y resumen de recurso como parte del flujo existente.

### 2026-07-10 - Cierre auditado y despliegue controlado
- Se publicaron y fusionaron PRs de estabilización en backend y frontend, con CI verde: backend (typecheck, 165 pruebas unitarias, evaluación IA offline, build e integración PostgreSQL/API) y frontend (lint, build y smoke E2E).
- El artefacto productivo del backend ahora incluye el cliente Prisma generado en `dist/generated/prisma`; `npm start` ya puede resolver sus imports después de `npm run build`.
- Se aplicó en Supabase mediante `npx prisma migrate deploy` la migración `202607100001_durable_learning_queue`; se verificaron las columnas de lease/reintento y el índice de cola/memoria idempotente.
- La CI de integración genera Prisma en su job aislado, desactiva scheduler/workers y espera explícitamente la salud HTTP antes de ejecutar el contrato API.

### 2026-07-10 - Fencing estricto de ingesta
- Cada job reclamado lleva su intento como token de fencing. Renovar, completar o fallar exige coincidir en `id`, `lockedBy`, `attempts` y estado `RUNNING`.
- Un worker que perdió el lease descarta el resultado del proveedor y no puede sobrescribir la ejecución reclamada por otro worker.

### 2026-07-10 - Durabilidad de aprendizaje, recuperación de ingesta y métricas fiables
- Aprendizaje: `agent_learning_events` incorpora lease, intentos y próximo reintento; un worker persistente reclama eventos atómicamente y evita que una decisión humana quede bloqueada por una llamada IA.
- Las memorias del agente son idempotentes por evento fuente y alcance (`LOCAL`/`GLOBAL`), preservando la trazabilidad histórica de duplicados previos en la migración.
- Ingesta: jobs `RUNNING` con lease vencido pueden recuperarse y el worker renueva el lease mientras consulta proveedores cloud.
- IA: la rúbrica determinística ahora se ejecuta después del auditor LLM; ninguna recomendación se persiste si falla evidencia, alcance, ahorro o seguridad operacional.
- Métricas: las series agregadas conservan el recurso original y la UI dibuja una serie independiente por recurso cuando se consulta el inventario completo; también cancela la paginación obsoleta al cambiar filtros.
- Pruebas/CI: se agregó integración PostgreSQL para series técnicas, se corrigió el smoke API de métricas y CI inicia la API con fixtures para validar el contrato HTTP.
- Verificación local: backend `npm run typecheck` y `npm test` (42 archivos, 165 tests); frontend lint, build y smoke E2E. La integración Docker queda pendiente porque Docker no está instalado localmente.

### 2026-07-09 - Remediación de auditoría: métricas, streaming, pruebas y CI
- Métricas técnicas: el backend valida fechas, rango y bucket; la cobertura usa agregaciones SQL en PostgreSQL; la serie agregada elimina ventanas completas y aplica el cursor antes de agrupar.
- La UI dejó de descargar todas las páginas automáticamente: renderiza la primera página, permite cargar puntos exactos bajo demanda, cancela consultas obsoletas y usa uPlot sin ordenar/copiar series completas en cada render.
- FOCUS: OCI y AWS ahora exponen batches asíncronos para no cargar reportes completos en memoria; el repositorio persiste cada batch idempotentemente y contabiliza filas/proyección en el resumen y quality check.
- Pruebas: suite backend 40 archivos/160 tests, typecheck, frontend lint/build y smoke E2E sin API/BD. Se agregó Docker Compose para integración destructiva aislada, aunque la ejecución local queda bloqueada porque Docker no está instalado.
- CI: workflows separados para backend/frontend; frontend valida dependencias, lint, build y smoke E2E; backend valida typecheck, tests, escenarios IA offline, build e integración Docker.
- Dependencias frontend actualizadas sin cambios mayores destructivos; `npm audit --omit=dev --audit-level=high` queda sin vulnerabilidades. Backend conserva advertencias transitivas del SDK OCI y Prisma que requieren actualización mayor o sustitución controlada.

### 2026-06-29 - Limpieza ponytail de riesgos de sobreingenieria
- Se retiraron dependencias frontend sin uso comprobado: clsx, tailwind-merge, lucide-react y puppeteer. Recharts se conservo porque sigue usado.
- Se agregaron ignores para graphify-out y .graphify-* y se borraron artefactos generados locales.
- Se elimino docs/erd-input/schema.prisma por estar stale y conservar tablas de grafo ya retiradas.
- Login dejo de precargar cuentas demo y Sidebar/Profile muestran nombre/email del usuario autenticado.
- Verificacion: frontend npm run build; backend npm run build.
### 2026-06-26 - Agente IA sin grafo y canales externos unificados
- Se audito la utilidad real del grafo del agente: las relaciones no aportaban suficiente evidencia accionable, el contexto IA no lo estaba usando para ahorrar tokens y la UI resultaba lenta/confusa.
- Se elimino el grafo como modulo funcional: backend sin ruta knowledge-graph, sin servicio/repositorios de grafo y migracion Supabase para retirar agent_knowledge_nodes, agent_knowledge_edges y ai_context_traces.knowledge_node_ids.
- El modulo Agente IA del frontend quedo reorganizado en Gobierno, Evidencia y Canales, retirando la visualizacion de grafo y conservando trazas, reglas, instrucciones y auditoria.
- Se agrego canal outbound unificado con outbound_message_deliveries, Telegram y correo SMTP por variables de entorno.
- Se agregaron endpoints para estado de canales, entregas recientes, prueba manual, recordatorios de ahorro pendiente y resumen de recomendaciones.
- Se agrego scheduler opcional por entorno para recordatorios, sin depender de n8n.
- Migracion aplicada en Supabase con npx prisma migrate deploy.
- Verificacion: backend npm run build; frontend npm run build.

### 2026-06-25 - Rediseno del modulo Agente IA

- Se reestructuro la vista `Agente IA` como cockpit operativo en tres bloques: Gobierno, Evidencia y aprendizaje, y Canales y operacion.
- El frontend ahora recibe el rol API real: `MASTER_ADMIN`, `OPERATOR_ADMIN` y `ADMIN` pueden configurar; roles tecnicos pueden auditar en modo lectura.
- El backend permite a `FINOPS_TECHNICIAN` leer reglas tenant del agente sin habilitar escritura administrativa.
- La pantalla muestra metricas de perfil, reglas, trazas, tokens estimados, grafo de evidencia y canales Telegram con estados diferenciados.
- Verificacion: frontend `npm run build`; backend `npm run build`.

### 2026-06-24 - Motor deterministico de reglas tecnicas FinOps

- Se agrego un motor puro de reglas tecnicas para compute/VM antes de llamar a IA, evaluando CPU, memoria, red, disco/IOPS, cobertura y frescura de datos.
- `resource_metric_samples` ahora puede resumirse desde PostgreSQL con `avg`, `min`, `max`, `p50`, `p95`, `p99`, `sampleCount`, `coverageDays`, `firstSampledAt` y `latestSampledAt`.
- La evidencia tecnica enviada al agente incluye `deterministicRules` con `ruleMatches`, `blockers`, `evidenceStrength`, percentiles y referencias tecnicas.
- La compuerta de recomendaciones consume esos bloqueos: CPU/memoria saturadas o evidencia insuficiente obligan `VALIDATION_ONLY`; CPU+memoria bajas y cobertura suficiente permiten `GENERATABLE`.
- La rubrica offline y el auditor IA ahora tratan `deterministicRules.blockers` como autoridad tecnica: recomendaciones con bloqueos no pueden presentarse como reduccion ejecutable.
- Se agregaron escenarios dorados para CPU alta que bloquea rightsizing y CPU baja sin memoria que solo permite validacion tecnica.
- Verificacion: backend `npm run typecheck`; backend `npm test -- --run` (39 archivos, 157 tests); backend `npm run build`.

### 2026-06-24 - Refinamiento del agente generador y auditor IA

- Se agrego una compuerta deterministica de evidencia para recomendaciones IA: el modelo recibe candidatos permitidos (`GENERATABLE`, `VALIDATION_ONLY`, `BLOCKED_NO_EVIDENCE`) antes de generar recomendaciones.
- El prompt del generador ahora exige `candidateId`, `sourceFacts`, `assumptions`, `confidence`, limites de ahorro y diferenciacion clara entre recomendacion ejecutable y validacion tecnica previa.
- El auditor IA ahora puede devolver `recommendationIndexes` y `repairInstructions`, permitiendo una ronda de reparacion mas especifica.
- `AI_AUDIT_REJECTED` dejo de ser un 502 opaco: el backend responde 422 con `diagnosticId` y reporte de auditoria para diagnostico.
- El frontend conserva y muestra el diagnostico del auditor en el chat IA, sin sugerir que se guardaron recomendaciones rechazadas.
- Verificacion: backend `npm run typecheck`; backend `npm test -- --run` (38 archivos, 152 tests); frontend `npm run build`.

### 2026-06-22 - Cierre multi-tenant, IA OpenAI-compatible e inventario SDK

- Configuracion IA migrada a variables genericas `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`, `AI_AUDITOR_MODEL`, `AI_TIMEOUT_MS` y `AI_MAX_RETRIES`; las variables NVIDIA/NIM quedan como fallback temporal.
- Modelo IA por defecto actualizado a `gpt-5.4-mini`; `.env` local apunta al endpoint OpenAI-compatible nuevo sin versionar secretos.
- Seed corregido: `andres.rivera@takcolombia.co` queda como `MASTER_ADMIN` en futuras instalaciones.
- Inventario cloud normalizado reforzado: `INVENTORY` de AWS consulta EC2 `DescribeInstances` y `INVENTORY` de OCI consulta Compute `listInstances`, manteniendo fallback por metadata/definiciones de metricas.
- Agente IA reforzado con evidencia tecnica real: se inyecta al prompt un bloque compacto desde `resource_metric_samples`, `cloud_resources` y contexto de costo por recurso.
- Verificacion focalizada: gateway IA, evidencia tecnica, inventario AWS y OCI.

### 2026-06-18 - Cuentas admin multi-tenant y selector real de tenant

- Se implemento la base de autenticacion multi-tenant para administradores: nuevo rol `MASTER_ADMIN`, listado de tenants accesibles y cambio de tenant mediante emision de un nuevo JWT tenant-scoped.
- `tenant_access_assignments` queda como fuente de verdad para admins/tecnicos asignados; `MASTER_ADMIN` puede ver todos los tenants activos.
- El frontend reemplaza el selector local `prod/dev` por un selector de tenants reales en el menu superior derecho.
- `Dashboard` y `Console` dejan de filtrar por entorno local `prod/dev`; el aislamiento se delega al `tenantId` activo del JWT.
- Se agrego script `npm run users:consolidate-admin-tenants` para consolidar usuarios admin duplicados, con dry-run por defecto y `--apply` explicito.

### 2026-06-17 - Inventario normalizado, evidencia IA y hardening base

- Se reforzo la ingesta tecnica para poblar `cloud_resources` de forma consistente: los jobs ahora fusionan inventario explicito con recursos derivados de `resource_metric_samples` cuando el proveedor aun no entrega inventario completo.
- Las muestras nuevas de `resource_metric_samples` se enlazan a `cloudResourceId` al persistirse y se reconcilian muestras previas sin enlace para la misma conexion/recurso.
- Los summaries y checks de calidad de ingesta ahora reportan `metricDerivedResources` y `metricSamplesLinkedToResource`, lo que permite medir cobertura real del cruce inventario-metricas.
- AWS/OCI `INVENTORY` ya no devuelven un stub vacio: leen metadata declarativa (`awsInventoryResources`/`ociInventoryResources`) y, si falta, infieren inventario base desde definiciones de metricas.
- La rubrica IA y los prompts ahora exigen evidencia tecnica fuerte para recomendaciones `COST_USAGE_AND_TECHNICAL`: referencias, recurso enlazado, muestras/cobertura suficiente y muestra reciente. Acciones tecnicas sin evidencia fuerte deben marcar validacion pendiente.
- Se agregaron golden scenarios para rightsizing con evidencia tecnica fuerte, sin referencias y con evidencia antigua.
- Hardening backend: validacion de configuracion runtime en produccion, CORS multi-origen, rate limit global `/api/v1`, rate limit especifico para IA y logging estructurado por request con `x-request-id`.
- Verificacion: backend `npm run typecheck`.

### 2026-06-05 - Scheduler seguro de jobs de ingesta

- Se agrego `npm run ingestion:schedule` para programar jobs recurrentes de ingesta sin depender de la UI ni de scripts manuales.
- El comando corre en modo dry-run por defecto; solo escribe en `ingestion_jobs` cuando se usa `--apply`.
- Se agrego scheduler persistente dentro del backend con `INGESTION_SCHEDULER_ENABLED=true`; encola trabajos automaticamente y el worker existente los procesa.
- Variables nuevas: `INGESTION_SCHEDULER_INTERVAL_MS`, ventanas/cooldowns por metricas y billing, `INGESTION_SCHEDULER_MAX_ATTEMPTS`, y filtros opcionales por proveedor/conexion.
- La logica crea jobs `TECHNICAL_METRIC` y `BILLING_EXPORT` solo si la conexion activa tiene credencial lectora/operativa y metadata suficiente. Si falta metadata FOCUS, no inventa jobs de costos.
- Se agregaron reglas de deduplicacion: omite fuentes con jobs `PENDING`/`RUNNING` y fuentes con cobertura reciente dentro del cooldown configurado.
- Pruebas agregadas: scheduling por metadata, FOCUS, jobs pendientes, cobertura reciente, falta de metadata, credenciales inactivas y loop sin solapamiento.
- Dry-run contra Supabase actual: 1 conexion OCI evaluada; planifica `TECHNICAL_METRIC`; omite `BILLING_EXPORT` porque faltan `ociFocusReportObjects`/`ociFocusReportLocations`; no hay conexion AWS activa.
- Ejecucion controlada con `--apply`: scheduler creo job OCI `cmq1lxm3z0000yc523dz5qx0c`; el worker lo proceso con 11 llamadas OCI, 11 muestras tecnicas normalizadas, 0 warnings y 848 ms internos. Dry-run posterior omitio metricas por cobertura reciente, validando cooldown/deduplicacion.
- Retroalimentacion de la meta: la base scheduler + worker ya puede operar sin intervencion manual. AWS real y FOCUS real siguen pendientes por falta de cuenta/bucket/prefix; antes de activar `--apply` continuo en produccion conviene definir frecuencia por cliente y monitorear volumen de jobs creados.

### 2026-06-05 - Readiness de ingesta visible en API/UI

- Se agrego `GET /api/v1/ingestion/readiness`, acotado al tenant autenticado, para exponer el diagnostico operativo que antes solo existia como CLI.
- El endpoint devuelve conexiones AWS/OCI activas, propositos de credenciales, conteos de metadata, jobs recientes e issues `INFO`/`WARNING`/`BLOCKER`, sin exponer payloads cifrados ni secretos.
- La vista `Ingesta` del frontend ahora muestra un bloque de "Preparacion de ingesta productiva" con estado general, hallazgos y metadata por conexion.
- Se centralizo la evaluacion de readiness en `ingestionReadiness.ts`; CLI `npm run ingestion:doctor`, API y UI quedan alineados y reducen riesgo de divergencia operativa.
- Doctor real contra Supabase tras el cambio: OCI activo con credencial `OPERATIONAL`, 11 metric definitions, jobs tecnicos exitosos recientes; advertencias vigentes: falta metadata FOCUS OCI y no hay conexion AWS activa.
- Verificacion: backend `typecheck`, `test` (121 tests) y `build`; frontend `npm run build`.

### 2026-06-05 - Configuracion FOCUS desde API/UI

- Se agrego `POST /api/v1/ingestion/focus-sources` para registrar metadata FOCUS por tenant y conexion sin editar Supabase manualmente.
- El endpoint determina el proveedor desde la conexion activa y solo acepta valores string de ubicacion (`bucket`, `prefix`, `key`, `namespace-name`, etc.); no recibe ni persiste secretos.
- La vista `Ingesta` ahora incluye un formulario para configurar prefijos u objetos FOCUS de AWS/OCI, con opcion de reemplazar la lista actual.
- Retroalimentacion de la meta: esto elimina friccion operativa para cerrar el pendiente de FOCUS real. Sigue faltando que el usuario/cliente provea bucket/prefix/objeto real para ejecutar `BILLING_EXPORT`.
- Verificacion: backend `typecheck`, `test` (127 tests) y `build`; frontend `npm run build`.

### 2026-06-05 - SDK OCI/AWS: commit seguro + base de worker productivo en curso

Se inicio el objetivo de ingesta productiva por SDK para costos, consumo y metricas tecnicas.
- Commit inicial seguro backend: 127c4f3 (chore: harden backend baseline before SDK ingestion).
- Commit hardening backend: 34f510c (chore: harden ingestion prerequisites).
- Commit hardening frontend: 8c8767 (chore: remove demo password from login form).
- Seguridad previa: .env.*, *.pem, *.key, .oci/, .claude/, descargas y artefactos quedan ignorados; seed/importador ya no usan password demo por defecto ni imprimen contrasenas demo.
- Base worker: nueva migracion 202606050001_ingestion_job_observability agrega started_at, completed_at y esult_summary a ingestion_jobs; el worker reclama jobs con FOR UPDATE SKIP LOCKED, desencripta credenciales operativas y persiste resultados normalizados.
- Conectores SDK iniciales: OCI usa OCI Monitoring para TECHNICAL_METRIC desde metadata.ociMetricDefinitions; AWS usa STS AssumeRole + CloudWatch GetMetricData desde metadata.awsMetricDefinitions.
- FOCUS queda definido como fuente canonica pendiente de parser productivo: OCI Cost Reports/Object Storage y AWS Data Exports/S3.
- Retroalimentacion de la meta: para esta rebanada no se inventan datos si faltan credenciales o metadata; el job registra warning/cobertura parcial. Memoria en AWS/OCI sigue requiriendo agente cuando el proveedor no la entrega por defecto.
- Hallazgo: 
pm install reporto 174 vulnerabilidades transitivas (172 moderadas, 2 altas). No se aplico 
pm audit fix --force porque puede romper dependencias; queda como tarea de seguridad.
- Avance adicional: ocusCsvIngestion normaliza CSV/CSV.GZ FOCUS a ocus_cost_line_items con hash estable; AWS BILLING_EXPORT puede leer objetos declarados en metadata.awsFocusExportObjects o descubrirlos por prefijo en metadata.awsFocusExportLocations; OCI BILLING_EXPORT puede leer objetos declarados en metadata.ociFocusReportObjects o descubrirlos por prefijo en metadata.ociFocusReportLocations. Queda pendiente benchmark con datos reales y discovery especifico de particiones por fecha.
### 2026-05-30 — Bloque 5: Hardening + documentación ✅

Documentación alineada con lo que el código **realmente** hace (sin afirmaciones aspiracionales) y
postura de seguridad explícita. Solo docs/config; no toca lógica.
- `.env.example`: añadidas variables que el código usa y faltaban (`NIM_API_KEY` como alternativa de
  `NVIDIA_API_KEY`, `LEARNING_AUDIT_TIMEOUT_MS`, `ANOMALY_MIN_DELTA_USD`).
- `README.md` corregido (errores factuales): stack real (Vitest no Jest; cliente `openai`→NVIDIA NIM
  no LangChain/Gemini; Supabase/PostgreSQL no TimescaleDB), scripts reales (no existe `lint`/ESLint),
  errores con `FinOpsBaseError`, e instalación/requisitos acordes a `docker-compose.yml`
  (postgres:16-alpine).
- Sección **Postura de seguridad**: lo que existe (JWT + aislamiento por tenant, Argon2, cifrado de
  credenciales, CORS configurable, `.env` ignorado) y **pendientes honestos de hardening**
  (rate limiting y `helmet` ausentes, logging estructurado, gestión de secretos/rotación).
- Verificación: cambios solo de documentación; backend sin cambios de código (último estado verde:
  `tsc` 0, 58/58 tests). Build de frontend no afectado.

### 2026-05-30 — Bloque 2: Métricas técnicas (separadas de FOCUS) ✅

Expone el inventario de recursos (`cloud_resources`) y las muestras de métricas técnicas
(`resource_metric_samples`) por API y UI, **estrictamente separado** del consumo facturado de FOCUS.
Solo lectura, multi-tenant, additivo, sin migración (tablas preexistentes). El sistema **no** infiere
CPU/memoria/IOPS desde FOCUS; estas métricas provienen de monitorización/agentes.
- Backend (todo nuevo salvo wiring): puerto `IResourceMetricRepository` (`CloudResourceItem`,
  `ResourceMetricSampleItem`); `mappers/technicalMetricsMappers.ts`; `PrismaResourceMetricRepository`
  (`findMany` por `tenantId`, orden por recencia, `take: limit`); `TechnicalMetricsService` con
  `clampLimit` [1,200]; `TechnicalMetricsController` (+ `parseLimit`/`respondWithError`);
  `routes/technicalMetricsRoutes.ts` montado en `server.ts` bajo `/api/v1/technical-metrics`
  (`GET /resources`, `GET /samples`); wiring en `index.ts` + `server.ts`.
  - `TechnicalMetricsService.test.ts`: 4 casos (recursos por tenant, clamp de límite, muestras, vacío).
  - Verificación: `tsc --noEmit` exit 0; **58/58 tests**.
- Frontend: `api.ts` (tipos + `fetchTechnicalResources` / `fetchTechnicalMetricSamples`); vista
  `views/MetricasTecnicas.tsx` (inventario + muestras, aviso explícito de separación FOCUS, estados
  carga/vacío/error); navegación admin-only en `App.tsx`, `Sidebar.tsx`, `BottomNav.tsx`, `TopHeader.tsx`.
  - Verificación: `npm run build` (`tsc -b && vite build`) exit 0 (691 módulos).
- Nota honesta: en la BD demo estas tablas estarán probablemente **vacías** (su fuente real requiere
  colector/credenciales); la UI muestra estados vacíos honestos hasta que existan datos.

### 2026-05-30 — Bloque 3/4: Evaluación de calidad del agente IA + golden scenarios ✅

Marco determinista para medir la calidad del agente **sin llamar al modelo** ni depender de
credenciales — base para endurecer prompts con medición en vez de a ciegas. Solo backend, puro, additivo.
- `ai/evaluation/qualityRubric.ts`: funciones puras. `evaluateRecommendationDrafts` (controles:
  count, accountScoping, severityValid, evidenceLevel, **focusHonesty** —COST_ONLY exige
  requiresTechnicalValidation—, savingsRealism, spanishText) y `evaluateExecutionPlan` (requiredArrays,
  scopeAccount, **noAutoExecution**). Reusa `isRecord` de `ai/jsonReadHelpers`.
- `ai/evaluation/goldenScenarios.ts`: 4 escenarios sintéticos (bueno con consumo; FOCUS-only honesto;
  cuenta inventada → rechazo del parser; ahorro irreal → reprobado por rúbrica). Datos marcados demo.
- `ai/evaluation/goldenScenarioRunner.ts`: `runScenarioOffline` ejercita el pipeline real
  (`parseRecommendationDrafts` → rúbrica) y clasifica `PARSED_AND_PASSED | PARSED_BUT_FAILED | PARSE_REJECTED`.
- `ai/evaluation/goldenScenarios.test.ts`: recorre todos los escenarios + controles finos de la rúbrica.
- Verificación: `tsc --noEmit` exit 0; **54/54 tests** (+9 vs. bloque anterior).
- Orden ajustado: se priorizó este bloque (#3/#4) sobre #2 porque es autocontenido y no requiere
  credenciales; #2 (métricas técnicas) queda como siguiente.

### 2026-05-30 — Bloque 1: Historial de Ingesta + Calidad de Datos ✅

Objetivo del bloque: exponer por API (solo lectura, nivel tenant) el historial de jobs de ingesta y
los controles de calidad de datos (tablas ya existentes en BD, sin migración), y añadir una vista
nueva en el frontend. Additivo, multi-tenant, sin tocar prompts/IA ni contratos existentes.

- **Paso 0 — Commit de línea base** ✅. El árbol tenía 87 archivos modificados + carpetas nuevas
  (refactor <200 líneas entremezclado con trabajo previo sin commitear). Por decisión de alcance se
  consolidó en un único commit snapshot `a105817` (excluyendo `.claude/` —añadido a `.gitignore`— y 5
  scripts scratch `.mjs`). `.env` ya estaba ignorado. Verificación previa: `tsc` exit 0, 41/41 tests.
- **Bitácora creada** ✅: este archivo.
- **Backend — API de ingesta + calidad de datos** ✅. Additivo, sin migración (tablas ya existentes).
  - Puerto `ICloudConnectionRepository`: nuevos tipos `IngestionJobHistoryItem` y
    `DataQualityCheckItem` + firmas `listIngestionJobsForTenant` / `listDataQualityChecksForTenant`.
  - Repo `PrismaCloudConnectionRepository` + `mappers/cloudConnectionMappers.ts`
    (`toIngestionJobHistoryItem`, `toDataQualityCheckItem`): `findMany` filtrado por `tenantId`,
    `orderBy` fecha desc, `take: limit`.
  - Servicio `CloudConnectionService`: `listIngestionHistory` / `listDataQualityChecks` con
    `clampLimit` (default 50, rango [1, 200]).
  - Controlador `CloudConnectionController`: handlers `listIngestionHistory` / `listDataQuality`
    (+ `parseLimit`), reusando `requireTenant` / `respondWithError`.
  - Ruta nueva `routes/ingestionRoutes.ts` montada en `server.ts` bajo `/api/v1/ingestion`:
    `GET /history` → `{ success, jobs }`, `GET /data-quality` → `{ success, checks }` (ambos `requireAuth`).
  - Tests `CloudConnectionService.test.ts`: fake actualizado + 4 casos (historial por tenant, clamp de
    límite, checks de calidad, lista vacía).
  - Verificación: `tsc --noEmit` exit 0; **45/45 tests** (`vitest run --exclude '**/.claude/**'`).
- **Frontend — vista Ingesta** ✅. Additivo, en español, admin-only.
  - `services/api.ts`: tipos (`IngestionJobHistoryItem`, `DataQualityCheckItem`, enums y *responses*)
    + funciones `fetchIngestionHistory` / `fetchDataQualityChecks` (con `?limit=`), reusando `apiRequest`.
  - Vista `views/Ingesta.tsx`: dos secciones (Historial de ingesta y Calidad de datos) con tablas,
    badges de estado en español, estados de carga/vacío/error.
  - Navegación: `App.tsx` (type `View` + import + render `case 'ingesta'`), `Sidebar.tsx`,
    `BottomNav.tsx` y `TopHeader.tsx` (entrada "Ingesta y Datos" + título; los 3 componentes
    redeclaraban `CurrentView`, todos actualizados con `'ingesta'`).
  - Verificación: `npm run build` (`tsc -b && vite build`) exit 0 (690 módulos). Aviso de tamaño de
    chunk preexistente, no relacionado.

**Bloque 1 COMPLETADO.** Backend `tsc` 0 + 45/45 tests; frontend build 0. Rebanada vertical de
ingesta/calidad de datos operativa de extremo a extremo (API → UI), multi-tenant, sin migración.

## 3. Próximos bloques (orden de prioridad del goal)

1. **(en curso)** UI de ingesta / calidad de datos — API + vista.
2. Métricas técnicas separadas de FOCUS (vista + API sobre `ResourceMetricSample`; **sin** inferir
   CPU/memoria/IOPS desde FOCUS).
3. Fortalecimiento del motor IA con evidencia/auditoría + golden scenarios del agente.
4. Hardening y documentación de despliegue (secretos, CORS, JWT, rate limits, variables de entorno).
5. Conectores cloud reales + scheduler de jobs (sin remediación automática).

- Runner manual agregado: 
pm run ingestion:worker:once ejecuta un job pendiente y devuelve JSON con duracion/resumen para pruebas de rendimiento controladas.

- Preflight agregado: 
pm run ingestion:worker:preflight valida DATABASE_URL y CREDENTIAL_ENCRYPTION_KEY sin exponer valores. Evidencia 2026-06-05: DATABASE_URL=true, CREDENTIAL_ENCRYPTION_KEY=false en .env actual.
- Benchmark base sin jobs pendientes: con una clave temporal de proceso, 
pm run ingestion:worker:once completo en 929 ms y devolvio { processed: false }. Falta benchmark real con credenciales cifradas y jobs OCI/AWS.

### 2026-06-05 - Ingesta OCI SDK verificada con metricas reales

- Se agrego `npm run oci:register-profile` para registrar un perfil OCI CLI como credencial operativa cifrada en `cloud_connection_credentials`, sin imprimir secretos.
- Se agrego `npm run ingestion:create-job` para encolar jobs manuales de `BILLING_EXPORT`, `TECHNICAL_METRIC` o `INVENTORY`, con ventana relativa (`--hours`) o exacta (`--start`/`--end`).
- Hallazgo tecnico: OCI CLI devolvia metricas, pero el SDK quedaba en 0 porque `SummarizeMetricsDataResponse` en TypeScript usa `items`, no `summarizedMetricsData`. Se corrigio `OciSdkIngestionProvider` y se agrego prueba unitaria para este shape.
- Benchmark real en Supabase/OCI: job `TECHNICAL_METRIC` historico `2026-06-04T01:30:00Z` a `2026-06-04T20:30:00Z`, 11 llamadas API, 429 muestras normalizadas, duracion interna 660 ms, sin warnings.
- Queda pendiente repetir benchmark con ventana viva/diaria cuando el recurso siga emitiendo metricas y hacer prueba equivalente AWS con rol `AssumeRole` real.

### 2026-06-05 - Base operativa AWS SDK

- Se agrego `npm run aws:register-role` para guardar un rol AWS `AssumeRole` como credencial operativa cifrada, con soporte de `externalId`, `sessionName`, region y proposito (`OPERATIONAL`, `BILLING_EXPORT_READ`, `METRICS_READ`, `STORAGE_READ`).
- Se hizo testeable `AwsSdkIngestionProvider` mediante factories internas de STS, CloudWatch y S3 sin cambiar la ruta productiva.
- Se agrego prueba unitaria para `GetMetricData`: valida normalizacion de `MetricDataResults` hacia `resource_metric_samples`, con recurso, metrica, unidad y granularidad.
- Decision de diseno confirmada con documentacion AWS: FOCUS/Data Exports cubre costos y uso facturado en S3; CloudWatch `GetMetricData` cubre metricas tecnicas y permite hasta 500 metricas por request; acceso MSP recomendado mediante `AssumeRole` con `ExternalId`.
- Pendiente: obtener rol AWS real de cliente/lab, configurar `awsMetricDefinitions` y/o `awsFocusExportLocations`, ejecutar benchmark real equivalente al de OCI.

### 2026-06-05 - Cobertura FOCUS por adapters SDK

- Se agregaron pruebas de adapter para `BILLING_EXPORT` en AWS y OCI: discovery por prefijo, filtrado de objetos `.csv`/`.csv.gz`, lectura de objeto y normalizacion con `parseFocusCsvToLineItems`.
- AWS probado con `ListObjectsV2Command` + `GetObjectCommand` simulados; valida `objectsDiscovered`, `objectsProcessed`, `rowsParsed` y fila FOCUS canonica.
- OCI probado con `listObjects` + `getObject` simulados; valida el mismo contrato para Object Storage.
- No se encontraron cambios necesarios en el parser/adapters para esta rebanada; la ruta SDK FOCUS queda cubierta por tests, pero falta ejecutar con buckets reales de AWS/OCI.
- Verificacion: `npm run typecheck`, `npm test -- --run` (24 archivos, 101 tests) y `npm run build`.

### 2026-06-05 - Doctor de readiness de ingesta

- Se agrego `npm run ingestion:doctor` para inspeccionar conexiones AWS/OCI activas, credenciales activas por proposito, metadata configurada, ultimos jobs y errores/resumen sin imprimir secretos.
- Ejecucion contra Supabase actual: `ok=true`, OCI tiene credencial `OPERATIONAL`, 11 `ociMetricDefinitions` y ultimo job tecnico exitoso con 429 muestras.
- Pendientes reportados por el doctor: falta metadata `ociFocusReportObjects`/`ociFocusReportLocations` para costos FOCUS en OCI; no existe conexion AWS activa.
- Este comando queda como preflight operacional antes de probar cuentas reales o diagnosticar por que no se ingestan costos/metricas.

### 2026-06-05 - Configuracion operativa de fuentes FOCUS

- Se agrego `npm run ingestion:configure-focus` para registrar metadata FOCUS de AWS/OCI sin editar Supabase manualmente.
- Soporta `--mode location` para prefijos y `--mode object` para objetos directos; `--replace` reemplaza el arreglo seleccionado y por defecto conserva metadata existente.
- OCI actualiza `ociFocusReportLocations` u `ociFocusReportObjects`; AWS actualiza `awsFocusExportLocations` o `awsFocusExportObjects`.
- La logica de metadata esta separada en `focusSourceMetadata.ts` y tiene pruebas unitarias para append, replace y validacion de campos requeridos.

### 2026-06-05 - Preview dry-run de fuentes FOCUS

- Se agrego `npm run ingestion:preview-focus` para validar fuentes FOCUS antes de crear jobs `BILLING_EXPORT`.
- El preview lista objetos directos y objetos descubiertos por prefijo, filtra `.csv`/`.csv.gz`, no descarga contenido y no escribe datos.
- Incluye helper testeado `focusSourcePreview.ts` para leer metadata AWS/OCI y aplicar limites.
- Ejecucion contra Supabase OCI actual: `configuredObjects=0`, `configuredLocations=0`, `discoveredObjects=0`; confirma que falta bucket/prefix u objeto FOCUS real.

### 2026-06-05 - Worker continuo sin solapamiento

- Se agrego `startCloudIngestionWorkerLoop` para ejecutar una pasada inmediata al arrancar y luego por intervalo configurable.
- El loop evita solapamientos: si una iteracion sigue activa, la siguiente se omite y registra warning.
- `index.ts` usa el loop cuando `INGESTION_WORKER_ENABLED=true`; `.env.example` documenta `INGESTION_WORKER_ID` e `INGESTION_WORKER_INTERVAL_MS`.
- Pruebas cubren ejecucion inmediata, scheduling, skip por solapamiento y recuperacion despues de error.

### 2026-06-05 - API tenant-level para encolar jobs

- Se agrego `POST /api/v1/ingestion/jobs` como alias tenant-level para crear jobs de ingesta desde el modulo de ingesta/UI.
- El body recibe `cloudConnectionId`, `sourceType`, `targetStart` y `targetEnd`; reutiliza `CloudConnectionService.queueIngestion` y conserva validacion tenant.
- La ruta historica `POST /api/v1/cloud-connections/:id/ingestion-jobs` sigue funcionando.
- Se agrego test de wiring para confirmar que `/ingestion/jobs` apunta a `queueTenantIngestion`.

### 2026-06-05 - UI para encolar jobs de ingesta

- La vista `Ingesta` del frontend deja de ser solo lectura: ahora permite encolar jobs desde la UI usando `POST /api/v1/ingestion/jobs`.
- El formulario recibe conexion, fuente (`TECHNICAL_METRIC`, `BILLING_EXPORT`, `INVENTORY`) y rango objetivo; tras encolar refresca historial/calidad.
- La conexion ahora se selecciona desde `GET /api/v1/cloud-connections`; ya no exige escribir manualmente el `cloudConnectionId`.
- Build frontend verificado con `npm run build`.

### 2026-06-07 - OCI FOCUS real desbloqueado y validado

- Se creo desde OCI CLI una policy para que el grupo operativo `FinOpsReaders` pueda leer objetos de reportes de uso en el tenancy administrado por Oracle.
- Con el perfil `FINOPS_READER` se valido acceso real a Object Storage: namespace disponible, bucket Oracle-managed de la tenancy y 490 objetos bajo `FOCUS Reports`.
- Se configuro la fuente FOCUS principal en Supabase usando `npm run ingestion:configure-focus` con modo `location`, `prefix=FOCUS Reports/`, `focusVersion=1.0` y limite operativo `maxObjects=20`.
- `npm run ingestion:preview-focus -- --provider oci --limit 10` descubrio objetos FOCUS reales sin descargar ni escribir datos.
- Hallazgo corregido: el SDK TypeScript de OCI devuelve el cuerpo de `getObject` en `response.value` como `ReadableStream` web para este caso real, no en `getObjectBody`. El adapter ahora soporta ambos shapes, ademas de `Uint8Array`, `arrayBuffer`, streams Node, async iterables y strings.
- Hallazgo corregido: guardar 20 objetos FOCUS reales con upserts dentro de una transaccion interactiva de Prisma agotaba el timeout. La persistencia de filas idempotentes ahora se ejecuta fuera de la transaccion larga y se deja transaccional solo el cierre del job, watermark y quality check.
- Evidencia real contra Supabase/OCI: job `cmq41j2yh00008s52a712arsv` finalizo `SUCCESS`, proceso 20 objetos, 533 filas FOCUS, 21 llamadas API, 0 warnings.
- `npm run ingestion:doctor` queda en `ok=true` para OCI; el unico warning global vigente es que aun no existe conexion AWS activa.

### 2026-06-11 - FOCUS real conectado a la capa analitica

- Se agrego proyeccion idempotente desde `focus_cost_line_items` hacia `cost_metrics` durante el cierre de jobs `BILLING_EXPORT`.
- La proyeccion crea o reutiliza `cloud_accounts` a partir de `SubAccountId`, `BillingAccountId` o la cuenta raiz de la conexion, preservando costo, consumo FOCUS, moneda, servicio, recurso, region y metadatos de procedencia.
- El resumen de readiness ahora expone `durationMs`, `costMetrics` y `costMetricsInserted`, para que la UI/CLI muestren si los datos FOCUS llegaron tambien a la capa analitica usada por dashboard, contexto IA y recomendaciones.
- Validacion real contra Supabase/OCI: job `cmq91sgea0000fc52feo0c6rh` finalizo `SUCCESS`, proceso 20 objetos, 533 filas FOCUS, proyecto 533 `cost_metrics`, inserto 432 nuevas, 21 llamadas API, 0 warnings.
- Conteos directos posteriores: `focus_cost_line_items` OCI = 9160 y `cost_metrics` OCI = 9228.
- Hallazgo de rendimiento: el ciclo completo del worker para 20 objetos/533 filas tomo 58.3 s. Antes de subir `maxObjects` de forma agresiva conviene optimizar persistencia por lotes/upsert masivo o staging SQL.

### 2026-06-11 - RediseÃ±o analitico de metricas de uso

- Se reemplazo la vista de `Metricas Tecnicas` para que deje de ser una tabla de muestras crudas y pase a mostrar KPIs, filtros, grafica temporal, oportunidades tecnicas, recursos con costo asociado y tabla secundaria de auditoria.
- Backend: se agregaron `GET /api/v1/technical-metrics/overview` y `GET /api/v1/technical-metrics/series`.
- `overview` deriva recursos desde `resource_metric_samples` aunque `cloud_resources` este vacio, cataloga metricas por grupo (CPU, memoria, red, disco, sistema), calcula KPIs y genera oportunidades tecnicas como baja CPU, memoria alta, metricas desactualizadas o falta de inventario normalizado.
- `series` entrega puntos agregados por bucket (`auto`, `raw`, `30m`, `hour`, `day`) con promedio, minimo, maximo, ultimo valor y conteo de muestras.
- Se agrego cruce honesto con costos: solo muestra costo asociado cuando existe match exacto entre `cost_metrics.resource_id` y `resource_metric_samples.external_resource_id`; si no existe, la UI lo declara como "Sin match exacto".
- Se agrego indice Prisma para acelerar consultas por `tenantId`, `externalResourceId`, `metricName` y `sampledAt`.
- Frontend: la vista usa Recharts, filtros por recurso/grupo/metrica/rango/granularidad y toma el ultimo dato disponible como referencia de rango, no la fecha actual. Esto permite visualizar la cuenta OCI demo aunque las metricas reales disponibles esten entre 2026-06-04 y 2026-06-06.
- Verificacion: backend `npm test -- --run src/application/services/TechnicalMetricsService.test.ts`, backend `npm test -- --run` (32 archivos, 133 tests), backend `npm run typecheck`, backend `npm run build`, frontend `npm run build`.
- Bugfix posterior: los rangos relativos (`24h`, `7d`, `30d`) ahora se calculan contra la fecha actual y la grafica rellena buckets sin muestras para que el cambio de rango sea visible. En modo `auto`, la peticion usa buckets horarios para `24h` y diarios para `7d`/`30d`. Verificacion: frontend `npm run build`.

### 2026-06-11 - Backfill historico y cobertura de metricas tecnicas

- Se agrego `POST /api/v1/ingestion/backfill` para encolar backfill historico de `TECHNICAL_METRIC` por conexion cloud, con `lookbackDays` limitado a 1-90 dias y `windowHours` limitado a 1-24 horas.
- El backfill consulta jobs existentes `PENDING`, `RUNNING` o `SUCCESS` y omite ventanas completamente cubiertas para evitar duplicados; los jobs creados usan `maxAttempts=1` para no saturar el worker con ventanas historicas.
- Se agrego `GET /api/v1/technical-metrics/coverage`, que devuelve muestras totales, recursos, metricas, dias esperados, dias con datos y cobertura por metrica/rango.
- La UI de `Ingesta` ahora tiene una accion "Backfill historico de metricas tecnicas" para traer hasta 90 dias hacia atras al agregar o corregir una cuenta.
- La UI de `Metricas Tecnicas` ahora muestra "Cobertura de datos", diferencia muestras crudas vs puntos agregados de la grafica y usa cache simple de series para reducir lag al alternar metricas ya consultadas.
- El resumen de jobs tecnicos de OCI ahora registra rango solicitado, granularidad y datapoints retornados dentro de `coverage`.
- Verificacion: backend `npm test -- --run CloudConnectionService` (12 tests), backend `npm test -- --run` (32 archivos, 136 tests), backend `npm run typecheck`, backend `npm run build`, frontend `npm run build`.

### 2026-06-12 - Optimizacion de rendimiento de metricas tecnicas con uPlot

- Se reemplazo la grafica principal SVG/Recharts de `Metricas Tecnicas` por `uPlot`/Canvas para evitar miles de nodos DOM al usar granularidades finas.
- `GET /api/v1/technical-metrics/series` ahora devuelve `series` mas `meta` con `hasMore`, `nextCursor`, `returnedPoints`, `totalSamples`, `queryMs`, `bucket` y `pageSize`.
- La serie se calcula desde PostgreSQL con SQL agregado por `raw`, `30m`, `hour` y `day`; se preservan `avg`, `min`, `max`, `latest` y timestamps de picos para no ocultar picos tecnicos.
- El frontend carga series por paginas, cancela requests anteriores con `AbortController`, usa cache LRU limitada y permite drilldown raw seleccionando una ventana sobre la grafica.
- Se agrego indice por `tenantId, sampledAt` en `resource_metric_samples` para acelerar rangos temporales generales.
- Verificacion: consulta real contra Supabase para `raw`, `30m`, `hour`, `day`; backend `npm run typecheck`; backend `npm run build`; backend `npm test -- --run` (32 archivos, 137 tests); frontend `npm run build`.

### 2026-06-17 - Supabase migrado y refuerzo de performance critica

- Se aplico en Supabase la migracion no destructiva `resource_metric_sample_time_index`, creando `resource_metric_samples_tenant_id_sampled_at_idx`.
- Evidencia Supabase: consulta general por `tenant_id + sampled_at` bajo de ~252 ms a ~5 ms en `EXPLAIN ANALYZE`.
- `technical-metrics/series` ahora usa cursor opaco compuesto (`bucketStart + externalResourceId + metricName`) para paginar sin saltarse puntos cuando varios grupos comparten bucket.
- La ruta `raw` de metricas tecnicas se separo de la agregada: devuelve muestras exactas con SQL directo, sin ventanas ni agregacion. Evidencia Supabase: ~2 ms para 1001 puntos raw representativos.
- Los buckets agregados conservan calculo en PostgreSQL y reemplazan `array_agg` ordenado por rankings de ventana para evitar construir arrays por grupo.
- La ingesta FOCUS cambio de `upsert` fila por fila a `createMany(skipDuplicates)` por lotes de 1000 filas; se conserva idempotencia por la clave unica `(cloud_connection_id, charge_period_start, line_item_hash)`.
- El readiness/result summary ahora expone `focusRowsInserted` para distinguir filas parseadas de filas nuevas realmente persistidas.
- Hallazgo no ejecutado en esta fase: Supabase advisors reportan RLS deshabilitado en tablas publicas e indices FK no cubiertos. Se deja como bloque de hardening separado para no mezclar seguridad amplia con performance critica.

### 2026-06-24 - Modulo master admin MSP multi-tenant

- Se agrego backend `GET/POST/PATCH /api/v1/master-admin/tenants`, `GET/POST /users`, `GET /assignments`, `PUT/DELETE /tenants/:tenantId/users/:userId`.
- El modulo exige rol real `MASTER_ADMIN` consultado en BD; no depende solo del tenant activo del JWT.
- El admin maestro puede ver todos los tenants, crear tenants, suspender/reactivar tenants, crear usuarios tecnicos/admin operador y asignar o revocar tenants por usuario.
- Los usuarios staff creados quedan asociados al tenant home del master admin, no al tenant activo seleccionado en la UI.
- Frontend: nueva vista `Administracion MSP`, visible solo para `MASTER_ADMIN`, con KPIs, tablas, formularios de tenant/usuario y gestion de accesos.
- El selector superior conserva el comportamiento operativo: solo tenants activos accesibles; al crear/reactivar/suspender tenant se refresca la lista disponible.
- Verificacion: backend `npm test -- MasterAdminService.test.ts --run`, backend `npm run build`, frontend `npm run build`.
