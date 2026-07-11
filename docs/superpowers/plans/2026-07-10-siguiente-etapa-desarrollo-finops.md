# Siguiente Etapa De Desarrollo FinOps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar una rebanada vertical de inteligencia por recurso cloud: inventario consultable, sincronización manual, detalle 360 y recomendaciones IA respaldadas por evidencia del recurso.

**Architecture:** Se reutilizan `TechnicalMetricsService`, `IResourceMetricRepository`, las rutas de ingesta y los endpoints de recomendaciones existentes. No se crean workers nuevos ni infraestructura siempre encendida: durante desarrollo la sincronización seguirá siendo manual. Los riesgos operativos y de producción se registran, pero no bloquean el avance funcional.

**Tech Stack:** Node.js 22, TypeScript, Express, Prisma/PostgreSQL/Supabase, Vitest, React, Vite, Tailwind y Playwright.

## Global Constraints

- Todo texto visible para usuarios debe estar en español.
- Usar “oportunidades”, no “anomalías”, en UI nueva.
- No inferir CPU, memoria, red, disco o IOPS desde FOCUS.
- No ejecutar remediaciones automáticas sobre proveedores cloud.
- Mantener aislamiento por `tenantId` en todos los repositorios y endpoints.
- No agregar dependencias salvo que una capacidad instalada no pueda resolver el problema.
- La ingesta seguirá siendo manual mientras el proyecto esté en desarrollo.
- Cada avance debe actualizar `PROGRESO_ROADMAP_FINOPS.md`.

---

## Orden De Ejecución

1. Registrar deuda y separar claramente desarrollo de producción.
2. Implementar inventario cloud navegable.
3. Completar sincronización manual por cuenta.
4. Implementar detalle 360 por recurso.
5. Integrar el recurso 360 con generación y auditoría IA.
6. Probar el flujo completo y actualizar el roadmap.

---

### Task 1: Registro Único De Bugs, Deuda Y Faltantes

**Files:**
- Create: `docs/DEUDA_TECNICA.md`
- Modify: `docs/ROADMAP_PRODUCTO.md`
- Modify: `docs/ESTADO_ACTUAL_FINOPS.md`
- Modify: `PROGRESO_ROADMAP_FINOPS.md`

**Interfaces:**
- Consumes: hallazgos de CI, Supabase Advisors y pruebas manuales.
- Produces: una tabla única con `ID`, `prioridad`, `tipo`, `estado`, `evidencia`, `criterio de cierre` y `momento objetivo`.

- [ ] **Step 1: Crear el registro con los hallazgos actuales**

```markdown
| ID | Prioridad | Tipo | Estado | Hallazgo | Criterio de cierre | Momento objetivo |
|---|---|---|---|---|---|---|
| SEC-001 | Alta | Producción | Registrado | 41 tablas públicas sin RLS | Acceso externo bloqueado y pruebas cross-tenant aprobadas | Antes de despliegue público |
| OPS-001 | Media | Operación | Aceptado en desarrollo | Worker no permanece encendido | Worker desplegado y healthcheck operativo | Fase de despliegue |
| ING-001 | Media | Datos | Registrado | Jobs históricos pendientes/fallidos por configuración de prueba | Configuración corregida y jobs cerrados | Antes de validar onboarding |
| DEP-001 | Media | Dependencias | Registrado | Alertas moderadas transitivas OCI/Prisma | Evaluación de paquetes OCI específicos sin regresiones | Hardening productivo |
| DOC-001 | Baja | Documentación | En curso | Documentos con estados superados | Roadmap y estado actual sin contradicciones | Esta etapa |
```

- [ ] **Step 2: Corregir contradicciones documentales sin reescribir el historial**

Actualizar `docs/ESTADO_ACTUAL_FINOPS.md` para indicar que CI ya ejecuta integración PostgreSQL/API y que la falta de ingesta diaria es una decisión temporal de desarrollo.

- [ ] **Step 3: Validar que los documentos no vuelvan a presentar deuda aceptada como incidente activo**

Run:

```powershell
rg -n "integración Docker.*pendiente|Supabase.*inactiv|permanentemente encendido" docs PROGRESO_ROADMAP_FINOPS.md
```

Expected: no afirmaciones incompatibles con el estado actual.

- [ ] **Step 4: Commit**

```bash
git add docs/DEUDA_TECNICA.md docs/ROADMAP_PRODUCTO.md docs/ESTADO_ACTUAL_FINOPS.md PROGRESO_ROADMAP_FINOPS.md
git commit -m "docs: register FinOps development debt"
```

---

### Task 2: Inventario Cloud Navegable

**Files:**
- Modify: `finops-backend/src/application/services/TechnicalMetricsService.ts`
- Modify: `finops-backend/src/application/services/TechnicalMetricsService.test.ts`
- Modify: `finops-backend/src/presentation/controllers/TechnicalMetricsController.ts`
- Modify: `finops-backend/src/presentation/routes/technicalMetricsRoutes.ts`
- Modify: `finops-app/src/services/api.ts`
- Create: `finops-app/src/views/CloudInventory.tsx`
- Modify: `finops-app/src/App.tsx`
- Modify: `finops-app/src/components/Sidebar.tsx`

**Interfaces:**
- Consumes: `TechnicalMetricsService.listResources()` y `GET /api/v1/technical-metrics/resources`.
- Produces: `GET /api/v1/technical-metrics/resources/:externalResourceId` y vista `inventario_cloud`.

- [ ] **Step 1: Escribir tests de aislamiento y recurso inexistente**

```ts
it('returns only the requested tenant resource', async () => {
  const detail = await service.getResource('tenant-a', 'ocid1.instance.demo');
  expect(detail.externalResourceId).toBe('ocid1.instance.demo');
});

it('returns undefined when the resource is not owned by the tenant', async () => {
  await expect(service.getResource('tenant-b', 'ocid1.instance.demo')).resolves.toBeUndefined();
});
```

- [ ] **Step 2: Ejecutar el test y confirmar que falla**

Run: `npm test -- TechnicalMetricsService.test.ts --run`

Expected: FAIL porque `getResource` todavía no existe.

- [ ] **Step 3: Reutilizar el repositorio existente**

Añadir a `IResourceMetricRepository` y `PrismaResourceMetricRepository`:

```ts
findResourceForTenant(tenantId: string, externalResourceId: string): Promise<CloudResourceItem | undefined>;
```

La consulta Prisma debe filtrar simultáneamente por `tenantId` y `externalResourceId`.

- [ ] **Step 4: Exponer el endpoint de detalle básico**

```ts
router.get('/resources/:externalResourceId', requireAuth, technicalMetricsController.getResource);
```

Respuesta:

```ts
interface TechnicalResourceResponse {
  readonly resource: CloudResourceItem;
}
```

Usar `404` si el recurso no pertenece al tenant.

- [ ] **Step 5: Crear la vista de inventario**

La tabla debe mostrar únicamente datos existentes:

- nombre o identificador externo;
- proveedor;
- tipo y servicio;
- región;
- estado;
- primera y última observación;
- acción “Ver detalle”.

Filtros locales: texto, proveedor, estado y tipo. No agregar paginación nueva hasta que el límite existente demuestre ser insuficiente.

- [ ] **Step 6: Integrar navegación**

Agregar `inventario_cloud` al tipo `View`, al switch de `App.tsx` y al menú con etiqueta `Inventario Cloud`.

- [ ] **Step 7: Verificar y commit**

Run:

```bash
cd finops-backend && npm test -- TechnicalMetricsService.test.ts --run && npm run typecheck
cd ../finops-app && npm run lint && npm run build
```

Commit: `feat: add tenant cloud inventory`

---

### Task 3: Sincronización Manual Por Cuenta Cloud

**Files:**
- Modify: `finops-backend/src/application/services/CloudConnectionService.ts`
- Modify: `finops-backend/src/application/services/CloudConnectionService.test.ts`
- Modify: `finops-backend/src/presentation/controllers/CloudConnectionController.ts`
- Modify: `finops-backend/src/presentation/routes/cloudConnectionRoutes.ts`
- Modify: `finops-app/src/services/api.ts`
- Modify: `finops-app/src/views/Ingesta.tsx`

**Interfaces:**
- Consumes: endpoints actuales `validate`, `ingestion-jobs`, `/ingestion/backfill` y `/ingestion/readiness`.
- Produces: una acción UI “Sincronizar ahora” que encadena validación y jobs manuales sin crear un scheduler nuevo.

- [ ] **Step 1: Definir el contrato de sincronización manual**

```ts
interface ManualSyncRequest {
  readonly includeInventory: boolean;
  readonly includeTechnicalMetrics: boolean;
  readonly includeBillingExport: boolean;
}

interface ManualSyncResult {
  readonly connectionId: string;
  readonly queuedJobIds: readonly string[];
  readonly skipped: readonly string[];
}
```

- [ ] **Step 2: Probar que no se encolen fuentes sin configuración válida**

Casos mínimos:

- conexión de otro tenant → `404`;
- conexión inactiva → `409`;
- FOCUS no configurado → se agrega a `skipped`, no se crea job;
- inventario configurado → se crea un único job;
- job equivalente pendiente → no se duplica.

- [ ] **Step 3: Implementar reutilizando el creador de jobs existente**

Endpoint:

```ts
router.post('/:id/sync', requireAuth, cloudConnectionController.syncNow);
```

No ejecutar SDK dentro del request HTTP; solo validar y encolar. El worker se inicia manualmente junto con el backend durante desarrollo.

- [ ] **Step 4: Completar la UI de Ingesta**

Por conexión mostrar:

- estado de validación;
- fuentes disponibles;
- última ejecución por fuente;
- botón `Sincronizar ahora`;
- resultado de jobs creados u omitidos;
- enlace al historial existente.

- [ ] **Step 5: Verificar y commit**

Run:

```bash
cd finops-backend && npm test -- CloudConnectionService.test.ts --run && npm run typecheck
cd ../finops-app && npm run lint && npm run build
```

Commit: `feat: add manual cloud synchronization`

---

### Task 4: Detalle 360 Del Recurso

**Files:**
- Modify: `finops-backend/src/domain/interfaces/IResourceMetricRepository.ts`
- Modify: `finops-backend/src/infrastructure/repositories/PrismaResourceMetricRepository.ts`
- Modify: `finops-backend/src/application/services/TechnicalMetricsService.ts`
- Modify: `finops-backend/src/presentation/controllers/TechnicalMetricsController.ts`
- Modify: `finops-app/src/services/api.ts`
- Create: `finops-app/src/views/CloudResourceDetail.tsx`
- Modify: `finops-app/src/App.tsx`

**Interfaces:**
- Consumes: inventario de Task 2, resumen técnico, contexto de costo y recomendaciones existentes.
- Produces: `GET /api/v1/technical-metrics/resources/:externalResourceId/summary`.

- [ ] **Step 1: Definir la respuesta sin duplicar cálculos**

```ts
interface CloudResourceSummary {
  readonly resource: CloudResourceItem;
  readonly metrics: readonly TechnicalMetricSummaryItem[];
  readonly costs: readonly TechnicalCostContextItem[];
  readonly evidence: {
    readonly sampleCount: number;
    readonly coverageDays: number;
    readonly latestSampleAt?: Date;
    readonly strength: 'NONE' | 'WEAK' | 'MODERATE' | 'STRONG';
  };
}
```

- [ ] **Step 2: Escribir tests**

Verificar:

- costo y métricas se consultan por `externalResourceId` exacto;
- no se mezclan recursos con el mismo nombre;
- `strength` es `NONE` sin muestras y nunca se inventan métricas;
- tenant incorrecto devuelve `undefined`.

- [ ] **Step 3: Implementar componiendo métodos existentes**

`TechnicalMetricsService.getResourceSummary()` debe reutilizar:

- `findResourceForTenant`;
- `listMetricSummariesForTenant` con filtro de recurso;
- `listCostContextForResources`.

No crear una segunda consulta analítica paralela.

- [ ] **Step 4: Crear la vista 360**

Bloques funcionales:

1. identidad e inventario;
2. cobertura y frescura;
3. métricas técnicas principales;
4. costo asociado;
5. recomendaciones relacionadas obtenidas desde el endpoint existente;
6. aviso explícito cuando no exista evidencia suficiente.

- [ ] **Step 5: Verificar y commit**

Run:

```bash
cd finops-backend && npm test -- TechnicalMetricsService.test.ts --run && npm run typecheck
cd ../finops-app && npm run lint && npm run build
```

Commit: `feat: add cloud resource intelligence detail`

---

### Task 5: Recomendaciones IA Desde El Recurso 360

**Files:**
- Modify: `finops-backend/src/application/services/FinOpsAiService.ts`
- Modify: `finops-backend/src/application/services/FinOpsAiService.test.ts`
- Modify: `finops-backend/src/application/services/ai/RecommendationReadinessGate.ts`
- Modify: `finops-backend/src/application/services/ai/evaluation/goldenScenarios.ts`
- Modify: `finops-backend/src/presentation/controllers/AiController.ts`
- Modify: `finops-app/src/services/api.ts`
- Modify: `finops-app/src/views/CloudResourceDetail.tsx`

**Interfaces:**
- Consumes: `CloudResourceSummary` y guardrails determinísticos existentes.
- Produces: generación opcional limitada a un `externalResourceId`.

- [ ] **Step 1: Extender la solicitud existente**

```ts
interface GenerateRecommendationsRequest {
  readonly externalResourceId?: string;
}
```

Si no se envía, conservar el comportamiento actual. Si se envía, toda evidencia, candidatos y salida deben limitarse al recurso del tenant.

- [ ] **Step 2: Añadir escenarios dorados**

- recurso con costo y evidencia técnica fuerte → recomendación ejecutable permitida;
- costo sin métricas → solo validación técnica pendiente;
- CPU alta sostenida → bloquear reducción de capacidad;
- identificador de otro tenant → no generar;
- respuesta IA con otro recurso → auditoría determinística rechaza.

- [ ] **Step 3: Implementar el filtro antes de llamar al LLM**

El identificador debe aplicarse al ensamblar contexto y no filtrarse únicamente después de recibir la respuesta.

- [ ] **Step 4: Añadir acción en detalle 360**

Botón: `Analizar este recurso con IA`.

Mostrar antes de llamar:

- nivel de evidencia;
- cobertura;
- fecha de última muestra;
- advertencia si la salida solo podrá ser de validación.

- [ ] **Step 5: Verificar y commit**

Run:

```bash
cd finops-backend && npm test -- FinOpsAiService.test.ts --run && npm run test:ai:offline && npm run typecheck
cd ../finops-app && npm run lint && npm run build
```

Commit: `feat: generate resource-scoped recommendations`

---

### Task 6: Aceptación End-To-End Y Cierre De Etapa

**Files:**
- Modify: `finops-backend/scripts/testing/api-smoke.ts`
- Modify: `finops-app/e2e/finops-app.spec.ts`
- Modify: `finops-backend/PROGRESO_ROADMAP_FINOPS.md`
- Modify: `finops-backend/docs/ESTADO_ACTUAL_FINOPS.md`
- Modify: `finops-backend/docs/DEUDA_TECNICA.md`

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces: evidencia reproducible de la rebanada vertical completa.

- [ ] **Step 1: Extender fixtures y smoke API**

Comprobar:

1. inventario lista recursos del tenant;
2. detalle de recurso responde;
3. resumen 360 contiene costo/métricas sin mezclar tenants;
4. sincronización manual encola sin ejecutar inline;
5. solicitud IA por recurso respeta el identificador.

- [ ] **Step 2: Extender Playwright**

Flujo:

```text
login → seleccionar tenant → Inventario Cloud → filtrar → abrir recurso → revisar evidencia → volver
```

El E2E no debe llamar al proveedor LLM ni a OCI/AWS; usar fixtures HTTP existentes.

- [ ] **Step 3: Ejecutar validación completa**

Run:

```bash
cd finops-backend && npm run typecheck && npm test && npm run test:ai:offline && npm run build
cd ../finops-app && npm run lint && npm run build && npm run test:e2e:smoke
```

Expected: CI local equivalente en verde.

- [ ] **Step 4: Actualizar roadmap y deuda**

Marcar la rebanada como completada, pero mantener registrados sin resolver:

- RLS y rol DB dedicado;
- worker/scheduler siempre encendidos;
- dependencias OCI/Prisma;
- observabilidad centralizada;
- AWS real.

- [ ] **Step 5: Commit**

```bash
git add scripts/testing/api-smoke.ts PROGRESO_ROADMAP_FINOPS.md docs/ESTADO_ACTUAL_FINOPS.md docs/DEUDA_TECNICA.md
git commit -m "test: verify resource intelligence workflow"
```

---

## Criterio De Cierre

La etapa termina cuando un técnico puede, con la aplicación ejecutada manualmente:

1. seleccionar tenant;
2. sincronizar una cuenta cloud;
3. consultar su inventario;
4. abrir un recurso;
5. ver costo, métricas, cobertura y recomendaciones relacionadas;
6. solicitar análisis IA únicamente para ese recurso;
7. comprobar que la recomendación fue auditada y que no se generó con evidencia débil.

La operación 24/7, RLS, secretos externos y dependencias moderadas quedan registradas para la fase de hardening y no bloquean este cierre funcional.
