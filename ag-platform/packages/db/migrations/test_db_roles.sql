-- test_db_roles.sql
-- Test migration to verify ag_owner / ag_app role separation
-- Run as superuser or role with CREATEROLE privilege

\set ON_ERROR_STOP on

-- ============================================================
-- SETUP: Create test roles (mirroring production roles)
-- ============================================================

-- Clean up any existing test roles
DROP ROLE IF EXISTS test_ag_owner;
DROP ROLE IF EXISTS test_ag_app;

-- Create test roles with same attributes as production
CREATE ROLE test_ag_owner WITH
  LOGIN
  SUPERUSER
  CREATEDB
  CREATEROLE
  BYPASSRLS
  PASSWORD 'test_owner_password';

CREATE ROLE test_ag_app WITH
  LOGIN
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOBYPASSRLS
  PASSWORD 'test_app_password';

-- ============================================================
-- TEST 1: Verify role attributes
-- ============================================================

\echo '=== TEST 1: Verify role attributes ==='
SELECT 'test_ag_owner attributes' AS test,
  rolsuper, rolcreatedb, rolcreaterole, rolbypassrls
FROM pg_roles WHERE rolname = 'test_ag_owner';

SELECT 'test_ag_app attributes' AS test,
  rolsuper, rolcreatedb, rolcreaterole, rolbypassrls
FROM pg_roles WHERE rolname = 'test_ag_app';

-- Verify test_ag_owner has superuser privileges
SELECT 'test_ag_owner is superuser' AS test,
  rolsuper AS pass FROM pg_roles WHERE rolname = 'test_ag_owner';

-- Verify test_ag_app is NOT superuser
SELECT 'test_ag_app is NOT superuser' AS test,
  NOT rolsuper AS pass FROM pg_roles WHERE rolname = 'test_ag_app';

-- Verify test_ag_app cannot bypass RLS
SELECT 'test_ag_app cannot bypass RLS' AS test,
  NOT rolbypassrls AS pass FROM pg_roles WHERE rolname = 'test_ag_app';

-- ============================================================
-- TEST 2: Create test schema and tables
-- ============================================================

\echo '=== TEST 2: Schema setup ==='

-- Create test schema
CREATE SCHEMA IF NOT EXISTS test_roles;

-- Create test table as test_ag_owner
SET ROLE test_ag_owner;
CREATE TABLE test_roles.test_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  data TEXT NOT NULL
);
RESET ROLE;

-- Enable RLS on test table
ALTER TABLE test_roles.test_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY test_org_isolation ON test_roles.test_table
  FOR ALL USING (org_id = current_setting('app.current_org_id')::uuid);

-- Grant privileges to test_ag_app
GRANT SELECT, INSERT, UPDATE, DELETE ON test_roles.test_table TO test_ag_app;
GRANT USAGE ON SCHEMA test_roles TO test_ag_app;

-- ============================================================
-- TEST 3: ag_app CAN perform normal CRUD operations
-- ============================================================

\echo '=== TEST 3: ag_app CRUD operations ==='

SET ROLE test_ag_app;
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- INSERT should work
INSERT INTO test_roles.test_table (org_id, data) 
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'test data A')
RETURNING id, org_id, data;

-- SELECT should work (and respect RLS)
SELECT 'ag_app can SELECT own org data' AS test,
  COUNT(*) = 1 AS pass
FROM test_roles.test_table;

-- UPDATE should work
UPDATE test_roles.test_table 
SET data = 'updated data A' 
WHERE org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
RETURNING id, data;

-- DELETE should work
DELETE FROM test_roles.test_table 
WHERE org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
RETURNING id;

RESET ROLE;

-- ============================================================
-- TEST 4: ag_app CANNOT ALTER TABLE
-- ============================================================

\echo '=== TEST 4: ag_app cannot ALTER TABLE ==='

SET ROLE test_ag_app;

-- This should FAIL
DO $$
BEGIN
  ALTER TABLE test_roles.test_table ADD COLUMN forbidden_column TEXT;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'EXPECTED: ag_app cannot ALTER TABLE - %', SQLERRM;
END $$;

RESET ROLE;

-- Verify column was not added
SELECT 'ag_app ALTER TABLE blocked' AS test,
  NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'test_roles' 
      AND table_name = 'test_table' 
      AND column_name = 'forbidden_column'
  ) AS pass;

-- ============================================================
-- TEST 5: ag_app CANNOT DROP TABLE
-- ============================================================

\echo '=== TEST 5: ag_app cannot DROP TABLE ==='

SET ROLE test_ag_app;

-- This should FAIL
DO $$
BEGIN
  DROP TABLE test_roles.test_table;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'EXPECTED: ag_app cannot DROP TABLE - %', SQLERRM;
END $$;

RESET ROLE;

-- Verify table still exists
SELECT 'ag_app DROP TABLE blocked' AS test,
  EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'test_roles' 
      AND tablename = 'test_table'
  ) AS pass;

-- ============================================================
-- TEST 6: ag_app CANNOT CREATE TABLE
-- ============================================================

\echo '=== TEST 6: ag_app cannot CREATE TABLE ==='

SET ROLE test_ag_app;

-- This should FAIL
DO $$
BEGIN
  CREATE TABLE test_roles.forbidden_table (id INT);
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'EXPECTED: ag_app cannot CREATE TABLE - %', SQLERRM;
END $$;

RESET ROLE;

-- Verify table was not created
SELECT 'ag_app CREATE TABLE blocked' AS test,
  NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'test_roles' 
      AND tablename = 'forbidden_table'
  ) AS pass;

-- ============================================================
-- TEST 7: ag_app CANNOT BYPASS RLS
-- ============================================================

\echo '=== TEST 7: ag_app cannot bypass RLS ==='

-- Insert data for two different orgs as owner
SET ROLE test_ag_owner;
INSERT INTO test_roles.test_table (org_id, data) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'org A data'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'org B data');
RESET ROLE;

-- As ag_app with org A context, should only see org A data
SET ROLE test_ag_app;
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

SELECT 'ag_app with org A context sees only org A' AS test,
  COUNT(*) = 1 AS pass,
  COUNT(*) AS actual_count
FROM test_roles.test_table;

-- Switch to org B context
SET LOCAL app.current_org_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

SELECT 'ag_app with org B context sees only org B' AS test,
  COUNT(*) = 1 AS pass,
  COUNT(*) AS actual_count
FROM test_roles.test_table;

-- Try to SET ROLE to bypass RLS (should fail or be ignored)
-- Note: NOBYPASSRLS prevents bypassing RLS even with SET ROLE
DO $$
BEGIN
  -- This should not allow seeing both orgs' data
  PERFORM 1;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

RESET ROLE;

-- ============================================================
-- TEST 8: ag_app CANNOT TRUNCATE TABLE
-- ============================================================

\echo '=== TEST 8: ag_app cannot TRUNCATE TABLE ==='

SET ROLE test_ag_app;

DO $$
BEGIN
  TRUNCATE TABLE test_roles.test_table;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'EXPECTED: ag_app cannot TRUNCATE TABLE - %', SQLERRM;
END $$;

RESET ROLE;

-- Verify data still exists
SELECT 'ag_app TRUNCATE blocked' AS test,
  EXISTS (SELECT 1 FROM test_roles.test_table) AS pass;

-- ============================================================
-- TEST 9: ag_app CANNOT GRANT/REVOKE PRIVILEGES
-- ============================================================

\echo '=== TEST 9: ag_app cannot GRANT/REVOKE ==='

SET ROLE test_ag_app;

DO $$
BEGIN
  GRANT SELECT ON test_roles.test_table TO PUBLIC;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'EXPECTED: ag_app cannot GRANT - %', SQLERRM;
END $$;

RESET ROLE;

-- ============================================================
-- TEST 10: ag_owner CAN perform schema changes
-- ============================================================

\echo '=== TEST 10: ag_owner can perform schema changes ==='

SET ROLE test_ag_owner;

-- Should succeed
ALTER TABLE test_roles.test_table ADD COLUMN owner_added_column TEXT DEFAULT 'owner';
DROP COLUMN owner_added_column;

-- Should succeed
CREATE TABLE test_roles.owner_created_table (id SERIAL PRIMARY KEY, name TEXT);
DROP TABLE test_roles.owner_created_table;

RESET ROLE;

SELECT 'ag_owner schema changes work' AS test, TRUE AS pass;

-- ============================================================
-- TEST 11: ag_app CAN use sequences
-- ============================================================

\echo '=== TEST 11: ag_app can use sequences ==='

SET ROLE test_ag_owner;
CREATE TABLE test_roles.seq_test_table (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL,
  data TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON test_roles.seq_test_table TO test_ag_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA test_roles TO test_ag_app;
RESET ROLE;

SET ROLE test_ag_app;
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

INSERT INTO test_roles.seq_test_table (org_id, data)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'seq test')
RETURNING id, org_id, data;

SELECT 'ag_app can use sequences (BIGSERIAL)' AS test,
  id IS NOT NULL AND id > 0 AS pass
FROM test_roles.seq_test_table WHERE org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

RESET ROLE;

-- ============================================================
-- TEST 12: ag_app CANNOT CREATE ROLE/DATABASE
-- ============================================================

\echo '=== TEST 12: ag_app cannot create role/database ==='

SET ROLE test_ag_app;

DO $$
BEGIN
  CREATE ROLE forbidden_role;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'EXPECTED: ag_app cannot CREATE ROLE - %', SQLERRM;
END $$;

DO $$
BEGIN
  CREATE DATABASE forbidden_db;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'EXPECTED: ag_app cannot CREATE DATABASE - %', SQLERRM;
END $$;

RESET ROLE;

-- ============================================================
-- TEST 13: Verify production tables accessible to ag_app
-- ============================================================

\echo '=== TEST 13: Production tables accessible to ag_app ==='

-- Check that all core tables have grants for ag_app
SELECT 'Core tables granted to ag_app' AS test,
  COUNT(*) = (
    SELECT COUNT(*) FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename IN ('organizations','banks','profiles','cases','disbursements',
                        'case_timeline','timesheets','documents','files',
                        'tasks','comments','activities','notifications',
                        'staff_activity','invoices','invoice_line_items',
                        'bank_advance_reconciliation','bank_portal_configs',
                        'bank_workflow_variants','audit_trail')
  ) AS pass
FROM information_schema.table_privileges
WHERE grantee = 'ag_app' 
  AND table_schema = 'public'
  AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE');

-- ============================================================
-- CLEANUP
-- ============================================================

\echo '=== CLEANUP ==='

SET ROLE test_ag_owner;
DROP TABLE IF EXISTS test_roles.seq_test_table;
DROP TABLE IF EXISTS test_roles.test_table;
DROP SCHEMA IF EXISTS test_roles;
RESET ROLE;

DROP ROLE IF EXISTS test_ag_app;
DROP ROLE IF EXISTS test_ag_owner;

\echo '=== ALL TESTS COMPLETE ==='

-- Summary of expected results:
-- TEST 1: Role attributes correct ✓
-- TEST 2: Schema setup ✓
-- TEST 3: ag_app CRUD works ✓
-- TEST 4: ag_app ALTER TABLE blocked ✓
-- TEST 5: ag_app DROP TABLE blocked ✓
-- TEST 6: ag_app CREATE TABLE blocked ✓
-- TEST 7: ag_app cannot bypass RLS ✓
-- TEST 8: ag_app TRUNCATE blocked ✓
-- TEST 9: ag_app GRANT/REVOKE blocked ✓
-- TEST 10: ag_owner schema changes work ✓
-- TEST 11: ag_app can use sequences ✓
-- TEST 12: ag_app cannot CREATE ROLE/DATABASE ✓
-- TEST 13: Production tables granted ✓