# Limpieza controlada de artefactos de desarrollo

La limpieza de jobs y schemas E2E es una operación de mantenimiento, no una
migración. El comando trabaja en modo **dry-run** por defecto y no imprime
metadata de conexiones, buckets, namespaces ni credenciales.

## Precondiciones

1. Corregir primero la causa de los jobs fallidos y comprobar el scheduler con
   `npm run ingestion:doctor`.
2. Usar una base PostgreSQL local o un destino explícitamente autorizado. La
   aplicación remota no debe limpiarse mientras Supabase permanezca `read-only`.
3. Confirmar el par exacto bucket/namespace del origen; no usar el tenancy como
   sustituto del namespace.

## Diagnóstico

Desde `finops-backend` (la invocación directa evita que el shell intercepte
los argumentos):

```powershell
npx tsx scripts/maintenance/cleanup-development-artifacts.ts --bucket asd --namespace asd
```

La salida informa únicamente el número de jobs que coinciden, hasta diez IDs
de muestra y los tres schemas E2E permitidos. El comando exige ambos valores y
solo considera jobs `FAILED` de tipo `BILLING_EXPORT` cuyo mismo objeto de
metadata contiene el bucket y namespace indicados.

## Aplicación

Después de revisar el dry-run y comprobar que el destino es local:

```powershell
$env:ALLOW_NONLOCAL_DEVELOPMENT_CLEANUP = $null
npx tsx scripts/maintenance/cleanup-development-artifacts.ts --bucket asd --namespace asd --apply
```

El script también está disponible como:

```powershell
npm run maintenance:cleanup-development-artifacts -- --bucket=asd --namespace=asd
```

El parser acepta tanto argumentos directos como los `npm_config_*` que npm 11
crea en PowerShell; `--apply` se agrega únicamente después de revisar el
dry-run.

`--apply` elimina únicamente los jobs que todavía cumplen simultáneamente el
número de ID, `BILLING_EXPORT` y `FAILED`, y elimina solo estos schemas estáticos:

- `finops_e2e_integrated_secure_beta`
- `finops_e2e_local`
- `finops_e2e_verified_savings`

El comando rechaza `NODE_ENV=production` y destinos no locales. Si en el futuro
se autoriza un destino no local, la excepción debe habilitarse conscientemente
con `ALLOW_NONLOCAL_DEVELOPMENT_CLEANUP=true` y quedar registrada en la revisión
operativa. Nunca se deben pasar nombres arbitrarios de schemas ni ejecutar una
limpieza sobre `public`.
