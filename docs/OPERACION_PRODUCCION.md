# Operación e infraestructura

Fecha de revisión: 2026-08-12.

La configuración se valida antes de construir la composición: en producción
`APP_PROCESS_ROLE` es obligatorio y puede ser un alias (`api`, `worker`,
`scheduler`, `all`) o un rol granular (`ingestion-worker`, `learning-worker`,
`recommendation-analysis-worker`, `savings-reconciliation-worker`,
`ingestion-scheduler`,
`recommendation-analysis-scheduler`,
`notification-scheduler`, `auth-cleanup-scheduler`). Un valor inválido no puede caer silenciosamente en `all`. Si se habilita
correo, Telegram o el scheduler de mensajes/reconciliación, también son
obligatorios sus secretos y destinos explícitos. En desarrollo estas mismas
integraciones permanecen apagadas por defecto.

## Roles de proceso

El mismo artefacto backend puede ejecutarse con responsabilidades separadas:

| `APP_PROCESS_ROLE` | Escucha HTTP | Responsabilidades activas |
|---|---:|---|
| `api` | Sí | HTTP |
| `worker` | No | Los cuatro workers (`ingestion`, `learning`, `recommendation-analysis`, `savings-reconciliation`) |
| `scheduler` | No | Todos los schedulers habilitados |
| `ingestion-worker` | No | Solo worker de ingesta |
| `learning-worker` | No | Solo worker de aprendizaje |
| `recommendation-analysis-worker` | No | Solo worker de análisis |
| `ingestion-scheduler` | No | Solo scheduler de ingesta |
| `recommendation-analysis-scheduler` | No | Solo scheduler de análisis |
| `savings-reconciliation-worker` | No | Solo reconciliación de valor |
| `notification-scheduler` | No | Solo cola de mensajes |
| `auth-cleanup-scheduler` | No | Solo limpieza de autenticación |
| `all` | Sí | Todas las responsabilidades |

`all` mantiene compatibilidad con el desarrollo local; `worker` y `scheduler`
mantienen compatibilidad con la primera topología de beta. En un despliegue real
se puede aislar cada responsabilidad con un rol granular, evitando que una
llamada externa lenta bloquee otros workers y permitiendo escalar únicamente el
backlog que lo necesita. Los jobs usan `FOR UPDATE SKIP LOCKED`, leases y
contexto de tenant; no se debe ejecutar el mismo scheduler con una configuración
diferente sin revisar sus cooldowns.

Ejemplos de procesos independientes con el mismo artefacto:

```powershell
$env:APP_PROCESS_ROLE='api'; node dist/index.js
$env:APP_PROCESS_ROLE='ingestion-worker'; node dist/index.js
$env:APP_PROCESS_ROLE='learning-worker'; node dist/index.js
$env:APP_PROCESS_ROLE='recommendation-analysis-worker'; node dist/index.js
$env:APP_PROCESS_ROLE='savings-reconciliation-worker'; node dist/index.js
$env:APP_PROCESS_ROLE='ingestion-scheduler'; node dist/index.js
$env:APP_PROCESS_ROLE='notification-scheduler'; node dist/index.js
```

Los envíos SMTP y Telegram están limitados por `OUTBOUND_PROVIDER_TIMEOUT_MS`
(15 segundos por defecto; entre 5 y 60 segundos en producción). Un timeout se
persiste como resultado de entrega fallida y no debe detener el loop del scheduler.

La limpieza de autenticación se activa con `AUTH_CLEANUP_SCHEDULER_ENABLED=true`
en el proceso `scheduler` o `auth-cleanup-scheduler`. Solo elimina filas cuyo `expiresAt` ya pasó y ejecuta
con el contexto RLS `finops-maintenance:auth-lifecycle`; conserva registros no
expirados para no debilitar la detección de replay de refresh tokens.

La liveness durable de cada instancia se registra en
`runtime_process_heartbeats`. `PROCESS_HEARTBEAT_ENABLED` está activo por defecto
en desarrollo, el primer heartbeat se escribe al arrancar y luego se renueva
según `PROCESS_HEARTBEAT_INTERVAL_MS`; `PROCESS_HEARTBEAT_STALE_AFTER_MS` define
cuándo debe considerarse atrasado. El `process_id` combina rol, instancia y PID,
y la política RLS permite a cada proceso leer/modificar únicamente su propio
registro mediante `app.worker_id`. Un reinicio de la misma instancia reutiliza su
identidad y restablece `started_at`, evitando una fila nueva por cada reinicio;
los cambios de instancia conservan su historial operativo. Durante un shutdown ordenado el estado
pasa a `STOPPED`; un proceso terminado abruptamente queda `RUNNING` hasta que
supere el umbral de stale. La tabla no contiene datos de tenant y sus operaciones
se ejecutan dentro de transacciones para que el contexto runtime se aplique de
forma consistente.

## Imagen y usuario

- `finops-backend/Dockerfile` construye TypeScript en una etapa y ejecuta la
  imagen final como usuario no root `node`.
- `finops-app/Dockerfile` genera el bundle estático y lo sirve con la imagen
  `nginxinc/nginx-unprivileged` en el puerto 8080, sin ejecutar el contenedor
  como root.
- Los `.dockerignore` excluyen `.env`, logs, artefactos E2E y credenciales.
- Las migraciones se aplican como paso explícito (`npx prisma migrate deploy`)
  desde un job de release; la imagen no ejecuta migraciones automáticamente al
  arrancar.

## Health, readiness y métricas

- `GET /health`: proceso vivo; no confirma conectividad de BD.
- `GET /ready`: proceso listo para recibir tráfico; consulta la BD y, cuando
  `DB_RUNTIME_ENFORCE=true`, verifica que la conexión usa `DB_RUNTIME_ROLE`.
- `GET /metrics`: formato Prometheus. En producción exige `X-Metrics-Token` y
  `METRICS_TOKEN`; nunca se debe publicar sin una red o autenticación interna.

`GET /ready` devuelve checks separados para base de datos, rol runtime,
migraciones, capacidad de adquirir un advisory lease, heartbeat del proceso y
disponibilidad opcional del proveedor IA. La IA no bloquea el readiness cuando
está sin configurar, porque los endpoints determinísticos pueden seguir
funcionando. En producción `DB_EXPECTED_MIGRATION` es obligatorio y debe
coincidir con la última migración desplegada. El detalle de backup/restore,
rotación y recuperación de jobs vive en `docs/OPERACION_RECUPERACION.md`.

El heartbeat exporta `process_heartbeat_writes_total`,
`process_heartbeat_write_duration_ms` y `process_heartbeat_stops_total` sin usar
el `process_id` como etiqueta de alta cardinalidad.

## Ejecución con Docker Compose

`docker-compose.runtime.yml` separa los tres roles del mismo artefacto. Requiere
un `.env` fuera del repositorio con `DATABASE_URL`, `DB_RUNTIME_ENFORCE=true`,
`DB_RUNTIME_ROLE=finops_runtime` y los secretos de producción:

```powershell
Copy-Item .env.example .env
# Editar .env y reemplazar todos los valores de ejemplo.
docker compose -f docker-compose.runtime.yml build
docker compose -f docker-compose.runtime.yml up -d
docker compose -f docker-compose.runtime.yml ps
Invoke-WebRequest http://localhost:3000/health
Invoke-WebRequest http://localhost:3000/ready
```

La imagen no aplica migraciones automáticamente. Antes de arrancar una nueva
versión se debe ejecutar `npx prisma migrate deploy` desde un job de release
con permisos de migración y luego desplegar la imagen etiquetada con el commit.
El healthcheck del servicio `api` valida únicamente liveness (`/health`) para
evitar reinicios por una caída temporal de Supabase; el balanceador u orquestador
debe usar `/ready` para retirar tráfico cuando la BD o el rol runtime no estén
disponibles. `worker` y `scheduler` no exponen un healthcheck HTTP ficticio: su
estado se verifica mediante `runtime_process_heartbeats`, logs de claim/lease y
métricas operativas.

La configuración activa `init`, `no-new-privileges`, elimina capabilities Linux
innecesarias y da 20 segundos para que el shutdown drene trabajo antes de que
Docker fuerce la terminación. No se debe montar `.env`, claves OCI ni artefactos
E2E dentro de la imagen.

Se registran, como mínimo, solicitudes HTTP y latencia por clase de estado,
llamadas/latencia/tokens estimados del proveedor IA e iteraciones/latencia/
llamadas de los workers de ingesta. El registro es intencionalmente acotado en
memoria; para producción debe scrapearse periódicamente y no sustituye un
backend de métricas durable.

## Secuencia de release

1. Validar `npm run check:release-hygiene`, `npm run test:all`, `npm run test:integration:auth-cleanup`, `npm run test:integration:process-heartbeat`, `npm audit --omit=dev --audit-level=high` y el
   build del frontend.
2. Construir imágenes con un tag inmutable basado en el commit.
3. Aplicar migraciones Prisma desde un job con permisos de migración y ejecutar
   `npm run db:verify:quality-indexes` cuando la entrega incluya el reporte de
   calidad IA; la verificación solo consulta metadatos y planes.
4. Arrancar un proceso `api`, comprobar `/health` y `/ready`.
5. Arrancar `worker` y `scheduler` con identidades separadas, o sus roles
   granulares, y revisar logs de claim/lease.
6. Ejecutar el canary de autenticación, RLS, ingesta y proveedor IA antes de
   habilitar tráfico general.
7. Si se habilita mensajería, ejecutar `npm run test:canary:messaging` con un
   destino de prueba explícito; el comando se omite sin una confirmación fuerte
   y no debe apuntar a destinatarios de clientes.
8. Mantener rollback de aplicación separado del rollback de migración; nunca
   borrar datos para revertir una versión.

`check:release-hygiene` inspecciona únicamente rutas rastreadas por Git y falla
si encuentra `.env` no permitido, claves/certificados, bases SQLite, logs o
artefactos de pruebas. `.env.example` es la única excepción explícita.

## Señales operativas

Alertar cuando:

- `/ready` falla durante más de dos intervalos;
- aumenta `5xx` o `auth` fallido;
- aparecen replays de refresh/MFA;
- jobs `FAILED` superan el umbral por conexión o el lease expira;
- un heartbeat de proceso permanece `RUNNING` por encima de
  `PROCESS_HEARTBEAT_STALE_AFTER_MS` o desaparece de la ventana esperada;
- el backlog de análisis/aprendizaje crece sin disminuir;
- la latencia IA o el estimado de tokens supera el presupuesto;
- el enlace de costos a inventario cae por debajo del umbral acordado.

Durante desarrollo estos procesos se ejecutan manualmente y no existe una
promesa de ingesta diaria si el backend está apagado. Esa condición se vuelve
un requisito de operación únicamente cuando exista un destino desplegado.
