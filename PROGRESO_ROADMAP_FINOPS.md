# Progreso — FinOps Inteligente (Backend)

> Bitácora viva del proyecto. Se actualiza **a medida que se avanza**, no solo al final.
> Estructura: (1) Estado actual · (2) Bitácora de avance (cronológica inversa) · (3) Próximos bloques.

## 1. Estado actual

Plataforma FinOps con IA generativa para optimización de costos cloud. Backend Node.js + TypeScript
(ESM, Clean Architecture: domain / application / infrastructure / presentation), Prisma sobre
Supabase/PostgreSQL, multi-tenant/MSP. Frontend: Vite + React + TS + Tailwind (`finops-app`).

Capacidades operativas hoy: autenticación JWT y roles; ingesta OCI FOCUS local; analítica de costos,
forecast, consumo, costo unitario e insights; recomendaciones IA (NVIDIA/NIM) con auditor IA
independiente; planes de ejecución auditados; aprobación/rechazo con aprendizaje asíncrono; Context
Engine, memoria, reglas TAK, grafo y trazas IA; notificaciones in-app y Telegram MVP.

Decisiones vigentes: todo el texto de usuario en español; en UI se dice "oportunidades", no
"anomalías"; n8n descartado; WhatsApp es evolución futura (Telegram MVP); sin remediación automática
cloud; ejecución manual, gobernada y auditable; FOCUS sirve para costo/consumo facturado pero **no**
para inferir CPU/memoria/IOPS/throughput; Supabase es la BD principal (arquitectura portable a
PostgreSQL).

## 2. Bitácora de avance

### 2026-05-30 — Bloque 3/4: Evaluación de calidad del agente IA + golden scenarios ✅

Marco determinista para medir la calidad del agente **sin llamar al modelo** ni depender de
credenciales — base para endurecer prompts con medición en vez de a ciegas. Solo backend, puro, additivo.
- `ai/evaluation/qualityRubric.ts`: funciones puras. `evaluateRecommendationDrafts` (controles:
  count, accountScoping, severityValid, evidenceLevel, **focusHonesty** —COST_ONLY exige
  requiresTechnicalValidation—, savingsRealism, spanishText) y `evaluateExecutionPlan` (requiredArrays,
  scopeAccount, **noAutoExecution**). Reusa `isRecord` de `ai/jsonReadHelpers`.
- `ai/evaluation/goldenScenarios.ts`: 4 escenarios sintéticos (bueno con consumo; FOCUS-only honesto;
  cuenta inventada → rechazo del parser; ahorro irreal → reprobado por rúbrica). Datos marcados demo.
- `ai/evaluation/goldenScenarioRunner.ts`: `runScenarioOffline` ejercita el pipeline real
  (`parseRecommendationDrafts` → rúbrica) y clasifica `PARSED_AND_PASSED | PARSED_BUT_FAILED | PARSE_REJECTED`.
- `ai/evaluation/goldenScenarios.test.ts`: recorre todos los escenarios + controles finos de la rúbrica.
- Verificación: `tsc --noEmit` exit 0; **54/54 tests** (+9 vs. bloque anterior).
- Orden ajustado: se priorizó este bloque (#3/#4) sobre #2 porque es autocontenido y no requiere
  credenciales; #2 (métricas técnicas) queda como siguiente.

### 2026-05-30 — Bloque 1: Historial de Ingesta + Calidad de Datos (en curso)

Objetivo del bloque: exponer por API (solo lectura, nivel tenant) el historial de jobs de ingesta y
los controles de calidad de datos (tablas ya existentes en BD, sin migración), y añadir una vista
nueva en el frontend. Additivo, multi-tenant, sin tocar prompts/IA ni contratos existentes.

- **Paso 0 — Commit de línea base** ✅. El árbol tenía 87 archivos modificados + carpetas nuevas
  (refactor <200 líneas entremezclado con trabajo previo sin commitear). Por decisión de alcance se
  consolidó en un único commit snapshot `a105817` (excluyendo `.claude/` —añadido a `.gitignore`— y 5
  scripts scratch `.mjs`). `.env` ya estaba ignorado. Verificación previa: `tsc` exit 0, 41/41 tests.
- **Bitácora creada** ✅: este archivo.
- **Backend — API de ingesta + calidad de datos** ✅. Additivo, sin migración (tablas ya existentes).
  - Puerto `ICloudConnectionRepository`: nuevos tipos `IngestionJobHistoryItem` y
    `DataQualityCheckItem` + firmas `listIngestionJobsForTenant` / `listDataQualityChecksForTenant`.
  - Repo `PrismaCloudConnectionRepository` + `mappers/cloudConnectionMappers.ts`
    (`toIngestionJobHistoryItem`, `toDataQualityCheckItem`): `findMany` filtrado por `tenantId`,
    `orderBy` fecha desc, `take: limit`.
  - Servicio `CloudConnectionService`: `listIngestionHistory` / `listDataQualityChecks` con
    `clampLimit` (default 50, rango [1, 200]).
  - Controlador `CloudConnectionController`: handlers `listIngestionHistory` / `listDataQuality`
    (+ `parseLimit`), reusando `requireTenant` / `respondWithError`.
  - Ruta nueva `routes/ingestionRoutes.ts` montada en `server.ts` bajo `/api/v1/ingestion`:
    `GET /history` → `{ success, jobs }`, `GET /data-quality` → `{ success, checks }` (ambos `requireAuth`).
  - Tests `CloudConnectionService.test.ts`: fake actualizado + 4 casos (historial por tenant, clamp de
    límite, checks de calidad, lista vacía).
  - Verificación: `tsc --noEmit` exit 0; **45/45 tests** (`vitest run --exclude '**/.claude/**'`).
- **Frontend — vista Ingesta** ✅. Additivo, en español, admin-only.
  - `services/api.ts`: tipos (`IngestionJobHistoryItem`, `DataQualityCheckItem`, enums y *responses*)
    + funciones `fetchIngestionHistory` / `fetchDataQualityChecks` (con `?limit=`), reusando `apiRequest`.
  - Vista `views/Ingesta.tsx`: dos secciones (Historial de ingesta y Calidad de datos) con tablas,
    badges de estado en español, estados de carga/vacío/error.
  - Navegación: `App.tsx` (type `View` + import + render `case 'ingesta'`), `Sidebar.tsx`,
    `BottomNav.tsx` y `TopHeader.tsx` (entrada "Ingesta y Datos" + título; los 3 componentes
    redeclaraban `CurrentView`, todos actualizados con `'ingesta'`).
  - Verificación: `npm run build` (`tsc -b && vite build`) exit 0 (690 módulos). Aviso de tamaño de
    chunk preexistente, no relacionado.

**Bloque 1 COMPLETADO.** Backend `tsc` 0 + 45/45 tests; frontend build 0. Rebanada vertical de
ingesta/calidad de datos operativa de extremo a extremo (API → UI), multi-tenant, sin migración.

## 3. Próximos bloques (orden de prioridad del goal)

1. **(en curso)** UI de ingesta / calidad de datos — API + vista.
2. Métricas técnicas separadas de FOCUS (vista + API sobre `ResourceMetricSample`; **sin** inferir
   CPU/memoria/IOPS desde FOCUS).
3. Fortalecimiento del motor IA con evidencia/auditoría + golden scenarios del agente.
4. Hardening y documentación de despliegue (secretos, CORS, JWT, rate limits, variables de entorno).
5. Conectores cloud reales + scheduler de jobs (sin remediación automática).
