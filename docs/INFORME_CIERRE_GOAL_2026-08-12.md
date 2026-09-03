# Informe de cierre técnico del Goal — FinOps Inteligente

> **Documento histórico.** Este informe corresponde al corte 2026-08-13. No
> sustituye el estado vigente de 2026-08-28; úsese únicamente como evidencia de
> aquella entrega. Las fuentes actuales son `docs/ESTADO_ACTUAL_FINOPS.md`,
> `docs/ROADMAP_PRODUCTO.md`, `docs/DEUDA_TECNICA.md` y
> `PROGRESO_ROADMAP_FINOPS.md`.

**Corte:** 2026-08-13
**Alcance:** `finops-backend` y `finops-app` únicamente  
**Estado:** beta consolidada para desarrollo; publicación y operación productiva aún no activadas

## 1. Alcance y criterio de lectura

Este informe audita el Goal de endurecimiento estructural y evolución productiva contra el estado real del código,
las pruebas y la deuda técnica vigente. No convierte bloqueos externos en funcionalidades simuladas:

- AWS permanece en `STANDBY` hasta disponer de una cuenta y un rol reales.
- OCI Usage API permanece bloqueada hasta aplicar la policy IAM requerida; FOCUS continúa como fuente primaria.
- SMTP y Telegram no se declaran validados sin credenciales/proveedores de prueba autorizados.
- La operación 24/7, el secret manager externo, el rate limiting distribuido y el benchmark de despliegue quedan
  diferidos hasta existir un destino operativo representativo.

Las fuentes autoritativas son `docs/ESTADO_ACTUAL_FINOPS.md`, `docs/ROADMAP_PRODUCTO.md`,
`docs/DEUDA_TECNICA.md` y `PROGRESO_ROADMAP_FINOPS.md`.

## 2. Evidencia reproducida

### Backend

- Rama: `feat/shared-cost-allocation`.
- Contra las referencias `origin` locales, el backend está 201 commits por delante de
  `origin/feat/shared-cost-allocation` y 235 por delante de `origin/main`; el frontend está 38 y 48 commits por
  delante, respectivamente. Estos commits son acumulación local de la beta y no implican que deban publicarse sin
  revisión.
- El corte mantiene cambios locales no comprometidos de aprendizaje global, canary, smoke aislado, CI y documentación
  para revisión antes de publicar.
- `npm run test:all`: 109 archivos aprobados, 5 omitidos, 451 pruebas pasadas y 11 omitidas.
- `npm run test:ai:offline`: 25/25 escenarios.
- `npm run check:architecture`: 359 archivos de producción, una excepción declarada para el fixture
  `goldenScenarios.ts`.
- Typecheck y build: aprobados.
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilidades.
- `npm run check:release-hygiene`: 619 rutas rastreadas sin secretos ni artefactos prohibidos.
- `npm run test:integration:auth-cleanup`: integración aislada aprobada; migraciones desde cero, RLS de mantenimiento,
  borrado bounded, bloqueo de sesiones contra carreras de refresh, preservación de refresh vigente con TTL inconsistente
  y limpieza del schema en `finally`.
- `npm run test:integration:process-heartbeat`: integración aislada aprobada; migración desde cero, escritura del
  propietario, aislamiento RLS entre procesos y transición durable a `STOPPED`.
- `npm run test:integration:isolated`: aplicó las 64 migraciones locales en un schema efímero, verificó que los
  helpers FinOps no tengan grants API, pasó 10 archivos/17
  pruebas PostgreSQL y los runners de auth cleanup y heartbeat/readiness. La primera corrida expuso una omisión
  de la rama DELETE del worker auth en la policy portable; `202608120007` la corrigió. La verificación posterior
  detectó grants explícitos en `finops_login_tenant_id()` y un guard con `PUBLIC`; `202608120008` corrigió ambos
  casos y la corrida final pasó.
  La inspección final confirmó cero schemas `finops_e2e_*` residuales. Durante la revalidación se corrigió además una
  selección no determinista del usuario en el fixture de retry cross-tenant: ahora se exige explícitamente `MASTER_ADMIN`.
- `npm run test:api:smoke:isolated`: pasó el smoke autenticado general y el de onboarding en un schema independiente:
  35 checks HTTP generales, 13 mutaciones administrativas rechazadas para `VIEWER`, cambio de tenant, aislamiento
  cross-tenant, lecturas de operación y redacción de material sensible. El backend se inició con RLS runtime
  obligatorio y el schema/fixture se eliminaron en `finally`.
- Revalidación aislada adicional: `test:integration:agent-quality`, `test:integration:resource-lineage` (5/5) y
  `test:integration:cost-allocation` (3/3) pasaron. Los runners quedaron acotados por timeout y cleanup.

### Frontend

- Rama: `feat/shared-cost-allocation`.
- El frontend no recibió cambios funcionales en esta iteración y conserva el estado verificado de su rama; su worktree
  está limpio.
- Arquitectura: 97 archivos de producción, 0 excepciones.
- Typecheck, ESLint y build: aprobados.
- Bundle: 23 chunks JavaScript; el mayor es `226.18 kB`, dentro del límite de `500 kB`.
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilidades.
- `npm run check:release-hygiene`: 135 rutas rastreadas sin secretos ni artefactos prohibidos.
- `npm run test:e2e:full`: 7/7 escenarios Playwright aprobados después de esperar explícitamente la rotación de sesión
  al cambiar de tenant; la corrida final aplicó las 64 migraciones locales en un schema aislado y eliminó fixtures y schema al finalizar.
  La prueba `e2e/auth-lifecycle.spec.ts` cubre login, refresh rotativo, reuse detection, cambio de tenant,
  revocación individual/global, logout y privacidad de recuperación de contraseña contra la API real.

### Higiene del repositorio

- Los únicos archivos relacionados con `.env` rastreados son `.env.example`.
- No se encontraron en Git rutas rastreadas de claves PEM/KEY, bases SQLite, reportes Playwright ni resultados E2E.
- Graphify fue actualizado en el backend después de los cambios de código; el frontend conserva su grafo verificado
  de la iteración anterior y no recibió cambios funcionales.
- El workflow backend ejecuta ahora `check:release-hygiene` y limpia los fixtures de smoke en un paso `always()`;
  la integración CI usa el PostgreSQL efímero de Docker, no la base principal.
- Los Dockerfiles, healthchecks, usuarios no root, `.dockerignore` y Compose están presentes en backend/frontend;
  la estación actual no tiene Docker CLI, por lo que el build local de imágenes queda sin ejecutar y debe validarse
  en CI o en el destino de despliegue. El workflow ahora incluye builds de ambas imágenes como compuertas de CI.

## 3. Auditoría requisito por requisito

| Área del Goal | Estado actual | Evidencia | Pendiente real |
|---|---|---|---|
| Gobernanza de entrega | Parcial local | Ramas limpias, commits convencionales, documentación y Graphify actualizados | Publicar ramas y abrir PR coordinados cuando exista autorización de release y CI remoto verde |
| Seguridad e identidad | Cerrado para beta | Sesiones persistidas y revocables, logout, refresh rotation, recuperación, MFA, autorización central, RLS, sanitización, Helmet, CORS y rate limits | Activación permanente de runtime RLS, rotación formal y observabilidad externa dependen del despliegue |
| Modularidad | Cerrado para hotspots críticos | `MOD-001` cerrado; fitness backend 359/1 excepción y frontend 97/0; composición, IA, ingesta, métricas, repositorios y mensajería separados | Extracciones oportunistas de módulos cohesivos de 200–400 líneas no bloquean la beta |
| Inventario y linaje OCI | Cerrado dentro de la cobertura disponible | Inventario OCI/Resource Search, identidades históricas exactas, backfill idempotente, cruces canónicos y sin fuzzy matching; 8.173/8.173 costos elegibles enlazados en la cuenta validada | OCI Usage API requiere policy; AWS requiere cuenta/rol reales |
| Operación e infraestructura | Base implementada | Roles `api`/`worker`/`scheduler`/`all`, contenedores, health/readiness detallado, migración esperada, advisory lease, heartbeat durable por proceso, graceful shutdown, logs y métricas | OPS-001/002/003/006: destino 24/7, scheduler permanente, secret manager, alertas centralizadas y rehearsal formal de backup/restore |
| IA y auditoría | Cerrado para generación gobernada; promoción global en shadow y fail-closed | Evidencia determinística antes del LLM, auditoría independiente, salida segura, planes persistidos, aprendizaje local auditable, candidatos globales inactivos, trazas con IDs, `GlobalLearningPromotionService`, rollback y canary IA aislado | `AI-008`: el canary comparativo live produjo 3/3 recomendaciones aprobadas por brazo, pero candidate obtuvo 90 frente a 92 de baseline; repetir hasta demostrar mejora estricta sin degradación |
| FinOps avanzado | Cerrado en el alcance actual | Gobernanza de tags/readiness, catálogo de oportunidades, forecast por escenarios, presupuestos, asignación, valor realizado y resumen ejecutivo durable | Commitments/chargeback contable permanecen fuera de alcance hasta tener datos reales |
| Rendimiento y calidad | Cerrado localmente con una deuda de entorno | Métricas con SQL/uPlot/cursor, índices y benchmarks existentes; suite, builds y audits verdes | PERF-001 requiere entorno representativo para alcanzar objetivos de preview/cierre |
| Documentación | Cerrado como fuente vigente | README, estado, roadmap, progreso, deuda, testing y pipeline reconciliados con el corte actual | Conservar snapshots históricos sin usarlos como estado actual |

## 4. Deuda vigente

El registro autoritativo contiene **34 cerrados**, **2 abiertos**, **2 bloqueados** y **7 diferidos**:

- `MSG-001` — abierto: faltan canaries reales de SMTP/Telegram; la cola, leases, retries, estados y sanitización ya
  están implementados y los envíos externos siguen deshabilitados por defecto.
- `AI-008` — abierto: los patrones globales recurrentes se conservan en shadow y no contaminan el contexto; el
  mecanismo administrativo de promoción, la evidencia estricta y el rollback ya existen. El canary reconstruido del
  2026-08-13 produjo 3/3 recomendaciones aprobadas por brazo, pero candidate obtuvo 90 frente a 92 de baseline, por
  lo que la promoción fue bloqueada correctamente por no demostrar mejora estricta.
- `AWS-001` — bloqueado: falta cuenta y rol AWS reales.
- `OCI-001` — bloqueado: falta aplicar `Allow group <group_name> to read usage-report in tenancy`.
- `OPS-001`, `OPS-002`, `OPS-003` — diferidos por falta de destino productivo y gestión operacional externa.
- `SEC-002`, `SEC-003` — diferidos por escalamiento horizontal y vulnerabilidades dev-only sin fix disponible.
- `PERF-001` — diferido hasta medir en infraestructura representativa sin sacrificar trazabilidad.
- `OPS-004` — cerrado: heartbeat durable por proceso con RLS, shutdown ordenado e integración PostgreSQL aislada.
- `OPS-005` — cerrado: readiness con checks de migración, advisory lease, runtime RLS y heartbeat.
- `OPS-006` — diferido: rehearsal formal de backup/restore y RTO/RPO; el runbook ya está documentado.

## 5. Cambios de esta iteración

- `1fd5c57` — `fix(ops): fail closed on invalid process roles`: valores explícitamente inválidos de
  `APP_PROCESS_ROLE` ya no se convierten silenciosamente en `all`.
- `28aac3b` — `refactor(analytics): use canonical opportunities field`: frontend y recompute usan
  `opportunities`; `anomalies` queda como alias de compatibilidad.
- `6dbccd5` — `docs(roadmap): update validation counts`.
- `a0fabcb` — `docs(state): reconcile current validation evidence`.
- `1261735` — `docs(architecture): close critical modularity debt`.
- `1de6664` — `docs(analytics): clarify deprecated endpoint contract`: la ruta legacy conserva su payload
  histórico y `/opportunities` queda documentado como la forma canónica.
- La iteración actual añadió `202608120006_schema_portable_rls_helpers`, `202608120007_restore_auth_cleanup_refresh_delete_policy`, `202608120008_revoke_login_tenant_api_grants`, el servicio de promoción global con evidencia,
  regresiones de contexto/trazas y el canary comparativo sanitizado; ningún candidato GLOBAL fue activado.
- `e521af0` — `fix(messaging): bound provider request duration`: timeouts SMTP/Telegram configurables y
  regresiones sin llamadas reales a proveedores.
- `pending` — `test:canary:messaging` preparado con confirmación fuerte, destino explícito y sin acceso a la BD;
  su ejecución real sigue pendiente para `MSG-001`.
- `REL-001` — compuerta reproducible de higiene de release añadida a ambos repositorios y a sus validaciones locales.
- `AUTH-004` — limpieza bounded de artefactos de autenticación expirados, con RLS de mantenimiento indexado y prueba aislada.
- `OPS-004` — heartbeat durable por proceso, con migración Supabase aplicada, política RLS por worker y runner de
  integración aislado.
- `8bd14e9` — `feat(ops): add durable process heartbeats`: servicio, repositorio, runtime de background, migración,
  configuración y pruebas unitarias/integración.
- `33eee08` — `docs(roadmap): record operational heartbeat`: estado, deuda, operación y roadmap reconciliados con
  la evidencia del corte.
- `4882ff1` — `feat(ops): expose operational readiness checks`: readiness estructurado para usuario/rol de BD,
  migración esperada, lease advisory, heartbeat y configuración de IA; `/ready` responde según el estado real.
- `48525aa` — `docs(ops): document readiness and recovery`: runbook de backup/restore, rollback RLS y pérdida de
  jobs; la prueba formal de recuperación permanece diferida hasta contar con un destino productivo.
- `5f8ed44` — `feat(ops): isolate process responsibilities`: `APP_PROCESS_ROLE` resuelve capacidades granulares
  para cada worker y scheduler sin iniciar responsabilidades ajenas; los alias de beta se conservan.
- `e2160a7` — `feat(ops): instrument background loops`: los loops no solapables y el scheduler outbound exponen
  contadores y duración acotados por rol/proceso y resultado para detectar atascos sin cardinalidad peligrosa.
- `c07ac97` — integración opt-in de `budget-scheduler` con actor técnico, configuración tenant-scoped y alertas
  idempotentes sobre la cola outbound; la operación continua permanece diferida por falta de destino.
- `19bbdfc` y `fb26035` — runners de integración acotados con timeout, terminación del árbol de procesos,
  allowlist de schemas y prueba del guard de timeout; se evitó dejar procesos o schemas E2E residuales.
- `9ba1a1f` — reconciliación final de los conteos de pruebas y release hygiene con la evidencia vigente.
- `0b67035` — E2E frontend estabilizado: la prueba espera la finalización del cambio de tenant antes de
  continuar con el panel de análisis; la suite completa volvió a pasar 5/5.
- `46f2cc5` — el runner E2E elimina el manifiesto local con la contraseña temporal después del cleanup,
  con una guardia que impide borrar fuera de `finops-backend/.test-artifacts`.
- `18eb1f2` — se añadió `e2e/auth-lifecycle.spec.ts` y la suite completa quedó revalidada en 6/6, incluyendo
  la rotación y revocación de sesiones vía API.
- `852d8c4` — se añadió la regresión E2E de recuperación de contraseña para verificar respuesta indistinguible
  entre correos existentes y desconocidos; la suite actual quedó en 7/7.

No se hizo merge, push ni PR. No se modificó `main` directamente.

## 6. Conclusión

La beta tiene resueltos los riesgos críticos internos verificables con los recursos actuales. El Goal **no debe
declararse productivo al 100 %** mientras permanezcan sin ejecutar los canaries externos, el despliegue 24/7 y la
publicación mediante PR. Estos puntos están correctamente clasificados como abiertos, bloqueados o diferidos y no
se deben cerrar con mocks o afirmaciones aspiracionales.

## 7. Entregables estructurales y evidencia complementaria

- **Modularidad:** no quedan archivos de producción backend o frontend por encima de 400 líneas sin una
  justificación vigente; los fixtures declarativos y las pruebas grandes quedan excluidos del fitness check.
  Los hotspots actuales más grandes son cohesivos: `PrismaResourceMetricRepository.ts` (372 líneas),
  `PrismaResourceLinkageReadinessRepository.ts` (366), `AnalyticsController.ts` (363),
  `AwsSdkIngestionProvider.ts` (363), `applicationComposition.ts` (359) y `ResourceDetail.tsx` (347).
- **Migraciones:** el repositorio y Supabase principal mantienen 64 migraciones aplicadas, con head
  `202608120008_revoke_login_tenant_api_grants`; `npx prisma migrate status` reporta la base actualizada.
- **Rendimiento:** la última integración de asignación con 10.000 costos midió preview de 1.694,86 ms,
  cierre de 8.712,79 ms y plan SQL de 17,27 ms. La diferencia entre el plan y el tiempo total mantiene
  `PERF-001` diferido; no se declara cumplimiento del objetivo sin un entorno representativo.
- **Runners seguros:** las integraciones aisladas tienen timeout y terminación de árbol de procesos, y la
  verificación posterior no encontró schemas `finops_e2e_*` residuales.

## 8. Próxima secuencia recomendada

1. Repetir el canary comparativo `AI-008` con una corrida estable del proveedor IA; solo promover con evidencia de
   mejora estricta y conservar rollback/auditoría. No relajar el gate porque ambos brazos sean válidos.
2. Autorizar y ejecutar publicación mediante PR backend/frontend con CI remoto y revisión de migraciones.
3. Cuando existan credenciales de prueba, ejecutar canaries SMTP/Telegram y cerrar `MSG-001` si los proveedores
   responden y la cola conserva idempotencia, retries y sanitización.
4. Elegir destino de despliegue, activar `DB_RUNTIME_ENFORCE=true`, `finops_runtime`, scheduler y alertas 24/7;
   completar OPS-001/002/003 con runbooks y rollback.
5. Aplicar la policy de OCI Usage API y ejecutar el canary read-only sin duplicar FOCUS.
6. Incorporar una cuenta/rol AWS reales y validar STS, EC2, CloudWatch, Cost Explorer y FOCUS; no usar los mocks
   como evidencia productiva.
7. Repetir el benchmark de asignación en el destino elegido antes de establecer un SLA definitivo.
