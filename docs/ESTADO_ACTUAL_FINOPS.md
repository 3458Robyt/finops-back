# Estado Actual FinOps Inteligente

Fecha: 2026-08-03

## Resumen

La plataforma ya tiene backend Node.js/TypeScript, frontend React, Supabase/PostgreSQL como base principal, autenticacion JWT, analitica de costos/consumo, recomendaciones IA con auditor, planes de ejecucion, aprendizaje por aprobacion/rechazo, trazabilidad, Telegram MVP, ingesta FOCUS/metricas para OCI y visualizacion de metricas tecnicas.

## Ingesta e inventario cloud

- OCI FOCUS real esta conectado hasta `focus_cost_line_items` y `cost_metrics`.
- OCI Monitoring ya alimenta `resource_metric_samples`.
- AWS tiene base SDK para EC2, CloudWatch y Data Exports, pendiente de credencial/rol real para validacion productiva.
- `cloud_resources` se pobla desde inventario declarativo (`ociInventoryResources` / `awsInventoryResources`) y desde definiciones/muestras de metricas cuando aun no hay inventario completo.
- Las muestras tecnicas nuevas se enlazan a `cloudResourceId` y se reconcilian muestras anteriores por conexion/recurso.
- Costos, muestras y recomendaciones tienen `cloudResourceId`/`resourceLinkReason`; el enlace canónico exige `cloudConnectionId + externalResourceId` exactos, sin fuzzy matching.
- La ingesta persiste el orden inventario → costos/métricas, el resumen de linkage en cada job y el endpoint `/api/v1/ingestion/resource-linkage` muestra cobertura por tabla y por recurso en `Ingesta`.
- El backfill idempotente `npm run db:reconcile:resource-links` ya se aplicó en Supabase. En la cuenta OCI actual: 36 costos enlazados, 9.124 sin enlace por inventario/conexión y 19.367/19.367 muestras técnicas enlazadas. Los costos sin inventario no se presentan como evidencia técnica.
- Las corridas de análisis por recurso también persisten `cloudResourceId` (`202608030004_analysis_run_canonical_resource`), por lo que el alcance durable no depende solo de `externalResourceId`.

## IA y recomendaciones

- El agente genera recomendaciones y planes en espanol usando una API OpenAI-compatible configurable.
- El auditor IA valida coherencia, realismo, idioma, no invencion de recursos y prohibicion de ejecucion automatica.
- Las recomendaciones con evidencia `COST_USAGE_AND_TECHNICAL` ahora requieren evidencia tecnica fuerte: referencias, recurso enlazado, cobertura/muestras suficientes y muestra reciente.
- La evidencia técnica se construye como un snapshot canónico hasheado: costo/consumo FOCUS, métricas agregadas en PostgreSQL, percentiles, cobertura, frescura, vínculo costo-recurso, reglas determinísticas y referencias exactas. El mismo snapshot llega al prompt, auditor, compuerta determinística, persistencia y detalle de la recomendación.
- Las recomendaciones aisladas por recurso también consumen aprendizaje auditado relevante del tenant, sin ampliar los hechos técnicos fuera del recurso solicitado.
- Si la evidencia tecnica es debil, la recomendacion debe marcar validacion tecnica pendiente.
- Existen golden scenarios offline para medir regresiones sin llamar al LLM.
- El análisis solicitado desde el detalle 360 se aísla por `externalResourceId`: costo, métricas, prompt, auditoría y rúbrica se limitan al recurso exacto. Las oportunidades relacionadas usan el mismo identificador exacto dentro del tenant.
- El detalle 360 comunica el nivel de evidencia y los bloqueos de las reglas técnicas; una evidencia limitada solo habilita recomendaciones de validación técnica.
- Las oportunidades persistidas tienen deduplicación por tenant, cuenta, recurso/candidato, tipo y período factual. Un plan rechazado por el auditor no se guarda ni se muestra como plan reutilizable.
- El ciclo humano diferencia aprobación de ejecución: técnico FinOps/administradores registran ejecución manual y el aprobador del cliente puede decidir sobre un plan auditado. La decisión crea un evento durable de aprendizaje sin bloquear la respuesta HTTP.

## Presupuestos FinOps

- Existe un módulo de presupuestos mensuales persistentes por tenant, cuenta cloud o servicio.
- Cada presupuesto compara únicamente costos y forecasts de su misma moneda; si no hay forecast persistido se declara no disponible.
- La evaluación manual de umbrales 80/90/100 crea eventos idempotentes, notificaciones in-app y registros outbound pendientes, sin exigir un scheduler durante desarrollo.
- El dashboard ya no calcula un presupuesto inventado; muestra únicamente el presupuesto tenant real cuando existe.

## Seguridad y produccion

Implementado:

- `helmet` para cabeceras HTTP.
- CORS configurable con multiples origenes.
- Rate limit global para `/api/v1`.
- Rate limit especifico para login, Telegram e IA.
- Logging estructurado por request con `x-request-id`.
- Validacion runtime estricta en produccion para secretos/configuracion critica.

Estado de cierre:

- Las migraciones de hardening de funciones e índices FK ya están aplicadas en Supabase principal.
  La seguridad Advisor quedó sin hallazgos. El canary runtime con `DB_RUNTIME_ENFORCE=true` y
  `DB_RUNTIME_ROLE=finops_runtime` pasó contra Supabase principal, con aislamiento cross-tenant y
  contexto de workers; la activación permanente queda diferida hasta disponer de un entorno desplegado.
- Gestion externa y rotacion formal de secretos.
- Observabilidad centralizada.
- Benchmark con `EXPLAIN (ANALYZE, BUFFERS)` y volumen productivo representativo.

## Rendimiento y pruebas recientes

- Las series de métricas técnicas usan agregación SQL, cursor y carga progresiva; la UI conserva el raw
  bajo demanda y renderiza la serie principal con uPlot.
- Los reportes FOCUS de OCI/AWS se procesan por batches asíncronos para evitar cargar el CSV completo en
  memoria; la persistencia mantiene inserción idempotente por hash.
- Backend: `npm run typecheck`, `npm run test:unit` (57 archivos aprobados, 245 pruebas pasadas y 6 omitidas),
  `npm run test:ai:offline` (17/17), build y `npm audit --omit=dev` sin vulnerabilidades.
- Frontend: lint y build aprobados; el CI de la beta ejecutó el smoke E2E con éxito.
- Canary IA real aislado: chat en español, generación, auditor, snapshot canónico, rúbrica determinística,
  ahorros no negativos, trazabilidad y `persist=false` aprobados con el modelo `gpt-5.4-mini`.
  Latencia de generación: 54.662 s; estimación de contexto/trazas: 4.093 tokens; recomendaciones: 3.
- Canary OCI read-only de onboarding: identidad, inventario, métricas y Object Storage disponibles;
  1 recurso Compute leído en una llamada, preview FOCUS sin errores (20 objetos descubiertos, 5 retornados);
  la capacidad de costos directa quedó denegada y el resultado fue `PARTIAL`, consistente con el bloqueo
  documentado de OCI Usage API.
- Integración de trazabilidad en PostgreSQL aislado: 5/5 pruebas; readiness con 10.000 costos y 20.000
  muestras técnicas tuvo mediana de 186,46 ms en cinco lecturas.
- Canary principal: la prueba `tenantContext.integration.test.ts` pasó con enforcement runtime contra
  Supabase `public`; el plan de métricas usa el índice `(tenant_id, sampled_at)` y la línea base
  observada fue 52.029 ms raw y 7.692 ms agregada para 660 filas/grupos.
- CI ejecuta integración aislada PostgreSQL/API en GitHub Actions. Docker local sigue siendo opcional para
  desarrollo; Supabase se valida mediante migraciones Prisma antes de cambios de esquema.

## Pendientes principales

- Asignación de costos: reglas persistentes por tenant y showback determinístico ya están disponibles; la distribución porcentual de costos compartidos y el chargeback contable siguen fuera de alcance.
- Validar inventario SDK OCI Compute y AWS EC2 con cuentas reales, benchmark y cobertura por tenant.
- Completar la cobertura histórica de costos OCI: requiere que el inventario real exponga los mismos identificadores de recurso; los registros sin coincidencia quedan visibles con razón, no se enlazan por nombre.
- AWS productivo con rol real y bucket/prefix FOCUS.
- Mantener un canary periódico de IA real con fixtures controlados; no persistir datos de prueba en tenants normales.
- Activar permanentemente el enforcement runtime RLS solo al desplegar, usando el procedimiento de
  `docs/RUNTIME_RLS_CANARY.md` y su rollback.
- Limpieza de documentos antiguos que aun describen estados superados.

## Operación durante desarrollo

- Backend, frontend y workers se ejecutan manualmente cuando se desarrolla o prueba una funcionalidad.
- La falta de ingesta diaria mientras la aplicación está apagada es una decisión temporal de desarrollo,
  no un incidente operativo. El trabajo permanente queda registrado en `docs/DEUDA_TECNICA.md`.

## Validación de inteligencia por recurso

- La CI ejecuta el flujo Playwright completo contra fixtures de PostgreSQL y la API local del job de integración.
- El flujo cubre login, cambio de tenant, inventario, detalle 360, evidencia, oportunidades relacionadas, plan auditado de fixture, decisión, timeline y ejecución manual sin depender de proveedores cloud ni de un LLM real.
- El 2026-08-03 el canary runtime RLS pasó contra Supabase principal: usuario `finops_runtime`, dos tenants,
  consultas tenant-scoped, conteo cross-tenant cero, contexto de worker y tablas operativas verificadas.
  La activación operativa permanente permanece diferida por no existir todavía un destino de despliegue.
