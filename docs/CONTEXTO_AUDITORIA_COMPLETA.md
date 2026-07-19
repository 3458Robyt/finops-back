# Contexto para auditoría completa — FinOps Inteligente

> **Snapshot histórico del 2026-07-09.** No describe el estado vigente posterior al retiro de
> Recharts y a la integración del onboarding cloud. Consulta `ROADMAP_PRODUCTO.md`,
> `PROGRESO_ROADMAP_FINOPS.md` y `ONBOARDING_CLOUD.md`.

Fecha de corte: 2026-07-09
Workspace: C:\Users\DAVID\OneDrive\Documentos\Antigravity

## 1. Alcance
Plataforma FinOps multi-tenant/MSP para ingerir costos FOCUS y métricas técnicas desde OCI y AWS, normalizar recursos, analizar costo/consumo/evidencia, generar recomendaciones y planes en español mediante LLM, auditarlos, permitir aprobación/rechazo y aprendizaje, y enviar notificaciones in-app, Telegram y correo SMTP.

Decisiones vigentes: Supabase/PostgreSQL es la BD principal; n8n fue descartado; Telegram es el MVP externo; WhatsApp queda para evolución; FOCUS no sustituye CPU/memoria/red/disco/IOPS; la UI usa oportunidades en vez de anomalías; el texto funcional va en español; el grafo de conocimiento fue retirado por baja utilidad y latencia; no hay remediación cloud automática.

## 2. Repositorios y estado Git
Backend: C:\Users\DAVID\OneDrive\Documentos\Antigravity\finops-backend. Rama main, ahead 31 de origin/main. HEAD 8e1e1a3 feat: project focus exports into analytics. Hay modificaciones, eliminaciones y archivos nuevos locales.
Frontend: C:\Users\DAVID\OneDrive\Documentos\Antigravity\finops-app. Rama main, ahead 7 de origin/main. HEAD c1c29ba feat: configure focus sources from UI. También hay cambios locales y archivos nuevos.
Riesgo: la auditoría debe separar HEAD, cambios locales, documentación y despliegue Supabase. No hacer reset, clean ni commit masivo sin revisar.

## 3. Backend
Clean Architecture: domain, application, infrastructure y presentation.
Codebase Memory: 1.988 nodos y 5.933 relaciones. Zonas principales: autenticación, ingesta, métricas técnicas, analítica, IA/recomendaciones, notificaciones y administración MSP.
Rutas principales: auth, master-admin, cloud-connections, ingestion, technical-metrics, analytics, cost, kpi, recommendation, agent, ai, notification, telegram y outbound-message.
Scripts críticos: dev, build, typecheck, test, test:integration, test:api:smoke, test:ai:offline, test:ai:live, test:perf:technical-metrics, ingestion:doctor, ingestion:schedule, ingestion:worker:once, db:seed.

## 4. Frontend
Vite + React + TypeScript + Tailwind. Recharts para gráficos secundarios y uPlot para métricas técnicas. Playwright está configurado.
Vistas: Login, Dashboard, Console, MetricasTecnicas, ResourceDetail, Ingesta, AgentSettings, MasterAdmin, Chat, History y Profile.
Componentes críticos: TechnicalMetricUPlot, TopHeader, Sidebar y BottomNav. src/services/api.ts concentra contratos y llamadas HTTP.

## 5. Modelo de datos
Identidad: Tenant, User, OperatorOrganization, TenantAccessAssignment, AuthSession.
Ingesta: ProviderCatalog, CloudConnection, CloudConnectionCredential, CloudAccount, OperatorStorageLocation, CloudExportConfig, IngestionRun, IngestionJob, IngestionObject, IngestionWatermark.
Costos/analítica: FocusCostLineItem, CostMetric, CostAnomaly, CostForecast, DataQualityCheck.
Inventario/métricas: CloudResource, ResourceMetricSample.
Recomendaciones/gobierno: Recommendation, RecommendationExecutionPlan, RecommendationDecision, RecommendationManualExecution, InAppNotification.
Agente IA: AgentInstallation, AgentLearningEvent, AgentMemory, AgentInstructionProfile, TenantAgentRule, AgentInstructionAuditEvent, ContextSummaryCache, AiContextTrace, ContextBuildRun.
Canales/auditoría: TelegramChatLink, TelegramInteractionLog, OutboundMessageDelivery, AuditEvent.
El grafo funcional fue retirado; la migración correspondiente es 202606250001_outbound_messages_drop_graph.

## 6. Estado funcional declarado
Implementado según PROGRESO_ROADMAP_FINOPS.md: JWT/roles; MASTER_ADMIN multi-tenant; OCI FOCUS hasta focus_cost_line_items y cost_metrics; OCI Monitoring a resource_metric_samples; adaptadores AWS SDK base; cloud_resources por inventario y derivación desde métricas; compuerta determinística de evidencia; auditor IA; golden scenarios offline; aprendizaje asíncrono; series técnicas con uPlot; readiness, scheduler y worker de ingesta; Telegram y correo SMTP; Helmet, CORS, rate limits y logging estructurado.
Pendientes declarados: validar AWS con cuenta/rol real; validar inventario OCI Compute y AWS EC2 con benchmark; fortalecer evidencia técnica; RLS gradual; gestión externa/rotación de secretos; observabilidad centralizada; tests de integración contra BD real; limpiar documentación antigua.

## 7. Verificaciones ejecutadas
Backend npm run typecheck: OK. Prisma Client v7.8.0 generado y TypeScript sin errores.
Backend npm run test:ai:offline: OK. 2 archivos y 10 tests aprobados.
Frontend npm run build: OK. 695 módulos. Bundle JS principal aproximado: 769 kB sin comprimir. Vite advierte chunk mayor a 500 kB; es un riesgo de optimización, no un fallo de compilación.
Backend `npm test`: OK, 40 archivos y 160 tests. Frontend `npm run lint`: OK; `npm run build`: OK; smoke E2E Playwright: OK. Los proveedores FOCUS tienen pruebas de streaming para OCI/AWS.
La integración Docker no se pudo ejecutar en este equipo porque el comando `docker` no está instalado. Supabase no se pudo verificar porque el proyecto se reportó INACTIVE. Siguen pendientes pruebas reales OCI/AWS y prueba live LLM.

## 8. Supabase
Proyecto FinOps: ref yhbugfuavjnsiacvoxhx, región us-east-1, estado reportado por MCP INACTIVE.
No debe asumirse que la BD está disponible ni que coincide con Prisma. La auditoría debe comprobar migraciones, tablas, índices, RLS, datos y conteos cuando el proyecto esté activo. La última consulta SQL MCP conocida terminó por timeout.

## 9. Documentación
Prioridad: PROGRESO_ROADMAP_FINOPS.md, docs/ROADMAP_PRODUCTO.md, docs/ESTADO_ACTUAL_FINOPS.md, docs/TESTING_AUDITORIA_IA.md, docs/OCI_FOCUS_BOOTSTRAP.md, README.md, prisma/schema.prisma.
Contradicción detectada: el roadmap declara Helmet/rate limiting/logging implementados, pero README aún dice que Helmet y rate limiting faltan. README también conserva referencias antiguas a anomalías y afirmaciones aspiracionales.

## 10. Orden de auditoría recomendado
1) Congelar evidencia con git status, diff stat y log sin limpiar cambios. 2) Separar HEAD, cambios locales y artefactos. 3) Ejecutar builds, typecheck, suite y pruebas específicas. 4) Revisar .gitignore sin leer ni exponer .env. 5) Comparar Prisma, migraciones y esquema real Supabase. 6) Auditar multi-tenant/RLS. 7) Auditar ingesta e idempotencia. 8) Auditar cruce recursos-métricas-costos-recomendaciones. 9) Auditar generación IA, compuerta, auditor, parser, trazabilidad y aprendizaje. 10) Auditar frontend/contratos. 11) Pruebas live seguras. 12) Clasificar P0-P3. 13) Emitir informe con evidencia y reproducción. 14) Crear plan de corrección después.

## 11. No dar por hechos
Que Supabase esté activa; que todas las migraciones estén aplicadas; que AWS esté validado; que existan métricas suficientes; que una recomendación técnica tenga evidencia fuerte solo por tener FOCUS; que aprendizaje funcione si falla el auditor; que el frontend apunte al backend correcto; que los archivos locales estén listos para commit.
