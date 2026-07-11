# Roadmap de Producto — FinOps Inteligente

> Documento de **propuesta y planificación de producto**. Traza el camino desde el estado actual
> hacia una versión terminada, por fases y con dependencias explícitas.
>
> **No reemplaza** a `REFACTOR_PLAN.md` (plan de refactor de código, ya completado) ni a
> `PROGRESO_ROADMAP_FINOPS.md` (bitácora de avance). Este documento es el **mapa hacia adelante**;
> la bitácora registra lo que ya se hizo.
>
> Última revisión: 2026-07-11.

---

## 1. Estado actual (qué está hecho de verdad)

### Núcleo funcional y verificado
- **Arquitectura:** Clean Architecture (domain / application / infrastructure / presentation), ESM,
  TypeScript estricto. Backend Node.js + Express; frontend Vite + React + Tailwind.
- **Multi-tenant MSP:** modelo jerárquico (organización operadora → clientes contratantes → usuarios).
  JWT + roles (`ADMIN`, `VIEWER`, `OPERATOR_ADMIN`, `FINOPS_TECHNICIAN`, `CLIENT_APPROVER`,
  `CLIENT_VIEWER`). Aislamiento por `tenantId` aplicado en servicios y repositorios.
- **Datos:** Prisma sobre Supabase/PostgreSQL; migración de fundación MSP aplicada; `provider_catalog`
  con `aws` y `oci`.
- **Analítica:** costos, forecast, tendencias, consumo, costo unitario e insights de eficiencia.
- **IA:** generación de recomendaciones mediante API OpenAI-compatible con **auditor IA independiente**; planes de
  ejecución auditados; aprobación/rechazo con aprendizaje asíncrono; Context Engine, memoria,
reglas TAK y trazas de contexto. El grafo visual fue retirado por baja utilidad practica.
- **Evaluación de calidad IA:** rúbrica determinista + golden scenarios (sin llamar al modelo).
- **Canales:** notificaciones in-app; Telegram MVP; base outbound con correo SMTP y scheduler opcional.
- **Frontend:** 10 vistas conectadas a endpoints reales (dashboard, consola técnica, detalle de
  recomendación, chat, historial, agente IA, ingesta/calidad, métricas técnicas, perfil, login).

### Base estructural lista, con validaciones productivas aún pendientes
- **Ingesta:** existen workers persistentes, scheduler, lectura S3/OCI, parser FOCUS streaming y
  persistencia idempotente hacia `focus_cost_line_items`/`cost_metrics`. AWS y OCI tienen adaptadores
  SDK; falta validar con cuentas reales, volumen y credenciales de producción.
- **Métricas técnicas:** OCI Monitoring y AWS CloudWatch ya alimentan `resource_metric_samples`; el
  inventario OCI Compute/AWS EC2 puede poblar `cloud_resources`. Falta validar cobertura real,
  frecuencia operativa y cruces completos por recurso.
- **Provisioning:** `provisionWithTemporaryAdmin` devuelve un stub `PENDING_PROVIDER_AUTOMATION`
  (recibe la credencial admin solo en memoria y no la persiste, por diseño).

### Decisiones firmes (no reabrir sin motivo)
Texto de usuario en español; en UI se dice "oportunidades", no "anomalías"; **sin remediación
automática cloud**; ejecución manual, gobernada y auditable; FOCUS aporta costo y consumo facturado,
**nunca** CPU/memoria/IOPS/throughput; Supabase en desarrollo / PostgreSQL portable; sin
n8n/MCP/Inngest (workers propios con jobs persistidos); las credenciales admin temporales **nunca**
se persisten como operativas.

---

## 2. Relación con los documentos existentes

| Documento | Qué es | Estado |
|---|---|---|
| `REFACTOR_PLAN.md` | Plan de refactor a <200 líneas efectivas (T-01…T-12) | **Completado**. El documento aún se lee como "en progreso": conviene marcarlo cerrado. |
| `PROGRESO_ROADMAP_FINOPS.md` | Bitácora de avance (cronológica inversa) | Vigente. Refleja los bloques entregados. |
| `docs/CONTEXTO_INGESTA_DATOS.md` | Contexto de ingesta + "Siguiente Fase Recomendada" (10 pasos AWS) | Semilla del roadmap futuro; cubre solo ingesta AWS. Integrado aquí como Fase 2. |
| **Este documento** | Roadmap de producto por fases | Nuevo. Llena el vacío: ningún doc previo trazaba el camino producto-completo. |

---

## 3. Roadmap por fases

Las fases se ordenan por dependencia y por si requieren credenciales cloud reales. Las Fases 0 y 1
son ejecutables **sin credenciales**; las Fases 2–4 las requieren.

### Fase 0 — Cierre de lo actual (sin credenciales) · CORTO
- **Hardening base:** `helmet`, rate limiting, CORS configurable y logging estructurado ya están
  implementados; queda validar despliegue y observabilidad centralizada.
- **Seed/demo sintético** para `ingestion_jobs`, `data_quality_checks`, `cloud_resources`,
  `resource_metric_samples` (claramente marcado como demo) para que las vistas nuevas muestren datos.
- **Verificación en vivo** del stack local cuando Docker esté disponible; CI ya valida PostgreSQL/API de forma aislada.
- **Endurecimiento de prompts medido** contra la rúbrica y los golden scenarios ya construidos.
- Marcar `REFACTOR_PLAN.md` como cerrado (resuelve la discrepancia de estado).

### Fase 1 — Robustez y confianza (sin credenciales) · CORTO/MEDIO
- Tests de integración contra BD real aislada (Docker Compose preparado; pendiente instalar Docker o
  ejecutar en CI) y, cuando Supabase esté activa, verificación en una rama dedicada.
- RLS a nivel de base de datos (el esquema ya es "RLS-ready"; envolver las consultas Prisma en
  contexto por request).
- Permisos multi-cliente reales con `tenant_access_assignments` (técnicos FinOps multi-tenant).
- Logging estructurado y gestión/rotación de secretos (fuera de `.env` plano).

### Fase 2 — Conector AWS productivo (requiere credenciales) · MEDIO
Sigue los 10 pasos de `docs/CONTEXTO_INGESTA_DATOS.md`:
1. `AwsCloudProviderPlugin`. 2. Recibir admin temporal solo en memoria. 3. Crear/verificar rol
operativo mínimo. 4. Configurar/verificar Data Export FOCUS hacia el storage del operador. 5. Guardar
solo la credencial operativa mínima cifrada. 6. Revocar/eliminar el admin temporal. 7. Worker que
procese jobs `BILLING_EXPORT` con `FOR UPDATE SKIP LOCKED` + reintentos. 8. Lectura de objetos
S3-compatibles. 9. Parser FOCUS productivo → `focus_cost_line_items`. 10. Data-quality checks +
watermarks. **Hito clave: el sistema deja de depender de cargas manuales.**

### Fase 3 — Conector OCI productivo (requiere credenciales) · MEDIO
Mismo patrón sobre OCI Cost Reports. El bootstrap (`oci-focus-bootstrap.ps1`) y el importador local
(`import-oci-focus.ts`) ya existen como base.

### Fase 4 — Métricas técnicas reales (requiere credenciales) · MEDIO/LARGO
Colector de inventario y métricas cada 30 min (SDK/API de AWS/OCI) → `cloud_resources` /
`resource_metric_samples`; agentes opcionales. Habilita recomendaciones con evidencia
`COST_USAGE_AND_TECHNICAL` (rightsizing técnico con datos reales, no inferido de FOCUS).

### Fase 5 — Expansión y gobernanza avanzada · LARGO
- Proveedores Azure y GCP (la arquitectura ya los soporta como capacidad de catálogo).
- WhatsApp como canal (Telegram es el MVP); scheduler de notificaciones de ahorro.
- TimescaleDB hypertable para `cost_metrics` (`prisma/timescale.sql` ya existe).
- Paneles de gobernanza y trazabilidad ampliados.
- **La remediación automática cloud queda explícitamente fuera del alcance.**

---

## 4. Criterio de "versión terminada"

Se considera terminada cuando, además del núcleo actual: la ingesta es productiva y automática para
al menos un proveedor real (Fase 2); existen métricas técnicas reales que enriquecen las
recomendaciones (Fase 4); el aislamiento multi-tenant está reforzado a nivel de BD (Fase 1); y el
sistema tiene hardening de producción (Fase 0/1). Todo manteniendo las decisiones firmes de la §1.

---

## 5. Actualizacion 2026-06-05 - Ingesta SDK OCI/AWS

Estado actualizado del roadmap general:

- Ya existe una base de worker persistente sobre ingestion_jobs, activable con INGESTION_WORKER_ENABLED=true, con claim por FOR UPDATE SKIP LOCKED, reintentos, started_at, completed_at y 
esult_summary.
- Ya existe una primera rebanada de conectores SDK:
  - OCI: OciSdkIngestionProvider recolecta TECHNICAL_METRIC via OCI Monitoring usando metadata.ociMetricDefinitions.
  - AWS: AwsSdkIngestionProvider recolecta TECHNICAL_METRIC via STS AssumeRole + CloudWatch GetMetricData usando metadata.awsMetricDefinitions.
- Avance 2026-06-05: ya existe parser FOCUS comun y lectura por objetos configurados para AWS S3 (wsFocusExportObjects) y OCI Object Storage (ociFocusReportObjects). Queda pendiente discovery automatico de particiones/exports y benchmark con cuentas reales.
- Sigue pendiente la parte canonica de costos/consumo FOCUS productiva:
  - OCI Cost Reports/Object Storage hacia ocus_cost_line_items.
  - AWS Data Exports/S3 hacia ocus_cost_line_items.
- Sigue pendiente benchmark SDK vs CLI con cuenta real: duracion total, llamadas API, muestras por segundo, errores y cobertura.
- No se debe inferir CPU/memoria/IOPS desde FOCUS. Memoria en AWS/OCI solo se considera evidencia tecnica cuando exista agente/namespace que la entregue.
- Hallazgo de seguridad: 
pm install reporto 174 vulnerabilidades transitivas. No se ejecuto 
pm audit fix --force para evitar cambios destructivos; queda como tarea controlada.

- Avance 2026-06-05 adicional: AWS/OCI ya soportan discovery por prefijo (wsFocusExportLocations, ociFocusReportLocations) con limite maxObjects para evitar barridos gigantes. Se agrego 
pm run ingestion:worker:once para benchmark manual de un job pendiente.

- Avance 2026-06-05 adicional 2: OCI TECHNICAL_METRIC ya fue probado contra Supabase con credencial OCI cifrada. Se agregaron scripts operativos `npm run oci:register-profile` y `npm run ingestion:create-job`. El benchmark historico sobre OCI Monitoring proceso 11 metricas y normalizo 429 muestras en 660 ms internos. El principal hallazgo fue de integracion SDK: la respuesta TypeScript expone `items`; leer `summarizedMetricsData` producia 0 muestras aunque OCI CLI si devolvia datos. Queda pendiente prueba AWS real y ejecucion con ventana diaria viva.

- Avance 2026-06-05 adicional 3: se agrego base operativa AWS con `npm run aws:register-role` para credencial cifrada basada en `AssumeRole` + `ExternalId`, y prueba unitaria del mapeo CloudWatch `GetMetricData` hacia muestras tecnicas. Falta credencial/rol real para benchmark AWS productivo; la estrategia se mantiene separada: AWS Data Exports FOCUS para costo/uso facturado y CloudWatch para CPU/red/disco/memoria cuando haya agente.

- Avance 2026-06-05 adicional 4: se agrego `npm run ingestion:schedule` como programador seguro de jobs recurrentes. Corre en dry-run por defecto y requiere `--apply` para crear registros en `ingestion_jobs`. Tambien puede correr dentro del backend con `INGESTION_SCHEDULER_ENABLED=true`. Evalua conexiones activas AWS/OCI, credenciales activas, metadata real de metricas/FOCUS y cooldowns para evitar duplicados. Esto completa la base operativa scheduler + worker: el scheduler encola y el worker procesa. Sigue pendiente definir frecuencia productiva y configurar FOCUS real/AWS real.

- Evidencia adicional: scheduler `--apply` + worker procesaron un job OCI vivo de `TECHNICAL_METRIC` con 11 llamadas OCI y 11 muestras normalizadas; un dry-run posterior no creo duplicados por cobertura reciente. Esto valida la ruta automatizable scheduler -> job persistido -> worker -> `resource_metric_samples`.

- Avance 2026-06-05 adicional 5: el readiness de ingesta ya no depende solo del CLI. Existe `GET /api/v1/ingestion/readiness` y la vista `Ingesta` muestra preparacion productiva por tenant: conexiones, credenciales, metadata, jobs recientes e issues. Esto mejora la gobernanza operativa para saber exactamente que falta antes de activar ingesta automatica por cliente.

- Avance 2026-06-11: OCI FOCUS real ya esta conectado de punta a punta hasta la capa analitica. El worker `BILLING_EXPORT` descarga reportes FOCUS desde Object Storage, guarda `focus_cost_line_items`, proyecta idempotentemente a `cost_metrics`, actualiza watermark/readiness y conserva quality check. Evidencia: job `cmq91sgea0000fc52feo0c6rh`, 20 objetos, 533 filas FOCUS, 533 metricas analiticas proyectadas, 432 nuevas insertadas, 0 warnings. Pendiente critico: AWS real sigue bloqueado por falta de rol/conexion y la persistencia FOCUS requiere optimizacion por lotes antes de subir volumen.

- Avance 2026-06-11 adicional: la Fase 4 ya tiene capa visual/analitica para metricas tecnicas. La seccion `Metricas de uso` muestra KPIs, series temporales, filtros por recurso/grupo/metrica/rango/granularidad, oportunidades tecnicas y costo asociado solo con match exacto por recurso. Sigue pendiente mejorar ingesta viva y normalizar inventario para poblar `cloud_resources` de forma consistente.

## 6. Actualizacion 2026-06-17 - Reconciliacion del estado real

Estos puntos sustituyen las afirmaciones antiguas del documento que decian que no existian conectores reales o que las metricas tecnicas estaban vacias:

- La ingesta productiva ya tiene base real para OCI FOCUS y OCI Monitoring; AWS tiene base de proveedor SDK y queda pendiente prueba con rol/cuenta real.
- `cloud_resources` ya no depende solo de datos manuales: los jobs de ingesta crean recursos desde inventario declarativo y, si falta inventario completo, desde las metricas tecnicas recolectadas.
- `resource_metric_samples.cloudResourceId` se enlaza durante la persistencia y se reconcilia para muestras previas de la misma conexion/recurso, habilitando cruces costo-metrica-recomendacion mas confiables.
- Las recomendaciones `COST_USAGE_AND_TECHNICAL` ahora tienen guardrails: requieren referencias tecnicas, recurso enlazado, cobertura/muestras suficientes y frescura. Si no, deben quedar como validacion tecnica pendiente.
- El hardening ya no parte de cero: existen `helmet`, CORS configurable multi-origen, rate limits globales/especificos y logging estructurado por request. Quedan pendientes RLS/staged DB policies, gestion externa de secretos y tests de integracion contra BD real.
- Pendiente critico vigente: validar inventario SDK Compute/EC2 con cuentas reales y benchmark, AWS productivo, RLS gradual, observabilidad centralizada y cierre de documentos historicos que aun usen terminos anteriores.
