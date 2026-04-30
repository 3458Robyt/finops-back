# FinOps Database And Security Design

## Research Basis

This design is based on primary sources and reference repositories inspected before implementation:

- FinOps Framework: cost data must support ingestion, allocation, reporting, anomaly management, governance, and accountability.
- FOCUS v1.2: the canonical cost model should use provider-neutral dimensions such as provider, billing account, sub account, service, resource, region, charge period, billed cost, effective cost, consumed quantity, currency, and tags.
- AWS Cost Explorer and CUR documentation: Cost Explorer can group by service, linked account, tags, usage type, and more; CUR can include resource IDs when configured.
- TimescaleDB documentation: unique indexes on hypertables must include the time partition column.
- PostgreSQL RLS documentation: policies filter visible rows with `USING` and validate writes with `WITH CHECK`.
- OWASP guidance: passwords must be hashed, not encrypted; JWTs require careful browser storage and short expiration; sensitive cloud credentials should use authenticated encryption such as AES-GCM, with keys kept outside the database.
- GitHub references: `opencost/opencost`, `aws-solutions-library-samples/cloud-intelligence-dashboards-framework`, `infracost/infracost`, and the FOCUS specification repository.

## Architecture Decisions

1. The project stores normalized cost rows in a provider-neutral `CostMetric` model aligned with FOCUS naming and semantics, while keeping the current `InternalCostMetric` as the domain DTO used by providers.
2. Tenant isolation is enforced in application services and repositories from the first implementation. Database-level RLS remains a planned hardening layer once Prisma queries are wrapped in per-request transaction/session context.
3. PostgreSQL is the system of record. TimescaleDB is supported through schema/index choices and later SQL migrations, but Prisma remains the ORM for relational models.
4. Cost metrics use a composite primary key of `chargePeriodStart` and `metricIdentityHash`; this keeps every unique constraint compatible with TimescaleDB hypertable rules.
5. Cloud credentials are stored as encrypted payloads using AES-256-GCM metadata fields: ciphertext, IV, auth tag, algorithm, and key version. Passwords are stored only as Argon2id hashes.
6. JWT access tokens carry only stable authorization claims: user id, tenant id, role, email, issuer, audience, expiration, and JWT id. Backend middleware is the source of authorization truth.

## Core Tables

- `tenants`: customer/business boundary for all scoped data.
- `users`: authenticated users with role and tenant membership.
- `auth_sessions`: issued-token tracking and future revocation support.
- `cloud_accounts`: provider accounts/subscriptions/tenancies linked to a tenant.
- `cloud_credentials`: encrypted provider credential payloads per account.
- `ingestion_runs`: audit trail for each provider ingestion.
- `cost_metrics`: provider-neutral time-series cost rows aligned with FOCUS concepts.
- `recommendations`: governed optimization findings generated from cost data.
- `recommendation_decisions`: approval/rejection/manual-completion decisions.
- `audit_events`: immutable business/security event log.

## Security Rules

- All `/api/v1/costs` routes require a valid Bearer JWT.
- Non-auth routes are limited to `/health` and `/api/v1/auth/login`.
- Repositories must receive `tenantId`; controllers must never trust tenant or role sent by the frontend.
- VIEWER can read scoped costs; ADMIN can read scoped costs and later manage integrations/recommendations.
- Credentials must not be returned by API responses.
- CORS origin is environment-controlled.

## MVP Limits

- This phase does not execute cloud remediations.
- This phase does not enable WhatsApp/Slack notifications.
- This phase does not implement DB-level RLS yet; it keeps the schema RLS-ready and enforces tenancy in backend code.
- This phase does not require TimescaleDB to be installed locally to compile or run type checks. The optional `prisma/timescale.sql` script converts `cost_metrics` into a hypertable when the extension is available.
