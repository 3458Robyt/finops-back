# Onboarding cloud por tenant

> Documento operativo autoritativo. Estado verificado: 2026-07-16.

## Alcance y arquitectura

El onboarding reutiliza `cloud_connections`, credenciales cifradas, `ingestion_jobs`, watermarks,
quality checks, el scheduler y el worker persistente. No existe una segunda ruta de ingesta ni se
aprovisiona IAM desde FinOps.

El flujo normal se realiza en **Ingesta > Configurar cuentas cloud**:

1. Seleccionar el tenant activo.
2. Crear una conexión OCI o AWS.
3. Guardar una credencial read-only.
4. Validar capacidades por separado.
5. Configurar costos, FOCUS y métricas.
6. Previsualizar FOCUS sin ingerir.
7. Activar la sincronización inicial y el backfill.
8. Corregir o reintentar únicamente las fuentes fallidas.
9. Consultar Dashboard, Inventario y Métricas técnicas.

El estado es derivado de conexión, credenciales, validación, configuración y jobs. No se persiste
un estado monolítico de onboarding.

## Permisos de FinOps

| Operación | MASTER_ADMIN / ADMIN / OPERATOR_ADMIN | FINOPS_TECHNICIAN | VIEWER |
|---|---:|---:|---:|
| Consultar conexiones y readiness del tenant | Sí | Sí | Sí |
| Crear, editar o deshabilitar una conexión | Sí | Sí | No |
| Guardar o revocar credenciales | Sí | Sí | No |
| Validar, configurar fuentes y activar | Sí | Sí | No |
| Encolar, reintentar o cancelar jobs | Sí | Sí | No |

El `tenantId` se obtiene del JWT/contexto activo. Los repositorios vuelven a comprobar la
pertenencia; una conexión de otro tenant se responde como no encontrada.

## Credenciales

Las credenciales se cifran con AES-256-GCM mediante `CredentialCipher`. La respuesta solo contiene
ID, propósito, estado, etiqueta, principal externo y fechas. Nunca devuelve private key,
passphrase, ExternalId, access keys, session tokens ni payload cifrado.

### AWS

FinOps recibe un `roleArn`, `externalId` único por cliente y región. El backend controla el
`sessionName` y usa STS `AssumeRole`; no solicita usuario, contraseña ni access keys del cliente.

La policy del rol debe conceder solo las capacidades utilizadas:

- inventario: `ec2:DescribeInstances` y lecturas relacionadas;
- métricas: `cloudwatch:GetMetricData`;
- costos directos: `ce:GetCostAndUsage`;
- FOCUS: `s3:ListBucket` limitado al prefijo y `s3:GetObject` para el export.

La trust policy debe restringir el principal operador y exigir el ExternalId acordado.

### OCI

FinOps recibe `tenancyId`, `userId`, `fingerprint`, `privateKey`, región y, si aplica, passphrase.
La llave PEM se cifra inmediatamente. El usuario/grupo debe tener policies read-only para las
capacidades utilizadas:

- identidad y tenancy;
- Compute para inventario;
- Monitoring para métricas;
- Usage API para costo directo;
- Object Storage para listar y leer FOCUS.

El onboarding no crea usuarios, grupos, policies, compartments, buckets ni recursos cloud.

## Validación de capacidades

`POST /api/v1/cloud-connections/:id/validate` comprueba cada capacidad de forma independiente:

| Capacidad | Resultado posible | Efecto |
|---|---|---|
| IDENTITY | AVAILABLE / DENIED / ERROR | Confirma firma e identidad |
| INVENTORY | AVAILABLE / DENIED / ERROR | Habilita `cloud_resources` |
| COSTS | AVAILABLE / DENIED / ERROR | Habilita API directa |
| METRICS | AVAILABLE / DENIED / NOT_CONFIGURED / ERROR | Habilita muestras técnicas |
| STORAGE | AVAILABLE / DENIED / NOT_CONFIGURED / ERROR | Habilita FOCUS |

Una conexión puede quedar parcialmente operativa. Para activarla se exige identidad disponible y
al menos una capacidad de datos disponible. Un permiso ausente no invalida los demás.

## Configuración de fuentes

### Costos

- `AUTO`: usa FOCUS configurado; de lo contrario intenta API directa.
- `FOCUS`: exige un objeto o ubicación FOCUS válida.
- `PROVIDER_API`: usa AWS Cost Explorer u OCI Usage API.

La procedencia se conserva por conexión y fila; no se mezclan silenciosamente resultados FOCUS y
API directa para el mismo rango.

### Preview FOCUS

`POST /api/v1/cloud-connections/:id/focus-preview` lista objetos `.csv`/`.csv.gz` con límite y
timeout. No descarga contenido ni escribe costos. Devuelve objetos encontrados, formatos, fechas,
tamaños disponibles y errores por ubicación. Una ubicación inválida no oculta las válidas.

### Métricas

`PUT /api/v1/cloud-connections/:id/metric-definitions` acepta entre 1 y 100 definiciones y elimina
campos desconocidos antes de persistir.

- OCI: compartment, namespace, métrica, recurso y query/unidad opcionales.
- AWS: recurso, namespace, métrica, stat, región/unidad opcionales y 1–20 dimensiones.

FOCUS no se usa para inferir CPU, memoria, red, disco ni IOPS. Memoria puede requerir OCI Compute
Agent o CloudWatch Agent.

## Sincronización y recuperación

`POST /api/v1/cloud-connections/:id/activate` responde `202` y crea ventanas persistentes para
inventario, costos y métricas según la configuración disponible. No espera a los proveedores.

Las ventanas se alinean y tienen unicidad parcial mientras están `PENDING` o `RUNNING`. La
persistencia de FOCUS y métricas es idempotente. Las operaciones disponibles son:

- reintentar ventanas `FAILED` sin duplicar las exitosas;
- cancelar ventanas `PENDING` por fuente;
- dejar terminar una ventana `RUNNING`;
- deshabilitar la conexión sin borrar histórico.

El readiness informa conexión, credencial, validación, fuentes, jobs, bloqueos, datos afectados y
acción recomendada. Estados: sin credencial, requiere validación, sincronizando, parcial, listo o
requiere atención.

## Endpoints

| Método y ruta | Uso |
|---|---|
| `GET /api/v1/cloud-connections/providers` | Catálogo OCI/AWS |
| `GET /api/v1/cloud-connections` | Conexiones del tenant |
| `POST /api/v1/cloud-connections` | Crear conexión |
| `GET /api/v1/cloud-connections/:id/onboarding` | Detalle seguro y reanudable |
| `PATCH /api/v1/cloud-connections/:id` | Editar nombre/región |
| `PATCH /api/v1/cloud-connections/:id/status` | Habilitar/deshabilitar |
| `POST /api/v1/cloud-connections/:id/credentials` | Guardar/reemplazar credencial |
| `DELETE /api/v1/cloud-connections/:id/credentials/:credentialId` | Revocar localmente |
| `POST /api/v1/cloud-connections/:id/validate` | Validar capacidades |
| `PUT /api/v1/cloud-connections/:id/billing-source` | AUTO/FOCUS/PROVIDER_API |
| `POST /api/v1/ingestion/focus-sources` | Configurar ubicación/objeto FOCUS |
| `POST /api/v1/cloud-connections/:id/focus-preview` | Preview read-only |
| `PUT /api/v1/cloud-connections/:id/metric-definitions` | Configurar métricas |
| `POST /api/v1/cloud-connections/:id/activate` | Sincronización inicial |
| `POST /api/v1/cloud-connections/:id/ingestion-jobs` | Encolar ventana concreta |
| `POST /api/v1/cloud-connections/:id/ingestion-jobs/retry-failed` | Reintentar fallos |
| `POST /api/v1/cloud-connections/:id/ingestion-jobs/cancel-pending` | Cancelar pendientes |
| `GET /api/v1/ingestion/readiness` | Readiness consolidado del tenant |

## Verificación actual

### OCI real

Canary read-only del 2026-07-16:

- identidad: disponible;
- inventario: disponible;
- métricas: disponible;
- Object Storage/FOCUS: disponible;
- Usage API: denegada por policy;
- preview: 20 objetos descubiertos, sin errores de ubicación;
- estado: parcialmente operativo;
- llamadas reales: ~3.5 s; readiness: ~1 s;
- arranque del proceso de prueba: ~45 s por importación de `oci-sdk`.

La denegación de Usage API no bloquea FOCUS ni las demás capacidades.

### AWS

El contrato STS, inventario EC2, CloudWatch y FOCUS S3 está cubierto con fixtures y pruebas. No hay
cuenta/rol AWS real disponible en este entorno; no se considera validación productiva.

### Seguridad e integración

- El smoke API comprueba 13 mutaciones denegadas a `VIEWER`.
- Una lectura cross-tenant no descubre la conexión ajena.
- El alta no acepta metadata arbitraria. Los resúmenes públicos proyectan únicamente configuración
  operativa conocida y eliminan campos sensibles anidados; la conexión interna de ingesta conserva
  la configuración completa sin exponer credenciales.
- El payload completo de onboarding se revisa para no contener secretos.
- Supabase revoca acceso PostgREST `anon`/`authenticated` a las tablas operativas del onboarding.

## Solución de problemas

| Síntoma | Causa probable | Acción |
|---|---|---|
| Sin credencial | No existe una credencial activa | Guardar credencial read-only |
| Requiere validación | Credencial nueva o rotada | Ejecutar Validar acceso |
| COSTS denegado | Policy de Usage/Cost Explorer insuficiente | Conceder lectura o usar FOCUS |
| Métricas no configuradas | Falta definición vinculada a recurso | Agregar definición Monitoring/CloudWatch |
| Memoria ausente | Agente del proveedor no instalado | Instalar agente o no usar esa señal |
| FOCUS sin objetos | Bucket/prefix incorrecto o sin permisos | Ejecutar preview y corregir ubicación |
| Jobs fallidos | Error recuperable del proveedor/configuración | Corregir y reintentar esa fuente |
| Datos desactualizados | Backend/worker apagado en desarrollo | Ejecutar scheduler/worker manualmente |

## Comandos de verificación

```powershell
npm run typecheck
npm test
npm run build
npm run test:api:onboarding
npm run test:canary:oci-onboarding
```

El canary OCI exige configuración local válida y solo ejecuta lecturas. No imprime secretos ni
modifica recursos cloud.

La integración y Playwright completo también fueron verificados contra un schema PostgreSQL
efímero `finops_e2e_*`. El cliente Prisma configura ese schema tanto para queries generadas como
para SQL raw y el schema se elimina después de la ejecución.

## Fuentes oficiales

- AWS: acceso de terceros mediante roles y ExternalId:
  https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_common-scenarios_third-party.html
- AWS CloudWatch `GetMetricData`:
  https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_GetMetricData.html
- OCI: métodos de autenticación del SDK:
  https://docs.oracle.com/en-us/iaas/Content/API/Concepts/sdk_authentication_methods.htm
- OCI: archivo de configuración SDK/CLI:
  https://docs.oracle.com/en-us/iaas/Content/API/Concepts/sdkconfig.htm

## Fuera de alcance

No se almacenan usuarios/contraseñas cloud, no se crean policies IAM, no se remedian recursos y no
se eliminan datos históricos. Los scripts CLI permanecen como soporte técnico; la ruta normal es la
UI/API integrada.
