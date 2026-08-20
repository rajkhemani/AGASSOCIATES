# Database Role Separation: ag_owner / ag_app

## Overview

This document describes the dual-role database architecture for Luxor9 Legal OS, separating **schema/migration administration** from **application runtime** for security and compliance.

## Roles

### ag_owner (Migration/Admin Role)
- **Purpose**: Run database migrations, schema changes, and administrative tasks
- **Privileges**: `SUPERUSER`, `CREATEDB`, `CREATEROLE`, `BYPASSRLS`
- **Usage**: CI/CD migration jobs ONLY
- **Restrictions**: NEVER used by application runtime

### ag_app (Application Runtime Role)
- **Purpose**: Application database connections for normal operations
- **Privileges**: `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, `NOBYPASSRLS`
- **Usage**: All application services, APIs, background workers
- **Restrictions**: No DDL privileges, cannot bypass RLS, owns no tables

## Connection String Patterns

### Migration Job (CI/CD) - uses ag_owner

```bash
# Connection string format
postgres://ag_owner:${DB_MIGRATION_PASSWORD}@${DB_HOST}:5432/${DB_DATABASE}?sslmode=require

# Environment variables for migration runner
DB_MIGRATION_USER=ag_owner
DB_MIGRATION_PASSWORD=<from secrets manager>
DB_MIGRATION_HOST=<db-host>
DB_MIGRATION_DATABASE=<db-name>
DB_MIGRATION_SSL=true
```

**GitHub Actions Example:**
```yaml
- name: Run Migrations
  env:
    DB_MIGRATION_USER: ag_owner
    DB_MIGRATION_PASSWORD: ${{ secrets.DB_MIGRATION_PASSWORD }}
    DB_MIGRATION_HOST: ${{ secrets.DB_HOST }}
    DB_MIGRATION_DATABASE: luxor9_legal_os
    DB_MIGRATION_SSL: "true"
  run: |
    # Install dependencies
    npm ci
    # Run migration job using dedicated runner
    npx tsx scripts/run-migrations.ts run
```

**Legacy psql Method (if needed):**
```yaml
- name: Run Migrations (legacy)
  env:
    DB_MIGRATION_USER: ag_owner
    DB_MIGRATION_PASSWORD: ${{ secrets.DB_MIGRATION_PASSWORD }}
    DB_MIGRATION_HOST: ${{ secrets.DB_HOST }}
    DB_MIGRATION_DATABASE: luxor9_legal_os
  run: |
    psql "postgres://$DB_MIGRATION_USER:$DB_MIGRATION_PASSWORD@$DB_MIGRATION_HOST/$DB_MIGRATION_DATABASE?sslmode=require" \
      -f packages/db/migrations/0001_schema_migrations.sql \
      -f packages/db/migrations/0002_baseline_schema.sql \
      -f packages/db/migrations/0003_pgvector_templates.sql \
      -f packages/db/migrations/0004_fix_collaboration_rls.sql \
      -f packages/db/migrations/0005_fix_remaining_rls.sql \
      -f packages/db/migrations/0006_db_roles.sql
```

### Application Runtime - uses ag_app

```bash
# Connection string format
postgres://ag_app:${DB_PASSWORD}@${DB_HOST}:5432/${DB_DATABASE}?sslmode=require

# Environment variables for application
DB_USER=ag_app
DB_PASSWORD=<from secrets manager>
DB_HOST=<db-host>
DB_DATABASE=<db-name>
DB_SSL=true
```

**Application Config (ag-platform/src/server/db.ts):**
```typescript
const connectionString =
  process.env.DATABASE_URL ||
  `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_DATABASE}`;

export const pool = new Pool({
  connectionString,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});
```

## Migration Job Script

A dedicated migration runner script is provided at `scripts/run-migrations.ts`:

```bash
# Run migrations (CI/CD step)
npx tsx scripts/run-migrations.ts run

# Verify migrations
npx tsx scripts/run-migrations.ts verify

# Check status
npx tsx scripts/run-migrations.ts status
```

The script uses the migration runner at `src/server/migrationRunner.ts` which:
- Discovers ordered migrations from `packages/db/migrations/`
- Tracks filename, SHA-256 checksum, applied_at in `schema_migrations` table
- Rules: new filename → execute; known filename + same checksum → skip; known filename + changed checksum → HARD FAIL
- NEVER uses ON CONFLICT DO UPDATE SET checksum for already-applied migrations

## Deployment Order

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CI Pipeline                                               │
│    ├── Lint → Type-check → Test → Build                     │
│    └── (No DB access needed)                                │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Migration Job (uses ag_owner)                            │
│    ├── Connect as ag_owner                                  │
│    ├── Run ALL pending migrations in order                  │
│    ├── Verify migration success                             │
│    └── Exit (ag_owner connection closed)                    │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Application Deployment (uses ag_app)                     │
│    ├── Deploy containers/services                           │
│    ├── Health checks pass                                   │
│    ├── Traffic switched to new version                      │
│    └── (ag_owner NOT used)                                  │
└─────────────────────────────────────────────────────────────┘
```

## Security Guarantees

| Threat | Mitigation |
|--------|------------|
| SQL Injection → Schema Destruction | ag_app cannot ALTER/DROP/CREATE tables |
| SQL Injection → RLS Bypass | ag_app has `NOBYPASSRLS` - RLS always enforced |
| SQL Injection → Privilege Escalation | ag_app cannot CREATE ROLE/DATABASE |
| Compromised App Credentials → Full DB Access | ag_app limited to DML on tenant tables only |
| Migration Failure → Broken Schema | Migrations run as separate job, verified before app deploy |

## Verification Tests

Run the test migration to verify role separation:

```bash
# As superuser (or role with CREATEROLE)
psql -U postgres -d luxor9_legal_os -f packages/db/migrations/test_db_roles.sql
```

Expected test results:
- ✅ ag_app CRUD operations work (respecting RLS)
- ✅ ag_app ALTER TABLE blocked
- ✅ ag_app DROP TABLE blocked
- ✅ ag_app CREATE TABLE blocked
- ✅ ag_app TRUNCATE blocked
- ✅ ag_app cannot bypass RLS
- ✅ ag_app cannot GRANT/REVOKE
- ✅ ag_app cannot CREATE ROLE/DATABASE
- ✅ ag_owner schema changes work
- ✅ ag_app can use sequences (BIGSERIAL/identity)

## Password Management

**CRITICAL**: Never hardcode passwords. Use secrets management:

- **AWS**: AWS Secrets Manager + IAM roles for service accounts
- **GCP**: Secret Manager + Workload Identity
- **Azure**: Key Vault + Managed Identity
- **Self-hosted**: HashiCorp Vault, Doppler, or 1Password CLI

**Rotation Policy**:
- Rotate `ag_owner` password after each migration run (or monthly)
- Rotate `ag_app` password quarterly
- Use automated rotation where possible

## Monitoring & Auditing

Monitor for suspicious activity:

```sql
-- Alert if ag_app attempts DDL
SELECT * FROM pg_stat_activity 
WHERE usename = 'ag_app' 
  AND query ILIKE ANY (ARRAY['%ALTER TABLE%', '%DROP TABLE%', '%CREATE TABLE%', '%TRUNCATE%']);

-- Alert if unexpected role membership changes
SELECT * FROM pg_auth_members 
WHERE roleid = 'ag_app'::regrole;
```

## Migration Checklist

When adding new tables/objects:

1. Create table as `ag_owner` in migration
2. Enable RLS with org-scoped policies
3. Grant `SELECT, INSERT, UPDATE, DELETE` to `ag_app`
4. Grant `USAGE, SELECT` on sequences to `ag_app`
5. Run `test_db_roles.sql` to verify
6. Document in this file if new pattern introduced