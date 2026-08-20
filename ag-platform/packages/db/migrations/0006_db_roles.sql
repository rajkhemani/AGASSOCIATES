-- 005_db_roles.sql
-- Establish ag_owner / ag_app DB Role Separation
-- ag_owner: migration/schema admin (SUPERUSER, CREATEDB, CREATEROLE, BYPASSRLS)
-- ag_app: runtime only (NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOBYPASSRLS)

-- ============================================================
-- 1. CREATE ROLES
-- ============================================================

-- ag_owner: Full admin for migrations/schema changes
-- Uses BYPASSRLS to bypass Row Level Security during migrations
CREATE ROLE ag_owner WITH
  LOGIN
  SUPERUSER
  CREATEDB
  CREATEROLE
  BYPASSRLS
  PASSWORD 'CHANGE_ME_IN_PRODUCTION';

-- ag_app: Application runtime role - NO schema mutation privileges
-- Cannot bypass RLS, cannot create/drop objects
CREATE ROLE ag_app WITH
  LOGIN
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOBYPASSRLS
  PASSWORD 'CHANGE_ME_IN_PRODUCTION';

-- ============================================================
-- 2. SET DEFAULT PRIVILEGES FOR FUTURE OBJECTS (ag_owner)
-- ============================================================

-- Ensure ag_owner's future tables/sequences are accessible to ag_app
ALTER DEFAULT PRIVILEGES FOR ROLE ag_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ag_app;

ALTER DEFAULT PRIVILEGES FOR ROLE ag_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO ag_app;

ALTER DEFAULT PRIVILEGES FOR ROLE ag_owner IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO ag_app;

-- ============================================================
-- 3. GRANT PRIVILEGES ON EXISTING TABLES TO ag_app
-- ============================================================

-- Core tenant tables (multi-tenant, RLS enforced)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO ag_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banks TO ag_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO ag_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cases TO ag_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.disbursements TO ag_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_timeline TO ag_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timesheets TO ag_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO ag_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.files TO ag_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_embeddings TO ag_app;

-- Collaboration tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO ag_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO ag_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO ag_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO ag_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_activity TO ag_app;

-- Billing tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO ag_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_line_items TO ag_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_advance_reconciliation TO ag_app;

-- Bank portal tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_portal_configs TO ag_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_workflow_variants TO ag_app;

-- Audit tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_trail TO ag_app;

-- ============================================================
-- 4. GRANT SEQUENCE USAGE TO ag_app
-- ============================================================

-- All tables use uuid_generate_v4() or have serial/identity columns
-- Grant usage on all sequences in public schema
DO $$
DECLARE
  seq_record RECORD;
BEGIN
  FOR seq_record IN
    SELECT sequence_name
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
  LOOP
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %I TO ag_app', seq_record.sequence_name);
  END LOOP;
END $$;

-- ============================================================
-- 5. REVOKE DDL PRIVILEGES FROM ag_app (DEFENSE IN DEPTH)
-- ============================================================

-- Explicitly revoke any schema modification privileges
REVOKE ALL ON SCHEMA public FROM ag_app;
REVOKE CREATE ON SCHEMA public FROM ag_app;
REVOKE USAGE ON SCHEMA public FROM ag_app;

-- Re-grant only USAGE (needed to access objects in schema)
GRANT USAGE ON SCHEMA public TO ag_app;

-- Revoke table-level DDL privileges
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM ag_app;
REVOKE REFERENCES ON ALL TABLES IN SCHEMA public FROM ag_app;
REVOKE TRIGGER ON ALL TABLES IN SCHEMA public FROM ag_app;

-- Revoke sequence DDL
REVOKE UPDATE ON ALL SEQUENCES IN SCHEMA public FROM ag_app;

-- Revoke function DDL
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM ag_app;
-- Re-grant only necessary function execution
GRANT EXECUTE ON FUNCTION public.set_current_org_id(uuid) TO ag_app;
GRANT EXECUTE ON FUNCTION public.get_app_org_id() TO ag_app;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO ag_app;
GRANT EXECUTE ON FUNCTION public.log_audit_event(...) TO ag_app;

-- ============================================================
-- 6. ENSURE ag_app OWNS NO TABLES
-- ============================================================

-- Transfer ownership of any tables owned by ag_app to ag_owner
-- (Should be none, but defensive)
DO $$
DECLARE
  tbl_record RECORD;
BEGIN
  FOR tbl_record IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tableowner = 'ag_app'
  LOOP
    EXECUTE format('ALTER TABLE %I OWNER TO ag_owner', tbl_record.tablename);
  END LOOP;
END $$;

-- ============================================================
-- 7. SET SEARCH PATH FOR ag_app
-- ============================================================

ALTER ROLE ag_app SET search_path = public;

-- ============================================================
-- 8. CONNECTION LIMITS (OPTIONAL - PRODUCTION HARDENING)
-- ============================================================

-- Limit concurrent connections for ag_app (adjust based on pool size)
-- ALTER ROLE ag_app CONNECTION LIMIT 100;

-- ============================================================
-- 9. DOCUMENTATION: CONNECTION STRING PATTERNS
-- ============================================================

/*
CONNECTION STRING PATTERNS:

MIGRATION JOB (CI/CD) - uses ag_owner:
  postgres://ag_owner:PASSWORD@HOST:5432/DATABASE?sslmode=require
  
  Environment variables for migration runner:
    DB_MIGRATION_USER=ag_owner
    DB_MIGRATION_PASSWORD=<from secrets manager>
    DB_MIGRATION_HOST=<db-host>
    DB_MIGRATION_DATABASE=<db-name>

APPLICATION RUNTIME - uses ag_app:
  postgres://ag_app:PASSWORD@HOST:5432/DATABASE?sslmode=require
  
  Environment variables for application:
    DB_USER=ag_app
    DB_PASSWORD=<from secrets manager>
    DB_HOST=<db-host>
    DB_DATABASE=<db-name>

IMPORTANT:
- Store passwords in secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
- Rotate passwords regularly
- ag_owner should ONLY be used by migration jobs, never by application
- ag_app should NEVER be given SUPERUSER or BYPASSRLS
- Monitor for any GRANT TO ag_app that includes CREATEDB, CREATEROLE, or BYPASSRLS
*/

-- Migration complete: DB role separation established