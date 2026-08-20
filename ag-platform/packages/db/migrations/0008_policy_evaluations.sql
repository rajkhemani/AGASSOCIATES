-- 0008_policy_evaluations.sql
-- Create policy_evaluations table for AI governance policy decision layer
-- This is the gate between AI Run and Approval/ExternalAction (P3 / P28)

-- ============================================================
-- 1. CREATE DECISION ENUM
-- ============================================================

DO $$ BEGIN
    CREATE TYPE policy_decision AS ENUM ('ALLOW', 'REQUIRE_APPROVAL', 'DENY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 2. CREATE POLICY_EVALUATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.policy_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
    workflow_instance_id UUID, -- References workflow engine instance (no FK, external system)
    task_id UUID, -- References task in workflow (no FK, external system)
    ai_run_id UUID, -- References AI run that triggered this evaluation
    action_type TEXT NOT NULL, -- e.g., 'document_generation', 'external_api_call', 'data_export', 'case_transition'
    integration TEXT, -- External integration name if applicable (e.g., 'igr_portal', 'nesl', 'gras', 'email')
    role TEXT NOT NULL, -- Role of the actor requesting the action (PRINCIPAL, ADVOCATE, EXECUTIVE, CLERK, BANK_VIEWER, AI_AGENT)
    legal_basis_confirmed BOOLEAN NOT NULL DEFAULT FALSE, -- Whether legal basis for action is confirmed
    approval_policy TEXT NOT NULL DEFAULT 'standard', -- Policy name/version governing approval (e.g., 'standard', 'strict', 'bypass')
    decision policy_decision NOT NULL, -- ALLOW, REQUIRE_APPROVAL, DENY
    reason TEXT NOT NULL, -- Human-readable reason for the decision
    policy_version TEXT NOT NULL DEFAULT '1.0', -- Version of the policy ruleset applied
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. CREATE INDEXES
-- ============================================================

-- Primary lookup: evaluations for a tenant
CREATE INDEX IF NOT EXISTS idx_policy_evaluations_tenant_id 
    ON public.policy_evaluations(tenant_id);

-- Case-scoped queries
CREATE INDEX IF NOT EXISTS idx_policy_evaluations_case_id 
    ON public.policy_evaluations(case_id);

-- Workflow instance lookups
CREATE INDEX IF NOT EXISTS idx_policy_evaluations_workflow_instance_id 
    ON public.policy_evaluations(workflow_instance_id);

-- Task-scoped queries
CREATE INDEX IF NOT EXISTS idx_policy_evaluations_task_id 
    ON public.policy_evaluations(task_id);

-- AI run lookups
CREATE INDEX IF NOT EXISTS idx_policy_evaluations_ai_run_id 
    ON public.policy_evaluations(ai_run_id);

-- Action type filtering
CREATE INDEX IF NOT EXISTS idx_policy_evaluations_action_type 
    ON public.policy_evaluations(action_type);

-- Integration filtering
CREATE INDEX IF NOT EXISTS idx_policy_evaluations_integration 
    ON public.policy_evaluations(integration);

-- Role filtering
CREATE INDEX IF NOT EXISTS idx_policy_evaluations_role 
    ON public.policy_evaluations(role);

-- Decision filtering
CREATE INDEX IF NOT EXISTS idx_policy_evaluations_decision 
    ON public.policy_evaluations(decision);

-- Time-series queries
CREATE INDEX IF NOT EXISTS idx_policy_evaluations_evaluated_at 
    ON public.policy_evaluations(evaluated_at DESC);

-- Composite index for tenant + case lookups
CREATE INDEX IF NOT EXISTS idx_policy_evaluations_tenant_case 
    ON public.policy_evaluations(tenant_id, case_id);

-- Composite index for tenant + workflow lookups
CREATE INDEX IF NOT EXISTS idx_policy_evaluations_tenant_workflow 
    ON public.policy_evaluations(tenant_id, workflow_instance_id);

-- Composite index for tenant + evaluated_at (time-series per tenant)
CREATE INDEX IF NOT EXISTS idx_policy_evaluations_tenant_time 
    ON public.policy_evaluations(tenant_id, evaluated_at DESC);

-- ============================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.policy_evaluations ENABLE ROW LEVEL SECURITY;

-- Org-scoped access policy
-- Users can only access policy evaluations within their organization
CREATE POLICY policy_evaluations_org_isolation ON public.policy_evaluations
    FOR ALL
    USING (tenant_id = current_setting('app.current_org_id')::uuid);

-- ============================================================
-- 5. GRANT PRIVILEGES TO ag_app (RUNTIME ROLE)
-- ============================================================

GRANT SELECT, INSERT ON public.policy_evaluations TO ag_app;
GRANT USAGE, SELECT ON SEQUENCE public.policy_evaluations_id_seq TO ag_app;

-- Note: UPDATE/DELETE are intentionally NOT granted - policy evaluations are IMMUTABLE audit records
-- The grants exist for edge cases (admin corrections, GDPR deletion)
-- Application logic should enforce immutability

-- ============================================================
-- 6. VERIFICATION QUERIES (run after migration)
-- ============================================================

/*
-- Verify table structure
\d public.policy_evaluations

-- Verify enums
SELECT * FROM pg_type WHERE typname = 'policy_decision';

-- Verify indexes
\di idx_policy_evaluations_*

-- Verify RLS is enabled
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'policy_evaluations';

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'policy_evaluations';

-- Verify grants
SELECT * FROM information_schema.table_privileges WHERE table_name = 'policy_evaluations';

-- Test insert (as ag_owner)
INSERT INTO public.policy_evaluations (
    tenant_id, case_id, workflow_instance_id, task_id, ai_run_id,
    action_type, integration, role, legal_basis_confirmed, approval_policy,
    decision, reason, policy_version
) VALUES (
    '7f45dc5f-6bef-4fae-b46a-a2306e69936d'::uuid, -- AG Associates HQs
    NULL,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    'document_generation',
    'igr_portal',
    'AI_AGENT',
    TRUE,
    'standard',
    'ALLOW',
    'Legal basis confirmed for mortgage registration document generation',
    '1.0'
);

-- Test decision enum values
INSERT INTO public.policy_evaluations (
    tenant_id, action_type, role, legal_basis_confirmed, approval_policy,
    decision, reason, policy_version
) VALUES 
    ('7f45dc5f-6bef-4fae-b46a-a2306e69936d'::uuid, 'external_api_call', 'EXECUTIVE', FALSE, 'standard', 'REQUIRE_APPROVAL', 'Missing legal basis confirmation', '1.0'),
    ('7f45dc5f-6bef-4fae-b46a-a2306e69936d'::uuid, 'data_export', 'CLERK', FALSE, 'strict', 'DENY', 'Insufficient role privileges for data export under strict policy', '1.0');
*/

-- Migration complete: policy_evaluations table created with full AI governance decision tracking