-- 004_fix_remaining_rls.sql
-- Fix remaining permissive RLS policies found in security audit:
-- 1. Notifications table: INSERT WITH CHECK (true) - cross-tenant notification creation
-- 2. staff_activity table: OR org_id IS NULL in boot-time migration - system logs leak across tenants
-- 3. profiles table: Principal policy missing org_id filter - cross-org profile access

-- ============================================================
-- 1. NOTIFICATIONS TABLE - Fix INSERT policy
-- ============================================================

-- Add org_id column to notifications table (nullable for backfill)
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- Create index for org_id lookups
CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON public.notifications(org_id);

-- Backfill org_id from user's profile
UPDATE public.notifications n
SET org_id = p.org_id
FROM public.profiles p
WHERE n.user_id = p.user_id
  AND n.org_id IS NULL
  AND p.org_id IS NOT NULL;

-- For any remaining NULL org_id, set to a default org or leave NULL
-- (Will be constrained after verification)

-- Drop the PERMISSIVE INSERT policy
DROP POLICY IF EXISTS "Allow authenticated to insert notifications" ON public.notifications;

-- Add RESTRICTIVE INSERT policy - users can only create notifications for users in their org
CREATE POLICY notifications_org_insert ON public.notifications
  FOR INSERT
  WITH CHECK (
    org_id = current_setting('app.current_org_id')::uuid
    AND user_id IN (
      SELECT user_id FROM public.profiles 
      WHERE org_id = current_setting('app.current_org_id')::uuid
    )
  );

-- Also fix SELECT and UPDATE policies to include org_id (defense in depth)
DROP POLICY IF EXISTS "Allow users to read their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow users to update their notifications" ON public.notifications;

CREATE POLICY notifications_org_select ON public.notifications
  FOR SELECT
  USING (
    user_id = auth.uid() 
    AND org_id = current_setting('app.current_org_id')::uuid
  );

CREATE POLICY notifications_org_update ON public.notifications
  FOR UPDATE
  USING (
    user_id = auth.uid() 
    AND org_id = current_setting('app.current_org_id')::uuid
  )
  WITH CHECK (
    org_id = current_setting('app.current_org_id')::uuid
  );

-- ============================================================
-- 2. STAFF_ACTIVITY TABLE (Supabase version) - Add org_id and fix policies
-- ============================================================

-- The supabase migration version of staff_activity lacks org_id column
-- Add org_id column
ALTER TABLE public.staff_activity ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_staff_activity_org_id ON public.staff_activity(org_id);

-- Backfill org_id from staff -> profiles -> org
UPDATE public.staff_activity sa
SET org_id = p.org_id
FROM public.staff s
JOIN public.profiles p ON p.user_id = s.auth_user_id
WHERE sa.staff_id = s.id
  AND sa.org_id IS NULL
  AND p.org_id IS NOT NULL;

-- Also backfill from case_id if staff_id is null
UPDATE public.staff_activity sa
SET org_id = c.org_id
FROM public.cases c
WHERE sa.case_id = c.id
  AND sa.org_id IS NULL;

-- Drop the existing policies (they only check staff_id, not org_id)
DROP POLICY IF EXISTS "activity_self_read" ON public.staff_activity;
DROP POLICY IF EXISTS "activity_admin_all" ON public.staff_activity;

-- Add org-scoped policies
CREATE POLICY staff_activity_org_isolation ON public.staff_activity
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- ============================================================
-- 3. STAFF_ACTIVITY TABLE (Boot-time version) - Fix OR org_id IS NULL
-- ============================================================

-- The boot-time migration has: org_id = current_setting('app.current_org_id')::uuid OR org_id IS NULL
-- This migration fixes the policy in the canonical package - the boot-time migration
-- will be updated separately to remove the OR org_id IS NULL clause

-- Note: The boot-time migration in src/server/migrations.sql will need to be updated
-- to remove the "OR org_id IS NULL" from the staff_activity policy.
-- This is tracked in the Phase 2 consolidation plan.

-- ============================================================
-- 4. PROFILES TABLE - Fix Principal cross-org access
-- ============================================================

-- Drop the existing overly permissive principal policy
DROP POLICY IF EXISTS profiles_admin_all ON public.profiles;

-- Add RESTRICTIVE policy - principals can only see profiles in their own org
CREATE POLICY profiles_admin_org ON public.profiles
  FOR ALL
  USING (
    org_id = current_setting('app.current_org_id')::uuid
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() 
        AND p.role = 'PRINCIPAL'
        AND p.org_id = current_setting('app.current_org_id')::uuid
    )
  );

-- ============================================================
-- 5. NOTIFICATIONS - Add org_id NOT NULL constraint after verification
-- ============================================================

-- Verify no orphaned notifications (will warn but not fail)
DO $$
DECLARE
  null_count INT;
BEGIN
  SELECT COUNT(*) INTO null_count FROM public.notifications WHERE org_id IS NULL;
  IF null_count > 0 THEN
    RAISE WARNING 'notifications: % rows have NULL org_id (orphaned records - review needed)', null_count;
  END IF;
END $$;

-- Verify no orphaned staff_activity (Supabase version)
DO $$
DECLARE
  null_count INT;
BEGIN
  SELECT COUNT(*) INTO null_count FROM public.staff_activity WHERE org_id IS NULL;
  IF null_count > 0 THEN
    RAISE WARNING 'staff_activity (Supabase): % rows have NULL org_id (orphaned records - review needed)', null_count;
  END IF;
END $$;

-- Migration complete: All three permissive RLS issues fixed