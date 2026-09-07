# Goal — Estabilización empresarial y validación real de FinOps

Fecha de implementación: 2026-08-14

> **Documento histórico:** este goal conserva la evidencia de su corte de
> implementación. Los estados actuales de migraciones, proveedor IA y entorno
> de ejecución se consultan en `docs/ESTADO_ACTUAL_FINOPS.md` y
> `docs/DEUDA_TECNICA.md`.

Este documento registra la implementación del goal de estabilización de la beta,
sin declarar como verificada una cuenta cloud real cuya credencial haya sido
expuesta en una conversación. La fuente de verdad del estado general sigue
siendo docs/ESTADO_ACTUAL_FINOPS.md; los pendientes formales están en
docs/DEUDA_TECNICA.md.

## Implementado

### Métricas técnicas y rendimiento

- Se preserva la estadística nativa de cada muestra mediante MetricStatistic:
  MEAN, MIN, MAX, P50, P90, P95, P99, SUM, COUNT, RATE y LATEST.
- OCI genera consultas Monitoring con la expresión nativa solicitada, incluidos
  percentiles y last(). AWS normaliza Average, Minimum, Maximum, Sum,
  SampleCount y percentiles de CloudWatch.
- El inventario cloud se filtra en PostgreSQL por costo positivo, estado,
  proveedor y búsqueda. La respuesta continúa tenant-scoped y conserva el
  lineage de costos, métricas y recomendaciones.
- La UI expone la estadística seleccionable y conserva la serie raw/drilldown;
  no sube automáticamente la granularidad ni oculta información.

### Portal de cliente y administración MSP

- El administrador maestro puede crear invitaciones de un solo uso para un
  tenant, seleccionar CLIENT_VIEWER o CLIENT_APPROVER y copiar un enlace de
  portal. Si SMTP está habilitado, el backend también envía directamente el
  enlace por correo y registra el estado de entrega sin guardar el token en la
  previsualización ni en el cuerpo durable de la entrega.
- Solo se persiste el hash SHA-256 del código; el código tiene TTL de 30 minutos,
  se consume de forma transaccional y no se reutiliza.
- La aceptación crea la cuenta cliente dentro del tenant de la invitación,
  inicia la sesión y aplica la matriz de permisos existente. El cliente no
  recibe acceso al módulo de configuración del agente ni a la administración
  MSP.
- La migración `202608140002_client_invitations` está aplicada en Supabase y
  registrada en el historial local de Prisma.
- La entrega usa el canal SMTP existente (`EMAIL_ENABLED`, `SMTP_*`) con
  timeout acotado. Si el proveedor falla, la invitación no se revierte: el
  administrador conserva el enlace para compartirlo manualmente y el fallo se
  registra como `FAILED`.

### Telegram

- Cada usuario autenticado puede generar desde Perfil un código de
  auto-vinculación de 10 minutos.
- El bot consume el código con /start <código> mediante el webhook autenticado,
  registra la auditoría y vincula el chat al tenant/usuario exactos.
- Los códigos solo se almacenan hasheados; un chat ya vinculado no puede ser
  apropiado por otro usuario.
- La migración `202608140003_telegram_self_link_codes` está aplicada en Supabase.
  El webhook ejecuta contexto worker explícito para que RLS permita resolver el chat antes de
  conocer el tenant.

## Migraciones y despliegue

Las migraciones del goal se aplicaron en Supabase mediante el MCP autorizado,
en orden y sin tocar datos de negocio:

1. 202608140001_native_metric_statistics
2. 202608140002_client_invitations
3. 202608140003_telegram_self_link_codes
4. 202608140004_client_invitation_message_type
5. 202608140005_invitation_telegram_fk_indexes_and_rls_initplans
6. 202608140006_consolidate_auth_refresh_rls
7. 202608160001_cloud_credential_validation_lifecycle
8. 202608160002_oci_ingestion_configuration
9. 202608160003_drop_legacy_metric_unique
10. 202608160004_cloud_credential_fingerprint_idempotency

La verificación posterior confirmó 19.427 muestras técnicas, tablas nuevas
vacías e índices de claves foráneas presentes. Los Advisors de seguridad no
presentan lints; el Advisor de rendimiento solo conserva observaciones INFO de
índices no usados, que se reevaluarán con tráfico productivo representativo.
Después de aplicar el SQL mediante MCP, el historial local de Prisma se alineó
con `prisma migrate resolve`; `npx prisma migrate status` confirma 74/74
migraciones aplicadas.
El canary RLS remoto pasó con dos tenants, rol `finops_runtime`, las tablas
nuevas y cero filas cross-tenant visibles.

## Validación ejecutada

- Backend: arquitectura, release hygiene, typecheck, build, suite unitaria
  completa y escenarios IA offline aprobados.
- Cobertura dirigida: invitaciones, webhook/self-linking de Telegram, consultas
  nativas OCI/AWS y filtros server-side de inventario.
- Frontend: lint, typecheck, build y fitness de bundle aprobados.
- Se ejecutó una validación live read-only de la candidata OCI empresarial: el
  PEM se normalizó y su fingerprint se derivó correctamente, pero OCI rechazó
  la autenticación. La candidata quedó `INVALID/REJECTED`, no desplazó una
  credencial activa y no se ejecutaron ingestas ni cambios sobre recursos cloud.
  Como la clave fue compartida en la conversación, debe revocarse/rotarse y
  nunca debe guardarse en Git, `.env.example`, logs o documentación.

## Pendientes y límites

- AWS real permanece en standby hasta disponer de una cuenta/rol autorizados.
- OCI Usage API continúa como redundancia pendiente de IAM; FOCUS sigue siendo
  la fuente operativa principal.
- Configurar CLIENT_PORTAL_URL, TELEGRAM_BOT_USERNAME, el token del bot y el
  webhook secreto solo en el gestor de secretos o .env local ignorado.
- Configurar SMTP únicamente con una cuenta de envío dedicada o una contraseña
  de aplicación; validar un correo de prueba antes de habilitar invitaciones.
- Los workers y schedulers continúan manuales durante desarrollo; la operación
  24/7, rate limiting distribuido y secret manager externo siguen diferidos.
