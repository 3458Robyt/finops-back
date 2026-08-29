# PostgreSQL local e ingesta FinOps

> **Corte vigente 2026-08-29.** Este runbook conserva los pasos operativos y
> distingue el estado actual de los cortes históricos que aparecen más abajo.

## Estado actual

- PostgreSQL 17 local está activo en `127.0.0.1:5433/finops_local` y tiene las
  95 migraciones aplicadas hasta
  `202608290002_recommendation_candidate_audits`.
- La base observa aproximadamente 14.678 MB. Tak 2.0 tiene 2.123.297 muestras
  raw y 3.105.765 rollups; el backfill no está completo: la ventana de auditoría
  conserva `COVERED`, `PARTIAL` y `NO_DATA` explícitos.
- `npm run dev:local` sigue siendo una operación manual de desarrollo. El
  scheduler y los workers no se ejecutan cuando se cierra la aplicación.
- Supabase se conserva como staging/rollback, pero actualmente está read-only;
  las migraciones locales pendientes no pueden aplicarse allí hasta habilitar
  escritura o elegir otro destino.
- Los trabajos `RUNNING` que queden sin heartbeat ya no permanecen bloqueados
  indefinidamente: el claim y la consola master ejecutan la reconciliación de
  leases vencidos con reintento, fallo final o cancelación explícita.

## Objetivo

La fase de desarrollo usa PostgreSQL 17 nativo en `127.0.0.1:5433` (no un
contenedor, porque el entorno actual no tiene Docker/virtualización
disponible) para no
seguir consumiendo el almacenamiento de Supabase con backfills técnicos y
reportes FOCUS. Supabase permanece como staging y rollback hasta validar la
operación local.

El clon contiene únicamente la aplicación FinOps en `public`: tenants,
usuarios y sesiones, credenciales cloud cifradas, inventario, costos FOCUS,
métricas, recomendaciones, trazabilidad y jobs. No se copian los servicios
internos de Supabase (`auth`, `storage`, `realtime`, `vault`, GraphQL, etc.).

## Rutas locales protegidas

Las siguientes rutas están fuera del repositorio y nunca deben versionarse:

- `C:\FinOpsData\postgres17\data` — cluster PostgreSQL 17.
- `C:\FinOpsData\postgres17\superuser.pass` — contraseña local.
- `C:\FinOpsData\snapshots` — dumps, logs y manifiestos de clonación.
- `C:\FinOpsData\backups` — respaldos de `.env`.

El `.gitignore` también bloquea dumps, backups y artefactos locales por
defensa en profundidad.

## Comandos

Desde `finops-backend`:

```powershell
# Confirmar que el cluster nativo está activo
npm run db:local:start

# Repetir el clon cuando sea necesario. Reemplaza solamente finops_local.
# El origen se lee de DATABASE_URL en .env y nunca se imprime.
npm run db:local:clone

# Desarrollo: inicia backend, scheduler y worker en esta misma ventana.
npm run dev:local

# Alternativa: ejecutar worker o scheduler por separado.
npm run ingestion:local:worker
npm run ingestion:local:scheduler

# Detener el cluster local al terminar la sesión.
npm run db:local:stop
```

El scheduler y el worker son procesos del ciclo de desarrollo: se ejecutan
mientras `dev:local` está abierto y se detienen al cerrar el backend. No se
instalan servicios permanentes ni se realizan llamadas OCI 24/7.

El scheduler usa un bloqueo advisory transaccional de PostgreSQL para que dos
ejecuciones simultáneas no creen jobs duplicados. Para métricas técnicas, la
recuperación automática puede alcanzar hasta 90 días y respeta la cobertura y
configuración registrada; se controla con
`INGESTION_SCHEDULER_METRIC_CATCHUP_DAYS` (1–90, por defecto 90).

## Política de clonación

Cada clon crea un dump custom inmutable con SHA-256 y un `manifest.json`. El
snapshot conserva el estado exacto del origen antes de cualquier operación
local; después de restaurarlo, el script ejecuta `prisma migrate deploy` para
aplicar de forma reproducible las migraciones que no existían al crear el
dump. En la base operativa, los jobs heredados en `PENDING` o `RUNNING` se
marcan `CANCELLED` y archivados para impedir que se reanuden leases antiguos;
los datos de negocio no se eliminan. El scheduler genera ventanas nuevas con
la configuración actual.

## Cobertura y provenance

Los nuevos jobs registran segmentos de cobertura en
`ingestion_coverage_segments` y partes operativas en
`ingestion_job_parts`. Las muestras técnicas y filas FOCUS nuevas llevan el
`ingestion_job_id`. Esto permite distinguir una ventana realmente descargada
de un job solamente creado y facilita reintentos sin duplicar la información.

La deduplicación de muestras conserva la identidad del stream, estadística,
granularidad y timestamp. La tabla de resúmenes se actualiza desde las filas
escritas por el job, no mediante un escaneo histórico de toda la conexión.
El script de reconstrucción de resúmenes sigue disponible para mantenimiento
controlado y auditorías.

## Estado verificado del clon (corte histórico — 2026-08-23)

Verificación local realizada el 23 de agosto de 2026:

- PostgreSQL 17.11 está activo en `127.0.0.1:5433/finops_local`.
- El clon conserva 8 tenants, 10 conexiones cloud, 737.609 muestras técnicas
  heredadas y 9.762 filas FOCUS heredadas antes de las nuevas pruebas locales.
- La cuenta personal de OCI fue validada y procesó una ventana técnica local
  con 44 llamadas, 44 muestras y las estadísticas `MEAN`, `MIN`, `MAX` y
  `P95`; no quedaron jobs `PENDING` o `RUNNING` después de la prueba.
- La conexión personal conserva 183.561 muestras técnicas locales entre el 4
  de mayo y el 23 de agosto de 2026. La cobertura exacta depende de las
  definiciones y de la retención que OCI devuelva para cada métrica.
- La capacidad OCI `COSTS` de la cuenta personal no está autorizada y en la
  ventana actual no se descubrieron reportes FOCUS nuevos; por eso la ingesta
  de facturación queda registrada como `PARTIAL`, no como completa. No se
  deben presentar esos costos como históricos completos hasta habilitar la
  policy oficial o disponer de objetos FOCUS publicados.

## Validación operativa mínima

1. Ejecutar `npm run db:local:start`.
2. Confirmar `pg_isready -h 127.0.0.1 -p 5433`.
3. Ejecutar `npm run typecheck` y `npm run test:unit`.
4. Iniciar `npm run dev:local`.
5. Revisar la consola de jobs del admin maestro: el job debe pasar por
   `DISCOVERING`, `FETCHING`, `PERSISTING` y `COMPLETED`.
6. Verificar en PostgreSQL que el intervalo aparece en
   `ingestion_coverage_segments`, que las métricas tienen `ingestion_job_id`
   y que FOCUS tiene filas para el rango solicitado.
7. Detener la aplicación cuando termine la sesión de desarrollo.

Un fallo de OCI no se debe resolver borrando jobs o datos: se conserva el
error, se valida la causa y se reintenta únicamente la parte faltante.

## Proyección de métricas para lectura rápida

La tabla `resource_metric_rollups` es una proyección derivada y no reemplaza
`resource_metric_samples`. Conserva ventanas de 30 minutos, una hora y un día
con `avg`, `min`, `max`, `latest`, `sum`, conteo de muestras y timestamps de los
extremos. La vista de métricas consulta esta proyección para granularidades
agregadas; `raw` y el drilldown siguen leyendo las muestras exactas.

Después de aplicar migraciones o restaurar un clon, reconstruirla una vez:

```powershell
npm run metrics:rebuild-rollups
```

Los jobs técnicos nuevos actualizan únicamente las ventanas afectadas al
finalizar, por lo que no deben ejecutar un escaneo histórico completo. Si la
proyección todavía no existe o está vacía, el lector usa temporalmente la
agregación SQL de las muestras raw para mantener compatibilidad.

La lectura del resumen interactivo usa además el lector
`PrismaResourceMetricSummaryReader`, basado en la ventana diaria de esa
proyección. Así el panel no calcula percentiles y agrupaciones sobre millones
de muestras en cada cambio de filtro. Los valores `avg`, `min`, `max` y
`latest` se combinan desde los rollups; las estadísticas percentiles del
detalle/serie (`P50`, `P90`, `P95`, `P99`) siguen consultando el flujo exacto
de muestras raw para no presentar un percentil aproximado como si fuera
exacto.

En el clon local verificado el 24 de agosto de 2026 hay 1.871.897 muestras
raw entre el 4 de mayo y el 24 de agosto y 2.861.231 filas de rollup. El
benchmark del resumen del tenant `Tak 2.0` pasó de una consulta raw de
aproximadamente 23,4 segundos a 0,75 segundos con la proyección diaria; el
tiempo total del overview, que también carga inventario, estadísticas y
contexto de costos, fue de 264 ms en una repetición local con buffers
calientes. Estos valores son
una línea base local y deben repetirse contra el destino remoto antes de
definir un SLA.

Para desarrollo local, `npm run dev:local` inicia API, worker y scheduler en la
misma ventana. El wrapper configura un lease de job de 120 segundos (renovable
cada minuto) para que un worker caído pueda recuperarse sin dejar trabajos
aparentemente congelados durante varios minutos. En producción el lease debe
definirse explícitamente según la latencia máxima del proveedor.
