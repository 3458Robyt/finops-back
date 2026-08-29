# Deuda técnica y faltantes — FinOps Inteligente

> Registro autoritativo del corte **2026-08-29**. Este archivo contiene únicamente
> trabajo abierto, bloqueado o diferido. El estado completo y lo ya entregado se
> consulta en `docs/ESTADO_ACTUAL_FINOPS.md`; la secuencia futura está en
> `docs/ROADMAP_PRODUCTO.md` y la evolución histórica en
> `PROGRESO_ROADMAP_FINOPS.md`.

## Deuda activa

| ID | Prioridad | Área | Estado | Hallazgo y criterio de cierre | Evidencia y siguiente acción |
|---|---|---|---|---|---|
| SEC-001 | Alta | Seguridad/RLS | DIFERIDO | Activar enforcement obligatorio en el destino productivo y documentar rollback seguro. | El canary local confirma rol `finops_runtime`, aislamiento entre tenants, 20 helpers sin exposición a roles API y `search_path` seguro. Falta definir destino de despliegue y operar con `DB_RUNTIME_ENFORCE=true`, `DB_RUNTIME_ROLE=finops_runtime` y migración esperada. |
| DB-001 | Alta | Supabase | BLOQUEADO | Aplicar de forma controlada las migraciones de hardening e índices al destino que vaya a operar la beta. | PostgreSQL local tiene 93 migraciones hasta `202608280007_restore_auth_cleanup_refresh_visibility`. Supabase responde `read-only` y rechaza `CREATE/INSERT`; las migraciones 202608280001–007 están pendientes allí. El administrador debe habilitar escritura o seleccionar otro destino; no se deben reintentar indefinidamente. |
| ING-004 | Alta | Métricas OCI | ABIERTO | Auditar y completar, cuando el proveedor tenga evidencia, el backfill técnico de Tak 2.0 sin declarar cobertura inexistente. | Último corte local: 2.123.297 muestras raw, 3.105.765 rollups, rango 2026-05-21..2026-08-18; en 2026-05-30..2026-08-30 hay 44.304 `COVERED`, 16.157 `PARTIAL` y 71.593 `NO_DATA`. Los leases stale ahora se reconcilian automáticamente; continuar por gaps con workers activos y emitir auditoría por día, stream y job. |
| ING-006 | Alta | FOCUS | ABIERTO | Verificar disponibilidad y completitud de reportes FOCUS actuales de Tak 2.0 antes de presentarlos como histórico de costos. | La base local conserva 148.916 filas FOCUS hasta el 26 de agosto de 2026 y el backfill reciente cubrió 90/90 días operativos. Revisar watermark, completitud de nuevos reportes y vínculos de inventario; no sumar fuentes ni rellenar periodos con ceros. |
| AWS-001 | Alta | AWS | BLOQUEADO | Ejecutar canary real de STS/EC2/CloudWatch/Cost Explorer/FOCUS y validar normalización. | Falta una cuenta AWS y un rol de prueba. Las credenciales bootstrap de la plataforma solo deben permitir `AssumeRole`; no son credenciales del tenant. |
| OCI-001 | Media | OCI Usage API | BLOQUEADO | Ejecutar canary read-only de costos/consumo y comprobar que no duplica FOCUS. | La ruta existe, pero el permiso oficial de `usage-report` depende de un administrador externo. Mantener FOCUS como fuente primaria y ejecutar el canary solo después de aplicar la policy mínima en la cuenta objetivo. |
| AI-001 | Alta | IA/proveedor | BLOQUEADO | Superar el canary live aislado con el proveedor configurado: chat, generación, auditoría, evidencia, trazabilidad y `persist=false`. | La última ejecución del 2026-08-28 recibió HTTP 503 (`Service temporarily unavailable`) en `/ai/chat`; no persistió fixtures ni expuso la clave. Repetir cuando el proveedor esté disponible y conservar latencia, tokens y resultado sanitizado. |
| AI-002 | Media | IA/gobernanza | ABIERTO | Mantener una calificación periódica del proveedor real con escenarios dorados, auditoría, evidencia y abstención ante datos débiles. | El canary offline y la validación live anterior están registrados; repetirlo tras cambios de proveedor/modelo y conservar latencia, tokens, respuestas auditadas y motivos de rechazo sin persistir fixtures. |
| MSG-001 | Media | Mensajería | ABIERTO | Validar entrega real de alertas por SMTP y Telegram con proveedores controlados. | Procesamiento, leases, reintentos y estados sanitizados están implementados; faltan credenciales de prueba y ejecución explícita del canary `npm run test:canary:messaging`. |
| PERF-001 | Media | Asignación de costos | ABIERTO | Medir y reducir la latencia de preview/cierre en una infraestructura representativa sin perder trazabilidad. | El plan de base usa índices y bulk insert; la corrida remota histórica fue aproximadamente 1,7 s en preview y 8,7 s en cierre con 10.000 líneas. Repetir benchmark en el destino definitivo antes de optimizar por intuición. |
| PERF-004 | Alta | Ingesta técnica | ABIERTO | Establecer SLO de persistencia y throughput para backfills grandes con límites OCI, sin descartar raw ni estadísticas. | El raw-first, streaming, batching y cuatro workers están implementados; el projection worker es asíncrono. Falta una medición reproducible de cierre completo en el destino elegido y ajustar concurrencia con métricas de OCI/BD. |
| QA-003 | Alta | Integración PostgreSQL | BLOQUEADO | Ejecutar la suite aislada también contra el destino remoto cuando permita escritura y garantizar limpieza automática. | Suite local aislada: 10 archivos, 17 pruebas, cleanup de auth y heartbeat aprobados; schemas temporales se eliminan en `finally`. Supabase no permite crear schema por su modo read-only, por lo que el canary remoto queda bloqueado. |
| QA-004 | Media | Playwright real | BLOQUEADO | Recorrer todos los módulos contra una cuenta administrativa real, en modo solo lectura, sin errores de red, mutaciones ni desbordamientos. | playwright.real.config.ts y e2e-real/readonly.spec.ts están implementados con cuatro viewports, filtros técnicos y guardia de mutaciones. Falta configurar credenciales locales de prueba; la suite falla cerrada si faltan. |
| OPS-001 | Media | Operación | DIFERIDO | Activar workers, healthchecks, alertas y scheduler 24/7 en un despliegue controlado. | Roles de proceso, heartbeats, leases y readiness están implementados. Durante desarrollo la ejecución manual es una decisión aceptada; falta destino, supervisión y política de reinicio. |
| OPS-002 | Baja | Presupuestos | DIFERIDO | Ejecutar evaluación periódica de presupuestos y notificaciones en un worker desplegado. | `budget-scheduler` es opt-in e idempotente; la ejecución continua se difiere hasta definir operación 24/7 y canales reales. |
| OPS-003 | Media | Secretos/observabilidad | DIFERIDO | Migrar secretos a un gestor externo y centralizar logs, métricas y alertas con rotación. | El código evita imprimir secretos y el audit productivo está limpio; la operación formal depende del entorno de despliegue. |
| OPS-006 | Media | Recuperación | DIFERIDO | Ejecutar rehearsal de backup/restore aislado y medir RTO/RPO en el destino definitivo. | `docs/OPERACION_RECUPERACION.md` contiene el procedimiento; falta proveedor, almacenamiento y credenciales operativas autorizadas. |
| SEC-002 | Media | Escalabilidad | DIFERIDO | Sustituir el rate limiting en memoria por un store compartido al escalar horizontalmente. | El límite actual es adecuado para desarrollo/una instancia; usar Redis o equivalente antes de desplegar varias réplicas. |
| SEC-003 | Baja | Toolchain | DIFERIDO | Actualizar vulnerabilidades transitivas de desarrollo del frontend cuando exista una versión compatible. | `npm audit --omit=dev --audit-level=high` de producción está en cero; las vulnerabilidades restantes son de dependencias de desarrollo y no afectan el bundle productivo según el corte actual. |

## Decisiones de alcance

- FOCUS es la fuente operativa primaria; OCI Usage API es redundancia y no debe
  duplicar filas.
- AWS real, OCI Usage API, SMTP y Telegram real dependen de cuentas o
  proveedores externos; no se simulan para cerrar la deuda.
- La suite real de Playwright puede validar AWS/OCI ya registrado sin escribir:
  login, cambio de tenant, lecturas y filtros. Nunca debe automatizar creación,
  borrado, generación persistente, aprobación o ejecución en cuentas reales.
- Los workers son manuales durante desarrollo; la ausencia de un proceso 24/7 no
  se considera un incidente en esta etapa.
- El grafo visual fue retirado por baja utilidad y latencia; la memoria runtime,
  trazabilidad y evidencia determinística son las capas vigentes.
- Azure/GCP, distribución de costos compartidos, chargeback financiero y canales
  adicionales son evolución futura, no defectos de la beta actual.

## Regla de actualización

Cada cambio debe mover el estado de un ítem a `ABIERTO`, `BLOQUEADO`, `DIFERIDO`
o `CERRADO`, agregar evidencia verificable y actualizar simultáneamente el corte
vigente de `docs/ESTADO_ACTUAL_FINOPS.md` y la bitácora
`PROGRESO_ROADMAP_FINOPS.md`.
