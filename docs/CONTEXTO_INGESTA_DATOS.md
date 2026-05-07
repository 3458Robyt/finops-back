# Contexto De Ingesta De Datos FinOps

Este documento resume lo trabajado en este fork sobre la ingesta real de datos cloud. Sirve para pasar contexto al chat principal sin depender del historial completo de esta conversacion.

## Objetivo

Se definio e inicio la implementacion de una base de ingesta real para una plataforma FinOps tipo MSP. La empresa operadora administra nubes de multiples clientes externos, y los usuarios principales son tecnicos FinOps. Los clientes contratantes tambien podran tener usuarios con permisos de visualizacion/aprobacion.

La ingesta se diseno para soportar muchas conexiones cloud por cliente, especialmente cuentas raiz u organizaciones cloud, no cuentas sueltas una por una.

## Fundamentos Acordados

- El modelo correcto es multi-tenant jerarquico.
- La frontera de aislamiento de datos es el cliente contratante.
- Existe una organizacion operadora global encima de los clientes.
- Los tecnicos FinOps pueden tener acceso multi-cliente por asignacion.
- Los clientes contratantes tienen usuarios visores/aprobadores limitados a su propio tenant.
- La unidad principal de conexion cloud es la cuenta raiz, organizacion, tenancy o billing account principal.
- Primera ola de proveedores: AWS y OCI.
- Azure, GCP y otros deben quedar soportables por arquitectura, pero no implementados todavia.
- La fuente oficial de costos debe ser export automatico de billing/cost, preferiblemente FOCUS.
- La ingesta de costos no debe depender de descargas manuales ni uploads manuales.
- La aplicacion puede usar credenciales admin temporales para provisioning.
- Las credenciales admin temporales no se deben persistir.
- Despues del provisioning se deben eliminar o revocar.
- La operacion diaria debe usar credenciales minimas, cifradas y con permisos limitados.
- Los exports crudos se centralizan en storage S3-compatible del operador.
- Debe existir separacion fuerte por cliente, idealmente bucket por cliente.
- Retencion acordada: 24 meses.
- Ademas de costos, se deben ingerir inventario y metricas tecnicas.
- Las metricas tecnicas objetivo son cada 30 minutos.
- Los agentes son opcionales: la app debe funcionar sin agentes, pero puede enriquecer datos si se instalan.
- Supabase se usa en desarrollo, pero la arquitectura final debe ser PostgreSQL portable.
- No se tomo MCP ni Inngest como fundamento de ingesta productiva. La base implementada apunta a workers/backend propios con jobs persistidos en PostgreSQL.

## Decision Tecnica Sobre Proveedores

Se concluyo que los principales proveedores si tienen formas automaticas de entregar datos de costos al menos diariamente o varias veces al dia, pero no se debe prometer tiempo real contable universal.

La estrategia correcta es separar dos capas:

1. **Fuente oficial de costos**
   - Exports automaticos de billing/cost.
   - Preferiblemente FOCUS.
   - Usada para dashboard financiero, IA, recomendaciones y auditoria.

2. **Fuente tecnica/provisional**
   - Inventario y metricas nativas por SDK/API.
   - Frecuencia objetivo de 30 minutos.
   - Usada para alertas tempranas, rightsizing y contexto tecnico.

Referencias revisadas durante el analisis:

- AWS Data Exports: https://docs.aws.amazon.com/cur/latest/userguide/dataexports-create.html
- AWS S3 Data Export bucket setup: https://docs.aws.amazon.com/cur/latest/userguide/dataexports-s3-bucket.html
- OCI Cost Reports: https://docs.oracle.com/en-us/iaas/Content/Billing/Concepts/costusagereportsoverview.htm
- FOCUS: https://focus.finops.org/

## Implementacion Realizada

Se implemento la primera base estructural de ingesta en `finops-backend`. Esta fase no implementa todavia conectores productivos AWS/OCI, pero deja la base de datos, contratos de dominio, repositorio, servicio y endpoints listos para montar esos conectores.

### Migracion Principal

Se agrego la migracion:

```text
prisma/migrations/202605010001_msp_ingestion_foundation/migration.sql
```

Esta migracion fue aplicada contra la base PostgreSQL/Supabase configurada con:

```text
npx prisma migrate deploy
```

Resultado: la migracion se aplico exitosamente.

Tambien se ejecuto una verificacion contra la BD confirmando que existen entradas iniciales en `provider_catalog`:

- `aws`
- `oci`

## Cambios En Prisma Schema

Archivo modificado:

```text
prisma/schema.prisma
```

Se agregaron nuevos enums:

- `TenantAccessRole`
- `ProviderCapability`
- `CredentialPurpose`
- `CredentialStatus`
- `IngestionJobStatus`
- `IngestionSourceType`
- `DataQualityStatus`
- `CloudResourceStatus`
- `AgentInstallationStatus`

Se extendieron enums existentes:

- `UserRole`
  - Se mantuvieron `ADMIN` y `VIEWER`.
  - Se agregaron `OPERATOR_ADMIN`, `FINOPS_TECHNICIAN`, `CLIENT_APPROVER`, `CLIENT_VIEWER`.

- `CloudProvider`
  - Se mantuvieron `AWS` y `OCI`.
  - Se agregaron `AZURE`, `GCP`, `CUSTOM`.

Se agregaron tablas/modelos principales:

- `OperatorOrganization`
- `TenantAccessAssignment`
- `ProviderCatalog`
- `CloudConnection`
- `CloudConnectionCredential`
- `OperatorStorageLocation`
- `CloudExportConfig`
- `IngestionJob`
- `IngestionObject`
- `IngestionWatermark`
- `FocusCostLineItem`
- `CloudResource`
- `ResourceMetricSample`
- `AgentInstallation`
- `DataQualityCheck`

Tambien se agrego `cloudConnectionId` opcional a `IngestionRun` para conectar la ingesta antigua con la nueva arquitectura.

## Proposito De Las Tablas Nuevas

### `operator_organizations`

Representa la empresa FinOps operadora. Es la capa superior del modelo MSP.

### `tenant_access_assignments`

Define que tecnicos de la empresa operadora pueden acceder a que clientes contratantes.

### `provider_catalog`

Catalogo extensible de proveedores soportados. Evita depender solamente de enums rigidos. Incluye capacidades como:

- FOCUS export
- inventory
- technical metrics
- optional agents
- cross account delivery

### `cloud_connections`

Representa una conexion raiz de un cliente contra un proveedor cloud. Ejemplos:

- AWS Organization / payer account
- OCI Tenancy raiz
- Futuro: Azure billing account/subscription tree
- Futuro: GCP billing account/organization

### `cloud_connection_credentials`

Guarda credenciales cifradas por proposito. Esta tabla esta pensada para credenciales operativas minimas, no para credenciales admin permanentes.

Propositos posibles:

- `TEMPORARY_ADMIN`
- `OPERATIONAL`
- `BILLING_EXPORT_READ`
- `INVENTORY_READ`
- `METRICS_READ`
- `STORAGE_READ`
- `STORAGE_WRITE`

Aunque existe el proposito `TEMPORARY_ADMIN`, el principio acordado es que las credenciales admin temporales no deben persistirse como operativas. El endpoint implementado actualmente no las guarda.

### `operator_storage_locations`

Define ubicaciones de storage S3-compatible del operador, con separacion por cliente.

### `cloud_export_configs`

Representa exports automaticos configurados por proveedor.

### `ingestion_jobs`

Cola persistida de jobs de ingesta. Permite construir workers propios con reintentos y locking.

### `ingestion_objects`

Registra objetos o particiones descubiertas/procesadas, con URI, ETag, hash, estado y conteo de filas. Es clave para idempotencia.

### `ingestion_watermarks`

Registra ultimo punto confiable procesado por fuente, conexion y cliente.

### `focus_cost_line_items`

Tabla normalizada de costos FOCUS versionados. Es la futura fuente fuerte para costos oficiales.

### `cloud_resources`

Inventario normalizado de recursos cloud detectados.

### `resource_metric_samples`

Muestras de metricas tecnicas por recurso, con granularidad objetivo de 1800 segundos.

### `agent_installations`

Estado de agentes opcionales por recurso.

### `data_quality_checks`

Checks de frescura, completitud, schema drift, fallos de ingesta y otros controles.

## Archivos De Dominio Agregados

Se agrego:

```text
src/domain/models/CloudConnection.ts
```

Contiene tipos de dominio para:

- `ProviderCode`
- `CloudConnectionStatus`
- `IngestionSourceType`
- `IngestionJobStatus`
- `DataQualityStatus`
- `ProviderCatalogEntry`
- `CloudConnectionSummary`
- `IngestionHealthSummary`

Se agrego:

```text
src/domain/interfaces/ICloudConnectionRepository.ts
```

Contrato del repositorio para:

- listar catalogo de proveedores,
- buscar proveedor,
- crear conexion cloud,
- buscar/listar conexiones por tenant,
- marcar validacion,
- crear jobs de ingesta,
- consultar salud de ingesta.

Se agrego:

```text
src/domain/interfaces/ICloudProviderPlugin.ts
```

Contrato futuro para plugins de proveedor. Define:

- `CloudProviderPlugin`
- `TemporaryAdminProvisioningInput`
- `TemporaryAdminProvisioningResult`

Este contrato es la base para implementar AWS/OCI reales mas adelante.

## Cambios En Roles/Auth

Archivo modificado:

```text
src/domain/models/AuthContext.ts
```

Se amplio `UserRole` para soportar:

- `ADMIN`
- `VIEWER`
- `OPERATOR_ADMIN`
- `FINOPS_TECHNICIAN`
- `CLIENT_APPROVER`
- `CLIENT_VIEWER`

Archivo modificado:

```text
src/application/services/AuthService.ts
```

`LoginResult.user.role` ahora usa `UserRole` en vez de limitarse a `ADMIN | VIEWER`.

Esto mantiene compatibilidad con usuarios existentes y habilita roles MSP.

## Repositorio Implementado

Se agrego:

```text
src/infrastructure/repositories/PrismaCloudConnectionRepository.ts
```

Responsabilidades:

- `listProviderCatalog`
- `findProviderCatalog`
- `createCloudConnection`
- `findCloudConnectionForTenant`
- `listCloudConnectionsForTenant`
- `markCloudConnectionValidated`
- `createIngestionJob`
- `getIngestionHealth`

Este repositorio usa Prisma y mapea los modelos generados a tipos de dominio.

## Servicio Implementado

Se agrego:

```text
src/application/services/CloudConnectionService.ts
```

Responsabilidades:

- listar proveedores,
- listar conexiones,
- registrar conexion cloud raiz,
- recibir credencial admin temporal sin persistirla,
- validar conexion,
- crear jobs de ingesta,
- consultar salud de ingesta.

Punto importante de seguridad:

```text
provisionWithTemporaryAdmin(...)
```

Actualmente devuelve:

```json
{
  "adminCredentialStored": false,
  "status": "PENDING_PROVIDER_AUTOMATION"
}
```

Esto deja claro que la credencial admin temporal fue recibida solo en memoria y no se guardo.

La automatizacion real por proveedor queda pendiente para la siguiente fase.

## API Implementada

Se agrego:

```text
src/presentation/controllers/CloudConnectionController.ts
src/presentation/routes/cloudConnectionRoutes.ts
```

Tambien se conecto en:

```text
src/presentation/server.ts
src/index.ts
```

Endpoints nuevos:

```http
GET /api/v1/cloud-connections/providers
GET /api/v1/cloud-connections
POST /api/v1/cloud-connections
POST /api/v1/cloud-connections/:id/provision
POST /api/v1/cloud-connections/:id/validate
POST /api/v1/cloud-connections/:id/ingestion-jobs
GET /api/v1/cloud-connections/:id/ingestion-health
```

Todos los endpoints requieren JWT mediante el middleware existente.

### Crear Conexion

```http
POST /api/v1/cloud-connections
Authorization: Bearer <JWT>
Content-Type: application/json
```

Body:

```json
{
  "providerCode": "aws",
  "rootExternalId": "123456789012",
  "name": "AWS Organization Principal",
  "defaultRegion": "us-east-1",
  "metadata": {
    "environment": "prod"
  }
}
```

### Provisioning Con Admin Temporal

```http
POST /api/v1/cloud-connections/:id/provision
Authorization: Bearer <JWT>
Content-Type: application/json
```

Body:

```json
{
  "temporaryAdminCredential": {
    "accessKeyId": "temporal",
    "secretAccessKey": "temporal"
  }
}
```

Respuesta esperada por ahora:

```json
{
  "success": true,
  "provisioning": {
    "cloudConnectionId": "...",
    "adminCredentialStored": false,
    "status": "PENDING_PROVIDER_AUTOMATION",
    "messages": [
      "La credencial admin temporal fue recibida solo en memoria y no se persistio.",
      "La automatizacion especifica de AWS/OCI debe crear una credencial operativa minima antes de activar ingesta productiva."
    ]
  }
}
```

### Crear Job De Ingesta

```http
POST /api/v1/cloud-connections/:id/ingestion-jobs
Authorization: Bearer <JWT>
Content-Type: application/json
```

Body:

```json
{
  "sourceType": "BILLING_EXPORT",
  "targetStart": "2026-04-01T00:00:00.000Z",
  "targetEnd": "2026-04-02T00:00:00.000Z"
}
```

Valores validos para `sourceType`:

- `BILLING_EXPORT`
- `INVENTORY`
- `TECHNICAL_METRIC`
- `AGENT_METRIC`

## Tests Agregados

Se agrego:

```text
src/application/services/CloudConnectionService.test.ts
```

Cubre:

- registro de conexion cloud raiz contra proveedor habilitado,
- no persistencia de credenciales admin temporales,
- creacion de job de ingesta para el usuario autenticado.

## Verificaciones Ejecutadas

Se ejecutaron:

```powershell
npx.cmd prisma generate
npm.cmd run typecheck
npm.cmd test
npx.cmd prisma migrate deploy
npm.cmd run build
```

Resultados:

- Prisma generate: OK.
- Typecheck: OK.
- Tests: OK, 21 tests pasaron.
- Migracion deploy: OK.
- Build: OK.

Tambien se verifico en BD que `provider_catalog` contiene:

```json
[
  {
    "code": "aws",
    "provider": "AWS",
    "capabilities": [
      "FOCUS_EXPORT",
      "CROSS_ACCOUNT_DELIVERY",
      "INVENTORY",
      "TECHNICAL_METRICS",
      "OPTIONAL_AGENTS"
    ]
  },
  {
    "code": "oci",
    "provider": "OCI",
    "capabilities": [
      "FOCUS_EXPORT",
      "INVENTORY",
      "TECHNICAL_METRICS",
      "OPTIONAL_AGENTS"
    ]
  }
]
```

## Estado Actual

La base estructural de ingesta quedo implementada. Esto incluye:

- modelo de datos,
- migracion aplicada,
- catalogo inicial AWS/OCI,
- contratos de dominio,
- repositorio Prisma,
- servicio de aplicacion,
- endpoints REST,
- tests base,
- verificacion de build/typecheck.

Lo que todavia no esta implementado:

- provisioning real AWS con credencial admin temporal,
- provisioning real OCI con credencial admin temporal,
- creacion real de roles/usuarios operativos minimos,
- configuracion real de Data Exports AWS,
- lectura real de S3/operator storage,
- lectura real de OCI Cost Reports,
- parser FOCUS productivo conectado a `focus_cost_line_items`,
- worker real que procese `ingestion_jobs`,
- locking con `FOR UPDATE SKIP LOCKED`,
- reintentos reales,
- inventario AWS/OCI,
- metricas AWS/OCI cada 30 minutos,
- agentes opcionales reales,
- UI frontend para conexiones/estado/errores,
- permisos completos multi-cliente usando `tenant_access_assignments`.

## Siguiente Fase Recomendada

La siguiente fase deberia ser AWS primero:

1. Implementar `AwsCloudProviderPlugin`.
2. Recibir admin temporal solo en memoria.
3. Crear/verificar rol operativo minimo.
4. Configurar/verificar export FOCUS hacia storage del operador.
5. Guardar solo credencial operativa minima cifrada.
6. Revocar/eliminar admin temporal.
7. Crear worker que procese `BILLING_EXPORT` jobs.
8. Leer objetos S3-compatible.
9. Parsear FOCUS y guardar en `focus_cost_line_items`.
10. Crear checks de data quality y watermarks.

Despues de AWS, repetir con OCI usando la misma arquitectura.

## Nota Sobre Seguridad

La decision mas importante que debe preservarse es:

```text
Las credenciales admin del cliente nunca deben quedar como credenciales operativas permanentes.
```

Solo se deben usar para provisioning y luego eliminar/revocar. La app debe operar con credenciales minimas por proposito.

## Nota Sobre Worktree

Al momento de esta implementacion el worktree ya tenia multiples cambios previos no relacionados directamente con ingesta. No se revirtieron cambios ajenos. Los archivos nuevos/modificados relevantes a esta fase son los listados en este documento.
