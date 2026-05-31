# Roadmap de Producto — FinOps Inteligente

> Documento de **propuesta y planificación de producto**. Traza el camino desde el estado actual
> hacia una versión terminada, por fases y con dependencias explícitas.
>
> **No reemplaza** a `REFACTOR_PLAN.md` (plan de refactor de código, ya completado) ni a
> `PROGRESO_ROADMAP_FINOPS.md` (bitácora de avance). Este documento es el **mapa hacia adelante**;
> la bitácora registra lo que ya se hizo.
>
> Última revisión: 2026-05-30.

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
- **IA:** generación de recomendaciones (NVIDIA NIM) con **auditor IA independiente**; planes de
  ejecución auditados; aprobación/rechazo con aprendizaje asíncrono; Context Engine, memoria,
  reglas TAK, grafo de conocimiento y trazas de contexto.
- **Evaluación de calidad IA:** rúbrica determinista + golden scenarios (sin llamar al modelo).
- **Canales:** notificaciones in-app; Telegram MVP.
- **Frontend:** 10 vistas conectadas a endpoints reales (dashboard, consola técnica, detalle de
  recomendación, chat, historial, agente IA, ingesta/calidad, métricas técnicas, perfil, login).

### Base estructural lista, pero NO productiva (el gran hueco)
- **Ingesta:** existen tablas (`ingestion_jobs`, `ingestion_objects`, `ingestion_watermarks`),
  el contrato `ICloudProviderPlugin`, endpoints y `provisionWithTemporaryAdmin` — pero **no hay
  conectores reales**: falta el plugin AWS/OCI, el worker que procese jobs, la lectura de S3/OCI y
  el parser FOCUS productivo hacia `focus_cost_line_items`.
- **Métricas técnicas:** tablas listas (`cloud_resources`, `resource_metric_samples`) pero **sin
  colector** → vacías fuera de datos demo.
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
- **Hardening real:** `helmet` + rate limiting en Express (hoy solo documentado como pendiente).
- **Seed/demo sintético** para `ingestion_jobs`, `data_quality_checks`, `cloud_resources`,
  `resource_metric_samples` (claramente marcado como demo) para que las vistas nuevas muestren datos.
- **Verificación en vivo** del stack local (docker-compose PostgreSQL + backend + frontend).
- **Endurecimiento de prompts medido** contra la rúbrica y los golden scenarios ya construidos.
- Marcar `REFACTOR_PLAN.md` como cerrado (resuelve la discrepancia de estado).

### Fase 1 — Robustez y confianza (sin credenciales) · CORTO/MEDIO
- Tests de integración contra BD real (hoy la cobertura es unitaria con fakes).
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
