-- 003_fix_collaboration_rls.sql
-- Fix CRITICAL RLS vulnerability: collaboration tables (tasks, comments, activities) had USING(true) policies
-- providing ZERO tenant isolation. This migration adds org_id columns, backfills from case relationship,
-- drops permissive policies, and adds restrictive org-scoped policies.

-- 1. Add org_id columns (nullable first for backfill)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- 2. Create indexes for org_id lookups
CREATE INDEX IF NOT EXISTS idx_tasks_org_id ON public.tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_comments_org_id ON public.comments(org_id);
CREATE INDEX IF NOT EXISTS idx_activities_org_id ON public.activities(org_id);

-- 3. Backfill org_id from case/project relationship
-- tasks: project_id references cases.id (via project_id in cases context)
-- comments: task_id -> tasks.project_id -> cases.id
-- activities: project_id references cases.id

-- Backfill tasks.org_id from cases via project_id
UPDATE public.tasks t
SET org_id = c.org_id
FROM public.cases c
WHERE t.project_id = c.id
  AND t.org_id IS NULL;

-- Backfill comments.org_id from tasks -> cases
UPDATE public.comments cm
SET org_id = t.org_id
FROM public.tasks t
WHERE cm.task_id = t.id
  AND cm.org_id IS NULL
  AND t.org_id IS NOT NULL;

-- Backfill activities.org_id from cases via project_id
UPDATE public.activities a
SET org_id = c.org_id
FROM public.cases c
WHERE a.project_id = c.id
  AND a.org_id IS NULL;

-- 4. For any remaining NULL org_id (orphaned records), set to a default org or leave NULL
-- We'll leave them NULL and add a check constraint later if needed

-- 5. Drop the PERMISSIVE RLS policies (CRITICAL - these provide ZERO isolation)
DROP POLICY IF EXISTS "Allow authenticated full access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow authenticated full access to comments" ON public.comments;
DROP POLICY IF EXISTS "Allow authenticated full access to activities" ON public.activities;

-- 6. Add RESTRICTIVE RLS policies using current_setting('app.current_org_id')
-- These enforce multi-tenant isolation via the GUC set by middleware

-- tasks: org_id directly on table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_org_isolation ON public.tasks
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- comments: org_id directly on table (backfilled from tasks)
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY comments_org_isolation ON public.comments
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- activities: org_id directly on table (backfilled from cases)
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY activities_org_isolation ON public.activities
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- 7. NOTIFICATIONS table - keep existing user-scoped policies (separate concern)
-- notifications already has: user_id = auth.uid() for SELECT/UPDATE
-- No changes needed per task requirements

-- 8. Add updated_at triggers for new columns
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Verification: Ensure no rows have NULL org_id after backfill
-- (This will warn but not fail - orphaned records can be cleaned up separately)
DO $$
DECLARE
  null_tasks INT;
  null_comments INT;
  null_activities INT;
BEGIN
  SELECT COUNT(*) INTO null_tasks FROM public.tasks WHERE org_id IS NULL;
  SELECT COUNT(*) INTO null_comments FROM public.comments WHERE org_id IS NULL;
  SELECT COUNT(*) INTO null_activities FROM public.activities WHERE org_id IS NULL;
  
  IF null_tasks > 0 THEN
    RAISE WARNING 'tasks: % rows have NULL org_id (orphaned records)', null_tasks;
  END IF;
  IF null_comments > 0 THEN
    RAISE WARNING 'comments: % rows have NULL org_id (orphaned records)', null_comments;
  END IF;
  IF null_activities > 0 THEN
    RAISE WARNING 'activities: % rows have NULL org_id (orphaned records)', null_activities;
  END IF;
END $$;

-- Migration complete: collaboration tables now have org-scoped RLS