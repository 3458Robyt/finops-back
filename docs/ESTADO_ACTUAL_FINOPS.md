# Estado Actual FinOps Inteligente

Fecha: 2026-08-12

## Resumen

La plataforma ya tiene backend Node.js/TypeScript, frontend React, Supabase/PostgreSQL como base principal, autenticacion JWT, analitica de costos/consumo, recomendaciones IA con auditor, planes de ejecucion, aprendizaje por aprobacion/rechazo, trazabilidad, Telegram MVP, ingesta FOCUS/metricas para OCI y visualizacion de metricas tecnicas.

## Corte vigente 2026-08-12

- La analítica ahora expone escenarios de pronóstico comparables (base, tendencia, aprobado, ejecutado y verificado) y el dashboard los presenta sin convertir una proyección en ahorro realizado.
- El resumen ejecutivo FinOps se genera con evidencia tenant-scoped y se encola como entrega durable `PENDING` para correo/Telegram; el procesador existente conserva leases, reintentos y deduplicación diaria.
- Las memorias activas del agente pueden desactivarse de forma reversible mediante `PATCH /api/v1/ai/learning/memories/:memoryId/deactivate`; la operación exige autorización, respeta el alcance tenant/global y deja auditoría.
- La trazabilidad incluye un catálogo determinista de oportunidades de calidad de datos antes de la IA. Usa reglas versionadas sobre vínculos, frescura, evidencia técnica y etiquetas; no inventa ahorros ni autoriza acciones cloud.
- El módulo Agente IA expone `/api/v1/agent/quality`, un reporte tenant-scoped de calibración que separa tasa de revisión, aprobación/rechazo humano, abstenciones por evidencia débil, ahorro estimado frente a ahorro verificado, desglose por tipo/regla/proveedor y latencia/tokens del LLM. La aprobación se declara como proxy de calidad, no como precisión ML absoluta; el coste de tokens solo se estima si se configuran precios explícitos por millón de tokens.
- La migración `202608110012_executive_summary_delivery` está aplicada en Supabase. La migración 009 se regularizó con `migrate resolve` porque el enum de la cola ya existía; después se aplicaron 010, 011 y 012 sin borrar datos. Prisma reporta la base actualizada.
- Validación posterior: backend `npm run test:unit` con 94 archivos aprobados, 4 omitidos, 364 pruebas pasadas y 10 omitidas; IA offline 24/24; arquitectura, typecheck y build aprobados. La integración PostgreSQL desde migraciones cero pasó 5 archivos y 6 pruebas en un schema aislado de Supabase, que fue eliminado al finalizar. Frontend typecheck, lint, build, smoke E2E y presupuesto de bundle aprobados. El E2E completo de frontend requiere el entorno de aplicación aislado.
- La lógica de calibración tiene pruebas unitarias determinísticas y una integración aislada aprobada (`npm run test:integration:agent-quality`, 1/1) para comprobar consultas reales y aislamiento entre tenants con dos fixtures separados. El reporte lee recomendaciones y trazas con paginación keyset de 1.000 filas por consulta, agregando en el servicio sin cargar una respuesta histórica ilimitada; las cifras de producción aparecerán cuando existan decisiones y mediciones verificadas en la ventana solicitada.
- La analítica expone `/api/v1/analytics/opportunities` como ruta canónica. `/api/v1/analytics/anomalies` se conserva
  solo como alias histórico deprecado y mantiene su payload legado para no romper clientes antiguos; las vistas y
  mensajes visibles usan exclusivamente “oportunidades”.
- La migración `202608120001_quality_report_keyset_indexes` está aplicada en Supabase. `npm run db:verify:quality-indexes` confirma los índices compuestos de recomendaciones y trazas y obtiene planes `Index Only Scan Backward` para el filtro tenant/fecha y la paginación keyset.
- La configuración del proveedor IA ya no acepta fallbacks `NVIDIA_*`/`NIM_*`; únicamente se leen variables `AI_*`, evitando activar silenciosamente endpoints o credenciales heredadas.
- La auditoría de aprendizaje usa por defecto un timeout de 15 segundos y producción rechaza valores fuera de 5–60 segundos; un proveedor lento no debe bloquear la decisión humana.

La superficie de amenazas de la beta está documentada en `docs/MODELO_AMENAZAS_STRIDE.md`, complementando las
matrices de autenticación y autorización. Los riesgos externos (DAST, despliegue público, AWS real y OCI Usage API)
siguen explicitamente diferenciados de los controles ya verificados.

## Cierre incremental 2026-08-11

- Las sesiones autenticadas ahora tienen ciclo de vida persistido: logout, revocación individual/global y
  cambio de tenant invalidan el acceso sin esperar a que expire el JWT. El frontend separa el transporte de
  autenticación y no guarda tokens en `localStorage` ni `sessionStorage`.
- El límite HTTP en memoria está acotado, el trust proxy es explícito y el servidor configura timeouts de
  request, headers y keep-alive. El store distribuido sigue diferido hasta desplegar varias instancias.
- Los logs operativos ahora son estructurados y sanitizados mediante `safeErrorMessage`; se eliminan de los
  eventos URLs con credenciales, API keys, JWT, claves AWS y PEM. Esto no sustituye un agregador/secret manager
  de producción.
- El scheduler rechaza validaciones de capacidades expiradas (por defecto 24 h), y la ingesta OCI reporta
  explícitamente la cobertura de descubrimiento recursivo de compartimentos y recursos.
- La gobernanza IA incorporó tres controles determinísticos: utilización técnica solo para métricas de porcentaje,
  alcance exacto del plan contra el recurso objetivo y techo de ahorro calculado desde la evidencia antes del LLM.
- Los prompts delimitan el contexto externo como dato no confiable para impedir instrucciones incrustadas, y la
  salida de chat, oportunidades y planes pasa por un guardia determinístico que rechaza credenciales, PEM, JWT,
  API keys, URLs autenticadas y asignaciones de secretos antes de trazar o persistir la respuesta.
- El frontend mantiene la sesión autenticada en `AuthSessionProvider`; las vistas y controladores consumen el
  access token mediante `useAccessToken` en lugar de propagarlo desde `App.tsx`. El transporte de API sigue
  recibiendo el token explícitamente para conservar pruebas y contratos aislados.
- Verificación histórica: backend `test:unit` con 89 archivos, 351 pruebas pasadas y 9 omitidas; escenarios IA
  offline 24/24; typecheck, build y audit de producción aprobados. Frontend typecheck, lint, build y audit de
  producción también pasan. El chunk principal frontend es de aproximadamente 226 kB y el presupuesto de 500 kB
  queda protegido por `check:bundle`. AWS real y OCI Usage API continúan bloqueados externamente.
- La modularización estructural más reciente mantiene contratos públicos y redujo tres hotspots del backend:
  `PrismaValueRealizationRepository` quedó en 47 líneas con portfolio y atribución separados;
  `RecommendationAnalysisService` quedó en 104 líneas con el procesador de corridas/auditoría separado; y
  `PrismaCostAllocationRepository` quedó en 258 líneas con el motor determinístico aislado. Además, los puertos
  de recomendaciones y conexiones cloud componen capacidades cohesivas sin superar 400 líneas. El fitness check
  backend pasa con 340 archivos de producción y 1 excepción justificada (`goldenScenarios.ts`); frontend pasa sin excepciones.

## Ingesta e inventario cloud

- OCI FOCUS real esta conectado hasta `focus_cost_line_items` y `cost_metrics`.
- OCI Monitoring ya alimenta `resource_metric_samples`.
- AWS tiene base SDK para EC2, CloudWatch y Data Exports, pendiente de credencial/rol real para validacion productiva.
- `cloud_resources` se pobla desde inventario declarativo, OCI Compute, OCI Resource Search y definiciones/muestras de métricas cuando aún no hay inventario completo. Resource Search pagina únicamente tipos OCI observados y soportados (`instance`, `bootvolume`, `bootvolumebackup`, `vnic`) y respeta los compartimentos accesibles e incluidos/excluidos por configuración.
- Las muestras tecnicas nuevas se enlazan a `cloudResourceId` y se reconcilian muestras anteriores por conexion/recurso.
- Costos, muestras y recomendaciones tienen `cloudResourceId`/`resourceLinkReason`; el enlace canónico exige `cloudConnectionId + externalResourceId` exactos, sin fuzzy matching.
- La ingesta persiste el orden inventario → costos/métricas, el resumen de linkage en cada job y el endpoint `/api/v1/ingestion/resource-linkage` muestra cobertura por tabla y por recurso en `Ingesta`.
- El backfill exacto e idempotente de referencias OCI históricas se aplicó en Supabase: creó 11 identidades derivadas de OCID (4 boot volumes, 2 backups, 2 instancias y 3 VNIC) sin sobrescribir inventario vivo. En la cuenta OCI actual quedaron 8.173/8.173 costos elegibles enlazados (100 %): 36 a recursos vivos y 8.137 a referencias históricas; 555 identificadores de telemetría no soportados y 432 registros sin conexión se conservan como costos financieros, pero quedan fuera del denominador técnico. Las 19.367/19.367 muestras técnicas continúan enlazadas.
- La UI de Ingesta distingue recursos vivos, referencias históricas, costos de servicio/cuenta, falta de conexión, identificadores no soportados, recursos válidos pendientes y ambigüedades. Una referencia histórica exacta no se presenta como recurso actualmente activo.
- El job controlado de inventario OCI más reciente terminó correctamente en 3,4 s: 2 llamadas SDK,
  1 recurso descubierto y 1 recurso persistido. El scheduler ahora encola INVENTORY antes de costos/métricas,
  exige validación de capacidades vigente y respeta un cooldown configurable de 24 h.
- El adaptador OCI separa contratos SDK, validación, Monitoring, descubrimiento de compartimentos, inventario,
  fuentes FOCUS y retries en módulos cohesivos de hasta 219 líneas. El coordinador principal bajó de 1.140 a
  393 líneas sin cambiar el contrato; las pruebas OCI dirigidas pasan 22/22.
- La gestión de conexiones cloud también está separada: la fachada pública conserva el contrato de la API,
  mientras onboarding/configuración, orquestación de jobs, contratos y validación de entradas viven en módulos
  independientes de máximo 400 líneas; la configuración de fuentes ahora persiste mediante
  `PrismaCloudConnectionConfigurationRepository` (110 líneas), y los 23 escenarios de caracterización continúan aprobados.
- En el frontend, el detalle de corridas de análisis y el estado de Agente IA están separados de sus vistas:
  `RecommendationAnalysisRunsPanel.tsx` tiene 257 líneas y `AgentSettings.tsx` 149; el fitness check frontend
  no conserva excepciones. El smoke Playwright del shell de login pasa 1/1 sin requerir API ni base de datos.
- La analítica técnica separa consulta, contratos, overview, cobertura y utilidades matemáticas; el servicio
  coordinador quedó en 202 líneas y conserva los 12 escenarios de series, cobertura, recursos duplicados y raw.
- La persistencia de ingesta mantiene una fachada estable y ahora delega la normalización de recursos derivados de
  métricas a `ingestionResourceNormalizer.ts`; inventario del proveedor conserva precedencia sobre recursos
  inferidos, y la regla está cubierta por pruebas unitarias de caracterización.
- La preparación de lineage expone gobierno determinista de etiquetas. En la cuenta OCI actual hay 1 recurso,
  pero 0 % de cobertura de las claves requeridas (`environment`, `owner`, `application`, `cost_center`);
  la interfaz lo muestra como incumplimiento, no como dato faltante silencioso.
- Las corridas de análisis por recurso también persisten `cloudResourceId` (`202608030004_analysis_run_canonical_resource`), por lo que el alcance durable no depende solo de `externalResourceId`.

## IA y recomendaciones

- El agente genera recomendaciones y planes en espanol usando una API OpenAI-compatible configurable.
- El auditor IA valida coherencia, realismo, idioma, no invencion de recursos y prohibicion de ejecucion automatica.
- Las recomendaciones con evidencia `COST_USAGE_AND_TECHNICAL` ahora requieren evidencia tecnica fuerte: referencias, recurso enlazado, cobertura/muestras suficientes y muestra reciente.
- La evidencia técnica se construye como un snapshot canónico hasheado: costo/consumo FOCUS, métricas agregadas en PostgreSQL, percentiles, cobertura, frescura, vínculo costo-recurso, reglas determinísticas y referencias exactas. El mismo snapshot llega al prompt, auditor, compuerta determinística, persistencia y detalle de la recomendación.
- Las recomendaciones aisladas por recurso también consumen aprendizaje auditado relevante del tenant, sin ampliar los hechos técnicos fuera del recurso solicitado.
- Las reglas técnicas determinísticas están versionadas (`technical-rules-2026-08-11.v1`) y cada evaluación conserva
  los umbrales críticos aplicados junto con la evidencia. Además de CPU y memoria, clasifican señales de baja o alta
  utilización en red, disco e IOPS cuando la unidad es porcentual; una señal auxiliar por sí sola no autoriza
  rightsizing y los picos siguen preservados en min/max/p95/p99 y drilldown raw.
- Si la evidencia tecnica es debil, la recomendacion debe marcar validacion tecnica pendiente.
- Existen golden scenarios offline para medir regresiones sin llamar al LLM.
- El resumen de aprendizaje expone por tenant el feedback humano, los estados del auditor, las memorias activas
  y las memorias globales. La tasa de aprobación humana no se mezcla con el veredicto del auditor.
- El análisis solicitado desde el detalle 360 se aísla por `externalResourceId`: costo, métricas, prompt, auditoría y rúbrica se limitan al recurso exacto. Las oportunidades relacionadas usan el mismo identificador exacto dentro del tenant.
- El detalle 360 comunica el nivel de evidencia y los bloqueos de las reglas técnicas; una evidencia limitada solo habilita recomendaciones de validación técnica.
- Las oportunidades persistidas tienen deduplicación por tenant, cuenta, recurso/candidato, tipo y período factual. Un plan rechazado por el auditor no se guarda ni se muestra como plan reutilizable.
- El ciclo humano diferencia aprobación de ejecución: técnico FinOps/administradores registran ejecución manual y el aprobador del cliente puede decidir sobre un plan auditado. La decisión crea un evento durable de aprendizaje sin bloquear la respuesta HTTP.

## Presupuestos FinOps

- Existe un módulo de presupuestos mensuales persistentes por tenant, cuenta cloud o servicio.
- Cada presupuesto compara únicamente costos y forecasts de su misma moneda; si no hay forecast persistido se declara no disponible.
- La evaluación manual de umbrales 80/90/100 crea eventos idempotentes, notificaciones in-app y registros outbound pendientes, sin exigir un scheduler durante desarrollo.
- Las entregas outbound de alertas ya tienen cola durable: `PENDING` se reclama con lease, pasa a `PROCESSING`, se
  reintenta con backoff limitado y termina en `SENT`, `FAILED` o `SKIPPED`. El scheduler procesa lotes acotados y
  recupera leases vencidos; el cuerpo completo no se expone en el DTO de entregas. La migración
  `202608110009_outbound_delivery_queue` ya está aplicada y verificada en Supabase; faltan canaries con SMTP/Telegram
  reales antes de habilitar envíos externos en operación.
- El dashboard ya no calcula un presupuesto inventado; muestra únicamente el presupuesto tenant real cuando existe.

## Asignación compartida y cierre financiero

- `CostAllocationRule` conserva DIRECT y agrega SPLIT con destinos porcentuales explícitos; la suma debe ser exactamente 100 %.
- El motor mantiene primera coincidencia, separa monedas y calcula con `Prisma.Decimal`; el residuo se asigna al último destino y las líneas sin regla permanecen como `UNALLOCATED`.
- Antes de cerrar, la fuente se valida con conteo, total Decimal y una segunda huella canónica de las filas dentro de la transacción; una regla SPLIT persistida con porcentajes inválidos también bloquea el cálculo.
- Los cierres son independientes por tenant, período y moneda. Guardan totales, resultados por destino, hashes de costos y reglas, versión, responsable y fecha. Una entrada idéntica es idempotente; una corrección crea una versión nueva y conserva la anterior.
- `Asignación de costos` muestra suma SPLIT, preview con período anterior, reglas usadas e impacto financiero por destino, costo compartido, confirmación auditada de `UNALLOCATED`, checklist de estado e historial de cierres. La activación exige preview de la misma configuración; la API incorpora cierre, historial, detalle y comparación de versiones.
- La interfaz añade un resumen financiero por destino que combina costo cerrado vigente (o costo live identificado como no cerrado), período anterior, variación, presupuesto consumido y ahorro potencial/aprobado/verificado/acumulado sin duplicar el motor financiero.
- El historial de cierres permite cargar bajo demanda el detalle y comparar versiones, incluyendo hashes, responsable, totales y resultados por destino. El botón `Previsualizar` no persiste reglas: el frontend distingue explícitamente la acción del formulario antes de llamar a la API.
- El repositorio contiene 55 migraciones Prisma; las migraciones `202608040001_shared_cost_allocation_closures` a `202608040008_cost_metrics_tenant_period_index`, las ocho de ciclo de vida de autenticación y las migraciones `202608110009` a `202608110011` de cola, hardening de funciones e índices FK ya están aplicadas y verificadas en Supabase principal. Las tablas nuevas tienen RLS, índices de tenant/período/estado, FK tenant-aware, cierres inmutables, acceso directo revocado para roles API y compuerta de preview antes de activar.
- Los presupuestos por destino reutilizan el cierre cerrado como única fuente de actual; no recalculan distribución. Antes del cierre, el actual queda explícitamente no disponible y el preview conserva el valor como proyectado. `Valor realizado` expone el resumen por destino y solo atribuye ahorro cuando coinciden tenant, moneda, recurso canónico, hash de métrica y período; sin evidencia exacta no atribuye ahorro.
- Las líneas de cada cierre conservan un snapshot inmutable de recurso canónico, fuente, monto, destino, regla y hash de métrica. Cierres anteriores a `202608040004` pueden no tener líneas históricas y deben tratarse como agregados sin evidencia de atribución por línea.
- El detalle operativo del modelo, invariantes y API está en `docs/COST_ALLOCATION_SHARED_CLOSURES.md`.

## Seguridad y produccion

- MFA privilegiado incluye diez códigos de recuperación aleatorios de un solo uso: solo se persisten hashes,
  se muestran una vez, la regeneración revoca el lote anterior y el consumo es atómico con el challenge de login.
- El canary runtime RLS cubre ahora las seis tablas de credenciales. Se eliminó una recursión entre políticas
  pre-auth mediante helpers SECURITY DEFINER acotados; dos tenants pasaron con cero acceso cruzado.
- La autorización de aplicación usa una política central testeable para los siete roles y dieciséis capacidades.
  Cloud, ingesta, agente, recomendaciones, mediciones, presupuestos, asignación, valor, mensajería, MFA y
  administración MSP ya no mantienen listas de roles independientes; la matriz vigente está en
  `docs/MATRIZ_AUTORIZACION.md`.

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
  bajo demanda y renderiza la serie principal con uPlot. La vista separa coordinación asíncrona, cache LRU,
  cancelación, modelo de rango y paneles; `MetricasTecnicas.tsx` quedó en 216 líneas sin perder granularidades.
- Los reportes FOCUS de OCI/AWS se procesan por batches asíncronos para evitar cargar el CSV completo en
  memoria; la persistencia mantiene inserción idempotente por hash.
- Backend: `npm run test:all` (86 archivos aprobados, 340 pruebas pasadas y 9 omitidas),
  `npm run test:ai:offline` (22/22), typecheck y build sin errores. `npm audit --omit=dev` permanece sin
  vulnerabilidades altas.
- Frontend: lint, typecheck y build aprobados. La última ejecución documentada de `test:e2e:full` aplicó las
  migraciones desde cero en un schema aislado, creó fixtures autenticados y aprobó 5/5 escenarios Playwright;
  el cleanup eliminó los dos tenants y el schema de prueba incluso con la ruta de recuperación para preparación
  incompleta. La ejecución actual exige `TEST_DATABASE_URL` apuntando a una base/schema efímero y se abstiene si
  esa variable no está presente; el smoke `test:e2e:smoke` sí funciona sin BD.
- Canary IA real aislado: chat en español, generación, auditor, snapshot canónico, rúbrica determinística,
  ahorros no negativos, trazabilidad y `persist=false` aprobados con el modelo `gpt-5.4-mini`.
  Latencia de generación: 54.662 s; estimación de contexto/trazas: 4.093 tokens; recomendaciones: 3.
- Canary OCI read-only de onboarding: identidad, inventario, métricas y Object Storage disponibles;
  1 recurso Compute leído en una llamada, preview FOCUS sin errores (20 objetos descubiertos, 5 retornados);
  la capacidad de costos directa quedó denegada y el resultado fue `PARTIAL`, consistente con el bloqueo
  documentado de OCI Usage API.
- Integración de trazabilidad en PostgreSQL aislado: 5/5 pruebas; readiness con 10.000 costos y 20.000
  muestras técnicas tuvo mediana de 212,80 ms en cinco lecturas (un outlier de 607,78 ms).
- Canary principal: la prueba `tenantContext.integration.test.ts` pasó con enforcement runtime contra
  Supabase `public`; el plan de métricas usa el índice `(tenant_id, sampled_at)` y la línea base
  observada fue 52.029 ms raw y 7.692 ms agregada para 660 filas/grupos.
- Benchmark del motor determinista de asignación: 10.000 costos, 10 reglas y 5 iteraciones; mediana de
  66,98 ms con invariantes de suma conservadas. Es una medición del cálculo en memoria, no un SLA completo
  de la transacción de cierre contra la base de datos.
- La integración de asignación ahora mide también el flujo persistido con 10.000 costos: preview 1.647,36 ms,
  cierre 6.604,64 ms y 10.000 líneas de evidencia en el Supabase actual. `EXPLAIN (ANALYZE, BUFFERS)` confirmó
  el uso de `cost_metrics_tenant_period_idx` con 10,35 ms de ejecución SQL. La compuerta revalida la huella
  canónica de la fuente además de conteo y total; el guardado masivo usa JSONB
  parametrizado y la transacción no expira por el timeout genérico de Prisma; los objetivos orientativos de
  500 ms/2 s quedan abiertos para reevaluación con un entorno de despliegue representativo.
- Integración aislada de asignación: `npm run test:integration:cost-allocation` pasó 3/3 con 49
  migraciones; validó costos → regla → preview → activación → cierre, idempotencia, FK tenant-aware
  e inmutabilidad de cierres.
- CI ejecuta integración aislada PostgreSQL/API en GitHub Actions. Docker local sigue siendo opcional para
  desarrollo; Supabase se valida mediante migraciones Prisma antes de cambios de esquema.

## Pendientes principales

- Asignación de costos: DIRECT/SPLIT, preview, distribución por moneda y cierres versionados ya están disponibles; chargeback contable continúa fuera de alcance.
- Mantener canaries periódicos de OCI Compute/Resource Search y validar frecuencia/volumen del inventario cuando exista operación continua. AWS EC2 sigue bloqueado por falta de cuenta real.
- AWS productivo con rol real y bucket/prefix FOCUS.
- Mantener un canary periódico de IA real con fixtures controlados; no persistir datos de prueba en tenants normales.
- Activar permanentemente el enforcement runtime RLS solo al desplegar, usando el procedimiento de
  `docs/RUNTIME_RLS_CANARY.md` y su rollback.
- Limpieza de documentos antiguos que aún describen estados superados; las fuentes autoritativas son este archivo,
  `docs/ROADMAP_PRODUCTO.md`, `PROGRESO_ROADMAP_FINOPS.md` y `docs/DEUDA_TECNICA.md`.

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
