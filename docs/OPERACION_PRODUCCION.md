# Operación e infraestructura

Fecha de revisión: 2026-08-11.

## Roles de proceso

El mismo artefacto backend puede ejecutarse con responsabilidades separadas:

| `APP_PROCESS_ROLE` | Escucha HTTP | Workers | Schedulers |
|---|---:|---:|---:|
| `api` | Sí | No | No |
| `worker` | No | Sí, si cada `*_WORKER_ENABLED=true` | No |
| `scheduler` | No | No | Sí, si cada `*_SCHEDULER_ENABLED=true` |
| `all` | Sí | Sí | Sí |

`all` mantiene compatibilidad con el desarrollo local. En un despliegue real se
recomienda separar al menos `api`, `worker` y `scheduler` para que una llamada
externa lenta no bloquee la atención HTTP y para poder escalar cada rol de forma
independiente. Los jobs usan `FOR UPDATE SKIP LOCKED`, leases y contexto de
tenant; no se debe ejecutar el mismo scheduler con una configuración diferente
sin revisar sus cooldowns.

## Imagen y usuario

- `finops-backend/Dockerfile` construye TypeScript en una etapa y ejecuta la
  imagen final como usuario no root `node`.
- `finops-app/Dockerfile` genera el bundle estático y lo sirve con Nginx.
- Los `.dockerignore` excluyen `.env`, logs, artefactos E2E y credenciales.
- Las migraciones se aplican como paso explícito (`npx prisma migrate deploy`)
  desde un job de release; la imagen no ejecuta migraciones automáticamente al
  arrancar.

## Health, readiness y métricas

- `GET /health`: proceso vivo; no confirma conectividad de BD.
- `GET /ready`: proceso listo para recibir tráfico y consulta `SELECT 1`.
- `GET /metrics`: formato Prometheus. En producción exige `X-Metrics-Token` y
  `METRICS_TOKEN`; nunca se debe publicar sin una red o autenticación interna.

Se registran, como mínimo, solicitudes HTTP y latencia por clase de estado,
llamadas/latencia/tokens estimados del proveedor IA e iteraciones/latencia/
llamadas de los workers de ingesta. El registro es intencionalmente acotado en
memoria; para producción debe scrapearse periódicamente y no sustituye un
backend de métricas durable.

## Secuencia de release

1. Validar `npm run test:all`, `npm audit --omit=dev --audit-level=high` y el
   build del frontend.
2. Construir imágenes con un tag inmutable basado en el commit.
3. Aplicar migraciones Prisma desde un job con permisos de migración.
4. Arrancar un proceso `api`, comprobar `/health` y `/ready`.
5. Arrancar `worker` y `scheduler` con identidades separadas y revisar logs de
   claim/lease.
6. Ejecutar el canary de autenticación, RLS, ingesta y proveedor IA antes de
   habilitar tráfico general.
7. Mantener rollback de aplicación separado del rollback de migración; nunca
   borrar datos para revertir una versión.

## Señales operativas

Alertar cuando:

- `/ready` falla durante más de dos intervalos;
- aumenta `5xx` o `auth` fallido;
- aparecen replays de refresh/MFA;
- jobs `FAILED` superan el umbral por conexión o el lease expira;
- el backlog de análisis/aprendizaje crece sin disminuir;
- la latencia IA o el estimado de tokens supera el presupuesto;
- el enlace de costos a inventario cae por debajo del umbral acordado.

Durante desarrollo estos procesos se ejecutan manualmente y no existe una
promesa de ingesta diaria si el backend está apagado. Esa condición se vuelve
un requisito de operación únicamente cuando exista un destino desplegado.
