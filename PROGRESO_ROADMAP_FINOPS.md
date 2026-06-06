# Progreso — FinOps Inteligente (Backend)

> Bitácora viva del proyecto. Se actualiza **a medida que se avanza**, no solo al final.
> Estructura: (1) Estado actual · (2) Bitácora de avance (cronológica inversa) · (3) Próximos bloques.

## 1. Estado actual

Plataforma FinOps con IA generativa para optimización de costos cloud. Backend Node.js + TypeScript
(ESM, Clean Architecture: domain / application / infrastructure / presentation), Prisma sobre
Supabase/PostgreSQL, multi-tenant/MSP. Frontend: Vite + React + TS + Tailwind (`finops-app`).

Capacidades operativas hoy: autenticación JWT y roles; ingesta OCI FOCUS local; analítica de costos,
forecast, consumo, costo unitario e insights; recomendaciones IA (NVIDIA/NIM) con auditor IA
independiente; planes de ejecución auditados; aprobación/rechazo con aprendizaje asíncrono; Context
Engine, memoria, reglas TAK, grafo y trazas IA; notificaciones in-app y Telegram MVP.

Decisiones vigentes: todo el texto de usuario en español; en UI se dice "oportunidades", no
"anomalías"; n8n descartado; WhatsApp es evolución futura (Telegram MVP); sin remediación automática
cloud; ejecución manual, gobernada y auditable; FOCUS sirve para costo/consumo facturado pero **no**
para inferir CPU/memoria/IOPS/throughput; Supabase es la BD principal (arquitectura portable a
PostgreSQL).

## 2. Bitácora de avance

### 2026-06-05 - Scheduler seguro de jobs de ingesta

- Se agrego `npm run ingestion:schedule` para programar jobs recurrentes de ingesta sin depender de la UI ni de scripts manuales.
- El comando corre en modo dry-run por defecto; solo escribe en `ingestion_jobs` cuando se usa `--apply`.
- La logica crea jobs `TECHNICAL_METRIC` y `BILLING_EXPORT` solo si la conexion activa tiene credencial lectora/operativa y metadata suficiente. Si falta metadata FOCUS, no inventa jobs de costos.
- Se agregaron reglas de deduplicacion: omite fuentes con jobs `PENDING`/`RUNNING` y fuentes con cobertura reciente dentro del cooldown configurado.
- Pruebas agregadas: scheduling por metadata, FOCUS, jobs pendientes, cobertura reciente, falta de metadata y credenciales inactivas.
- Dry-run contra Supabase actual: 1 conexion OCI evaluada; planifica `TECHNICAL_METRIC`; omite `BILLING_EXPORT` porque faltan `ociFocusReportObjects`/`ociFocusReportLocations`; no hay conexion AWS activa.
- Retroalimentacion de la meta: el siguiente paso productivo debe ser ejecutar `npm run ingestion:schedule -- --apply` junto con el worker continuo en un intervalo controlado, pero solo despues de decidir la frecuencia operativa. AWS real y FOCUS real siguen pendientes por falta de cuenta/bucket/prefix.

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
