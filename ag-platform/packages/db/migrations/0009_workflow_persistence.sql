-- 0009_workflow_persistence.sql
-- Create canonical workflow persistence primitives (P1-B)
-- Enables reproducible, versioned workflow execution with full audit trail

-- ============================================================
-- 1. CREATE ENUMS FOR WORKFLOW STATUS
-- ============================================================

DO $$ BEGIN
    CREATE TYPE workflow_instance_status AS ENUM (
        'pending',      -- Instance created, not yet started
        'running',      -- Actively executing
        'paused',       -- Paused (awaiting external input, human decision, etc.)
        'completed',    -- Reached terminal state successfully
        'failed',       -- Failed due to error (transition validation, timeout, etc.)
        'cancelled',    -- Cancelled by user/system before completion
        'migrated'      -- Migrated to a new workflow version (historical record)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM (
        'pending',      -- Task created, not yet assigned/started
        'assigned',     -- Assigned to assignee, not yet started
        'in_progress',  -- Actively being worked on
        'awaiting_input', -- Waiting for external input (OTP, document, approval)
        'completed',    -- Completed successfully
        'failed',       -- Failed (retry may be possible)
        'cancelled',    -- Cancelled
        'skipped'       -- Skipped (not required for this case path)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE deadline_type AS ENUM (
        'sla',          -- Service level agreement deadline
        'statutory',    -- Statutory/legal deadline (e.g., Section 89B 30-day window)
        'internal',     -- Internal process deadline
        'escalation'    -- Escalation trigger deadline
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE deadline_status AS ENUM (
        'pending',      -- Deadline not yet reached
        'triggered',    -- Deadline reached, action required
        'completed',    -- Deadline satisfied (action taken in time)
        'breached',     -- Deadline missed
        'cancelled'     -- Deadline cancelled (workflow completed/changed)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 2. WORKFLOW_DEFINITIONS TABLE
-- ============================================================
-- Canonical workflow definitions. One row per workflow slug.
-- definition_json contains the full WorkflowDefinition structure (states, transitions, deadlines, etc.)
-- Validated at import time via application logic (mirrors Python WorkflowDefinition.__post_init__)

CREATE TABLE IF NOT EXISTS public.workflow_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,                    -- e.g., 'noi', 'mortgage_registration', 'public_notice'
    name TEXT NOT NULL,                           -- Human-readable name
    version TEXT NOT NULL,                        -- Semantic version (e.g., '1.0.0')
    status_field TEXT NOT NULL,                   -- Column on cases table holding this workflow's stage
    redis_prefix TEXT,                            -- Redis key prefix for fallback storage
    definition_json JSONB NOT NULL,               -- Full workflow definition (states, transitions, deadlines, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id),
    
    -- Constraints
    CONSTRAINT workflow_definitions_slug_format CHECK (slug ~ '^[a-z_]+$'),
    CONSTRAINT workflow_definitions_version_format CHECK (version ~ '^\d+\.\d+\.\d+$'),
    CONSTRAINT workflow_definitions_definition_valid CHECK (
        -- Basic structural validation at DB level
        definition_json ? 'states'
        AND definition_json ? 'transitions'
        AND definition_json ? 'initial_states'
        AND definition_json ? 'terminal_states'
        AND jsonb_typeof(definition_json->'states') = 'array'
        AND jsonb_typeof(definition_json->'transitions') = 'object'
        AND jsonb_typeof(definition_json->'initial_states') = 'array'
        AND jsonb_typeof(definition_json->'terminal_states') = 'array'
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_slug ON public.workflow_definitions(slug);

-- ============================================================
-- 3. WORKFLOW_VERSIONS TABLE
-- ============================================================
-- Immutable version history for workflow definitions.
-- Each time a workflow definition is updated, a new version row is created.
-- Allows historical reproducibility: instances pin to a specific version.

CREATE TABLE IF NOT EXISTS public.workflow_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_definition_id UUID NOT NULL REFERENCES public.workflow_definitions(id) ON DELETE CASCADE,
    version_number TEXT NOT NULL,                 -- Semantic version (e.g., '1.0.0', '1.1.0')
    definition_json JSONB NOT NULL,               -- Snapshot of definition at this version
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id),
    changelog TEXT,                               -- Human-readable description of changes
    
    -- Constraints
    CONSTRAINT workflow_versions_version_format CHECK (version_number ~ '^\d+\.\d+\.\d+$'),
    CONSTRAINT workflow_versions_unique_version UNIQUE (workflow_definition_id, version_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_versions_definition ON public.workflow_versions(workflow_definition_id);
CREATE INDEX IF NOT EXISTS idx_workflow_versions_number ON public.workflow_versions(workflow_definition_id, version_number);

-- ============================================================
-- 4. WORKFLOW_INSTANCES TABLE
-- ============================================================
-- Runtime workflow instances. Each case can have one instance per workflow type.
-- Pinned to workflow_version at creation for historical reproducibility.
-- Only explicitly governed migration can change instance's workflow_version.

CREATE TABLE IF NOT EXISTS public.workflow_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_definition_id UUID NOT NULL REFERENCES public.workflow_definitions(id) ON DELETE RESTRICT,
    workflow_version_id UUID NOT NULL REFERENCES public.workflow_versions(id) ON DELETE RESTRICT,
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    current_state TEXT NOT NULL,                  -- Current stage (from workflow's states)
    status workflow_instance_status NOT NULL DEFAULT 'pending',
    context_json JSONB NOT NULL DEFAULT '{}',     -- Runtime context (variables, metadata, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    started_by UUID REFERENCES public.profiles(id),
    
    -- Constraints
    CONSTRAINT workflow_instances_unique_case_workflow UNIQUE (case_id, workflow_definition_id),
    CONSTRAINT workflow_instances_completed_when_done CHECK (
        (status IN ('completed', 'failed', 'cancelled', 'migrated') AND completed_at IS NOT NULL)
        OR (status IN ('pending', 'running', 'paused') AND completed_at IS NULL)
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_instances_case ON public.workflow_instances(case_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_org ON public.workflow_instances(org_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_definition ON public.workflow_instances(workflow_definition_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_version ON public.workflow_instances(workflow_version_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON public.workflow_instances(status);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_current_state ON public.workflow_instances(current_state);

-- ============================================================
-- 5. TASKS TABLE
-- ============================================================
-- Tasks within a workflow instance. Based on workflow definition's stage/task structure.
-- Each task corresponds to a step that must be completed to advance the workflow.

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_instance_id UUID NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
    task_definition_id TEXT NOT NULL,             -- Identifier from workflow definition (e.g., 'generate_challan', 'verify_docs')
    assignee_id UUID REFERENCES public.profiles(id),
    status task_status NOT NULL DEFAULT 'pending',
    due_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metadata_json JSONB NOT NULL DEFAULT '{}',    -- Task-specific data (input, output, evidence, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT tasks_completed_when_done CHECK (
        (status IN ('completed', 'failed', 'cancelled', 'skipped') AND completed_at IS NOT NULL)
        OR (status IN ('pending', 'assigned', 'in_progress', 'awaiting_input') AND completed_at IS NULL)
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_instance ON public.tasks(workflow_instance_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_definition ON public.tasks(task_definition_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON public.tasks(due_at) WHERE due_at IS NOT NULL;

-- ============================================================
-- 6. DEADLINES TABLE
-- ============================================================
-- Deadlines attached to workflow instances or specific tasks.
-- Based on workflow definition's deadlines (statutory clocks, SLAs, etc.)

CREATE TABLE IF NOT EXISTS public.deadlines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_instance_id UUID NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,  -- Optional: deadline for specific task
    deadline_type deadline_type NOT NULL,
    label TEXT NOT NULL,                          -- Human-readable label (e.g., 'Section 89B filing window')
    due_at TIMESTAMPTZ NOT NULL,                  -- Absolute deadline timestamp
    status deadline_status NOT NULL DEFAULT 'pending',
    triggered_at TIMESTAMPTZ,
    metadata_json JSONB NOT NULL DEFAULT '{}',    -- Additional context (window_days, starts_from, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deadlines_instance ON public.deadlines(workflow_instance_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_task ON public.deadlines(task_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_status ON public.deadlines(status);
CREATE INDEX IF NOT EXISTS idx_deadlines_due_at ON public.deadlines(due_at);
CREATE INDEX IF NOT EXISTS idx_deadlines_type ON public.deadlines(deadline_type);

-- ============================================================
-- 7. TRIGGERS FOR UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_workflow_definitions_updated_at ON public.workflow_definitions;
CREATE TRIGGER update_workflow_definitions_updated_at
    BEFORE UPDATE ON public.workflow_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_instances_updated_at ON public.workflow_instances;
CREATE TRIGGER update_workflow_instances_updated_at
    BEFORE UPDATE ON public.workflow_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deadlines_updated_at ON public.deadlines;
CREATE TRIGGER update_deadlines_updated_at
    BEFORE UPDATE ON public.deadlines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 8. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;

-- workflow_definitions: Global read (all orgs can read definitions), owner write
CREATE POLICY workflow_definitions_global_read ON public.workflow_definitions
    FOR SELECT USING (true);

CREATE POLICY workflow_definitions_owner_write ON public.workflow_definitions
    FOR ALL USING (current_user = 'ag_owner');

-- workflow_versions: Global read, owner write
CREATE POLICY workflow_versions_global_read ON public.workflow_versions
    FOR SELECT USING (true);

CREATE POLICY workflow_versions_owner_write ON public.workflow_versions
    FOR ALL USING (current_user = 'ag_owner');

-- workflow_instances: Org-scoped access
CREATE POLICY workflow_instances_org_isolation ON public.workflow_instances
    FOR ALL
    USING (org_id = current_setting('app.current_org_id')::uuid);

-- tasks: Org-scoped via workflow_instance
CREATE POLICY tasks_org_isolation ON public.tasks
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.workflow_instances wi
            WHERE wi.id = tasks.workflow_instance_id
            AND wi.org_id = current_setting('app.current_org_id')::uuid
        )
    );

-- deadlines: Org-scoped via workflow_instance
CREATE POLICY deadlines_org_isolation ON public.deadlines
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.workflow_instances wi
            WHERE wi.id = deadlines.workflow_instance_id
            AND wi.org_id = current_setting('app.current_org_id')::uuid
        )
    );

-- ============================================================
-- 9. GRANT PRIVILEGES TO ag_app (RUNTIME ROLE)
-- ============================================================

GRANT SELECT ON public.workflow_definitions TO ag_app;
GRANT SELECT ON public.workflow_versions TO ag_app;
GRANT SELECT, INSERT, UPDATE ON public.workflow_instances TO ag_app;
GRANT SELECT, INSERT, UPDATE ON public.tasks TO ag_app;
GRANT SELECT, INSERT, UPDATE ON public.deadlines TO ag_app;

GRANT USAGE, SELECT ON SEQUENCE public.workflow_definitions_id_seq TO ag_app;
GRANT USAGE, SELECT ON SEQUENCE public.workflow_versions_id_seq TO ag_app;
GRANT USAGE, SELECT ON SEQUENCE public.workflow_instances_id_seq TO ag_app;
GRANT USAGE, SELECT ON SEQUENCE public.tasks_id_seq TO ag_app;
GRANT USAGE, SELECT ON SEQUENCE public.deadlines_id_seq TO ag_app;

-- Note: DELETE not granted - workflow data is immutable audit trail
-- UPDATE restricted to status transitions, not definition changes

-- ============================================================
-- 10. SEED WORKFLOW DEFINITIONS
-- ============================================================
-- Insert the three canonical workflow definitions from ag-associates-ai
-- These mirror the Python WorkflowDefinition objects exactly

INSERT INTO public.workflow_definitions (slug, name, version, status_field, redis_prefix, definition_json, created_by)
VALUES
(
    'noi',
    'Notice of Intimation',
    '1.0.0',
    'noi_status',
    'noi:case:',
    jsonb_build_object(
        'slug', 'noi',
        'label', 'Notice of Intimation',
        'status_field', 'noi_status',
        'redis_prefix', 'noi:case:',
        'states', jsonb_build_array(
            'DOCUMENTS_RECEIVED',
            'CHALLAN_GENERATED',
            'CHALLAN_PAID',
            'VERIFIED',
            'NOI_DROP_RECEIVED',
            'RECTIFY',
            'NOI_FILED',
            'ACKNOWLEDGED',
            'COMPLETED'
        ),
        'transitions', jsonb_build_object(
            'DOCUMENTS_RECEIVED', jsonb_build_array('CHALLAN_GENERATED'),
            'CHALLAN_GENERATED', jsonb_build_array('CHALLAN_PAID'),
            'CHALLAN_PAID', jsonb_build_array('VERIFIED'),
            'VERIFIED', jsonb_build_array('NOI_DROP_RECEIVED', 'RECTIFY'),
            'NOI_DROP_RECEIVED', jsonb_build_array('NOI_FILED', 'RECTIFY'),
            'RECTIFY', jsonb_build_array('NOI_FILED', 'VERIFIED'),
            'NOI_FILED', jsonb_build_array('ACKNOWLEDGED'),
            'ACKNOWLEDGED', jsonb_build_array('COMPLETED'),
            'COMPLETED', jsonb_build_array(),
            'MISMATCH', jsonb_build_array('VERIFIED')
        ),
        'initial_states', jsonb_build_array('DOCUMENTS_RECEIVED'),
        'terminal_states', jsonb_build_array('COMPLETED', 'REJECTED'),
        'exception_states', jsonb_build_array('MISMATCH', 'REJECTED'),
        'deadlines', jsonb_build_object(
            'DOCUMENTS_RECEIVED', jsonb_build_object(
                'label', 'Section 89B filing window',
                'options', jsonb_build_array(30),
                'starts_from', 'date of the mortgage — deposit of title deeds',
                'blocking', true
            )
        )
    ),
    NULL
),
(
    'mortgage_registration',
    'Mortgage Registration',
    '1.0.0',
    'mortgage_status',
    'mortgage:case:',
    jsonb_build_object(
        'slug', 'mortgage_registration',
        'label', 'Mortgage Registration',
        'status_field', 'mortgage_status',
        'redis_prefix', 'mortgage:case:',
        'states', jsonb_build_array(
            'DOCUMENTS_RECEIVED',
            'DRAFT_PREPARED',
            'INTERNAL_REVIEW',
            'APPROVED',
            'REGISTRATION_SCHEDULED',
            'REGISTERED',
            'DOCUMENTS_COLLECTED',
            'CLOSED'
        ),
        'transitions', jsonb_build_object(
            'DOCUMENTS_RECEIVED', jsonb_build_array('DRAFT_PREPARED'),
            'DRAFT_PREPARED', jsonb_build_array('INTERNAL_REVIEW'),
            'INTERNAL_REVIEW', jsonb_build_array('APPROVED', 'DRAFT_PREPARED'),
            'APPROVED', jsonb_build_array('REGISTRATION_SCHEDULED'),
            'REGISTRATION_SCHEDULED', jsonb_build_array('REGISTERED'),
            'REGISTERED', jsonb_build_array('DOCUMENTS_COLLECTED'),
            'DOCUMENTS_COLLECTED', jsonb_build_array('CLOSED'),
            'CLOSED', jsonb_build_array(),
            'ON_HOLD', jsonb_build_array('DOCUMENTS_RECEIVED', 'CANCELLED')
        ),
        'initial_states', jsonb_build_array('DOCUMENTS_RECEIVED'),
        'terminal_states', jsonb_build_array('CLOSED', 'CANCELLED'),
        'exception_states', jsonb_build_array('ON_HOLD', 'CANCELLED'),
        'deadlines', jsonb_build_object()
    ),
    NULL
),
(
    'public_notice',
    'Public Notice',
    '1.0.0',
    'public_notice_status',
    'notice:case:',
    jsonb_build_object(
        'slug', 'public_notice',
        'label', 'Public Notice',
        'status_field', 'public_notice_status',
        'redis_prefix', 'notice:case:',
        'states', jsonb_build_array(
            'DOCUMENTS_RECEIVED',
            'TITLE_VERIFICATION',
            'DRAFTED',
            'PUBLISHED',
            'AWAITING_OBJECTIONS',
            'OBJECTION_RECEIVED',
            'ESCALATED',
            'CLEAR',
            'CLOSED'
        ),
        'transitions', jsonb_build_object(
            'DOCUMENTS_RECEIVED', jsonb_build_array('TITLE_VERIFICATION'),
            'TITLE_VERIFICATION', jsonb_build_array('DRAFTED'),
            'DRAFTED', jsonb_build_array('PUBLISHED'),
            'PUBLISHED', jsonb_build_array('AWAITING_OBJECTIONS'),
            'AWAITING_OBJECTIONS', jsonb_build_array('OBJECTION_RECEIVED', 'CLEAR'),
            'OBJECTION_RECEIVED', jsonb_build_array('ESCALATED'),
            'ESCALATED', jsonb_build_array('CLEAR', 'ON_HOLD'),
            'CLEAR', jsonb_build_array('CLOSED'),
            'CLOSED', jsonb_build_array(),
            'ON_HOLD', jsonb_build_array('ESCALATED', 'CLEAR')
        ),
        'initial_states', jsonb_build_array('DOCUMENTS_RECEIVED'),
        'terminal_states', jsonb_build_array('CLOSED'),
        'exception_states', jsonb_build_array('ON_HOLD'),
        'deadlines', jsonb_build_object(
            'AWAITING_OBJECTIONS', jsonb_build_object(
                'label', 'Objection window',
                'options', jsonb_build_array(7, 15, 30),
                'starts_from', 'date of newspaper publication',
                'blocking', true
            )
        )
    ),
    NULL
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    version = EXCLUDED.version,
    status_field = EXCLUDED.status_field,
    redis_prefix = EXCLUDED.redis_prefix,
    definition_json = EXCLUDED.definition_json,
    updated_at = NOW();

-- ============================================================
-- 11. SEED WORKFLOW VERSIONS (initial versions)
-- ============================================================

INSERT INTO public.workflow_versions (workflow_definition_id, version_number, definition_json, created_by, changelog)
SELECT 
    wd.id,
    '1.0.0',
    wd.definition_json,
    NULL,
    'Initial workflow definition from ag-associates-ai backend/workflows/definitions.py'
FROM public.workflow_definitions wd
ON CONFLICT (workflow_definition_id, version_number) DO NOTHING;

-- ============================================================
-- 12. VERIFICATION QUERIES (run after migration)
-- ============================================================

/*
-- Verify table structures
\d public.workflow_definitions
\d public.workflow_versions
\d public.workflow_instances
\d public.tasks
\d public.deadlines

-- Verify enums
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'workflow_instance_status'::regtype ORDER BY enumsortorder;
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'task_status'::regtype ORDER BY enumsortorder;
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'deadline_type'::regtype ORDER BY enumsortorder;
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'deadline_status'::regtype ORDER BY enumsortorder;

-- Verify indexes
\di idx_workflow_*
\di idx_tasks_*
\di idx_deadlines_*

-- Verify RLS is enabled
SELECT relname, relrowsecurity FROM pg_class 
WHERE relname IN ('workflow_definitions', 'workflow_versions', 'workflow_instances', 'tasks', 'deadlines');

-- Verify policies
SELECT * FROM pg_policies WHERE tablename IN ('workflow_definitions', 'workflow_versions', 'workflow_instances', 'tasks', 'deadlines');

-- Verify grants
SELECT * FROM information_schema.table_privileges WHERE table_name IN ('workflow_definitions', 'workflow_versions', 'workflow_instances', 'tasks', 'deadlines');

-- Verify seed data
SELECT slug, name, version, status_field, jsonb_pretty(definition_json) FROM public.workflow_definitions;
SELECT wd.slug, wv.version_number, wv.changelog FROM public.workflow_versions wv JOIN public.workflow_definitions wd ON wd.id = wv.workflow_definition_id;

-- Test workflow instance creation (as ag_owner)
INSERT INTO public.workflow_instances (
    workflow_definition_id, workflow_version_id, case_id, org_id, current_state, status, started_by
) VALUES (
    (SELECT id FROM public.workflow_definitions WHERE slug = 'noi'),
    (SELECT id FROM public.workflow_versions WHERE workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug = 'noi') AND version_number = '1.0.0'),
    '00000000-0000-0000-0000-000000000000'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'DOCUMENTS_RECEIVED',
    'running',
    '00000000-0000-0000-0000-000000000000'::uuid
);

-- Test task creation
INSERT INTO public.tasks (workflow_instance_id, task_definition_id, assignee_id, status, due_at)
VALUES (
    (SELECT id FROM public.workflow_instances LIMIT 1),
    'generate_challan',
    '00000000-0000-0000-0000-000000000000'::uuid,
    'pending',
    NOW() + INTERVAL '24 hours'
);

-- Test deadline creation
INSERT INTO public.deadlines (workflow_instance_id, deadline_type, label, due_at, metadata_json)
VALUES (
    (SELECT id FROM public.workflow_instances LIMIT 1),
    'statutory',
    'Section 89B filing window',
    NOW() + INTERVAL '30 days',
    jsonb_build_object('window_days', 30, 'starts_from', 'date of the mortgage — deposit of title deeds')
);
*/

-- Migration complete: workflow persistence primitives created