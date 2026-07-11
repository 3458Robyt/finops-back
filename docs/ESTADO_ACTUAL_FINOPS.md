# Estado Actual FinOps Inteligente

Fecha: 2026-07-11

## Resumen

La plataforma ya tiene backend Node.js/TypeScript, frontend React, Supabase/PostgreSQL como base principal, autenticacion JWT, analitica de costos/consumo, recomendaciones IA con auditor, planes de ejecucion, aprendizaje por aprobacion/rechazo, trazabilidad, Telegram MVP, ingesta FOCUS/metricas para OCI y visualizacion de metricas tecnicas.

## Ingesta e inventario cloud

- OCI FOCUS real esta conectado hasta `focus_cost_line_items` y `cost_metrics`.
- OCI Monitoring ya alimenta `resource_metric_samples`.
- AWS tiene base SDK para EC2, CloudWatch y Data Exports, pendiente de credencial/rol real para validacion productiva.
- `cloud_resources` se pobla desde inventario declarativo (`ociInventoryResources` / `awsInventoryResources`) y desde definiciones/muestras de metricas cuando aun no hay inventario completo.
- Las muestras tecnicas nuevas se enlazan a `cloudResourceId` y se reconcilian muestras anteriores por conexion/recurso.

## IA y recomendaciones

- El agente genera recomendaciones y planes en espanol usando una API OpenAI-compatible configurable.
- El auditor IA valida coherencia, realismo, idioma, no invencion de recursos y prohibicion de ejecucion automatica.
- Las recomendaciones con evidencia `COST_USAGE_AND_TECHNICAL` ahora requieren evidencia tecnica fuerte: referencias, recurso enlazado, cobertura/muestras suficientes y muestra reciente.
- Si la evidencia tecnica es debil, la recomendacion debe marcar validacion tecnica pendiente.
- Existen golden scenarios offline para medir regresiones sin llamar al LLM.

## Seguridad y produccion

Implementado:

- `helmet` para cabeceras HTTP.
- CORS configurable con multiples origenes.
- Rate limit global para `/api/v1`.
- Rate limit especifico para login, Telegram e IA.
- Logging estructurado por request con `x-request-id`.
- Validacion runtime estricta en produccion para secretos/configuracion critica.

Pendiente:

- RLS o controles equivalentes a nivel BD de forma gradual.
- Gestion externa y rotacion formal de secretos.
- Observabilidad centralizada.
- Tests de integracion contra BD real controlada.

## Rendimiento y pruebas recientes

- Las series de métricas técnicas usan agregación SQL, cursor y carga progresiva; la UI conserva el raw
  bajo demanda y renderiza la serie principal con uPlot.
- Los reportes FOCUS de OCI/AWS se procesan por batches asíncronos para evitar cargar el CSV completo en
  memoria; la persistencia mantiene inserción idempotente por hash.
- Backend: typecheck y suite completa (40 archivos, 160 tests) aprobados.
- Frontend: lint, build y smoke E2E sin dependencia de API/BD aprobados.
- CI ejecuta integración aislada PostgreSQL/API en GitHub Actions. Docker local sigue siendo opcional para
  desarrollo; Supabase se valida mediante migraciones Prisma antes de cambios de esquema.

## Pendientes principales

- Validar inventario SDK OCI Compute y AWS EC2 con cuentas reales, benchmark y cobertura por tenant.
- AWS productivo con rol real y bucket/prefix FOCUS.
- Fortalecer agregacion de evidencia tecnica en el contexto del agente, no solo en guardrails.
- RLS gradual en Supabase.
- Limpieza de documentos antiguos que aun describen estados superados.

## Operación durante desarrollo

- Backend, frontend y workers se ejecutan manualmente cuando se desarrolla o prueba una funcionalidad.
- La falta de ingesta diaria mientras la aplicación está apagada es una decisión temporal de desarrollo,
  no un incidente operativo. El trabajo permanente queda registrado en `docs/DEUDA_TECNICA.md`.
