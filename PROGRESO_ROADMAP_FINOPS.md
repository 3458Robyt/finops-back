# Progreso — FinOps Inteligente (Backend)

### 2026-08-12 — Runners de integración aislada acotados y revalidación PostgreSQL

- Se centralizó la ejecución de `auth-cleanup`, `process-heartbeat`, `agent-quality`, `resource-lineage` y
  `cost-allocation` en `scripts/testing/integrationRuntime.ts`: timeout de proceso configurable, timeout de
  conexión/consulta, allowlist de schemas y cleanup garantizado en `finally`.
- Una corrida que superó cinco minutos dejó un schema de prueba residual; se eliminó únicamente ese schema
  permitido y las cinco integraciones se ejecutaron individualmente con resultado aprobado. La inspección final
  confirmó cero schemas `finops_e2e_*` residuales.
- Evidencia de esta revalidación: heartbeat `PASSED`, auth cleanup `PASSED`, agent quality 1/1, resource lineage
  5/5 y cost allocation 3/3. El benchmark de asignación quedó documentado con preview 1.694,86 ms y cierre
  8.712,79 ms en Supabase remoto; no se redefine el SLA representativo hasta contar con destino de despliegue.
- El E2E completo se revalidó después de corregir la espera del selector de tenant: `test:e2e:full` pasó 5/5
  escenarios contra 61 migraciones en un schema aislado de Supabase y eliminó sus dos tenants y el schema al finalizar.

### 2026-08-12 — Auditoría final local y reconciliación documental del runtime

- Se revalidó el estado actual contra el goal y las cuatro fuentes autoritativas. Los repositorios quedaron
  limpios en `feat/shared-cost-allocation`; no se hizo push, merge ni PR.
- La validación vigente conserva 105 archivos de pruebas aprobados, 436 pruebas pasadas y 10 omitidas,
  IA offline 24/24, arquitectura 357/1 excepción, release hygiene backend 617 y frontend 134.
- Supabase reportó 61 migraciones aplicadas; `db:verify:quality-indexes`, integración de heartbeat/RLS,
  typecheck, build, frontend lint/build y `npm audit --omit=dev --audit-level=high` pasaron.
- Se corrigieron conteos obsoletos en `README.md`, `docs/DEUDA_TECNICA.md` y `docs/ESTADO_ACTUAL_FINOPS.md`.
  Los snapshots fechados más antiguos permanecen como historia y no se interpretan como estado vigente.
- El goal mantiene como abiertos, bloqueados o diferidos únicamente los elementos que requieren proveedores,
  credenciales, IAM o destino de despliegue externo; no se fabricó evidencia para AWS, OCI Usage API ni mensajería.

### 2026-08-12 — Roles de proceso granulares para operación separable

- `APP_PROCESS_ROLE` ahora admite roles específicos para cada worker y
  scheduler: ingesta, aprendizaje, análisis de recomendaciones, scheduler de
  ingesta, análisis, reconciliación de valor, notificaciones y limpieza auth.
- Se conserva la compatibilidad con `api`, `worker`, `scheduler` y `all`; una
  resolución tipada de capacidades evita que un proceso granular arranque
  responsabilidades ajenas.
- Se añadieron pruebas para alias legacy, aislamiento de cada rol granular y
  modo `all`, además de validación de configuración de desarrollo/producción.
- La separación operativa queda implementada en el artefacto; el despliegue
  24/7, alertas y rehearsal de recuperación siguen diferidos por falta de
  destino productivo.
- Los loops no solapables ahora registran `started`, `completed`, `failed`,
  `skipped` y duración en Prometheus, etiquetados únicamente por rol de proceso
  y resultado. Esto hace observable el backlog/atasco sin introducir IDs de alta
  cardinalidad; el scheduler outbound usa el mismo mecanismo.

### 2026-08-12 — Evaluación periódica de presupuestos opt-in

- Se integró `budget-scheduler`, con actor técnico explícito, tenant scoping,
  intervalo configurable y ejecución idempotente mediante el `BudgetService` ya
  existente. Las alertas reutilizan la cola outbound y las notificaciones in-app.
- Se añadieron `BUDGET_SCHEDULER_ENABLED`, `BUDGET_SCHEDULER_TENANT_ID`,
  `BUDGET_SCHEDULER_USER_ID` y `BUDGET_SCHEDULER_INTERVAL_MS`; todas las
  integraciones continúan apagadas por defecto durante desarrollo.
- La activación permanente, alertas 24/7 y despliegue del scheduler siguen en
  `OPS-002` diferido por falta de destino productivo.

### 2026-08-12 — Readiness operativo, métricas de heartbeat y recuperación documentada

- `GET /ready` dejó de comprobar únicamente la conexión de base: ahora devuelve
  checks separados para base de datos, rol `finops_runtime`, migración esperada,
  advisory lease, heartbeat fresco y disponibilidad opcional de IA. La IA sin
  configuración no bloquea las capacidades determinísticas.
- Se añadió `DB_EXPECTED_MIGRATION`, obligatorio en producción, para evitar que
  una imagen incompatible reciba tráfico después de una migración futura. La
  identidad de proceso se comparte entre heartbeat y readiness, y el heartbeat
  exporta contadores/latencia sin etiquetas de alta cardinalidad.
- `npm run test:integration:process-heartbeat` verifica ahora también readiness
  contra migraciones desde cero, RLS runtime, lease y heartbeat. Se documentó el
  runbook `docs/OPERACION_RECUPERACION.md`; el rehearsal productivo de backup y
  restore queda diferido porque todavía no existe destino operativo autorizado.
- La validación completa posterior pasó con 104 archivos de test aprobados, 4
  omitidos, 433 pruebas pasadas y 10 omitidas; arquitectura 357/1 excepción y
  release hygiene 616 rutas.

### 2026-08-12 — Heartbeat durable de procesos y flags de runtime estrictos

- Se añadió `ProcessHeartbeatService` con repositorio Prisma, tabla
  `runtime_process_heartbeats` y migración `202608120005_runtime_process_heartbeats`.
  Cada API/worker/scheduler registra su instancia al iniciar, renueva su liveness
  con `PROCESS_HEARTBEAT_INTERVAL_MS`, marca `STOPPED` durante el shutdown y queda
  stale si deja de renovar. La política RLS limita lectura/escritura al
  `app.worker_id` propio; Supabase principal fue migrado y verificado sin grants
  para `anon`, `authenticated` ni `service_role`.
- La persistencia usa transacciones para que el contexto runtime se aplique de
  forma consistente también en operaciones Prisma directas. La identidad combina
  rol, instancia y PID para reutilizar la fila cuando el mismo proceso se reinicia.
  El runner
  `npm run test:integration:process-heartbeat` validó desde un schema aislado la
  escritura del propietario, el aislamiento entre procesos y la transición a
  `STOPPED`; la suite dirigida y typecheck pasan.
- La validación de flags booleanos ahora rechaza valores ambiguos (`yes`, `1`,
  vacíos, etc.) y mantiene semántica case-insensitive/trimmed en integraciones y
  enforcement de producción. AWS, OCI Usage API, mensajería real y operación 24/7
  siguen en sus estados externos/diferidos; no se simulan.

### 2026-08-12 — Validación del slice de higiene auth

- La suite vigente pasa con 102 archivos aprobados, 4 omitidos, 400 pruebas pasadas y
  10 omitidas; arquitectura backend 352/1 excepción, typecheck, build e IA offline 24/24. El registro de higiene cubre 598 rutas backend y 134 frontend.

### 2026-08-12 — Higiene acotada del ciclo de vida de autenticación

- Se añadió `AuthLifecycleCleanupService` con repositorio Prisma bounded: solo elimina sesiones, refresh tokens,
  tokens de recuperación y desafíos MFA cuyo `expiresAt` ya pasó; mantiene artefactos usados/revocados aún vigentes
  para no perder detección de replay ni trazabilidad. La selección de sesiones usa `FOR UPDATE SKIP LOCKED` y
  comprueba refresh tokens vigentes para evitar que una cascada elimine credenciales por una carrera concurrente.
- El scheduler es opt-in (`AUTH_CLEANUP_SCHEDULER_ENABLED=false` en desarrollo) y utiliza el contexto RLS exacto
  `finops-maintenance:auth-lifecycle`. Las migraciones `202608120002`, `202608120003` y `202608120004`
  restringen la función, acotan el worker a filas expiradas, agregan índices por `expires_at` y revocan explícitamente
  ejecución a `anon`, `authenticated` y `service_role`.
- `npm run test:integration:auth-cleanup` pasó en schema Supabase aislado y lo eliminó en `finally`; se conservaron
  los registros no expirados. La suite dirigida y typecheck también pasan.

### 2026-08-12 — Compuerta reproducible de higiene de release

- Backend y frontend incorporan `npm run check:release-hygiene`, que inspecciona las rutas rastreadas por Git y
  rechaza `.env` no permitido, certificados/claves, bases locales, logs y artefactos E2E; `.env.example` queda como
  única excepción explícita. La validación pasó con 588 archivos backend y 133 frontend.
- Se reforzaron ambos `.gitignore` con extensiones de credenciales y bases locales. La compuerta quedó integrada al
  `test:all` backend y al `build` frontend; no sustituye la rotación de secretos ni el secret manager productivo.

### 2026-08-12 — Hardening de timeouts para mensajería externa

- SMTP aplica `connectionTimeout`, `greetingTimeout` y `socketTimeout`; Telegram usa `AbortController` y transforma
  expiraciones en `TELEGRAM_TIMEOUT`. Ambos comparten `OUTBOUND_PROVIDER_TIMEOUT_MS`, con 15 segundos por defecto y
  rango 5–60 segundos validado en producción.
- Se agregaron regresiones de configuración, transporte SMTP y timeout Telegram. La suite vigente queda en 97
  archivos aprobados, 4 omitidos, 382 pruebas pasadas y 10 omitidas; IA offline 24/24, typecheck, arquitectura y
  build pasan. Graphify quedó actualizado a 4.279 nodos, 11.633 relaciones y 238 comunidades. El canary real
  SMTP/Telegram sigue abierto y no se simula.

### 2026-08-12 — Canary seguro de proveedores de mensajería

- Se agregó `npm run test:canary:messaging`, que envía únicamente a un destino de prueba explícito mediante
  `MESSAGING_CANARY_EMAIL_TO` o `MESSAGING_CANARY_TELEGRAM_CHAT_ID` y exige una confirmación fuerte. Sin ella el
  comando termina como `SKIPPED`; no usa la BD, no carga datos de tenants y sanitiza errores.
- El canary prepara la validación externa de `MSG-001`, pero no la cierra: todavía requiere credenciales reales,
  ejecución autorizada y validación adicional de la cola durable. Graphify quedó actualizado a 4.293 nodos,
  11.657 relaciones y 242 comunidades.

### 2026-08-12 — Cierre de modularidad crítica y evidencia de la beta

- `MOD-001` queda cerrado: los hotspots críticos ya están divididos por responsabilidad, los contratos públicos se
  conservan y `npm run check:architecture` pasa con 345 archivos de producción y una única excepción declarativa
  (`goldenScenarios.ts`). Las extracciones futuras de módulos cohesivos entre 200 y 400 líneas quedan como
  mantenimiento oportunista, no como bloqueo de la beta.
- La validación completa vigente pasa: backend `npm run test:all` con 97 archivos aprobados, 4 omitidos, 382 pruebas
  y 10 omitidas; IA offline 24/24; frontend arquitectura, typecheck, lint, build y bundle budget; auditorías de
  dependencias de producción sin vulnerabilidades.
- Permanecen explícitos los bloqueos/deferimientos externos de `AWS-001`, `OCI-001`, `MSG-001`, operación 24/7,
  secret manager externo, rate limiting distribuido y benchmark representativo; no se simulan para cerrar el roadmap.

### 2026-08-12 — Cierre de bypass de configuración y nomenclatura canónica de oportunidades

- `APP_PROCESS_ROLE` ahora falla cerrado cuando se proporciona un valor inválido incluso en desarrollo; únicamente
  la ausencia explícita de la variable conserva el shorthand `all`. Se agregó regresión de configuración.
- El recálculo de analítica expone `opportunities` como campo canónico y conserva `anomalies` solo como alias de
  compatibilidad. El frontend consume el campo canónico y mantiene fallback temporal para backends antiguos.
- Validación dirigida: 2 archivos/19 pruebas de configuración, 1 prueba de analítica y typecheck frontend aprobados.

### 2026-08-12 — Runner de recomendaciones IA aislado

- Se extrajo el caso de uso de generación de recomendaciones a `FinOpsAiRecommendationRunner`, que concentra
  preparación/evidencia, contexto determinístico, generación, auditoría, persistencia, deduplicación y trazas.
- `FinOpsAiService` queda como fachada de casos de uso y conserva sin cambios los contratos de chat,
  recomendaciones, preparación y planes. La lógica de auditoría y el bloqueo por evidencia siguen en las mismas
  fronteras; no se habilita ninguna acción cloud automática.
- La suite dirigida IA pasó 10 archivos/62 pruebas y el typecheck pasó. Graphify quedó actualizado a 4.259 nodos,
  11.610 relaciones y 228 comunidades.

### 2026-08-12 — Orquestación de backfill técnico modularizada

- Se extrajo la generación idempotente de ventanas de métricas técnicas a `CloudIngestionBackfillService`; el
  orquestador conserva activación, jobs manuales, cancelación, reintentos, salud e historial, y sigue exponiendo la
  misma fachada pública.
- La lógica conserva el límite histórico de 90 días, ventanas de 1–24 horas, omisión de ventanas cubiertas y
  `maxAttempts=1` para backfills controlados. La validación dirigida y el typecheck pasan.
- Graphify quedó actualizado a 4.256 nodos, 11.584 relaciones y 240 comunidades.

### 2026-08-12 — Separación de facturación OCI

- Se extrajo la recolección de facturación OCI (FOCUS por Object Storage y OCI Usage API) a
  `OciBillingCollector`, manteniendo en `OciSdkIngestionProvider` la composición de clientes y la fachada del
  proveedor. La lectura sigue siendo streaming, con cierre de clientes, retry y normalización hash de costos.
- Se agregó caracterización del camino `PROVIDER_API` sin afirmar disponibilidad productiva de Usage API; el bloqueo
  real de IAM continúa documentado en `OCI-001` y FOCUS permanece como fuente primaria.
- La suite vigente quedó en 95 archivos aprobados, 4 omitidos, 377 pruebas pasadas y 10 omitidas; IA offline 24/24,
  typecheck, arquitectura y build pasan. Graphify quedó actualizado a 4.250 nodos, 11.557 relaciones y 234
  comunidades.

### 2026-08-12 — Sanitización durable y error HTTP unificado

- Los mensajes de proveedores ya se sanitizan en la frontera de persistencia antes de guardarse en eventos de
  aprendizaje, trazas IA, trabajos de ingesta, corridas de contexto, resultados de Telegram y advertencias de
  inventario OCI. La regresión cubre API key y cookies en el flujo de aprendizaje.
- `AuthController`, `AuthSessionController`, `PasswordRecoveryController`, `MfaController`,
  `NotificationController`, `RecommendationReadController`, middleware de roles y el manejador HTTP global
  reutilizan `respondWithFinOpsError`; se eliminó mapeo duplicado y `AUTHENTICATION_FAILED` conserva 401.
- La configuración de fuentes de conexión cloud se extrajo a `CloudConnectionSourceConfiguration`, dejando el
  onboarding concentrado en registro, credenciales, validación y previsualización sin cambiar el contrato público.
- Se reemplazaron mensajes visibles en inglés de estas rutas por mensajes en español. La suite vigente quedó en
  95 archivos aprobados, 4 omitidos, 377 pruebas pasadas y 10 omitidas; IA offline 24/24, typecheck, arquitectura
  y build pasan. Graphify quedó actualizado a 4.242 nodos, 11.525 relaciones y 231 comunidades.

### 2026-08-12 — Redacción de headers sensibles en errores

- `safeErrorMessage` ahora consume y redacta el valor completo de headers `Authorization`/`Proxy-Authorization`
  (incluido el prefijo `Bearer`) y de `Cookie`/`Set-Cookie`, además de las credenciales, tokens, URLs autenticadas,
  claves AWS, JWT y PEM que ya cubría.
- Se agregó una regresión específica para bearer y cookies. La validación vigente quedó en `npm run test:unit`:
  95 archivos aprobados, 4 omitidos, 373 pruebas pasadas y 10 omitidas; arquitectura, typecheck, IA offline y build
  también pasan. Graphify quedó actualizado a 4.238 nodos, 11.442 relaciones y 237 comunidades.

### 2026-08-12 — Configuración productiva fail-closed

- Producción ahora exige `APP_PROCESS_ROLE` y rechaza valores desconocidos en vez de caer silenciosamente en
  `all`. También valida que las integraciones habilitadas tengan sus credenciales y destinos: SMTP, Telegram,
  scheduler de mensajes y scheduler de reconciliación.
- Desarrollo conserva defaults seguros: las integraciones siguen apagadas y puede usarse `APP_PROCESS_ROLE=all`.
- La suite de configuración quedó en 18 pruebas para roles, integraciones y destinos; la validación de
  configuración, typecheck y arquitectura pasan.

### 2026-08-12 — Manejo HTTP de errores centralizado

- `AgentController`, `AiController`, `AnalyticsController`, `OutboundMessageController` y
  `TelegramController` ya reutilizan `respondWithFinOpsError`; se eliminaron cinco implementaciones
  divergentes de mapeo HTTP.
- El helper central conserva `401`, `403`, `404`, `409`, `422` y `502`, incluye `diagnosticId`/auditoría
  para rechazos IA y registra errores inesperados con `safeErrorMessage`. El identificador de auditoría IA
  no se sobrescribe con el request ID cuando ambos existen.
- Se añadieron regresiones para proveedor IA y `AiAuditRejectedError`. Las pruebas dirigidas de HTTP/agent/
  Telegram pasan 8/8; arquitectura y typecheck pasan. Graphify quedó actualizado a 4.237 nodos y 11.441
  relaciones.

### 2026-08-12 — Extracción del despacho de canales externos

- `OutboundMessageService` dejó de mezclar la orquestación tenant-scoped con el detalle de entrega por canal.
  `OutboundChannelDeliveryService` concentra Telegram/SMTP, estados `SENT`/`SKIPPED`/`FAILED`, persistencia
  y previews; el servicio coordinador quedó en 268 líneas y el nuevo módulo en 114.
- Los errores de proveedores se sanitizan antes de persistirse en el historial de entregas, sin cambiar el
  contrato HTTP ni los estados de la cola. El envío externo continúa deshabilitado por defecto hasta contar
  con canaries SMTP/Telegram reales.
- Se añadieron tres pruebas de despacho y se conservaron las cuatro pruebas del procesador de cola: 7/7
  focalizadas aprobadas. `npm run typecheck`, `npm run check:architecture` y Graphify pasaron; Graphify quedó
  actualizado a 4.238 nodos y 11.426 relaciones.

### 2026-08-12 — Compatibilidad terminológica de oportunidades

- La ruta canónica de analítica continúa siendo `/api/v1/analytics/opportunities`; la ruta histórica
  `/api/v1/analytics/anomalies` conserva su payload por compatibilidad, pero ahora devuelve headers de
  deprecación y enlaza explícitamente a su sucesora.
- Se revisaron las cadenas visibles de frontend, Telegram y controladores: la interfaz usa “oportunidades”.
  Los nombres internos de dominio/BD (`CostAnomaly`, `anomalies`) se mantienen únicamente como compatibilidad
  técnica y no se renombraron de forma masiva para evitar una migración de contrato innecesaria.
- Se corrigieron comentarios y variables de presentación que todavía hablaban de anomalías, y se corrigió la
  documentación de la cola outbound para reflejar que su migración ya está aplicada en Supabase; los canaries
  externos siguen deshabilitados por defecto.
- Verificación dirigida: `npm run typecheck`, `npm run check:architecture` y `TelegramBotService.test.ts` (4/4)
  pasaron. Graphify fue actualizado a 4.228 nodos y 11.398 relaciones.

### 2026-08-12 — Verificación remota de paginación del reporte IA

- Se aplicó en Supabase la migración `202608120001_quality_report_keyset_indexes` mediante `npx prisma migrate deploy`; `prisma migrate status` quedó al día.
- Se añadió `npm run db:verify:quality-indexes`, una comprobación read-only que valida los dos índices y ejecuta `EXPLAIN (COSTS OFF)` sin imprimir credenciales ni datos de tenant.
- La verificación encontró `recommendations_tenant_id_created_at_id_idx` y `ai_context_traces_tenant_id_created_at_id_idx`; ambos planes usan `Index Only Scan Backward` con filtro por tenant/fecha y límite de página.
- `PERF-002` queda cerrado con evidencia remota. La integración aislada de calibración pasó 1/1 en un schema efímero creado por el runner `npm run test:integration:agent-quality`; `AI-007` queda cerrado sin inventar precisión ML ni precios LLM.

### 2026-08-12 — Integración aislada del reporte de calidad IA

- Se añadió `npm run test:integration:agent-quality`, que crea un schema `finops_e2e_*`, aplica todas las migraciones, ejecuta el caso tenant-scoped del reporte y elimina el schema en `finally`.
- La ejecución remota pasó 1/1: el tenant AWS solo mostró sus dimensiones y el tenant OCI solo las suyas; no se observaron filas cross-tenant.
- El runner exige un nombre de schema allowlisted y nunca usa la BD principal como destino de fixtures; `AI-007` queda cerrado con evidencia PostgreSQL real aislada.

### 2026-08-12 — Pronóstico, mensajería durable, aprendizaje reversible y oportunidades deterministas

- La analítica incorpora escenarios comparables de base, tendencia, aprobado, ejecutado y verificado; el dashboard los presenta con separación explícita entre proyección, ahorro aprobado y valor realizado.
- El resumen ejecutivo tenant-scoped se encola como entrega `PENDING` para correo/Telegram, con deduplicación diaria y procesamiento posterior por la cola outbound existente.
- Las memorias activas del agente pueden desactivarse de forma reversible mediante endpoint protegido; la operación registra auditoría y no elimina el evento de aprendizaje original.
- La trazabilidad genera `finops-opportunity-rules-v1` antes de la IA para detectar vínculos pendientes, datos desactualizados, evidencia técnica débil y brechas de etiquetas. El catálogo no emite ahorros.
- Migración `202608110012_executive_summary_delivery` aplicada en Supabase. La suite backend posterior pasó `test:unit` con 94 archivos aprobados, 4 omitidos, 364 pruebas y 10 omitidas; IA offline 24/24; typecheck, build y arquitectura aprobados. Frontend typecheck, lint, build y bundle budget aprobados.
- Pendiente: E2E completo con el entorno de aplicación aislado, canaries SMTP/Telegram y revisión de seguridad operativa productiva. La integración PostgreSQL desde migraciones cero ya pasó 5 archivos/6 pruebas en schema efímero y el schema fue eliminado. Graphify y commits separados quedaron completados; AWS real y OCI Usage API permanecen bloqueados externamente.

### 2026-08-12 — Calibración observable del agente IA

- Se añadió `GET /api/v1/agent/quality`, protegido por `AGENT_OBSERVE`, para medir por tenant la tasa de revisión, aprobación/rechazo humano, abstenciones por evidencia débil, ahorro estimado frente a ahorro verificado, resultado verificado y latencia/tokens de las trazas IA.
- El reporte desglosa recomendaciones por tipo, regla determinística y proveedor. La extracción tolera las formas históricas de evidencia y agrupa explícitamente lo que no tiene regla como `SIN_REGLA_DETERMINISTICA`; no usa coincidencias fuzzy ni datos de otro tenant.
- La UI de `Agente IA > Evidencia` muestra la ventana, indicadores, desglose y notas de interpretación. El costo de tokens solo aparece cuando existen `AI_INPUT_COST_PER_MILLION_TOKENS_USD` y `AI_OUTPUT_COST_PER_MILLION_TOKENS_USD`; de lo contrario se declara no configurado.
- Verificación: `AgentQualityService.test.ts` 2/2, `AgentController.test.ts` 2/2, integración aislada `npm run test:integration:agent-quality` 1/1, typecheck backend, arquitectura 340 archivos/1 excepción, typecheck frontend, lint dirigido y build/bundle frontend aprobados.
- La integración aislada del nuevo caso ya está ejecutada; queda validar canary live de IA cuando el proveedor esté disponible y no interpretar aprobación como precisión ML sin un conjunto etiquetado.
- El informe de calidad usa paginación keyset de 1.000 filas y agregación incremental para que ventanas históricas grandes no se materialicen en una única respuesta de PostgreSQL ni en un lote sin límite del repositorio.
- `202608120001_quality_report_keyset_indexes` quedó aplicada y verificada en Supabase; la consulta permanente `npm run db:verify:quality-indexes` confirma ambos índices y sus planes `Index Only Scan Backward`.
- Se retiraron los fallbacks `NVIDIA_*`/`NIM_*` del lector de configuración y se añadió una regresión que falla cerrado cuando solo existen variables heredadas; el contrato vigente es `AI_*`.
- Se alineó el timeout runtime del auditor de aprendizaje con el contrato de 15 segundos y se añadió validación productiva de límites para evitar bloqueos prolongados.

> **Estado vigente 2026-08-12:** las entradas inferiores son bitácora histórica. La fase de distribución
> compartida continúa en `feat/shared-cost-allocation`; la beta, trazabilidad, canaries SEC-001/AI-001 y
> la base de asignación por destino están documentadas. AWS-001/OCI-001 y la activación productiva permanente
> permanecen bloqueados o diferidos según `docs/DEUDA_TECNICA.md`.

> **Fuente de conteos vigente:** `npm run test:unit` ejecutado el 2026-08-12: 105 archivos aprobados, 4 omitidos,
> 436 pruebas pasadas y 10 omitidas; `npm run test:ai:offline`: 24/24. Las cifras menores en entradas
> fechadas son snapshots históricos y no representan regresiones.

### 2026-08-11 — Cierre estructural, operación y validación reproducible

- La configuración de MFA, TTL de sesiones, cookies, orígenes confiables, ingesta, analítica, recuperación de
  contraseña y cifrado de credenciales queda inyectada desde el composition root; los adaptadores ya no leen
  valores de entorno directamente. La revocación individual de una sesión también revoca sus refresh tokens.
- El shutdown de `api`, `worker` y `scheduler` detiene los loops y espera a que termine la iteración activa antes
  de desconectar Prisma. `GET /live`, `/health` y `/ready` distinguen liveness, readiness, rol de proceso y
  enforcement runtime RLS; se agregó una prueba de drenaje.
- El runtime Compose activa `init`, `no-new-privileges`, capabilities reducidas, healthcheck de API y ventana
  de apagado de 20 segundos. La imagen no aplica migraciones automáticamente; la operación queda documentada.
- `PrismaResourceMetricRepository` quedó en 372 líneas al extraer además la lectura paginada de series raw/agregadas,
  cobertura y contexto de costos a lectores cohesivos; se conserva el contrato público y las pruebas de compatibilidad
  de cursor. `FinOpsArtifactGenerator` pasó
  de 562 a 340 líneas al extraer la normalización determinística de borradores contra evidencia canónica.
- `PrismaCloudIngestionJobRepository` pasó de 949 a 835 líneas al extraer la construcción de recursos derivados
  de métricas, la clasificación de namespace y la precedencia inventario-proveedor en
  `ingestionResourceNormalizer.ts`; se agregaron pruebas de normalización y no se modificó el contrato de ingesta.
- El proveedor de llamadas IA y auditoría de artefactos se aisló en `finOpsArtifactAiRunner.ts` (152 líneas);
  `FinOpsArtifactGenerator` quedó en 234 líneas y conserva la orquestación de revisión, normalización y rúbrica.
- `FinOpsAiService` quedó en 364 líneas al separar los casos de uso en `FinOpsAiChatRunner`,
  `FinOpsAiExecutionPlanRunner` y `FinOpsAiRecommendationPreparer`; se mantienen la evidencia determinística,
  la auditoría y las trazas sin cambiar el contrato público.
- La rúbrica determinística IA quedó separada por responsabilidad: `qualityRubric.ts` conserva el facade público,
  `recommendationQualityChecks.ts` concentra evidencia y ahorro de recomendaciones y
  `executionPlanQualityChecks.ts` concentra alcance, seguridad y estructura de planes; los escenarios golden
  existentes mantienen 23/23 aprobados.
- `PrismaCloudConnectionRepository` quedó en 338 líneas al separar las operaciones de jobs, salud, readiness,
  historial y calidad en `PrismaCloudIngestionReadRepository`, y la creación idempotente en
  `PrismaCloudIngestionCommandRepository`; el puerto de conexiones cloud permanece sin cambios.
- `CloudConnectionController` dejó de concentrar conexión e ingesta: el facade quedó en 58 líneas y delega
  handlers de gestión (319), handlers de ingesta (228) y soporte común de parseo/error (71), manteniendo la
  identidad de handlers que esperan los routers y sus 35 pruebas focalizadas.
- `RecommendationController` quedó en 54 líneas como facade estable; ejecución/decisiones/planes viven en
  `RecommendationExecutionController` (118), ahorro verificado en `RecommendationSavingsController` (270) y
  consultas tenant-aware en `RecommendationReadController` (92). El contrato de rutas y las pruebas de
  caracterización del controlador permanecen sin cambios (8/8).
- `PrismaAgentLearningRepository` quedó en 92 líneas como puerto estable; los eventos y transiciones atómicas
  viven en `PrismaAgentLearningEventRepository` (261), las memorias auditadas en
  `PrismaAgentLearningMemoryRepository` (64) y las lecturas de contexto/resumen en
  `PrismaAgentLearningQueryRepository` (146). Se mantiene la persistencia atómica de memorias aprobadas y
  decisión; typecheck, arquitectura y 3 pruebas focalizadas del servicio de aprendizaje pasaron.
- `PrismaRecommendationRepository` quedó en 149 líneas como facade; el ciclo de vida se aisló en
  `PrismaRecommendationLifecycleRepository` (314), ahorro/medición en `PrismaRecommendationSavingsRepository`
  (96) y timeline en `PrismaRecommendationTimelineRepository` (47). Las pruebas de recomendaciones y valor
  focalizadas pasaron 12/12 y se conserva el puerto `IRecommendationRepository`.
- `PrismaValueRealizationRepository` quedó en 47 líneas como facade; las consultas de cartera, resumen, tendencia
  y exportación viven en `PrismaValueRealizationPortfolioRepository` (146), mientras que atribución por destino
  y candidatos de conciliación viven en `PrismaValueRealizationAllocationRepository` (101). El SQL compartido
  y el mapeo/cursor quedaron aislados en soportes pequeños; el puerto `IValueRealizationRepository` y las pruebas
  de valor realizado permanecen sin cambios.
- `RecommendationAnalysisService` quedó en 104 líneas como coordinador de autorización y consultas; el procesamiento
  de corridas, compuerta de evidencia, auditoría, publicación y reintentos vive en
  `RecommendationAnalysisRunProcessor` (201), con soporte de candidatos/periodos y notificación separados. Se
  preservan el contrato del servicio, los estados de corrida y las 9 pruebas focalizadas de análisis/controlador.
- `PrismaCostAllocationRepository` quedó en 258 líneas al separar el motor determinístico de asignación, validación,
  hashes, sugerencias y mapeos a `costAllocationEngine.ts` (161); el contrato de reglas, cierres, líneas de evidencia
  y transacciones serializables permanece sin cambios. Las pruebas focalizadas de asignación pasaron 11/11.
- La consulta de mediciones de ahorro quedó en 382 líneas al extraer la evidencia agregada y el mapeo de dominio
  a `savingsMeasurementEvidenceQueries.ts` y `savingsMeasurementMapping.ts`; se preservan la fórmula determinística,
  la suficiencia técnica y la verificación inmutable.
- `PrismaCloudIngestionJobRepository` quedó en 300 líneas al extraer el resumen de ejecución, watermark y
  controles de calidad a `PrismaIngestionJobCompletionSupport` (139 líneas); las pruebas focalizadas de worker,
  scheduler, provider OCI y rutas de ingesta pasaron 21/21.
- `PrismaCloudConnectionRepository` pasó de 882 a 725 líneas al extraer credenciales cifradas, revocación,
  conexión de ingesta y la invalidación de validación a `PrismaCloudCredentialRepository` (182 líneas) y
  `cloudConnectionMetadata.ts`; el puerto `ICloudConnectionRepository` no cambió.
- `PrismaCloudIngestionJobRepository` pasó de 834 a 599 líneas al extraer proyección de costos FOCUS/API,
  upsert de cuentas, recursos históricos, resolución exacta de recursos y agregación de linkage a
  `PrismaIngestionCostProjector` (141 líneas) y helpers tipados; el flujo transaccional de jobs conserva su contrato.
- El mapeo de errores HTTP de conexiones cloud, presupuestos, asignación y valor realizado reutiliza
  `finOpsErrorResponse.ts`, con diagnóstico por request y redacción de excepciones inesperadas; la prueba dirigida
  y la suite completa cubren el contrato sin exponer el status interno en el JSON. El controlador cloud conserva
  sus códigos y estados públicos, pero dejó de tener una ruta de logging divergente (`c2c0699`).
- La higiene del repositorio excluye la metadata de fuentes de datos de IntelliJ (`.idea/dataSources.xml`), además
  de `.env`, claves y artefactos de pruebas; la conexión local queda disponible solo fuera del índice Git (`a7ed749`).
- Costos, administración MSP, trazabilidad, análisis de recomendaciones y métricas técnicas también usan el
  responder compartido. Se agregó una regresión para dobles de respuesta sin `res.locals`; la suite vigente
  queda en 89 archivos, 351 pruebas pasadas y 9 omitidas.
- `finops-app` expone ahora `npm run typecheck`; typecheck, lint, build y `npm audit --omit=dev` pasaron. Recharts
  no está presente en las dependencias ni en el código; la serie técnica usa uPlot.
- El shell autenticado de `finops-app` ahora expone `AuthSessionProvider`, `useAuthSession` y `useAccessToken`;
  las vistas y controladores ya no reciben el access token por prop desde `App.tsx`. Las funciones de transporte
  conservan el token explícito para mantenerlas testeables y no se modificó el contrato HTTP. Commits `6f41988`,
  `a6ebe47`.
- Evidencia de validación: backend 89 archivos/351 pruebas/9 omitidas, IA offline 24/24, audit de producción
  sin vulnerabilidades altas; Docker no está instalado en esta estación, por lo que Compose solo fue validado
  sintácticamente con PyYAML. No se hizo push ni merge.
- Se agregó `npm run check:architecture` al backend y frontend y a ambos workflows CI: el control detecta nuevos
  archivos de producción por encima de 400 líneas y exige que las excepciones existentes tengan límite documentado.
  La verificación vigente pasa con 340 archivos backend/1 excepción y 97 archivos frontend/0 excepciones;
  los contratos de recomendaciones y conexiones cloud ya no requieren excepciones.
- El build frontend ahora ejecuta `check:bundle` y falla si un chunk JavaScript supera 500 kB. La compilación actual
  queda por debajo del presupuesto: chunk principal de aproximadamente 226 kB y carga por vistas lazy.
- `RecommendationAnalysisRunsPanel.tsx` quedó en 257 líneas al separar el detalle de corrida, la presentación de
  estados y los componentes Metric/Notice; conserva polling cancelable, retry, cancelación y navegación al detalle.
  `AgentSettings.tsx` quedó en 149 líneas al separar su controlador de carga, formularios y canales en
  `useAgentSettingsController.ts`. El typecheck, lint, build, bundle budget y architecture check del frontend
  pasaron; el fitness check ya no tiene excepciones frontend. El smoke Playwright sin API/BD pasó 1/1.
- Se agregó `docs/MODELO_AMENAZAS_STRIDE.md` como matriz compacta de amenazas para identidad, cambio de tenant,
  administración MSP, credenciales cloud, ingesta, IA, ejecución manual, asignación, cierres, workers y mensajería.
  El documento separa controles implementados, evidencia y riesgo residual; no sustituye una prueba DAST externa.
- La configuración de fuentes de una conexión cloud se aisló en `PrismaCloudConnectionConfigurationRepository`
  (110 líneas); `PrismaCloudConnectionRepository` quedó en 639 líneas sin cambiar el puerto ni los contratos HTTP.
  La prueba dirigida de cloud/onboarding/ingesta pasó 25/25 y el typecheck quedó verde.
- Las alertas de presupuesto ya no quedan como registros `PENDING` sin consumidor: se agregó una cola durable de
  entregas outbound con cuerpo completo, lease `FOR UPDATE SKIP LOCKED`, estado `PROCESSING`, reintentos con backoff,
  recuperación de leases vencidos y estados finales `SENT`, `FAILED` o `SKIPPED`. El scheduler procesa lotes
  acotados antes de los recordatorios de ahorro y el frontend distingue “En proceso”. La migración
`202608110009_outbound_delivery_queue`, `202608110010_revoke_api_function_grants` y
`202608110011_add_missing_foreign_key_indexes` ya fueron aplicadas y verificadas en Supabase; todavía requiere validarse con
  SMTP/Telegram reales.
- La frontera de contexto IA marca nombres, etiquetas, identificadores y texto externo como no confiables para
  reducir prompt injection; chat, recomendaciones y planes rechazan respuestas que contengan PEM, JWT, API keys,
  URLs autenticadas o asignaciones de secretos. La rúbrica y los golden scenarios cubren este control sin enviar
  credenciales al proveedor.
- El motor determinístico de evidencia técnica usa la versión `technical-rules-2026-08-11.v1`, conserva los
  umbrales críticos en cada evaluación y reconoce señales auxiliares porcentuales de red, disco e IOPS sin
  convertirlas por sí solas en autorización de rightsizing. La regresión específica pasó 7/7.
- El arranque de workers y schedulers quedó aislado en `src/bootstrap/backgroundProcessRuntime.ts`; `src/index.ts`
  conserva únicamente composition root, servidor HTTP y shutdown, con los roles de proceso y semántica de loops
  existentes.

### 2026-08-11 — Modularización estructural del proveedor AWS (validación real en standby)

- Se redujo `AwsSdkIngestionProvider.ts` de 1.032 a 363 líneas, manteniendo la fachada pública, la validación de capacidades y los dobles de prueba compatibles.
- Se extrajeron contratos/configuración (`awsContracts.ts`, `awsConfiguration.ts`), métricas CloudWatch (`AwsMetricCollector.ts`), inventario EC2 (`AwsInventoryCollector.ts`) y facturación/FOCUS (`AwsBillingCollector.ts`). Los módulos quedan entre 88 y 300 líneas y conservan AssumeRole, streaming FOCUS, Cost Explorer, inventario y métricas.
- La suite dirigida del proveedor AWS pasó 4/4 y `npm run test:all` pasó 81 archivos, 321 pruebas y 9 omitidas; no se ejecutó validación AWS real porque la cuenta/rol externo continúa bloqueado (`AWS-001`).

### 2026-08-11 — Composición de runtime y entrypoint operativo

- Se aisló el grafo de repositorios/servicios en `src/bootstrap/applicationComposition.ts`; `src/index.ts` quedó en 353 líneas y conserva los roles `api`, `worker`, `scheduler` y `all`, además de health/readiness, cierre ordenado y loops de fondo.
- No se modificaron contratos HTTP ni la semántica de workers/schedulers. `npm run test:all` continúa en 81 archivos, 321 pruebas pasadas y 9 omitidas; typecheck y build permanecen verdes. Commit `296d7cb`.

### 2026-08-11 — Dashboard frontend modularizado

- Se redujo `finops-app/src/views/Dashboard.tsx` de 466 a 231 líneas. La carga paralela, fallback de analítica, presupuesto y KPIs viven en `useDashboardController.ts` (194 líneas), mientras los transformadores y formateadores viven en `dashboardPresentation.ts` (161 líneas).
- Frontend typecheck, lint y build pasaron; no se ejecutó E2E en esta sesión porque el runner exige `TEST_DATABASE_URL` aislada y `ALLOW_DESTRUCTIVE_TEST_DATABASE=true`, variables que no estaban disponibles. Commit `92954f9`; no se hizo push.

### 2026-08-11 — Administración MSP frontend modularizada

- Se redujo `finops-app/src/views/MasterAdmin.tsx` de 426 a 225 líneas. El hook `useMasterAdminController.ts` concentra cargas y mutaciones de tenants, usuarios y asignaciones en 197 líneas; la vista conserva el selector, creación, suspensión, asignación y revocación.
- Frontend typecheck, lint y build pasaron. Commit `54cb0d0`; no se hizo push.

### 2026-08-11 — Detalle de recomendación modular y E2E desde migraciones cero

- Se dividió `ResourceDetail.tsx` de 1.609 a 348 líneas, extrayendo el controlador de carga/acciones,
  normalización de evidencia, presentación compartida, plan auditado, ejecución manual, ahorro verificado,
  timeline y decisión. Los módulos resultantes tienen entre 38 y 310 líneas y preservan el contrato visual.
- El runner `test:e2e:full` ahora aplica todas las migraciones al schema aislado antes de crear fixtures y el
  cleanup tolera una preparación incompleta para poder eliminar el schema sin ocultar el error original.
- La validación completa aplicó 52 migraciones desde cero y aprobó 5/5 escenarios Playwright: login, cambio de
  tenant, detalle técnico, recomendación, plan/decisión, aislamiento, análisis y asignación de costos. El schema
  `finops_e2e_resource_detail_refactor` y sus dos tenants fixture se eliminaron al finalizar.
- Se redujo `MetricasTecnicas.tsx` de 876 a 216 líneas: estado/requests/cancelación/cache LRU quedaron en un hook
  de 222 líneas, mientras modelo de rango/cache, formatters, tarjetas y paneles viven en módulos de 68 a 121
  líneas. Se conservaron uPlot, granularidad raw, drilldown, paginación exacta y cancelación con AbortController.
- La suite E2E reveló una carrera preexistente: dos archivos ejecutaban análisis durable sobre el mismo tenant
  fixture en paralelo. El runner completo ahora usa un worker para ese fixture compartido; la repetición aprobó
  5/5 y eliminó el schema `finops_e2e_metrics_refactor_serial`.

### 2026-08-11 — Cierre de controles críticos de seguridad, ingesta e IA

- Se centralizó la autorización backend en una matriz explícita de siete roles y dieciséis capacidades. Las
  guardas de cloud, ingesta, agente, recomendaciones, ahorro, presupuestos, asignación, valor, mensajería, MFA
  y administración MSP ya no mantienen listas independientes. Decisión, ejecución, creación y verificación de
  mediciones tienen permisos separados; `CLIENT_APPROVER` no puede ejecutar ni calcular ahorros.
- Se agregó `docs/MATRIZ_AUTORIZACION.md`, una prueba exhaustiva de la matriz y pruebas de adaptadores para las
  cuatro guardas de recomendaciones.
- Se cerró el hotspot principal OCI: contratos SDK, validación, Monitoring, compartimentos, inventario, fuentes
  FOCUS y retries se extrajeron a módulos cohesivos de máximo 219 líneas. El coordinador bajó de 1.140 a 393
  líneas y conserva el contrato, streaming FOCUS, Usage API e identidad exacta. Las pruebas dirigidas OCI
  pasaron 22/22 y la suite final pasó con 76 archivos, 312 pruebas y 9 omitidas;
  IA offline 19/19, typecheck y build aprobados.
- Se dividió `CloudConnectionService` (979 líneas) en una fachada estable de 148 líneas y módulos
  profundos para onboarding/configuración (400), orquestación de ingesta (361), contratos (133) y políticas
  de entrada/credenciales (138). Se preservó el contrato de controladores y los 23 escenarios de caracterización.
- Se redujo `TechnicalMetricsService` de 843 a 202 líneas: contratos, construcción de overview,
  cobertura diaria/agregada y utilidades matemáticas quedaron en módulos de 108 a 252 líneas. Se preservaron
  las granularidades exactas, el enlace canónico y los 12 escenarios de métricas.
- Se completó recuperación MFA con diez códigos aleatorios de 80 bits: solo hashes persistidos, consumo único,
  revocación del lote anterior al regenerar y presentación una sola vez en login/perfil.
- El canary runtime RLS se amplió a sesiones, refresh, reset, TOTP, challenges y recovery codes. La ampliación
  detectó recursión en políticas pre-auth; se reemplazaron subconsultas cruzadas por helpers SECURITY DEFINER
  acotados y el canary final pasó con dos tenants y cero visibilidad cruzada.
- Supabase quedó al día con 52 migraciones. La suite vigente subió a 76 archivos, 312 pruebas pasadas y 9
  omitidas; frontend lint/build continúa verde.

- Se consolidó la revocación persistida de sesiones: logout individual/global, revocación de dispositivos,
  cambio de tenant y validación de cada request protegido. El frontend separó `authApi`/`authTypes` del facade
  general y no usa almacenamiento web para tokens.
- Se endureció el ciclo HTTP con rate limiting acotado, trust proxy explícito y timeouts de request, headers y
  keep-alive. Se añadió `safeErrorMessage` para que errores de SDK/HTTP no filtren credenciales, JWT, API keys,
  claves AWS, PEM o URLs autenticadas en logs.
- La ingesta OCI descubre compartimentos accesibles de forma recursiva y conserva conteos y estado de cobertura
  (`COMPLETE`, `FALLBACK`, `CONFIGURED_ONLY`, `FAILED`). El scheduler ya no encola conexiones con validación
  de capacidades ausente o vencida; el TTL por defecto es 24 horas.
- La compuerta IA ahora distingue métricas porcentuales de métricas absolutas, verifica el alcance exacto del plan
  y limita el ahorro estimado al techo derivado de la evidencia determinística. Los golden scenarios offline
  quedaron en 19/19.
- El scheduler ahora encola INVENTORY antes de costos/métricas, exige validación/capacidades vigentes y aplica
  cooldown configurable. Un job OCI controlado persistió 1 recurso en 3,4 s con 2 llamadas SDK.
- Readiness de lineage incorpora gobierno de etiquetas requerido y la UI muestra cobertura, recursos cumplidos
  y claves faltantes. La cuenta OCI actual tiene 1 recurso y 0 % de cobertura de las cuatro claves por defecto.
- El resumen IA agrega feedback humano, estados del auditor y memorias activas por tenant; las métricas se
  calculan en PostgreSQL y no se limitan a los últimos 20 eventos.
- Se aisló el procesador de eventos de aprendizaje para que el coordinador quede en 130 líneas efectivas sin
  alterar timeout, reintentos, estados `SKIPPED`/`ERROR` ni promoción global.
- El frontend separó Agent Settings en módulos de gobierno, evidencia/aprendizaje, canales y UI compartida;
  la vista principal quedó en 396 líneas efectivas sin cambiar contratos ni comportamiento visible.
- Verificación final del bloque: `npm run test:all` pasó con 68 archivos, 287 pruebas pasadas y 9 omitidas;
  typecheck, build y pruebas dirigidas de seguridad/OCI/scheduler/golden también pasaron. Se creó el commit
  `e96097d` para logs seguros, `d638269` para inventario/gobierno de tags, `347d175` para métricas de
  aprendizaje y `4e74693` para modularización del procesador; no se hizo push.


### 2026-08-04 — Distribución compartida auditable y cierre financiero

- Se extendió `CostAllocation` sin crear un segundo módulo: `DIRECT` conserva la asignación unitaria y
  `SPLIT` distribuye con porcentajes Decimal exactos, primera coincidencia determinista, separación por
  moneda y `UNALLOCATED` explícito.
- El cierre financiero es reproducible por tenant/período/moneda: valida fuente y reglas dentro de una
  transacción serializable, persiste hashes, versión, responsable y conserva versiones reemplazadas sin
  mutar cierres cerrados.
- La migración `202608040004_cost_allocation_line_snapshots` guarda evidencia por línea: recurso canónico,
  hash de métrica, moneda, fuente, monto asignado, destino, regla y motivo de enlace. Los cierres antiguos
  sin líneas siguen siendo visibles, pero no permiten atribución histórica por línea.
- Presupuestos por destino y `Value Realization` consultan el cierre cerrado; el ahorro solo aparece por destino
  cuando la evidencia exacta coincide. El frontend muestra preview, historial/comparación e impacto financiero.
- La activación de una regla ahora exige un preview exitoso de la misma configuración; cualquier modificación
  invalida el hash previsualizado y la UI informa el error en español.
- El preview incorpora impacto de presupuestos por destino y separa ahorros potenciales, aprobados y verificados
  con evidencia cerrada; la UI añade checklist y estados ABIERTO/LISTO/CERRADO/REEMPLAZADO.
- Se reemplazó `express-rate-limit` por un limitador fijo en memoria; `npm audit --omit=dev` quedó sin
  vulnerabilidades. El store distribuido queda diferido hasta escalar a múltiples instancias.
- Verificación de esta fase: Supabase con 44 migraciones al día, 59 archivos unitarios, 255 pruebas pasadas,
  9 omitidas, typecheck, build, frontend TypeScript y auditoría de dependencias aprobados.
- Benchmark del cálculo: 10.000 costos, 10 reglas y cinco iteraciones; mediana 66,98 ms, con invariantes
  de suma conservadas. El tiempo no representa todavía el cierre end-to-end contra una base productiva.
- Validación inicial desde schema vacío: 5/5 pruebas con las 44 migraciones y permisos RLS de asignación;
  readiness mediana 212,80 ms en cinco lecturas, con un outlier de 607,78 ms documentado.
- La documentación del módulo y del modelo de datos quedó consolidada en
  `docs/COST_ALLOCATION_SHARED_CLOSURES.md`, incluyendo ciclo de vida, invariantes,
  API, RLS, integración financiera y límites conocidos.
- Se corrigió el hash canónico para excluir estado/versión de ciclo de vida:
  activar una regla no invalida su preview y una modificación funcional sí
  incrementa la versión. Las reglas `DIRECT` nuevas persisten su destino del
  100 %, los costos `UNALLOCATED` se agrupan por recurso canónico y el motor
  comprueba que los grupos por moneda cuadren exactamente con la fuente.
- Se añadió `npm run test:integration:cost-allocation`, con schema temporal y cleanup en `finally`,
  para validar el flujo completo y la inmutabilidad tenant-aware contra PostgreSQL real.
- La compuerta de cierre ahora revalida la huella canónica de las filas fuente además de conteo y total;
  las reglas SPLIT persistidas con destinos o porcentajes inválidos se rechazan antes de asignar.
- Verificación posterior: 59 archivos unitarios, 255 pruebas pasadas y 9 omitidas; integración PostgreSQL
  3/3, preview 1.647,36 ms y cierre 6.604,64 ms con 10.000 líneas persistidas. `PERF-001` continúa diferido.

### 2026-08-03 — Cierre de canaries runtime RLS e IA

- Se verificó que frontend PR #19 (`11fb31c`) y backend PR #16 (`cb78e4c`) están fusionados con CI verde;
  `main` local quedó actualizado y el trabajo posterior continúa en `feat/post-beta-canary-closure`.
- El canary `npm run test:canary:runtime-rls` pasó contra Supabase principal con
  `DB_RUNTIME_ENFORCE=true` y `DB_RUNTIME_ROLE=finops_runtime`: usuario runtime, dos tenants, tablas de
  costos/métricas/recomendaciones/presupuestos/jobs, contexto de worker y conteo cross-tenant cero.
- Se documentaron activación y rollback en `docs/RUNTIME_RLS_CANARY.md`. La preparación técnica está cerrada;
  la activación permanente queda diferida hasta disponer de un destino de despliegue.
- Se corrigió el fixture del canary IA para usar periodo reciente, 14 días de muestras y evidencia enlazada.
  También se corrigió la referencia a periodos de facturación abiertos, se normalizaron candidatos antes de
  auditar y se reforzaron las instrucciones de generador/auditor sin relajar la rúbrica determinística.
- El canary IA aislado pasó con `persist=false`: chat en español, tres recomendaciones, auditoría aprobada,
  snapshot canónico, rúbrica 100/100, trazas, ahorro no negativo y estimación de 4.093 tokens. La última
  generación tardó 54.662 s. El schema y fixture se eliminaron automáticamente.
- `AI-001` y `SEC-001` quedaron cerrados técnicamente; AWS real y OCI Usage API siguen bloqueados por
  credenciales/policy externas.

### 2026-08-03 — Cierre de trazabilidad canónica por recurso

- Se agregaron las migraciones `202608030003_resource_lineage_readiness_indexes` y
  `202608030004_analysis_run_canonical_resource`, aplicadas en Supabase; las corridas de análisis ahora
  persisten también `cloudResourceId` para no depender solo de `externalResourceId`.
- La identidad de cruce es exacta por `cloudConnectionId + externalResourceId`; si hay duplicidad, la compuerta
  bloquea la recomendación hasta resolver el recurso canónico. Readiness expone estado, frescura, bloqueadores,
  cobertura por conexión y contadores del backfill idempotente.
- La suite aislada `npm run test:integration:resource-lineage` pasó 5/5. Con 10.000 costos y 20.000 muestras,
  cinco lecturas de readiness dieron mediana 186,46 ms.
- El canary IA real pasó después de endurecer artefactos de revisión técnica: 3 recomendaciones, auditoría
  aprobada, snapshot canónico, trazas y ahorros no negativos; 54,662 s y 4.093 tokens estimados.
- El canary OCI read-only pasó inventario Compute, Monitoring y FOCUS/Object Storage: 1 recurso y 20 objetos
  descubiertos/5 retornados. `COSTS=DENIED` queda explícito por la policy faltante de OCI Usage API.
- Verificación adicional: backend build/typecheck/unit/audit, frontend lint/build y `prisma migrate status` al día.

### 2026-08-03 — Trazabilidad normalizada y readiness por recurso

- Se integró el PR backend #17 antes de continuar y se creó `feat/resource-lineage-readiness` sin tocar
  directamente `main`.
- `cost_metrics`, `resource_metric_samples` y `recommendations` conservan el dato fuente y agregan el
  vínculo explícito `cloudResourceId` más `resourceLinkReason`. La identidad válida es exacta por
  `cloudConnectionId + externalResourceId`; no hay asociación por nombre ni por LLM.
- La ingesta persiste inventario antes de costos/métricas y cada job registra cobertura de enlaces. El
  script `db:reconcile:resource-links` funciona en dry-run/apply, procesa por cursor y se verificó
  idempotente contra Supabase.
- El backfill aplicado enlazó 36 costos OCI con inventario; clasificó 8.692 como inventario inexistente y
  432 sin conexión. Las 19.367 muestras técnicas OCI permanecen enlazadas; 13 recomendaciones históricas
  quedaron clasificadas como `EMPTY_RESOURCE_ID`. No se modificaron filas FOCUS crudas.
- Se agregó `/api/v1/ingestion/resource-linkage` y la sección de cobertura en `Ingesta`, incluyendo estado,
  razones, cobertura de costos/métricas y muestra por recurso. La rúbrica IA rechaza evidencia técnica
  sin relación `cloudResourceId` explícita y coincidente con el snapshot canónico.
- Migraciones nuevas aplicadas en Supabase: `202608030001_resource_lineage_normalization` y
  `202608030002_recommendation_resource_guard`.

### 2026-08-01 — CI integrado de beta cerrado

- La integración GitHub del backend quedó verde después de hacer que el job checkout del frontend use la misma
  rama del pull request (`github.event.pull_request.head.ref`) en lugar de fijarse siempre en `main`.
- El fallo observado en onboarding era de desalineación entre repositorios: el E2E probaba backend beta con un
  frontend antiguo. La corrida final pasó `verify` e `integration`; el diagnóstico temporal fue retirado del test.
- Durante la estabilización también se corrigió una condición de carrera del selector de cuentas: reseleccionar la
  conexión activa ya no borra el detalle cargado sin volver a solicitarlo.
- PRs integrados posteriormente: frontend #19 (`11fb31c`) y backend #16 (`cb78e4c`). AWS real y OCI Usage API
  siguen en los estados documentados de `docs/DEUDA_TECNICA.md`.

### 2026-07-31 — Cierre técnico de Supabase, scheduler y dependencias OCI

- Se aplicaron y verificaron en Supabase `public` las migraciones `202607310001_supabase_function_hardening` y
  `202607310002_cover_foreign_keys`. Las funciones FinOps tienen `search_path` seguro, no son ejecutables por
  `anon`, `authenticated` ni `service_role`, y solo `finops_runtime` conserva ejecución.
- Se agregaron los 27 índices líderes de claves foráneas públicas detectados por Supabase Advisor.
- Se eliminaron exactamente 433 jobs `FAILED` de `BILLING_EXPORT` asociados al bucket/namespace de prueba `asd`;
  se conservaron los otros 5 fallos históricos. También se eliminaron los tres schemas E2E aprobados:
  `finops_e2e_integrated_secure_beta`, `finops_e2e_local` y `finops_e2e_verified_savings`.
- El scheduler ahora exige validación vigente, `IDENTITY` y capacidades específicas por fuente. Cambios de
  credenciales, región o configuración invalidan la validación previa.
- El paquete OCI paraguas fue sustituido por módulos específicos `2.138.0`; la mediana de importación en frío
  quedó en aproximadamente 2,13 s en cinco mediciones. `npm audit --omit=dev` no reportó vulnerabilidades.
- Evidencia en la fecha de esta entrada: 32 migraciones Prisma al día, Advisors de seguridad sin lints y performance solo con índices no usados
  informativos; el canary IA real se cerró posteriormente el 2026-08-03 y OCI Usage API continúa condicionado a policy externa.
- Verificación final local: backend `npm run typecheck`, `npm run test:unit` (56 archivos, 235 pruebas, 1 omitida),
  `npm run test:ai:offline` (16/16), `npm run build` y `npm audit --omit=dev` sin vulnerabilidades altas; frontend
  lint/build y audit también aprobados.
- Canary IA real de esa fecha: chat y trazas pasaron, pero la generación fue rechazada por cobertura insuficiente
  del primer fixture. Ese resultado fue corregido y superado por el canary aislado del 2026-08-03.

### 2026-07-28 — Beta integrada: contexto tenant, RLS runtime y workers seguros
- Se verificó la integridad de las ramas aprobadas antes de continuar: backend `f5ed051` y frontend integrado `b0fc256`, con cambios locales únicamente del objetivo activo.
- Se agregó `TenantAwarePool` con `AsyncLocalStorage`, rol PostgreSQL `finops_runtime` y configuración de contexto tenant/usuario/request en una sola sentencia SQL por consulta; las consultas sin contexto no agregan sobrecarga cuando no está activo el enforcement.
- Los workers de ingesta, aprendizaje, análisis y schedulers reclaman con `workerId` y cambian al `tenantId` de la fila antes de procesar datos. Las políticas de cola permiten reclamar de forma controlada y las operaciones tenant siguen restringidas.
- Las migraciones `202607280001_runtime_tenant_rls` a `202607280005_allow_cross_tenant_operator_user_refs` cubren los 36 modelos con `tenantId`; se corrigieron las omisiones iniciales de `cloud_connections` y `operator_storage_locations`, el vínculo tenant de exportaciones cloud y el caso legítimo de usuarios operadores con acceso multi-tenant.
- Las cinco migraciones ya están aplicadas y resueltas en Supabase `public`. La base principal conserva RLS en sus tablas operativas, el rol `finops_runtime` existe y el trigger de consistencia tenant está presente en 36 tablas; `_prisma_migrations` es la única tabla pública sin RLS.
- Verificación: typecheck backend OK; 227 pruebas unitarias OK; integración real de contexto/RLS OK en schema aislado y Supabase principal; E2E Playwright integral con `DB_RUNTIME_ENFORCE=true`: 4/4 pruebas, 53.0 s.
- Pendiente en la fecha de esta entrada: ejecutar `EXPLAIN (ANALYZE, BUFFERS)` con volumen representativo y activar `DB_RUNTIME_ENFORCE=true` mediante una ventana/canary operativo. El canary técnico pasó posteriormente el 2026-08-03; la producción permanente sigue diferida por falta de despliegue.
- Canary principal: `src/testing/tenantContext.integration.test.ts` pasó contra Supabase `public` con `DB_RUNTIME_ENFORCE=true`. El `EXPLAIN` de la consulta raw de métricas usó `resource_metric_samples_tenant_id_sampled_at_idx` y terminó en 52.029 ms para 660 filas; la agregación de 30 minutos terminó en 7.692 ms para 660 grupos. Estos valores son una línea base de la cuenta actual, no un SLA productivo.

### 2026-07-26 — Centro de realización de valor FinOps (rama `feat/value-realization-center`)
- Se agregó el centro sobre `recommendation_savings_measurements` como única fuente de verdad: resumen por moneda, conteos del ciclo, tendencia mensual, filtros, cursor estable y exportación CSV limitada.
- Se implementó `POST /api/v1/value-realization/reconcile` con lotes acotados, hash idempotente, separación de aumentos de costo, tolerancia a fallos por candidato y notificaciones in-app en español.
- La conciliación posterior a ingesta es opcional (`SAVINGS_RECONCILIATION_ENABLED=false` por defecto). Email/Telegram se reutilizan de `OutboundMessageService` y solo se activan con `VALUE_REALIZATION_OUTBOUND_ENABLED=true`.
- Frontend: nueva vista `Valor realizado` con KPIs, embudo, uPlot, portafolio filtrable, carga paginada, actualización manual, exportación autenticada y navegación al detalle.
- Verificación realizada: backend typecheck y prueba unitaria de conciliación; frontend lint y build. Pendiente: integración PostgreSQL aislada, benchmark de consultas y smoke E2E autenticado.


## 2026-07-23 — Pipeline gobernado de análisis FinOps post-ingesta

- Se agregó una corrida durable por tenant o recurso con estados, etapas, snapshot canónico, hash de
  evidencia, conteos, modelos, tokens estimados, latencia, diagnóstico y enlaces a recomendaciones.
- La cola responde `202`, evita corridas activas equivalentes y el worker reclama trabajo con
  `FOR UPDATE SKIP LOCKED`, reintentos acotados y recuperación de leases vencidos. El scheduler
  post-ingesta existe, pero permanece desactivado por defecto.
- El preanálisis calcula tendencias de costo y consumo sin mezclar unidades. La compuerta de
  evidencia evita llamadas al LLM cuando no hay fundamentos y generador/auditor reciben el mismo
  snapshot; solo se publican artefactos aprobados y deduplicados.
- Los candidatos fuera del lote de seis de mayor impacto quedan registrados como aplazados, con
  motivo explícito, en vez de desaparecer silenciosamente o consumir tokens en esa corrida.
- `Agente IA > Análisis` muestra readiness, progreso, descartes, historial y recomendaciones. Los
  roles de lectura pueden consultar sin iniciar, cancelar ni reintentar corridas.
- Verificación: 217 pruebas backend, 16 escenarios IA offline, integración PostgreSQL aislada,
  frontend lint/build, 2 E2E dedicados y el E2E integral. Un smoke contra la API compilada encoló
  una corrida real en PostgreSQL con `202` en 48 ms y luego la canceló. La migración
  `recommendation_analysis_runs` fue aplicada en Supabase y las tablas nuevas no conceden acceso
  directo a `anon`/`authenticated`; el historial Prisma también quedó reconciliado y
  `prisma migrate status` reporta las 22 migraciones al día.
- Alcance validado con fixtures y PostgreSQL aislado. No se ejecutó canary LLM real ni se afirma
  validación del pipeline con AWS real; OCI/AWS conservan el estado documentado del onboarding.

## 2026-07-16 — Onboarding operativo cloud por tenant

- Se integró en Ingesta un flujo reanudable OCI/AWS para crear conexión, cifrar/revocar
  credenciales read-only, validar capacidades, editar configuración no sensible, configurar costos/FOCUS/métricas y
  activar jobs iniciales sin depender de scripts.
- La activación exige validación utilizable, responde en background, evita jobs activos duplicados y
  permite reintentar ventanas fallidas o cancelar pendientes por fuente.
- Readiness y detalle de onboarding explican en español el problema, capacidad, datos afectados y
  próxima acción. La UI enlaza Dashboard, Inventario y Métricas técnicas.
- El preview FOCUS es read-only y tolera errores por ubicación. La fuente OCI de prueba `asd/asd`
  fue retirada; la ubicación real descubre 20 objetos sin errores.
- Seguridad: 13 mutaciones son denegadas a `VIEWER`, las lecturas cross-tenant ocultan recursos,
  el alta ya no acepta metadata arbitraria, los resúmenes proyectan solo configuración operativa
  permitida y Supabase revoca acceso PostgREST directo a tablas operativas del onboarding.
- Canary OCI real: identidad, inventario, métricas y storage disponibles; Usage API denegada por
  policy; estado `PARTIAL`. AWS está cubierto con fixtures, pendiente de rol/cuenta real.
- Verificación local: 46 archivos/203 pruebas backend, typecheck/build, frontend lint/build, smoke API
  y canary OCI aprobados. Un smoke browser read-only con sesión efímera verificó los dos tenants,
  Dashboard y onboarding OCI sin errores. La integración PostgreSQL (2 archivos/3 pruebas) y el E2E
  Playwright completo pasaron contra un schema Supabase efímero, eliminado después de la prueba.
  La matriz está en `docs/ONBOARDING_CLOUD_ACCEPTANCE.md`.

## 2026-07-12 — Presupuestos y forecast gobernado

- Presupuesto mensual persistente por tenant, cuenta cloud o servicio, con moneda, umbrales y auditoría de creador.
- `cost_metrics` y `cost_forecasts` se consultan sin mezclar monedas; la ausencia de forecast se comunica como no disponible.
- La evaluación manual crea alertas idempotentes, notificaciones in-app y registros outbound pendientes; su ejecución continua queda registrada en OPS-002.
- Supabase recibió `budget_governance` después de validar el SQL mediante una transacción revertida.

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
### 2026-07-13 - Estabilización de gobernanza y claridad operacional
- Se corrigió la causa de los errores genéricos de presupuestos y asignación: el cliente Prisma local podía quedar desactualizado respecto al esquema. `npm run dev` ahora genera Prisma antes de iniciar el backend y las respuestas inesperadas incluyen un identificador de diagnóstico sin exponer detalles internos.
- Dashboard, presupuesto, asignación e inventario cargan sus bloques de forma independiente: un fallo de presupuesto o asignación ya no deja en blanco el resto de la pantalla ni el detalle técnico del recurso.
- Se agregó `GET /costs/options` para ofrecer períodos realmente disponibles y filtros por cuenta, servicio y moneda. Presupuestos y asignación explican cuando el período elegido no posee costos e invitan a usar el último período disponible.
- Los formularios de gobernanza ahora guían el flujo: alcance y umbrales en presupuestos; criterio, destino, previsualización y campos avanzados en asignación. Las reglas nuevas continúan como borradores hasta su activación explícita.
- Se eliminó el parpadeo de indicadores en Métricas técnicas: al refrescar se conservan los valores previos y solo se muestra un estado discreto de actualización.

### 2026-07-11 - Cierre verificable de inteligencia por recurso
- La CI de integración crea fixtures PostgreSQL, inicia la API y ejecuta el flujo Playwright de frontend: login, selector de tenant, inventario, detalle 360, oportunidades relacionadas y métricas técnicas.
- El recorrido E2E no llama OCI, AWS ni un LLM real; usa exclusivamente la API de fixtures y valida el contrato reproducible entre ambos repositorios.
- La etapa queda cerrada con aislamiento por tenant/recurso, evidencia y auditoría determinísticas, escenarios dorados, smoke API, E2E y CI verdes.

### 2026-07-11 - Aislamiento IA y oportunidades relacionadas por recurso
- El detalle 360 ahora consulta oportunidades persistidas por `externalResourceId` exacto dentro del tenant; recomendaciones FOCUS sin enlace a recurso no se presentan como relacionadas.
- Un análisis IA por recurso restringe tanto el snapshot de costo como las métricas técnicas antes de llegar al LLM. Para impedir mezclar datos históricos de otros recursos, omite el Context Engine y aprendizaje recuperado en esta modalidad aislada.
- La rúbrica determinística exige `evidence.externalResourceId` exacto en análisis aislados, aun si el auditor IA aprobara una salida distinta.
- El resumen del recurso expone el resultado de las reglas técnicas (`fuerte`, `moderada` o `limitada`, readiness y bloqueos), y el detalle explica en español cuándo la IA solo puede pedir validación previa.
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
- Commit hardening frontend: 8c8767 (chore: remove demo password from login form).
- Seguridad previa: .env.*, *.pem, *.key, .oci/, .claude/, descargas y artefactos quedan ignorados; seed/importador ya no usan password demo por defecto ni imprimen contrasenas demo.
- Base worker: nueva migracion 202606050001_ingestion_job_observability agrega started_at, completed_at y
result_summary a ingestion_jobs; el worker reclama jobs con FOR UPDATE SKIP LOCKED, desencripta credenciales operativas y persiste resultados normalizados.
- Conectores SDK iniciales: OCI usa OCI Monitoring para TECHNICAL_METRIC desde metadata.ociMetricDefinitions; AWS usa STS AssumeRole + CloudWatch GetMetricData desde metadata.awsMetricDefinitions.
- FOCUS queda definido como fuente canonica pendiente de parser productivo: OCI Cost Reports/Object Storage y AWS Data Exports/S3.
- Retroalimentacion de la meta: para esta rebanada no se inventan datos si faltan credenciales o metadata; el job registra warning/cobertura parcial. Memoria en AWS/OCI sigue requiriendo agente cuando el proveedor no la entrega por defecto.
- Hallazgo:
npm install reporto 174 vulnerabilidades transitivas (172 moderadas, 2 altas). No se aplico
npm audit fix --force porque puede romper dependencias; queda como tarea de seguridad.
- Avance adicional: focusCsvIngestion normaliza CSV/CSV.GZ FOCUS a focus_cost_line_items con hash estable; AWS BILLING_EXPORT puede leer objetos declarados en metadata.awsFocusExportObjects o descubrirlos por prefijo en metadata.awsFocusExportLocations; OCI BILLING_EXPORT puede leer objetos declarados en metadata.ociFocusReportObjects o descubrirlos por prefijo en metadata.ociFocusReportLocations. Queda pendiente benchmark con datos reales y discovery especifico de particiones por fecha.
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

## 3. Próximos bloques (estado vigente 2026-08-03)

1. **Validación cloud externa:** AWS real con cuenta/rol y FOCUS; OCI Usage API con la policy mínima oficial.
2. **Cierre de despliegue:** activar permanentemente `DB_RUNTIME_ENFORCE=true`, secret manager, observabilidad,
   healthchecks y workers 24/7 cuando exista un destino operativo.
3. **Calidad operacional:** inventario normalizado por SDK, cobertura/frecuencia de ingesta y benchmarks con
   volumen representativo; durante desarrollo los workers manuales siguen siendo aceptados.
4. **FinOps avanzado:** distribución de costos compartidos, chargeback y expansión de proveedores/canales,
   siempre sin remediación automática cloud.

- Runner manual agregado:
npm run ingestion:worker:once ejecuta un job pendiente y devuelve JSON con duracion/resumen para pruebas de rendimiento controladas.

- Preflight agregado:
npm run ingestion:worker:preflight valida DATABASE_URL y CREDENTIAL_ENCRYPTION_KEY sin exponer valores. Evidencia 2026-06-05: DATABASE_URL=true, CREDENTIAL_ENCRYPTION_KEY=false en .env actual.
- Benchmark base sin jobs pendientes: con una clave temporal de proceso,
npm run ingestion:worker:once completo en 929 ms y devolvio { processed: false }. Falta benchmark real con credenciales cifradas y jobs OCI/AWS.

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

### 2026-07-11 - Ciclo operacional de recomendaciones

- Las oportunidades generadas por IA ahora incluyen una huella estable de tenant, cuenta, recurso/candidato, tipo y período factual; la base evita duplicados y reutiliza la oportunidad existente ante una generación equivalente.
- La migración `202607110001_add_recommendation_deduplication` se aplicó en Supabase: `recommendations.deduplication_key` y clave única por tenant.
- Un plan de ejecución rechazado por auditoría ya no se persiste ni se reutiliza. El detalle recupera únicamente el último plan aprobado.
- Se separaron permisos: administrador, administrador operador y técnico FinOps generan planes y registran ejecución; esos roles y `CLIENT_APPROVER` pueden aprobar o rechazar planes auditados.
- El E2E de CI amplía el flujo a plan aprobado de fixture → decisión → aprendizaje pendiente → ejecución manual → timeline, sin llamadas a un LLM ni proveedor cloud real.
- Verificación local: `npm run typecheck`, `npm test` (42 archivos, 174 pruebas), `npm run test:ai:offline`, `npm run build`, frontend `npm run lint`, `npm run build` y compilación de Playwright con `--list`.

### 2026-07-11 - Evidencia técnica canónica y aprendizaje por recurso

- `TechnicalRecommendationEvidenceService` dejó de cargar muestras crudas para armar prompts: reutiliza los agregados SQL por recurso/métrica (mínimo, máximo, promedio, p50/p95/p99, cobertura y frescura) y crea `RecommendationEvidenceSnapshot` versionado y hasheado.
- El snapshot guarda costo FOCUS, contexto de consumo, calidad del vínculo costo-métrica, referencias técnicas y resultado de las reglas determinísticas. Se usa sin reparsear texto en readiness, prompt, auditoría y rúbrica; se persiste junto a la recomendación auditada.
- La rúbrica ahora rechaza una recomendación técnica si sus referencias, recurso o reglas no coinciden exactamente con el snapshot. Las oportunidades con evidencia insuficiente o bloqueos siguen siendo solo de validación técnica.
- La misma compuerta valida que cantidad de muestras, cobertura, fecha de la última muestra y ahorro propuesto coincidan con el recurso y máximo permitido por las reglas del snapshot.
- Las cifras porcentuales que la IA escriba en el título o descripción de una recomendación técnica también se comparan contra los valores agregados del snapshot; una cifra inventada rechaza el artefacto antes de persistirlo.
- La agregación SQL ahora calcula también cuántas muestras y qué proporción de cada métrica supera el umbral técnico; una exposición sostenida de 20% o más bloquea rightsizing aunque los percentiles no alcancen por sí solos el límite.
- Los análisis aislados por `externalResourceId` conservan sus hechos limitados al recurso, pero recuperan memoria auditada de aprobaciones/rechazos para que el agente pueda mejorar con decisiones humanas.
- La evaluación compara el mismo análisis aislado con y sin memorias: el contexto aprendido cambia los criterios del prompt y queda registrado, sin cambiar el recurso factual ni ampliar el tenant.
- El detalle de recomendación muestra período, métricas, reglas, bloqueos, huella del snapshot, resultado de auditoría e influencia del aprendizaje sin exponer prompts ni secretos.
- Se ampliaron los golden scenarios offline con CPU/memoria/red/disco, cobertura escasa, evidencia obsoleta, contradicciones técnicas y referencias de métricas inventadas. `test:ai:live` conserva ejecución explícita y ahora reporta snapshot/auditoría, latencia y estimación de tokens.

### 2026-07-12 - Asignación de costos y showback determinístico

- Se creó `cost_allocation_rules` en Supabase con aislamiento por tenant, creador, prioridad, estado, vigencia, criterios FOCUS/tags y dimensiones de destino de negocio.
- La asignación usa primera coincidencia por prioridad; cada línea queda una sola vez, separada por moneda, o explícitamente como `UNALLOCATED`.
- Backend: CRUD/archivado auditado, preview sin persistencia con ejemplos, resumen/comparación mensual, detalle sin asignar, CSV y destino asignado en el detalle 360 del recurso.
- Frontend: sección `Asignación de costos` con filtros, KPIs, distribución, reglas, preview, activación, archivado, exportación CSV y sugerencias en español; los presupuestos por cuenta o servicio enlazan la sección.
- Verificación local: typecheck, 4 pruebas unitarias específicas y build frontend aprobados. La migración fue validada dentro de una transacción y aplicada en Supabase.

### 2026-07-14 - Consolidación de ingesta y procedencia de costos

- La facturación recurrente usa ahora el worker persistente: `AUTO` consume FOCUS cuando la conexión tiene un export configurado y, si no, usa AWS Cost Explorer u OCI Usage API. Los modos explícitos `FOCUS` y `PROVIDER_API` evitan ambigüedad.
- Cada `cost_metric` registra la conexión cloud y su procedencia (`FOCUS`, `PROVIDER_API`, `LEGACY` o `UNKNOWN`). Al proyectar un rango se reemplaza únicamente la fuente alternativa de esa conexión, sin mezclar resultados FOCUS y API directa.
- Se añadió `PUT /api/v1/cloud-connections/:id/billing-source` y un control en la vista Ingesta para configurar el origen de forma visible.
- Se retiró la ruta legacy sin consumidores (`DataIngestionService`, proveedores antiguos AWS/OCI, contrato de plugin y barrels no usados). Las capacidades de Cost Explorer y Usage API se migraron antes al worker actual.
- Supabase: se verificó que tres migraciones anteriores ya existían en el esquema pero no en `_prisma_migrations`; se marcaron como aplicadas y se desplegó `202607140001_cost_billing_source`.
- Verificación: backend `npm run typecheck`, frontend `npm run build` y `prisma migrate deploy` aprobados.

### 2026-07-14 - Simplificación de dependencias y ejecución periódica

- Recharts fue retirado: el histórico de costos del Dashboard usa uPlot y los sparklines de KPI técnico usan SVG nativo.
- Se eliminaron wrappers frontend de analítica que no tenían consumidores.
- Los workers de ingesta, aprendizaje, scheduler y mensajes reutilizan un único loop no solapable; conserva ejecución inmediata, detención y manejo de errores.
- Se centralizó la traducción de errores FinOps repetida en cuatro controladores, sin alterar sus contratos HTTP.
- Se removieron aliases TypeScript y generación de declaraciones no utilizados. `dotenv` se conserva por sus entrypoints activos.

### 2026-07-25 - Medición verificable del ahorro post-ejecución

- Se implementó `recommendation_savings_measurements` para separar el ahorro
  reportado manualmente, el ahorro observado/calculado, la proyección mensual,
  los aumentos de costo y el ahorro verificado.
- El cálculo es determinístico y tenant-scoped: usa ventanas UTC comparables,
  costo efectivo cuando es consistente, costo facturado como fallback, alcance
  explícito por recurso/servicio/cuenta, fuente/moneda/conexión única y hash de
  evidencia idempotente. No usa LLM ni convierte automáticamente históricos.
- La eficiencia por unidad registra cantidad, unidad y costo unitario; un cambio
  de volumen superior al 20% bloquea la afirmación de eficiencia.
- Las recomendaciones ligadas a recursos requieren evidencia técnica posterior
  suficiente de CPU y memoria; las señales de saturación bloquean la verificación.
- La UI permite calcular/recalcular, revisar evidencia, verificar o rechazar y
  conserva el historial en el timeline. El KPI confirmado y el ROI solo suman
  mediciones `VERIFIED`; el valor manual no se mezcla.
- Migraciones `202607250001_verified_savings_measurements` y
  `202607250002_savings_unit_normalization` aplicadas en Supabase y en el
  esquema aislado `finops_e2e_verified_savings`; no se insertaron fixtures en
  producción.
- Verificación: 53 archivos y 224 pruebas unitarias, 16 pruebas IA offline, 4
  suites/5 pruebas de integración PostgreSQL, typecheck/build backend y
  lint/build frontend aprobados.

### 2026-07-26 - Centro de realización de valor

- Se añadió el Centro `Valor realizado` con resumen por moneda, portafolio SQL paginado, tendencia semántica (observado, proyectado/run-rate verificado y aumentos separados), cola de trabajo y exportación CSV acotada.
- La conciliación usa únicamente `recommendation_savings_measurements`, procesa todas las ejecuciones manuales elegibles, excluye mediciones verificadas y conserva idempotencia por hash. Los roles operativos pueden ejecutar la actualización; los roles autenticados restantes mantienen lectura.
- Se agregó deduplicación explícita de notificaciones por tenant, usuario, medición y estado. El correo/Telegram opcional solo se dispara después de crear una alerta in-app nueva y nunca revierte una medición ante una falla externa.
- La ingesta exitosa puede disparar una conciliación acotada; el inicio y scheduler por tenant son opt-in, no solapables y desactivados por defecto durante desarrollo.
- Supabase: aplicada la migración `202607260001_value_realization_notification_dedupe` con índices para ejecuciones y mediciones; `prisma migrate status` quedó al día.
- Evidencia de rendimiento en esquema aislado Supabase: 5 tenants, 10.000 recomendaciones y 20.000 mediciones; `summary=459 ms`, página de 100=`447 ms`, exportación de 10.000=`994 ms`, `EXPLAIN ANALYZE=131.263 ms`. Sin fixtures en el esquema principal.
- Verificación: typecheck backend, 227 pruebas unitarias, integración PostgreSQL tenant-scoped, smoke HTTP autenticado de login/summary/items/trend/export, lint/build frontend y benchmark de lectura aprobados.

### 2026-08-04 - Distribución compartida y cierre financiero reproducible

- Se mantuvo el módulo actual de asignación y se añadieron reglas `DIRECT`/`SPLIT`, destinos porcentuales, hash/versionado de configuración y backfill explícito de reglas DIRECT existentes a 100 %.
- El motor calcula con Decimal, conserva primera coincidencia, separa monedas, mantiene `UNALLOCATED` y asigna el residuo al último destino sin duplicar líneas.
- Se implementaron cierres por tenant/período/moneda con fuente y reglas hasheadas, resultados por destino, versiones inmutables, reemplazo con motivo e idempotencia.
- Se extendió la API con cierre, historial, detalle y comparación de versiones. La UI actual de `Asignación de costos` muestra suma SPLIT, preview con período anterior/reglas usadas, impacto presupuestal, costo compartido, confirmación de cierre e historial.
- Los presupuestos por destino reutilizan únicamente cierres CLOSED; antes del cierre el actual se reporta explícitamente como no disponible y el preview conserva el valor como proyectado. Valor realizado solo atribuye ahorro con evidencia exacta.
- Migraciones aplicadas en Supabase: `202608040001` a `202608040008`; el estado reporta 44 migraciones al día.
- Evidencia de verificación: backend 59 archivos, 254 pruebas unitarias pasadas y 9 omitidas, typecheck, build, integración aislada 3/3 y audit de producción sin vulnerabilidades; frontend lint, typecheck, build y smoke E2E aprobados.
- Pendiente: validación productiva AWS/OCI Usage API cuando existan prerrequisitos externos. Chargeback contable continúa fuera del alcance.

### 2026-08-04 - Auditoría frontend del cierre

- Se corrigió la compuerta de `Previsualizar`: el formulario identifica el botón que originó el envío y ya no crea una regla cuando el usuario solo solicita un preview.
- El historial de cierres ahora permite abrir el detalle y comparar una versión seleccionada bajo demanda, mostrando hashes de fuente/reglas, responsable, totales, resultados por destino y razón de reemplazo sin duplicar cálculos financieros.
- Se añadió `e2e/cost-allocation.spec.ts` para cubrir el flujo SPLIT, validación 100 %, preview sin persistencia, guardado, cierre, detalle, comparación y exportación CSV.
- La UI ahora combina resumen live, cierres vigentes, periodo anterior, presupuestos de destino y ahorro con evidencia en un resumen financiero por destino; identifica explícitamente cuándo no existe un cierre o cuando hay filtros parciales.
- Verificación vigente: frontend typecheck, lint y build; E2E de asignación 1/1 y smoke E2E 1/1. No se modificó el contrato HTTP.

### 2026-08-04 - Benchmark E2E de cierre y persistencia masiva

- La suite aislada de asignación incorporó una medición reproducible con 10.000 costos persistidos, preview, cierre, `EXPLAIN (ANALYZE, BUFFERS)` y validación de 10.000 líneas de evidencia.
- Se corrigió la expiración del cierre por el timeout interactivo predeterminado de Prisma y se redujo el payload de líneas grandes a un `INSERT` parametrizado con `jsonb_to_recordset`; los lotes pequeños mantienen `createMany`.
- La migración `202608040008_cost_metrics_tenant_period_index` se aplicó en Supabase; el plan usa `cost_metrics_tenant_period_idx` y ejecuta en 9,597 ms para 10.000 filas.
- Resultado de la última ejecución en Supabase: preview `1.466,65 ms`, cierre `5.108,36 ms`; las 3 pruebas de integración pasaron. La brecha contra los objetivos orientativos de 500 ms/2 s queda registrada como `PERF-001` para una medición con infraestructura de despliegue representativa.

### 2026-08-11 - Inventario OCI ampliado y cobertura elegible de linaje

- Se integró OCI Resource Search con paginación, filtros include/exclude de compartimentos y normalización de
  `instance`, `bootvolume`, `bootvolumebackup` y `vnic`, sin ampliar permisos ni inventar cobertura.
- FOCUS puede producir referencias históricas exactas para OCID soportados que ya no existen en el inventario
  vivo. Esas referencias quedan marcadas como `OCI_FOCUS_HISTORICAL_REFERENCE`, estado `UNKNOWN` y nunca
  sobrescriben un recurso vivo.
- El backfill controlado en Supabase creó 11 referencias históricas y enlazó 8.137 costos adicionales. Resultado:
  8.173/8.173 costos elegibles enlazados (100 %), 36 vivos, 8.137 históricos, 555 IDs no soportados y 432 costos
  sin conexión fuera del denominador técnico. La repetición fue idempotente: cero candidatos y cero cambios.
- Readiness clasifica cada costo en siete categorías y expone agregación global, por servicio y por conexión.
  La UI explica el denominador y diferencia evidencia viva, histórica, no elegible y pendiente.
- Se dividieron `PrismaResourceLinkageReadinessRepository` (360 líneas) y `Ingesta.tsx` (363 líneas) en queries y
  paneles cohesivos. El contrato HTTP solo se amplió con campos compatibles de clasificación.
- Evidencia: backend `test:all` 81 archivos/321 pruebas y 19 escenarios IA offline; integración de linaje 5/5
  con mediana de readiness de 352,34 ms; frontend typecheck, lint y build; audit productivo backend sin vulnerabilidades.
