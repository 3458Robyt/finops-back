# Deuda técnica y faltantes — FinOps Inteligente

> Registro único de hallazgos. Durante desarrollo se prioriza funcionalidad; los ítems de producción se corrigen antes del despliegue público.

| ID | Prioridad | Tipo | Estado | Hallazgo | Criterio de cierre | Momento objetivo |
|---|---|---|---|---|---|---|
| SEC-001 | Alta | Producción | En progreso 2026-07-28 | RLS runtime, rol dedicado y trigger de consistencia aplicados en Supabase principal; falta activar el enforcement como configuración operativa y cerrar la revisión de referencias | Acceso externo bloqueado, `DB_RUNTIME_ENFORCE=true` validado mediante canary, referencias tenant compuestas revisadas y pruebas cross-tenant aprobadas | Antes de despliegue público |
| OPS-001 | Media | Operación | Aceptado en desarrollo | Backend y workers se ejecutan manualmente | Worker desplegado con healthcheck y alerta de atraso | Fase de despliegue |
| ING-001 | Media | Datos | Registrado | Jobs históricos pendientes o fallidos por configuración de prueba | Configuración validada y jobs históricos cerrados | Antes de onboarding de cliente |
| DEP-001 | Media | Dependencias | Registrado | Alertas moderadas transitivas de OCI SDK y Prisma | Actualización o reducción controlada sin regresiones | Hardening productivo |
| DOC-001 | Baja | Documentación | Cerrado 2026-07-16 | Documentos antiguos contenían estados superados | `ONBOARDING_CLOUD.md` es autoritativo y los contextos antiguos están marcados como históricos | Cerrado |
| QA-001 | Baja | Entorno de desarrollo | Cerrado 2026-07-16 | Docker no está disponible localmente | Integración PostgreSQL y Playwright completo aprobados contra schema Supabase efímero, posteriormente eliminado | Cerrado |
| AI-001 | Baja | Validación de proveedor | Registrado | El canary de IA real es opcional y no debe ejecutarse contra datos productivos sin fixtures controlados | Ejecutar `AI_LIVE_TESTS=true npm run test:ai:live` con fixtures aislados y revisar latencia, tokens, auditoría y snapshot | Antes de activar IA real compartida |
| OPS-002 | Baja | Operación | Aceptado en desarrollo | La evaluación de presupuestos es manual mientras backend/workers se ejecutan bajo demanda | Conectar `POST /api/v1/budgets/evaluate` al worker o scheduler desplegado y monitorear ejecuciones | Antes de alertas operativas permanentes |
| FIN-001 | Baja | Alcance FinOps | Diferido | La asignación usa primera coincidencia completa; no distribuye costos compartidos ni genera chargeback contable | Diseñar reglas porcentuales, conciliación y aprobación financiera separadas | Después de validar showback con usuarios |
| AWS-001 | Alta | Validación cloud | Bloqueado externo | No hay cuenta/rol AWS real disponible; STS, EC2, CloudWatch, Cost Explorer y S3 solo están validados con fixtures | Ejecutar canary read-only con rol de mínimo privilegio y benchmark documentado | Antes de onboarding AWS productivo |
| OCI-001 | Media | Permisos cloud | Registrado | OCI Usage API devuelve `DENIED`; identidad, Compute, Monitoring y FOCUS sí funcionan | Conceder policy read-only de Usage API o aceptar FOCUS como única fuente de costos | Antes de requerir redundancia de costos OCI |
| PERF-001 | Media | Rendimiento | Registrado | Importar `oci-sdk` añade aproximadamente 35–42 s al arranque de procesos one-shot aunque las llamadas reales tarden 3–5 s | Carga diferida o worker persistente con benchmark antes/después | Antes de escalar workers efímeros |
| VAL-001 | Media | Rendimiento/validación | Registrado | El Centro de Realización de Valor tiene agregaciones SQL, pero falta medirlas con 10.000 recomendaciones y 20.000 mediciones en PostgreSQL aislado | Capturar `EXPLAIN (ANALYZE, BUFFERS)` y benchmark de resumen, página y exportación; ajustar índices solo con evidencia | Antes de activar conciliación automática compartida |
| QA-002 | Media | Validación UI | Bloqueado externo | No se conoce la contraseña del admin maestro para ejecutar el smoke autenticado completo en navegador | Proveer una cuenta de prueba autorizada o rotar la contraseña con aprobación explícita | Antes de aceptación manual del onboarding |

## Regla de mantenimiento

- Cada bug o faltante encontrado se registra aquí antes de posponerlo.
- Un ítem solo pasa a `Cerrado` con evidencia de prueba, CI o verificación manual documentada.
- Los ítems aceptados en desarrollo no deben presentarse como incidentes mientras la aplicación se ejecute manualmente.

## Cierre de inteligencia por recurso — 2026-07-11

La etapa no deja deuda funcional adicional: el aislamiento, la evidencia y el flujo E2E se validan en CI. Los ítems de esta tabla permanecen abiertos porque corresponden a producción, datos reales o documentación histórica, no a la rebanada funcional cerrada.

## Pipeline gobernado post-ingesta — 2026-07-23

La fase no agrega deuda funcional conocida: cola, recuperación, permisos, aislamiento, evidencia,
auditoría, persistencia y UI quedaron cubiertos por pruebas locales reproducibles. Continúan
vigentes `AI-001` para un canary controlado del proveedor real, `AWS-001` por ausencia de cuenta AWS
y `SEC-001` para activar el enforcement en runtime. La validación del 2026-07-28 cubre los 36
modelos con `tenantId` en schema aislado y Supabase principal, workers con contexto explícito,
trigger de consistencia y pruebas cross-tenant; el cierre productivo exige canary, revisión de
referencias compuestas y benchmark.

## Beta integrada y segura — 2026-07-28

- `TenantAwarePool` aplica el contexto de tenant, usuario, rol, request y worker sin imprimir
  secretos y con configuración SQL agrupada para evitar una ronda por variable.
- Los workers reclaman en modo operador controlado y procesan únicamente después de cambiar al
  tenant de la fila; las colas no quedan bloqueadas por RLS.
- La evidencia ejecutable es `npm run typecheck`, `npm run test:unit`, la prueba de integración
  `src/testing/tenantContext.integration.test.ts` y `finops-app` `npm run test:e2e:full` con
  `DB_RUNTIME_ENFORCE=true`. Las migraciones principales ya están aplicadas; queda la activación
  operativa y su rollback documentado.
