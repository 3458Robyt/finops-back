# Ingestion Operations

## Queue execution

The ingestion worker drains several jobs per iteration. `INGESTION_WORKER_CONCURRENCY`
controls the number of slots (maximum 16) and `INGESTION_WORKER_INTERVAL_MS` controls
how often the queue is checked. New work receives a source priority: inventory first,
billing second, technical metrics third and agent metrics fourth. This prevents a long
metric backfill from starving operational synchronization for another connection.

Retries use `INGESTION_JOB_RETRY_BACKOFF_MS` as the base delay and exponential backoff
per attempt. `available_at` is persisted, so restarting the process does not create a
retry storm.

## Provider protection

OCI jobs are limited per tenancy/region and API. OCI Monitoring uses a conservative
8 requests/second and four concurrent calls, below the documented 10 TPS tenancy
limit. Resource Search, Compute, Object Storage and Usage API calls use separate
coordinators. A second job-level limiter prevents multiple connections from creating
unbounded work against one OCI account. AWS remains provider-ready but its real canary
is intentionally deferred until an account and role are available.

## Progress and lifecycle

`ingestion_jobs.progress` stores the current phase and counters such as provider calls,
rows, resources and samples. The panel refreshes job state without reloading the rest
of the page, so an active job does not make the interface flash or lose form state.

Jobs are never physically deleted from the application. A manager can:

- **Cancelar**: pending jobs become `CANCELLED`; running jobs receive a cooperative
  cancellation request and stop at the next safe phase.
- **Archivar**: terminal jobs are hidden from the default operational view but remain
  available with `includeArchived=true` and in the audit trail.

The tenant-level cancellation and archival actions are tenant-scoped and produce audit events.
`INGESTION_JOB_PROGRESS_UPDATE_MS` controls the maximum interval between progress
updates while a provider call is running.

## Tak 2.0 verification snapshot — 2026-08-18

The enterprise OCI connection for `Tak 2.0` was verified with real provider data:

- 953 normalized inventory resources after multiregion reconciliation.
- 3,267 OCI Usage API rows received; 3,158 projected, with 30 historical OCID
  references created and explicit classification for unresolved logical/service-level
  identifiers.
- 21,536 technical samples persisted and linked to normalized resources.
- 197 resource-backed metric definitions confirmed from the discovered catalog; the
  account does not currently expose enough `oci_computeagent` or
  `oci_vmi_resource_utilization` streams to claim Compute CPU/memory coverage.

The job can therefore complete with data and still report `PARTIAL` readiness when
cost linkage, tags or technical coverage are incomplete. A successful job is not
equivalent to complete evidence for an executable recommendation. Bulk persistence
is currently the main latency hotspot on the remote Supabase database and remains
tracked as `PERF-004`; increasing granularity or discarding raw samples is not an
acceptable workaround.

## Central master-admin console

`/api/v1/master-admin/ingestion-jobs` exposes a global, tenant-aware view for the
`MASTER_ADMIN` role. It includes tenant, connection, provider, source, status,
progress and summary counters, so an administrator does not need to switch tenants
to diagnose the queue. The console also supports filtering, cooperative cancellation
and terminal-job archival across tenants.

The destructive `DELETE /api/v1/master-admin/ingestion-jobs/pending` operation is
restricted to `MASTER_ADMIN`, removes only rows whose status is exactly `PENDING`,
never touches `RUNNING` or terminal jobs, and records an audit event per affected
tenant. The frontend requires explicit confirmation and displays the exact count.

## Migration

The lifecycle migrations are `202608170001_ingestion_job_concurrency_lifecycle` and
`202608170002_ingestion_queue_source_priorities`; the enterprise truth/catalog
migrations are `202608180001_enterprise_ingestion_truth_columns` and
`202608180002_enterprise_ingestion_catalog`. All four are applied to the primary
Supabase project. They add fields, indexes and catalog tables; no job history is
deleted by the migrations. A pending-queue purge is a separate explicit operational
action and is not part of migration execution.
