# Ingesta SDK OCI/AWS

Este documento resume la configuracion operativa actual para ingesta productiva de costos, consumo facturado y metricas tecnicas. La regla de diseno se mantiene: FOCUS/Data Exports alimenta costos y uso facturado; Monitoring/CloudWatch alimenta CPU, red, disco y memoria cuando el proveedor o agente la entregue.

## Estado verificado

### OCI

- Credencial operativa: perfil OCI CLI registrado cifrado con `npm run oci:register-profile`.
- Worker: `npm run ingestion:worker:once`.
- Job manual: `npm run ingestion:create-job`.
- Benchmark real ejecutado contra Supabase/OCI:
  - ventana: `2026-06-04T01:30:00Z` a `2026-06-04T20:30:00Z`;
  - fuente: `TECHNICAL_METRIC`;
  - llamadas SDK: 11;
  - muestras normalizadas: 429;
  - duracion interna reportada: 660 ms;
  - warnings: ninguno.
- Hallazgo corregido: en el SDK TypeScript de OCI, `SummarizeMetricsDataResponse` expone `items`; leer `summarizedMetricsData` producia 0 muestras aunque OCI CLI si devolvia datos.

### AWS

- Credencial operativa: rol `AssumeRole` registrable cifrado con `npm run aws:register-role`.
- Worker: `npm run ingestion:worker:once`.
- Job manual: `npm run ingestion:create-job -- --provider aws`.
- Prueba actual: unitaria, sin credenciales reales, valida mapeo de `GetMetricData` hacia `resource_metric_samples` y lectura FOCUS desde S3 con discovery por prefijo.
- Pendiente para benchmark real: crear una conexion AWS, registrar rol operativo, configurar `awsMetricDefinitions` y/o `awsFocusExportLocations`.

### FOCUS SDK

- AWS `BILLING_EXPORT`: cubierto por test de adapter con `ListObjectsV2Command` y `GetObjectCommand`.
- OCI `BILLING_EXPORT`: cubierto por test de adapter con `listObjects` y `getObject`.
- Estas pruebas verifican discovery, filtrado `.csv`/`.csv.gz`, lectura de contenido y normalizacion hacia filas FOCUS canonicas.
- Pendiente: ejecutar contra buckets reales y medir objetos/minuto, filas/minuto, errores por permisos y comportamiento con particiones grandes.

## Comandos operativos

### Preflight

```powershell
npm run ingestion:worker:preflight
```

Debe devolver `DATABASE_URL=true` y `CREDENTIAL_ENCRYPTION_KEY=true`. No imprime valores.

### Doctor de readiness

```powershell
npm run ingestion:doctor
```

Inspecciona Supabase sin exponer secretos:

- conexiones AWS/OCI activas;
- propositos de credenciales activas;
- conteos de metadata de metricas y FOCUS;
- ultimos jobs de ingesta y resumen de resultados;
- issues `BLOCKER`, `WARNING` o `INFO`.

Estado observado el 2026-06-05: OCI tiene credencial operativa y 11 definiciones de metricas; faltan objetos/prefijos FOCUS de OCI y no existe conexion AWS activa.

### Registrar credencial OCI desde perfil CLI

```powershell
npm run oci:register-profile -- --profile FINOPS_READER --summary-series downloads/oci-metrics-test-20260604-202524/summary-series.json
```

Esto:

- lee el perfil local de `~/.oci/config`;
- lee la llave privada local;
- cifra la credencial antes de guardarla;
- actualiza `metadata.ociMetricDefinitions` si se pasa `--summary-series`.

No se debe commitear `.oci/`, `.pem`, `.key`, `.env` ni descargas.

### Registrar rol AWS

```powershell
npm run aws:register-role -- --connection-id <cloud_connection_id> --role-arn <role_arn> --external-id <external_id> --region us-east-1 --purpose OPERATIONAL
```

Notas:

- `--external-id` no se imprime en la salida.
- El payload se guarda cifrado en `cloud_connection_credentials`.
- Propositos soportados: `OPERATIONAL`, `BILLING_EXPORT_READ`, `METRICS_READ`, `STORAGE_READ`.

### Crear job manual

Ventana relativa:

```powershell
npm run ingestion:create-job -- --provider oci --source-type TECHNICAL_METRIC --hours 24 --max-attempts 1
```

Ventana exacta:

```powershell
npm run ingestion:create-job -- --provider oci --source-type TECHNICAL_METRIC --start 2026-06-04T01:30:00Z --end 2026-06-04T20:30:00Z --max-attempts 1
```

Ejecutar worker:

```powershell
npm run ingestion:worker:once
```

### Configurar fuentes FOCUS sin editar Supabase a mano

OCI por prefijo:

```powershell
npm run ingestion:configure-focus -- --provider oci --mode location --namespace-name <namespace> --bucket-name <bucket> --prefix <prefix/> --focus-version 1.0 --max-objects 100
```

OCI por objeto directo:

```powershell
npm run ingestion:configure-focus -- --provider oci --mode object --namespace-name <namespace> --bucket-name <bucket> --object-name <path/report.csv.gz> --focus-version 1.0
```

AWS por prefijo:

```powershell
npm run ingestion:configure-focus -- --provider aws --mode location --bucket <bucket> --prefix <prefix/> --region us-east-1 --focus-version 1.0 --max-objects 100
```

AWS por objeto directo:

```powershell
npm run ingestion:configure-focus -- --provider aws --mode object --bucket <bucket> --key <path/report.csv.gz> --region us-east-1 --focus-version 1.0
```

Notas:

- Por defecto agrega la fuente nueva y conserva metadata previa.
- Usar `--replace` cuando se quiera reemplazar el arreglo del tipo seleccionado.
- El comando no maneja secretos; solo metadata de ubicacion de reportes.
- Despues de configurar, ejecutar `npm run ingestion:doctor` para verificar conteos de metadata.

### Previsualizar fuentes FOCUS sin ingerir

```powershell
npm run ingestion:preview-focus -- --provider oci --limit 20
```

```powershell
npm run ingestion:preview-focus -- --provider aws --connection-id <cloud_connection_id> --limit 20
```

Este comando:

- desencripta credenciales solo en memoria;
- lista objetos candidatos desde los prefijos configurados;
- incluye objetos directos configurados;
- filtra solo `.csv` y `.csv.gz`;
- no descarga contenido y no escribe filas en BD.

Estado observado el 2026-06-05 para OCI: `configuredObjects=0`, `configuredLocations=0`, `discoveredObjects=0`; falta configurar bucket/prefix u objeto FOCUS.

## Metadata esperada por proveedor

### OCI metricas tecnicas

Clave: `cloud_connections.metadata.ociMetricDefinitions`.

```json
[
  {
    "compartmentId": "ocid1.tenancy.oc1...",
    "namespace": "oci_computeagent",
    "metricName": "CpuUtilization",
    "resourceId": "ocid1.instance.oc1...",
    "query": "CpuUtilization[30m]{resourceId = \"ocid1.instance.oc1...\"}.mean()"
  }
]
```

### OCI FOCUS/Object Storage

Objetos directos:

```json
{
  "ociFocusReportObjects": [
    {
      "namespaceName": "namespace",
      "bucketName": "bucket",
      "objectName": "path/report.csv.gz",
      "focusVersion": "1.0"
    }
  ]
}
```

Discovery por prefijo:

```json
{
  "ociFocusReportLocations": [
    {
      "namespaceName": "namespace",
      "bucketName": "bucket",
      "prefix": "reports/focus/",
      "focusVersion": "1.0",
      "maxObjects": 100
    }
  ]
}
```

### AWS metricas tecnicas

Clave: `cloud_connections.metadata.awsMetricDefinitions`.

```json
[
  {
    "externalResourceId": "i-0123456789abcdef0",
    "region": "us-east-1",
    "namespace": "AWS/EC2",
    "metricName": "CPUUtilization",
    "stat": "Average",
    "unit": "Percent",
    "dimensions": [
      { "Name": "InstanceId", "Value": "i-0123456789abcdef0" }
    ]
  }
]
```

### AWS FOCUS/Data Exports S3

Objetos directos:

```json
{
  "awsFocusExportObjects": [
    {
      "bucket": "bucket",
      "key": "exports/focus/report.csv.gz",
      "region": "us-east-1",
      "focusVersion": "1.0"
    }
  ]
}
```

Discovery por prefijo:

```json
{
  "awsFocusExportLocations": [
    {
      "bucket": "bucket",
      "prefix": "exports/focus/",
      "region": "us-east-1",
      "focusVersion": "1.0",
      "maxObjects": 100
    }
  ]
}
```

## Permisos minimos esperados

### OCI

- Monitoring: leer metricas (`summarizeMetricsData`) en los compartimentos requeridos.
- Object Storage: listar y leer objetos de reportes FOCUS.
- La memoria tecnica de instancias depende de `oci_computeagent`; no debe inferirse desde FOCUS.

### AWS

- STS: el backend asume un rol del cliente mediante `AssumeRole`.
- Trust policy recomendada: limitar el principal del operador y exigir `sts:ExternalId`.
- CloudWatch: `cloudwatch:GetMetricData`.
- S3: `s3:ListBucket` sobre prefijos de export y `s3:GetObject` sobre objetos FOCUS.
- Memoria requiere CloudWatch Agent u otra fuente tecnica; no se obtiene de FOCUS.

## Fuentes oficiales usadas para diseno

- OCI Monitoring CLI `summarize-metrics-data`: https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/monitoring/metric-data/summarize-metrics-data.html
- OCI MQL reference: https://docs.oracle.com/iaas/Content/Monitoring/Reference/mql.htm
- AWS CloudWatch `GetMetricData`: https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_GetMetricData.html
- AWS FOCUS 1.0 with AWS columns: https://docs.aws.amazon.com/en_us/cur/latest/userguide/table-dictionary-focus-1-0-aws.html
- AWS third-party access with External ID: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_common-scenarios_third-party.html
