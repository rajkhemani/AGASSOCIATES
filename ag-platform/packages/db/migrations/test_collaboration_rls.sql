-- Test: Collaboration RLS Tenant Isolation
-- Run this script against a database with the 003_fix_collaboration_rls migration applied
-- Tests that tasks, comments, activities are properly isolated by org_id

\set ON_ERROR_STOP on

-- Setup: Create two test organizations
INSERT INTO organizations (id, name) VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tenant A'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Tenant B')
ON CONFLICT (id) DO NOTHING;

-- Create test users for each org
INSERT INTO profiles (id, user_id, org_id, full_name, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'user-a', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'User A', 'ADVOCATE'),
  ('22222222-2222-2222-2222-222222222222', 'user-b', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'User B', 'ADVOCATE')
ON CONFLICT (id) DO NOTHING;

-- Create test cases for each org
INSERT INTO cases (id, case_number, org_id, bank_id, case_type, status, borrower_name) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'CASE-A-001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
   (SELECT id FROM banks LIMIT 1), 'TITLE_SEARCH', 'IN_PROGRESS', 'Borrower A'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'CASE-B-001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   (SELECT id FROM banks LIMIT 1), 'TITLE_SEARCH', 'IN_PROGRESS', 'Borrower B')
ON CONFLICT (id) DO NOTHING;

-- Test 1: As Tenant A, create a task
\echo '=== TEST 1: Tenant A creates task ==='
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

INSERT INTO public.tasks (project_id, title, description, status, assignee_id)
VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Task for Tenant A', 'Description A', 'To Do', '11111111-1111-1111-1111-111111111111')
RETURNING id, org_id;

-- Verify task was created with org_id = Tenant A
SELECT 'Task org_id check' AS test, org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' AS passed
FROM public.tasks WHERE project_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Test 2: As Tenant B, create a task
\echo '=== TEST 2: Tenant B creates task ==='
SET LOCAL app.current_org_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

INSERT INTO public.tasks (project_id, title, description, status, assignee_id)
VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Task for Tenant B', 'Description B', 'To Do', '22222222-2222-2222-2222-222222222222')
RETURNING id, org_id;

-- Verify task was created with org_id = Tenant B
SELECT 'Task org_id check' AS test, org_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' AS passed
FROM public.tasks WHERE project_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

-- Test 3: As Tenant A, SELECT tasks - should only see Tenant A's task
\echo '=== TEST 3: Tenant A reads tasks (should see 1) ==='
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

SELECT 'Tenant A sees tasks' AS test, COUNT(*) = 1 AS passed
FROM public.tasks;

-- Test 4: As Tenant B, SELECT tasks - should only see Tenant B's task
\echo '=== TEST 4: Tenant B reads tasks (should see 1) ==='
SET LOCAL app.current_org_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

SELECT 'Tenant B sees tasks' AS test, COUNT(*) = 1 AS passed
FROM public.tasks;

-- Test 5: As Tenant A, attempt to UPDATE Tenant B's task - should affect 0 rows
\echo '=== TEST 5: Tenant A tries to update Tenant B task (should fail) ==='
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

UPDATE public.tasks 
SET title = 'HACKED BY TENANT A'
WHERE id = (SELECT id FROM public.tasks WHERE project_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd');

SELECT 'Tenant A update Tenant B task' AS test, 
  (SELECT title FROM public.tasks WHERE project_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd') = 'Task for Tenant B' AS passed;

-- Test 6: As Tenant A, attempt to DELETE Tenant B's task - should affect 0 rows
\echo '=== TEST 6: Tenant A tries to delete Tenant B task (should fail) ==='
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

DELETE FROM public.tasks 
WHERE id = (SELECT id FROM public.tasks WHERE project_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd');

SELECT 'Tenant A delete Tenant B task' AS test,
  EXISTS (SELECT 1 FROM public.tasks WHERE project_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd') AS passed;

-- Test 7: Comments isolation
\echo '=== TEST 7: Comments tenant isolation ==='
-- Get task IDs
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
\set task_a_id `SELECT id FROM public.tasks WHERE project_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'`

SET LOCAL app.current_org_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
\set task_b_id `SELECT id FROM public.tasks WHERE project_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'`

-- Tenant A adds comment to their task
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
INSERT INTO public.comments (project_id, task_id, user_id, content)
VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', :task_a_id, '11111111-1111-1111-1111-111111111111', 'Comment by Tenant A');

-- Tenant B adds comment to their task
SET LOCAL app.current_org_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
INSERT INTO public.comments (project_id, task_id, user_id, content)
VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', :task_b_id, '22222222-2222-2222-2222-222222222222', 'Comment by Tenant B');

-- Tenant A reads comments - should only see their own
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
SELECT 'Tenant A sees comments' AS test, COUNT(*) = 1 AS passed FROM public.comments;

-- Tenant B reads comments - should only see their own
SET LOCAL app.current_org_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
SELECT 'Tenant B sees comments' AS test, COUNT(*) = 1 AS passed FROM public.comments;

-- Test 8: Activities isolation
\echo '=== TEST 8: Activities tenant isolation ==='
-- Tenant A adds activity
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
INSERT INTO public.activities (project_id, user_id, action, target)
VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'created', 'task');

-- Tenant B adds activity
SET LOCAL app.current_org_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
INSERT INTO public.activities (project_id, user_id, action, target)
VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'created', 'task');

-- Tenant A reads activities - should only see their own
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
SELECT 'Tenant A sees activities' AS test, COUNT(*) = 1 AS passed FROM public.activities;

-- Tenant B reads activities - should only see their own
SET LOCAL app.current_org_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
SELECT 'Tenant B sees activities' AS test, COUNT(*) = 1 AS passed FROM public.activities;

-- Test 9: Without org_id set (should see nothing due to RLS)
\echo '=== TEST 9: No org_id set (should see 0 rows) ==='
RESET app.current_org_id;

SELECT 'No org_id - tasks' AS test, COUNT(*) = 0 AS passed FROM public.tasks;
SELECT 'No org_id - comments' AS test, COUNT(*) = 0 AS passed FROM public.comments;
SELECT 'No org_id - activities' AS test, COUNT(*) = 0 AS passed FROM public.activities;

-- Cleanup
\echo '=== CLEANUP ==='
DELETE FROM public.activities WHERE project_id IN ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd');
DELETE FROM public.comments WHERE project_id IN ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd');
DELETE FROM public.tasks WHERE project_id IN ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd');
DELETE FROM cases WHERE id IN ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd');
DELETE FROM profiles WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
DELETE FROM organizations WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

\echo '=== ALL TESTS COMPLETE ==='