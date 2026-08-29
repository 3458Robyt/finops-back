# Testing integral y auditoria IA

Este proyecto separa las pruebas en dos capas:

- Deterministicas: no llaman al proveedor IA y sirven para CI/regresion rapida.
- Live: llaman al proveedor IA real y usan fixtures aislados en una base de pruebas dedicada.

La política de aceptación IA no depende únicamente del veredicto textual del
modelo: una recomendación o plan solo se acepta si el auditor devuelve
`APPROVED`, alcanza al menos 80/100, no tiene bloqueadores ni cambios requeridos
y todos sus checks pasan. Si alguna condición falla, el artefacto se rechaza o
se omite sin persistirlo.

## Base de datos de pruebas

No se deben crear fixtures contra `DATABASE_URL` productiva. La ruta recomendada es
`npm run test:integration:docker`, que levanta PostgreSQL en el puerto `55432`, aplica las migraciones
y exige `TEST_DATABASE_URL` con sufijo `_test` y `ALLOW_DESTRUCTIVE_TEST_DATABASE=true`. Si se usa una
rama de Supabase, debe ser una rama dedicada y su DSN debe configurarse únicamente como
`TEST_DATABASE_URL`; el proyecto principal no se usa para pruebas destructivas.

## Flujo recomendado

1. Crear fixtures E2E aislados (después de preparar la base de pruebas):

```bash
npm run test:fixtures:create
```

2. Levantar backend y frontend en terminales separadas:

```bash
npm run dev
```

```bash
cd ../finops-app
npm run dev
```

3. Ejecutar smoke API:

```bash
npm run test:api:smoke
```

Para una prueba reproducible sin depender de una API levantada ni de datos compartidos, usar el runner aislado:

```bash
npm run test:api:smoke:isolated
```

Este runner crea un schema `finops_e2e_*`, aplica todas las migraciones, crea credenciales temporales mediante
fixtures, inicia el backend con RLS runtime obligatorio, ejecuta el smoke general y el de onboarding, y elimina
schema/fixtures en `finally`. No debe apuntar a la base principal.

4. Ejecutar auditoria IA offline:

```bash
npm run test:ai:offline
```

5. Ejecutar auditoria IA live solo cuando se quiera consumir tokens:

```bash
$env:AI_LIVE_TESTS='true'
npm run test:ai:live
```

6. Ejecutar benchmark de metricas tecnicas:

```bash
npm run test:perf:technical-metrics
```

7. Ejecutar E2E frontend:

```bash
cd ../finops-app
npm run test:e2e
```

La suite anterior usa mocks para poder ejecutarse sin modificar datos externos.
Para probar la aplicación desplegada contra una cuenta real en modo solo
lectura, usar la suite separada:

```powershell
$env:E2E_REAL_BASE_URL='http://127.0.0.1:5173'
$env:E2E_REAL_ADMIN_EMAIL='cuenta-de-prueba'
$env:E2E_REAL_ADMIN_PASSWORD='secreto-local'
# Solo si la cuenta exige MFA:
$env:E2E_REAL_MFA_CODE='000000'
npm run test:e2e:real
```

Estas variables deben existir únicamente en el entorno local o en un gestor de
secretos. La suite recorre los módulos en 390, 1024, 1366 y 1920 px, verifica
tenant switching, filtros de métricas, errores de red, overflow y errores de
página. Rechaza cualquier mutación distinta de login, refresh o cambio de
tenant. No pulsa botones de generación persistente, aprobación, ejecución,
creación o borrado.

8. Limpiar fixtures de la base de pruebas:

```bash
cd ../finops-backend
npm run test:fixtures:cleanup
```

## Aislamiento de datos

Los fixtures crean tenants con slug `e2e-finops-*`. La limpieza solo borra tenants con ese prefijo y además
rechaza ejecutar si la URL no pertenece a una base con sufijo `_test` o si coincide con `DATABASE_URL`.
Como el modelo usa cascadas por tenant en los modulos principales, se eliminan también usuarios, costos,
recursos, metricas, recomendaciones, planes y trazas asociadas a esos tenants.

## Artefactos

Los artefactos quedan fuera de git:

- `.test-artifacts/e2e-fixtures.json`
- `.test-artifacts/ai-audit/*.json`
- `.test-artifacts/perf/*.json`
- `test-results/`
- `playwright-report/`

El E2E frontend mock (`npm run test:e2e`) no necesita API ni BD compartida y se ejecuta en CI; las pruebas
que dependen de fixtures se omiten de forma explícita cuando no existe el manifiesto aislado. El flujo
con backend, PostgreSQL y fixtures se ejecuta con `npm run test:e2e:full`. Ninguna de las dos suites debe
apuntarse a la base principal ni ejecutarse en CI sin las credenciales y servicios que correspondan.

## Criterios de auditoria IA

La auditoria offline valida escenarios dorados y rubricas deterministicas. La auditoria live comprueba:

- respuesta de chat en espanol;
- recomendaciones con evidencia;
- ahorros no negativos;
- trazas IA persistidas;
- uso del backend real y del tenant E2E.

## Última evidencia local

Al 2026-08-29, `npm run test:all` pasó con 123 archivos, 529 pruebas y 11 omitidas; `npm run test:ai:offline`
pasó 25/25. La rúbrica incluye alcance tenant/recurso, frescura y suficiencia técnica, idioma español,
ahorro máximo determinístico, ausencia de ejecución automática y ausencia de payloads de tool, SQL, shell o código.
El canary live requiere `AI_LIVE_TESTS=true`, crea un schema aislado y no es destructivo. El canary comparativo
de aprendizaje global reconstruido el 2026-08-13 autenticó después de corregir helpers/RLS portables; baseline y
candidate produjeron 3/3 recomendaciones aprobadas y ahorros no negativos, pero candidate obtuvo 90 frente a 92 de
baseline. La promoción fue rechazada por no demostrar mejora estricta y `AI-008` sigue abierto. Las corridas HTTP 422
anteriores se conservan como historial del proveedor.
La suite PostgreSQL aislada `npm run test:integration:isolated` pasó 10 archivos/17 pruebas y validó desde cero
las migraciones, la limpieza auth, el heartbeat y el readiness; no modifica la BD principal.
El 2026-08-12 `npm run test:api:smoke:isolated` también pasó: 35 verificaciones generales de API, creación y
evaluación idempotente de presupuesto/asignación, cambio de tenant, rechazo de acceso no autenticado, lecturas
operativas de onboarding, 13 mutaciones denegadas al viewer, aislamiento cross-tenant y redacción de payloads
sensibles. El schema `finops_e2e_api_*` y el manifiesto con contraseña temporal fueron eliminados.
