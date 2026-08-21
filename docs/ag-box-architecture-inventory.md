# AG BOX architecture inventory

## Repository boundaries

- `ag-platform/` is the active legal-operations platform: Express/TypeScript API, Vite/React web app, Turborepo workspaces, PostgreSQL/Supabase integrations, and separate `intake-api` and coordinator services.
- `ag-associates-ai/` is an independent FastAPI/LangGraph document and workflow pipeline with its own Postgres case store and frontend. It is not code-coupled to `ag-platform`.
- `apps/web/` is the independent static marketing site. `landing/` is superseded.
- Root `supabase/` migrations are separate from `ag-platform` runtime migrations in `src/server/migrations.sql`.

## Platform request path

`ag-platform/server.ts` loads the runtime SQL migration, configures CORS, cookies, rate limits, logging, metrics, OpenAPI, health checks, and mounts versioned routes under `/api/v1`. Authentication is Supabase cookie/session based; profiles provide the organization and role. Case, document, timesheet, invoice, bank portal, NeSL, dashboard, AI, intake, and coordinator capabilities are separate route/service areas.

## Security and domain foundations

- Organization identifiers are present on primary tenant data (`cases`, `documents`, `timesheets`, invoices, audit records).
- `src/server/auth.ts` now normalizes roles, derives permissions, requires organization membership, and exposes permission middleware.
- `src/server/matterStateMachine.ts` is the transition authority used by `CaseService.updateStatus`.
- `src/server/actionGateway.ts` defines L0-L3 action policy, independent approvals, denial/execute audit events, and a reusable execution guard. `/api/v1/actions/authorize` exposes a non-mutating authorization decision.
- Runtime SQL now provisions durable action requests/approvals with organization RLS and extends audit event types.

## Verification and known blockers

- Pure foundation tests cover action levels/approvals and terminal matter transitions.
- Existing platform type checking is blocked by pre-existing web JSX errors and unrelated server errors.
- Existing route suites currently have stale relative imports and lack the `supertest` dependency; those failures predate this increment.
- External government portals, messaging, AI providers, and production credentials remain unconfigured; no external integration is claimed complete.
- Runtime SQL migrations still require a reachable PostgreSQL database and should be reviewed/applied in the deployment environment before action approval data is used.
