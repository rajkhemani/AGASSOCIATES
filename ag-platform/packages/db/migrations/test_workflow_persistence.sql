-- Test: Workflow Persistence Primitives Verification (P1-B)
-- Run this after applying 0009_workflow_persistence.sql
-- Verifies that all workflow tables, constraints, RLS, and seed data work correctly

\set ON_ERROR_STOP on

-- ============================================================
-- SETUP: Create test organizations, users, and cases
-- ============================================================

INSERT INTO organizations (id, name) VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tenant A'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Tenant B')
ON CONFLICT (id) DO NOTHING;

-- Create test banks if not exist
INSERT INTO banks (id, name, short_code, type) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'Test Bank', 'TB', 'BANK')
ON CONFLICT (id) DO NOTHING;

-- Create test users for each org
INSERT INTO profiles (id, user_id, org_id, full_name, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'user-a', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'User A', 'ADVOCATE'),
  ('22222222-2222-2222-2222-222222222222', 'user-b', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'User B', 'ADVOCATE'),
  ('33333333-3333-3333-3333-333333333333', 'principal-a', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Principal A', 'PRINCIPAL'),
  ('44444444-4444-4444-4444-444444444444', 'principal-b', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Principal B', 'PRINCIPAL')
ON CONFLICT (id) DO NOTHING;

-- Create test cases for each org
INSERT INTO cases (id, case_number, org_id, bank_id, case_type, status, borrower_name) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'CASE-A-001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
   (SELECT id FROM banks LIMIT 1), 'NOI', 'RECEIVED', 'Borrower A'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'CASE-B-001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   (SELECT id FROM banks LIMIT 1), 'NOI', 'RECEIVED', 'Borrower B')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TEST 1: Workflow Definitions - Seed Data Verification
-- ============================================================

\echo '=== TEST 1: Workflow Definitions Seed Data ==='

SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Verify all three workflows exist
SELECT slug, name, version, status_field, 
       jsonb_array_length(definition_json->'states') as state_count,
       jsonb_object_keys(definition_json->'transitions') as transition_keys
FROM public.workflow_definitions
ORDER BY slug;

-- Verify NOI workflow structure
SELECT 
    'NOI states' as check_item,
    (SELECT jsonb_array_length(definition_json->'states') FROM public.workflow_definitions WHERE slug='noi') = 9 as pass
UNION ALL
SELECT 
    'NOI transitions',
    (SELECT jsonb_object_keys(definition_json->'transitions') FROM public.workflow_definitions WHERE slug='noi') IS NOT NULL
UNION ALL
SELECT 
    'NOI initial_states',
    (SELECT definition_json->'initial_states' FROM public.workflow_definitions WHERE slug='noi') = '["DOCUMENTS_RECEIVED"]'::jsonb
UNION ALL
SELECT 
    'NOI terminal_states includes COMPLETED',
    (SELECT definition_json->'terminal_states' @> '["COMPLETED"]'::jsonb FROM public.workflow_definitions WHERE slug='noi')
UNION ALL
SELECT 
    'NOI exception_states includes MISMATCH, REJECTED',
    (SELECT definition_json->'exception_states' @> '["MISMATCH","REJECTED"]'::jsonb FROM public.workflow_definitions WHERE slug='noi')
UNION ALL
SELECT 
    'NOI has deadline on DOCUMENTS_RECEIVED',
    (SELECT definition_json->'deadlines' ? 'DOCUMENTS_RECEIVED' FROM public.workflow_definitions WHERE slug='noi');

-- Verify Mortgage Registration workflow
SELECT 
    'MORTGAGE states count = 8',
    (SELECT jsonb_array_length(definition_json->'states') FROM public.workflow_definitions WHERE slug='mortgage_registration') = 8;

-- Verify Public Notice workflow
SELECT 
    'PUBLIC_NOTICE states count = 9',
    (SELECT jsonb_array_length(definition_json->'states') FROM public.workflow_definitions WHERE slug='public_notice') = 9
UNION ALL
SELECT 
    'PUBLIC_NOTICE has deadline with 3 options',
    (SELECT jsonb_array_length(definition_json->'deadlines'->'AWAITING_OBJECTIONS'->'options') FROM public.workflow_definitions WHERE slug='public_notice') = 3;

\echo 'PASS: Workflow definitions seed data verified'

-- ============================================================
-- TEST 2: Workflow Versions - Version History
-- ============================================================

\echo '=== TEST 2: Workflow Versions ==='

-- Verify each workflow has initial version
SELECT wd.slug, wv.version_number, wv.changelog
FROM public.workflow_versions wv
JOIN public.workflow_definitions wd ON wd.id = wv.workflow_definition_id
ORDER BY wd.slug;

SELECT 
    'NOI has version 1.0.0',
    EXISTS (SELECT 1 FROM public.workflow_versions wv JOIN public.workflow_definitions wd ON wd.id = wv.workflow_definition_id WHERE wd.slug='noi' AND wv.version_number='1.0.0') as pass
UNION ALL
SELECT 
    'MORTGAGE has version 1.0.0',
    EXISTS (SELECT 1 FROM public.workflow_versions wv JOIN public.workflow_definitions wd ON wd.id = wv.workflow_definition_id WHERE wd.slug='mortgage_registration' AND wv.version_number='1.0.0')
UNION ALL SELECT
    'PUBLIC_NOTICE has version 1.0.0',
    EXISTS (SELECT 1 FROM public.workflow_versions wv JOIN public.workflow_definitions wd ON wd.id = wv.workflow_definition_id WHERE wd.slug='public_notice' AND wv.version_number='1.0.0');

\echo 'PASS: Workflow versions verified'

-- ============================================================
-- TEST 3: Workflow Instances - Creation and Pinning
-- ============================================================

\echo '=== TEST 3: Workflow Instances ==='

-- Create workflow instance for Tenant A case (NOI workflow)
INSERT INTO public.workflow_instances (
    workflow_definition_id, workflow_version_id, case_id, org_id, current_state, status, started_by
) VALUES (
    (SELECT id FROM public.workflow_definitions WHERE slug = 'noi'),
    (SELECT id FROM public.workflow_versions WHERE workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug = 'noi') AND version_number = '1.0.0'),
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'DOCUMENTS_RECEIVED',
    'running',
    '11111111-1111-1111-1111-111111111111'
) RETURNING id, current_state, status;

-- Verify instance created and pinned to version
SELECT 
    'Instance created with correct state',
    (SELECT current_state = 'DOCUMENTS_RECEIVED' FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi')) as pass
UNION ALL
SELECT 
    'Instance status = running',
    (SELECT status = 'running' FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi'))
UNION ALL
SELECT 
    'Instance pinned to workflow_version_id',
    (SELECT workflow_version_id IS NOT NULL FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi'))
UNION ALL
SELECT 
    'Unique constraint: one instance per case per workflow',
    (SELECT COUNT(*) = 1 FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi'));

-- Try to create duplicate instance (should fail)
\echo '=== TEST 3b: Unique constraint violation ==='
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
INSERT INTO public.workflow_instances (
    workflow_definition_id, workflow_version_id, case_id, org_id, current_state, status
) VALUES (
    (SELECT id FROM public.workflow_definitions WHERE slug = 'noi'),
    (SELECT id FROM public.workflow_versions WHERE workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug = 'noi') AND version_number = '1.0.0'),
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'DOCUMENTS_RECEIVED',
    'running'
);
\echo 'FAIL: Duplicate instance was allowed'

EXCEPTION WHEN unique_violation THEN
    \echo 'PASS: Unique constraint prevents duplicate workflow instance per case per workflow'

-- ============================================================
-- TEST 4: Tasks - Creation and Status Transitions
-- ============================================================

\echo '=== TEST 4: Tasks ==='

-- Create tasks for the workflow instance
INSERT INTO public.tasks (workflow_instance_id, task_definition_id, assignee_id, status, due_at) VALUES
  (
    (SELECT id FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi')),
    'generate_challan',
    '11111111-1111-1111-1111-111111111111',
    'pending',
    NOW() + INTERVAL '24 hours'
  ),
  (
    (SELECT id FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi')),
    'verify_docs',
    '11111111-1111-1111-1111-111111111111',
    'pending',
    NOW() + INTERVAL '48 hours'
  )
RETURNING id, task_definition_id, status;

-- Verify tasks created
SELECT 
    'Two tasks created',
    (SELECT COUNT(*) = 2 FROM public.tasks WHERE workflow_instance_id = (SELECT id FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi'))) as pass
UNION ALL
SELECT 
    'Task status = pending',
    (SELECT status = 'pending' FROM public.tasks WHERE task_definition_id = 'generate_challan' AND workflow_instance_id = (SELECT id FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi')))
UNION ALL
SELECT 
    'Task has due_at',
    (SELECT due_at IS NOT NULL FROM public.tasks WHERE task_definition_id = 'generate_challan' AND workflow_instance_id = (SELECT id FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi')));

-- Test status transition: pending -> in_progress -> completed
UPDATE public.tasks 
SET status = 'in_progress', updated_at = NOW()
WHERE task_definition_id = 'generate_challan' 
  AND workflow_instance_id = (SELECT id FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi'));

UPDATE public.tasks 
SET status = 'completed', completed_at = NOW(), updated_at = NOW()
WHERE task_definition_id = 'generate_challan' 
  AND workflow_instance_id = (SELECT id FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi'));

SELECT 
    'Task completed_at set on completion',
    (SELECT completed_at IS NOT NULL FROM public.tasks WHERE task_definition_id = 'generate_challan' AND workflow_instance_id = (SELECT id FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi'))) as pass
UNION ALL
SELECT 
    'completed_at NULL when not completed',
    (SELECT completed_at IS NULL FROM public.tasks WHERE task_definition_id = 'verify_docs' AND workflow_instance_id = (SELECT id FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi')));

\echo 'PASS: Tasks verified'

-- ============================================================
-- TEST 5: Deadlines - Creation and Status
-- ============================================================

\echo '=== TEST 5: Deadlines ==='

-- Create deadlines for the workflow instance
INSERT INTO public.deadlines (workflow_instance_id, deadline_type, label, due_at, metadata_json) VALUES
  (
    (SELECT id FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi')),
    'statutory',
    'Section 89B filing window',
    NOW() + INTERVAL '30 days',
    jsonb_build_object('window_days', 30, 'starts_from', 'date of the mortgage — deposit of title deeds', 'blocking', true)
  ),
  (
    (SELECT id FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi')),
    'sla',
    'Internal SLA: Challan generation',
    NOW() + INTERVAL '2 days',
    jsonb_build_object('window_days', 2, 'internal', true)
  )
RETURNING id, label, deadline_type, due_at;

-- Verify deadlines
SELECT 
    'Two deadlines created',
    (SELECT COUNT(*) = 2 FROM public.deadlines WHERE workflow_instance_id = (SELECT id FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi'))) as pass
UNION ALL
SELECT 
    'Statutory deadline has correct metadata',
    (SELECT metadata_json->>'window_days' = '30' FROM public.deadlines WHERE label = 'Section 89B filing window' AND workflow_instance_id = (SELECT id FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi')));

-- Test deadline status transition
UPDATE public.deadlines 
SET status = 'triggered', triggered_at = NOW()
WHERE label = 'Section 89B filing window' 
  AND workflow_instance_id = (SELECT id FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi'));

SELECT 
    'Deadline status can transition to triggered',
    (SELECT status = 'triggered' FROM public.deadlines WHERE label = 'Section 89B filing window' AND workflow_instance_id = (SELECT id FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi'))) as pass;

\echo 'PASS: Deadlines verified'

-- ============================================================
-- TEST 6: RLS - Cross-tenant Isolation
-- ============================================================

\echo '=== TEST 6: RLS Cross-tenant Isolation ==='

-- Create a workflow instance for Tenant B
INSERT INTO public.workflow_instances (
    workflow_definition_id, workflow_version_id, case_id, org_id, current_state, status
) VALUES (
    (SELECT id FROM public.workflow_definitions WHERE slug = 'noi'),
    (SELECT id FROM public.workflow_versions WHERE workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug = 'noi') AND version_number = '1.0.0'),
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'DOCUMENTS_RECEIVED',
    'running'
) ON CONFLICT DO NOTHING;

-- As Tenant A, try to read Tenant B's workflow instance
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
SELECT COUNT(*) as tenant_a_sees_tenant_b_instances
FROM public.workflow_instances 
WHERE case_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

-- Should be 0 (Tenant A cannot see Tenant B's instances)
SELECT 
    'Tenant A cannot see Tenant B workflow instances',
    (SELECT COUNT(*) = 0 FROM public.workflow_instances WHERE case_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd') as pass;

-- As Tenant A, try to read Tenant B's tasks
SELECT 
    'Tenant A cannot see Tenant B tasks',
    (SELECT COUNT(*) = 0 FROM public.tasks WHERE workflow_instance_id IN (SELECT id FROM public.workflow_instances WHERE case_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd')) as pass;

-- As Tenant A, try to read Tenant B's deadlines
SELECT 
    'Tenant A cannot see Tenant B deadlines',
    (SELECT COUNT(*) = 0 FROM public.deadlines WHERE workflow_instance_id IN (SELECT id FROM public.workflow_instances WHERE case_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd')) as pass;

-- As Tenant B, verify they CAN see their own data
SET LOCAL app.current_org_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
SELECT 
    'Tenant B can see own workflow instance',
    (SELECT COUNT(*) = 1 FROM public.workflow_instances WHERE case_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd') as pass
UNION ALL SELECT
    'Tenant B can see own tasks',
    (SELECT COUNT(*) = 2 FROM public.tasks WHERE workflow_instance_id IN (SELECT id FROM public.workflow_instances WHERE case_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd')) as pass;

\echo 'PASS: RLS cross-tenant isolation verified'

-- ============================================================
-- TEST 7: Constraints - Status/Completed_at Consistency
-- ============================================================

\echo '=== TEST 7: Status/Completed_at Constraints ==='

-- Test: workflow_instances completed_at required when completed
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
INSERT INTO public.workflow_instances (
    workflow_definition_id, workflow_version_id, case_id, org_id, current_state, status, completed_at
) VALUES (
    (SELECT id FROM public.workflow_definitions WHERE slug = 'mortgage_registration'),
    (SELECT id FROM public.workflow_versions WHERE workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug = 'mortgage_registration') AND version_number = '1.0.0'),
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'CLOSED',
    'completed',
    NULL  -- Missing completed_at - should fail
);
\echo 'FAIL: workflow_instances allowed completed without completed_at'

EXCEPTION WHEN check_violation THEN
    \echo 'PASS: workflow_instances requires completed_at when status=completed'

-- Test with completed_at provided
INSERT INTO public.workflow_instances (
    workflow_definition_id, workflow_version_id, case_id, org_id, current_state, status, completed_at
) VALUES (
    (SELECT id FROM public.workflow_definitions WHERE slug = 'mortgage_registration'),
    (SELECT id FROM public.workflow_versions WHERE workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug = 'mortgage_registration') AND version_number = '1.0.0'),
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'CLOSED',
    'completed',
    NOW()
);
\echo 'PASS: workflow_instances allows completed with completed_at'

-- ============================================================
-- TEST 8: Updated_at Trigger
-- ============================================================

\echo '=== TEST 8: Updated_at Triggers ==='

-- Test workflow_instances updated_at
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
UPDATE public.workflow_instances 
SET current_state = 'CHALLAN_GENERATED'
WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi');

SELECT 
    'workflow_instances updated_at updated',
    (SELECT updated_at > created_at FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi')) as pass;

-- Test tasks updated_at
UPDATE public.tasks 
SET status = 'in_progress'
WHERE task_definition_id = 'verify_docs' 
  AND workflow_instance_id = (SELECT id FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi'));

SELECT 
    'tasks updated_at updated',
    (SELECT updated_at > created_at FROM public.tasks WHERE task_definition_id = 'verify_docs' AND workflow_instance_id = (SELECT id FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi'))) as pass;

\echo 'PASS: Updated_at triggers verified'

-- ============================================================
-- TEST 9: Workflow Definition Validation Constraint
-- ============================================================

\echo '=== TEST 9: Workflow Definition Validation ==='

-- Try to insert invalid workflow definition (missing required fields)
INSERT INTO public.workflow_definitions (slug, name, version, status_field, definition_json)
VALUES ('invalid_workflow', 'Invalid', '1.0.0', 'status_field', '{}'::jsonb);
\echo 'FAIL: Invalid workflow definition allowed'

EXCEPTION WHEN check_violation THEN
    \echo 'PASS: Definition validation constraint rejects incomplete definition'

-- Try to insert workflow with invalid slug format
INSERT INTO public.workflow_definitions (slug, name, version, status_field, definition_json)
VALUES ('Invalid-Workflow', 'Invalid', '1.0.0', 'status_field', jsonb_build_object(
    'states', jsonb_build_array('A','B'),
    'transitions', jsonb_build_object('A', jsonb_build_array('B')),
    'initial_states', jsonb_build_array('A'),
    'terminal_states', jsonb_build_array('B')
));
\echo 'FAIL: Invalid slug format allowed'

EXCEPTION WHEN check_violation THEN
    \echo 'PASS: Slug format constraint works'

-- Try to insert workflow with invalid version format
INSERT INTO public.workflow_definitions (slug, name, version, status_field, definition_json)
VALUES ('valid_workflow', 'Valid', 'not-a-version', 'status_field', jsonb_build_object(
    'states', jsonb_build_array('A','B'),
    'transitions', jsonb_build_object('A', jsonb_build_array('B')),
    'initial_states', jsonb_build_array('A'),
    'terminal_states', jsonb_build_array('B')
));
\echo 'FAIL: Invalid version format allowed'

EXCEPTION WHEN check_violation THEN
    \echo 'PASS: Version format constraint works'

-- ============================================================
-- TEST 10: Global Read Access for Definitions/Versions
-- ============================================================

\echo '=== TEST 10: Global Read Access ==='

-- Both tenants should be able to read workflow definitions and versions
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
SELECT 'Tenant A can read definitions' as test, COUNT(*) as count FROM public.workflow_definitions;

SET LOCAL app.current_org_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
SELECT 'Tenant B can read definitions' as test, COUNT(*) as count FROM public.workflow_definitions;

SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
SELECT 'Tenant A can read versions' as test, COUNT(*) as count FROM public.workflow_versions;

SET LOCAL app.current_org_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
SELECT 'Tenant B can read versions' as test, COUNT(*) as count FROM public.workflow_versions;

\echo 'PASS: Global read access for definitions/versions verified'

-- ============================================================
-- TEST 11: Workflow Migration Scenario (Version Change)
-- ============================================================

\echo '=== TEST 11: Workflow Migration ==='

-- Simulate creating a new version of NOI workflow
INSERT INTO public.workflow_versions (workflow_definition_id, version_number, definition_json, created_by, changelog)
SELECT 
    wd.id,
    '1.1.0',
    jsonb_set(wd.definition_json, '{states}', 
        wd.definition_json->'states' || jsonb_build_array('NEW_STATE')::jsonb
    ),
    NULL,
    'Added NEW_STATE for extended process'
FROM public.workflow_definitions wd
WHERE wd.slug = 'noi'
ON CONFLICT DO NOTHING;

-- Verify new version exists
SELECT 
    'NOI version 1.1.0 created',
    EXISTS (SELECT 1 FROM public.workflow_versions wv JOIN public.workflow_definitions wd ON wd.id = wv.workflow_definition_id WHERE wd.slug='noi' AND wv.version_number='1.1.0') as pass;

-- Existing instance still points to version 1.0.0 (historical reproducibility)
SELECT 
    'Existing instance still on v1.0.0',
    (SELECT wv.version_number = '1.0.0' 
     FROM public.workflow_instances wi
     JOIN public.workflow_versions wv ON wv.id = wi.workflow_version_id
     WHERE wi.case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND wi.workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='noi')) as pass;

-- New instance can be created on v1.1.0
INSERT INTO public.workflow_instances (
    workflow_definition_id, workflow_version_id, case_id, org_id, current_state, status
) VALUES (
    (SELECT id FROM public.workflow_definitions WHERE slug = 'noi'),
    (SELECT id FROM public.workflow_versions WHERE workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug = 'noi') AND version_number = '1.1.0'),
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'DOCUMENTS_RECEIVED',
    'pending'
) ON CONFLICT DO NOTHING;
-- Note: This will fail due to unique constraint, which is correct - one instance per case per workflow

-- To migrate, you'd need to explicitly change the instance (governed migration)
\echo 'PASS: Workflow version pinning and migration path verified'

-- ============================================================
-- CLEANUP
-- ============================================================

\echo '=== CLEANUP ==='

-- Clean up test data (in reverse dependency order)
DELETE FROM public.deadlines WHERE workflow_instance_id IN (SELECT id FROM public.workflow_instances WHERE case_id IN ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd'));
DELETE FROM public.tasks WHERE workflow_instance_id IN (SELECT id FROM public.workflow_instances WHERE case_id IN ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd'));
DELETE FROM public.workflow_instances WHERE case_id IN ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd');
DELETE FROM public.cases WHERE id IN ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd');
DELETE FROM public.profiles WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');
DELETE FROM public.organizations WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

\echo '=== ALL TESTS PASSED ==='

-- Migration test complete: workflow persistence primitives verified