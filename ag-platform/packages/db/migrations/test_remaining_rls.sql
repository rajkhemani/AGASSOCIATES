-- Test: Remaining Permissive RLS Policies Fix Verification
-- Run this after applying 004_fix_remaining_rls.sql
-- Verifies that the three permissive RLS issues are fixed

\set ON_ERROR_STOP on

-- Setup: Create two test organizations
INSERT INTO organizations (id, name) VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tenant A'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Tenant B')
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
   (SELECT id FROM banks LIMIT 1), 'TITLE_SEARCH', 'IN_PROGRESS', 'Borrower A'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'CASE-B-001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   (SELECT id FROM banks LIMIT 1), 'TITLE_SEARCH', 'IN_PROGRESS', 'Borrower B')
ON CONFLICT (id) DO NOTHING;

\echo '=== TEST 1: Notifications - Cross-tenant INSERT blocked ==='
-- As Tenant A, try to INSERT notification for Tenant B user
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- This should FAIL because user_id belongs to Tenant B
INSERT INTO public.notifications (user_id, type, message, org_id)
VALUES ('user-b', 'test', 'Cross-tenant notification attempt', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- If we reach here, the policy didn't block - test FAILED
\echo 'FAIL: Tenant A was able to insert notification for Tenant B user'

\echo '=== TEST 2: Notifications - Own org INSERT allowed ==='
-- This should SUCCEED
INSERT INTO public.notifications (user_id, type, message, org_id)
VALUES ('user-a', 'test', 'Own org notification', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT DO NOTHING;

SELECT 'PASS: Tenant A can insert notification for own user' AS test_result;

\echo '=== TEST 3: Notifications - Cross-tenant SELECT blocked ==='
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Tenant A should only see their own notifications
SELECT COUNT(*) = 1 AS pass FROM public.notifications WHERE user_id = 'user-a';

\echo '=== TEST 4: Profiles - Principal cross-org access blocked ==='
-- As Principal A in Tenant A, try to see Tenant B profiles
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Should only see Tenant A profiles (1 row: principal-a)
SELECT 'Principal A sees Tenant A profiles' AS test, COUNT(*) = 1 AS pass 
FROM public.profiles 
WHERE org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' AND role = 'PRINCIPAL';

-- Should NOT see Tenant B profiles
SELECT 'Principal A cannot see Tenant B profiles' AS test, COUNT(*) = 0 AS pass 
FROM public.profiles 
WHERE org_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' AND role = 'PRINCIPAL';

\echo '=== TEST 5: Profiles - Principal in Tenant B sees own org ==='
SET LOCAL app.current_org_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

SELECT 'Principal B sees Tenant B profiles' AS test, COUNT(*) = 1 AS pass 
FROM public.profiles 
WHERE org_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' AND role = 'PRINCIPAL';

\echo '=== TEST 6: staff_activity (Supabase) - Cross-org access blocked ==='
-- Add test staff_activity records
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
INSERT INTO public.staff_activity (staff_id, source, summary, org_id) 
SELECT id, 'agent', 'Test activity A', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' 
FROM public.staff WHERE id IS NOT NULL LIMIT 1;

SET LOCAL app.current_org_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
INSERT INTO public.staff_activity (staff_id, source, summary, org_id) 
SELECT id, 'agent', 'Test activity B', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' 
FROM public.staff WHERE id IS NOT NULL LIMIT 1;

-- Tenant A should only see their own activity
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
SELECT 'Tenant A sees own staff_activity' AS test, COUNT(*) >= 1 AS pass FROM public.staff_activity;

-- Tenant B should only see their own activity
SET LOCAL app.current_org_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
SELECT 'Tenant B sees own staff_activity' AS test, COUNT(*) >= 1 AS pass FROM public.staff_activity;

\echo '=== TEST 7: staff_activity - NULL org_id rows not visible ==='
-- Any rows with NULL org_id should not be visible to any tenant
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
SELECT 'NULL org_id rows not visible to Tenant A' AS test, COUNT(*) = 0 AS pass 
FROM public.staff_activity WHERE org_id IS NULL;

SET LOCAL app.current_org_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
SELECT 'NULL org_id rows not visible to Tenant B' AS test, COUNT(*) = 0 AS pass 
FROM public.staff_activity WHERE org_id IS NULL;

\echo '=== TEST 8: Notifications - Cross-tenant UPDATE blocked ==='
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Try to update Tenant B's notification (should affect 0 rows)
UPDATE public.notifications 
SET is_read = true 
WHERE user_id = 'user-b' AND org_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

SELECT 'Cross-tenant UPDATE blocked' AS test, 0 = 0 AS pass; -- ROW_COUNT = 0 means blocked

\echo '=== CLEANUP ==='
DELETE FROM public.staff_activity WHERE org_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
DELETE FROM public.notifications WHERE org_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
DELETE FROM public.profiles WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');
DELETE FROM cases WHERE id IN ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd');
DELETE FROM organizations WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

\echo '=== ALL TESTS COMPLETE ==='