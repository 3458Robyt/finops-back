# OCI FOCUS Bootstrap

Este documento describe el flujo inicial para preparar una tenancy OCI para FinOps usando Cost Reports FOCUS.

## Decision

El flujo recomendado es por consola con OCI CLI, no configuracion manual desde navegador. La consola web sirve para iniciar sesion o confirmar permisos, pero el script necesita un perfil OCI CLI local o una sesion temporal creada con OCI CLI.

Esto deja el proceso reproducible, auditable y compatible con clientes MSP.

## Que Hace El Script

Archivos:

```text
finops-backend/scripts/oci-focus-bootstrap.ps1
finops-backend/scripts/oci_focus_wizard.py
```

Por defecto:

- valida que OCI CLI exista;
- lee `tenancy` y `region` desde el perfil OCI CLI;
- valida autenticacion contra la tenancy;
- muestra la politica IAM requerida;
- lista archivos bajo `FOCUS Reports` en el bucket Oracle-managed de Cost Reports.

Solo modifica OCI si se ejecuta con `-CreatePolicy`.

El script Python es el flujo recomendado si no quieres recordar parametros. Es un asistente interactivo que puede abrir el login oficial de OCI CLI en navegador y luego ejecutar las mismas validaciones.

No hace:

- no guarda credenciales;
- no descarga reportes;
- no escribe en Supabase/PostgreSQL;
- no crea objetos de ingesta;
- no parsea FOCUS todavia.

## Flujo Si Ya Estas Logueado En OCI Web

Estar logueado en la consola web no le da credenciales automaticamente al script. El script puede abrir el login oficial de OCI CLI en navegador para crear una sesion temporal:

```powershell
.\scripts\oci-focus-bootstrap.ps1 -BrowserLogin -Region <home-region>
```

Ejemplo:

```powershell
.\scripts\oci-focus-bootstrap.ps1 -BrowserLogin -Region sa-bogota-1
```

El equivalente con Python:

```powershell
python .\scripts\oci_focus_wizard.py --browser-login --region sa-bogota-1 --non-interactive
```

Internamente esto ejecuta:

```powershell
oci session authenticate --region <home-region> --profile-name finops-oci
```

OCI CLI abrira el navegador. Si ya tienes sesion web activa, normalmente solo confirmas el flujo.

O con el wizard Python:

```powershell
python .\scripts\oci_focus_wizard.py
```

## Flujo Con Perfil OCI CLI Normal

Si ya tienes `~/.oci/config` con API key:

```powershell
.\scripts\oci-focus-bootstrap.ps1 -Profile DEFAULT
```

Con Python:

```powershell
python .\scripts\oci_focus_wizard.py --profile DEFAULT --auth api_key --non-interactive
```

## Crear La Politica IAM Minima

La politica requerida por Oracle para leer Cost Reports es:

```text
define tenancy usage-report as ocid1.tenancy.oc1..aaaaaaaaned4fkpkisbwjlr56u7cj63lf3wffbilvqknstgtvzub7vhqkggq
endorse group <group_name> to read objects in tenancy usage-report
```

Para crearla desde el script:

```powershell
.\scripts\oci-focus-bootstrap.ps1 -Profile DEFAULT -GroupName FinOpsCostReportsReaders -CreatePolicy
```

Con Python:

```powershell
python .\scripts\oci_focus_wizard.py --profile DEFAULT --auth api_key --group-name FinOpsCostReportsReaders --create-policy --non-interactive
```

Si usas sesion temporal:

```powershell
.\scripts\oci-focus-bootstrap.ps1 -Profile finops-oci -Auth security_token -GroupName FinOpsCostReportsReaders -CreatePolicy
```

Con Python:

```powershell
python .\scripts\oci_focus_wizard.py --profile finops-oci --auth security_token --group-name FinOpsCostReportsReaders --create-policy --non-interactive
```

El grupo debe existir y el usuario autenticado debe tener permisos para crear politicas en la root compartment de la tenancy.

## Listar Reportes FOCUS

OCI publica Cost Reports FOCUS en Object Storage administrado por Oracle:

- namespace: `bling`
- bucket: OCID de la tenancy del cliente
- prefix: `FOCUS Reports`

Ejemplo:

```powershell
.\scripts\oci-focus-bootstrap.ps1 -Profile DEFAULT -Prefix "FOCUS Reports" -Limit 20
```

Con Python:

```powershell
python .\scripts\oci_focus_wizard.py --profile finops-oci --auth security_token --limit 20 --non-interactive
```

## Descargar Reportes FOCUS

La descarga queda desactivada por defecto. Para descargar los reportes listados:

```powershell
python .\scripts\oci_focus_wizard.py --profile finops-oci --auth security_token --limit 5 --download --non-interactive
```

Con login por navegador y descarga:

```powershell
python .\scripts\oci_focus_wizard.py --browser-login --region sa-bogota-1 --limit 5 --download --non-interactive
```

La carpeta por defecto es:

```text
finops-backend/downloads/oci-focus/<tenancy-ocid>/FOCUS Reports/...
```

Para elegir otra carpeta:

```powershell
python .\scripts\oci_focus_wizard.py --profile finops-oci --auth security_token --limit 5 --download --download-dir .\tmp\oci-focus --non-interactive
```

Si un archivo ya existe, se omite. Para sobrescribir:

```powershell
python .\scripts\oci_focus_wizard.py --profile finops-oci --auth security_token --limit 5 --download --overwrite --non-interactive
```

## Descargar Rango De Fechas En Bulk

Para bajar todos los FOCUS Reports en una sola llamada usando `oci os object bulk-download`:

```powershell
python .\scripts\oci_focus_wizard.py --profile finops-oci --auth security_token --bulk-download --parallel-operations-count 25 --non-interactive
```

Con login por navegador:

```powershell
python .\scripts\oci_focus_wizard.py --browser-login --region sa-bogota-1 --bulk-download --parallel-operations-count 25 --non-interactive
```

Para bajar los ultimos 3 meses en una sola llamada, usando filtros mensuales:

```powershell
python .\scripts\oci_focus_wizard.py --profile finops-oci --auth security_token --bulk-download --months-back 3 --parallel-operations-count 25 --non-interactive
```

Con login por navegador:

```powershell
python .\scripts\oci_focus_wizard.py --browser-login --region sa-bogota-1 --bulk-download --months-back 3 --parallel-operations-count 25 --non-interactive
```

Para un rango exacto:

```powershell
python .\scripts\oci_focus_wizard.py --profile finops-oci --auth security_token --bulk-download --start-date 2026-02-05 --end-date 2026-05-05 --non-interactive
```

Para probar sin descargar:

```powershell
python .\scripts\oci_focus_wizard.py --profile finops-oci --auth security_token --bulk-download --months-back 3 --dry-run --non-interactive
```

El bulk se ejecuta en una sola llamada con el prefijo base:

```text
FOCUS Reports
```

Cuando se usa rango de fechas, el script agrega patrones mensuales `--include`, por ejemplo:

```text
FOCUS Reports/2026/02/*
FOCUS Reports/2026/03/*
```

Esto evita llamar a OCI por cada dia, pero puede incluir dias extra en los meses frontera.

## Siguiente Paso Tecnico

## Importar Reportes Descargados A La Aplicacion

Cuando ya existan reportes descargados en `downloads/oci-focus/FOCUS Reports`, se pueden cargar en Supabase como una cuenta OCI realista:

```powershell
npx tsx .\scripts\import-oci-focus.ts --root-external-id "ocid1.tenancy.oc1..TENANCY" --reports-dir "downloads/oci-focus/FOCUS Reports"
```

El importador:

- crea o actualiza el tenant `oci-personal-demo`;
- usa el admin maestro `andres.rivera@takcolombia.co` por defecto, salvo que se pase `--user-email`;
- registra `CloudAccount`, `CloudConnection` y `CloudExportConfig` de OCI;
- registra cada archivo en `ingestion_objects`;
- parsea CSV/CSV.GZ FOCUS hacia `focus_cost_line_items`;
- proyecta costos a `cost_metrics`, que ya alimenta dashboard, chat, analitica y motor IA;
- genera `DataQualityCheck`, `IngestionRun`, `IngestionJob` y `IngestionWatermark`;
- recalcula analitica persistida.

El proceso es idempotente. Los duplicados se controlan con hash natural de linea FOCUS, no con el nombre del archivo, para evitar contar dos veces snapshots repetidos.

## Siguiente Paso Tecnico

Cuando este flujo local quede validado, el siguiente paso es convertirlo en conector productivo:

- registrar `CloudConnection` OCI;
- guardar credencial operativa minima cifrada, si aplica;
- descubrir objetos FOCUS y registrarlos en `ingestion_objects`;
- crear `ingestion_jobs` persistentes;
- descargar o copiar objetos hacia storage del operador;
- parsear CSV `.gz` FOCUS hacia `focus_cost_line_items`;
- generar `DataQualityCheck` de frescura, completitud y schema drift.
