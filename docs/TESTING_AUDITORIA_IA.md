# Testing integral y auditoria IA

Este proyecto separa las pruebas en dos capas:

- Deterministicas: no llaman al proveedor IA y sirven para CI/regresion rapida.
- Live: llaman al proveedor IA real y usan fixtures aislados en una base de pruebas dedicada.

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

El smoke E2E del frontend (`npm run test:e2e:smoke`) no necesita API ni BD y se ejecuta en CI. El E2E
completo (`npm run test:e2e`) es un flujo de entorno, requiere backend y fixtures, y no debe llamarse en
CI sin credenciales y proveedor IA de prueba.

## Criterios de auditoria IA

La auditoria offline valida escenarios dorados y rubricas deterministicas. La auditoria live comprueba:

- respuesta de chat en espanol;
- recomendaciones con evidencia;
- ahorros no negativos;
- trazas IA persistidas;
- uso del backend real y del tenant E2E.
