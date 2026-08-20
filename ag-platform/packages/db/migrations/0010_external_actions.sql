-- 0010_external_actions.sql
-- Create external_actions, action_attempts tables and Action Gateway (P3-C / P30-P31)
-- Enforces core invariant: AI Run → Policy Evaluation → Human Approval → ExternalAction → Action Gateway → AuditEvent

-- ============================================================
-- 1. CREATE ACTION STATUS ENUM
-- ============================================================

DO $$ BEGIN
    CREATE TYPE action_status AS ENUM (
        'PROPOSED',
        'POLICY_CHECKED',
        'APPROVAL_PENDING',
        'APPROVED',
        'EXECUTING',
        'SUCCEEDED',
        'FAILED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 2. CREATE ATTEMPT STATUS ENUM
-- ============================================================

DO $$ BEGIN
    CREATE TYPE attempt_status AS ENUM (
        'STARTED',
        'SUCCEEDED',
        'FAILED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 3. CREATE EXTERNAL_ACTIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.external_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant and case context
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
    workflow_instance_id UUID, -- References workflow engine instance (no FK, external system)

    -- Approval linkage (required for APPROVED actions)
    approval_request_id UUID REFERENCES public.approval_requests(id) ON DELETE SET NULL,

    -- Action definition
    action_type TEXT NOT NULL, -- e.g., 'SEND_RECOVERY_NOTICE', 'SUBMIT_FILING', 'MAKE_PAYMENT', 'SEND_EMAIL', 'SEND_WHATSAPP', 'IGR_FILING', 'GRAS_PAYMENT', 'NESL_REGISTRATION'
    payload_json JSONB NOT NULL, -- Full action payload (immutable once APPROVED)
    idempotency_key CHAR(64) NOT NULL UNIQUE, -- SHA-256: org_id + case_id + action_type + payload_hash

    -- Lifecycle status
    status action_status NOT NULL DEFAULT 'PROPOSED',

    -- Execution tracking
    executed_at TIMESTAMPTZ,
    external_ref_ids_json JSONB DEFAULT '{}', -- External system reference IDs (e.g., challan_no, filing_id, message_id)

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. CREATE ACTION_ATTEMPTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.action_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_action_id UUID NOT NULL REFERENCES public.external_actions(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
    status attempt_status NOT NULL DEFAULT 'STARTED',
    error_message TEXT,
    response_json JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    UNIQUE (external_action_id, attempt_number)
);

-- ============================================================
-- 5. CREATE INDEXES
-- ============================================================

-- external_actions indexes
CREATE INDEX IF NOT EXISTS idx_external_actions_org_id ON public.external_actions(org_id);
CREATE INDEX IF NOT EXISTS idx_external_actions_case_id ON public.external_actions(case_id);
CREATE INDEX IF NOT EXISTS idx_external_actions_workflow_instance_id ON public.external_actions(workflow_instance_id);
CREATE INDEX IF NOT EXISTS idx_external_actions_approval_request_id ON public.external_actions(approval_request_id);
CREATE INDEX IF NOT EXISTS idx_external_actions_action_type ON public.external_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_external_actions_status ON public.external_actions(status);
CREATE INDEX IF NOT EXISTS idx_external_actions_idempotency_key ON public.external_actions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_external_actions_created_at ON public.external_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_external_actions_executed_at ON public.external_actions(executed_at DESC) WHERE executed_at IS NOT NULL;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_external_actions_org_case ON public.external_actions(org_id, case_id);
CREATE INDEX IF NOT EXISTS idx_external_actions_org_status ON public.external_actions(org_id, status);
CREATE INDEX IF NOT EXISTS idx_external_actions_org_type_status ON public.external_actions(org_id, action_type, status);

-- action_attempts indexes
CREATE INDEX IF NOT EXISTS idx_action_attempts_external_action_id ON public.action_attempts(external_action_id);
CREATE INDEX IF NOT EXISTS idx_action_attempts_status ON public.action_attempts(status);
CREATE INDEX IF NOT EXISTS idx_action_attempts_started_at ON public.action_attempts(started_at DESC);

-- ============================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.external_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_attempts ENABLE ROW LEVEL SECURITY;

-- Org-scoped access policy for external_actions
CREATE POLICY external_actions_org_isolation ON public.external_actions
    FOR ALL
    USING (org_id = current_setting('app.current_org_id')::uuid);

-- Org-scoped access policy for action_attempts (join through external_actions)
CREATE POLICY action_attempts_org_isolation ON public.action_attempts
    FOR ALL
    USING (
        external_action_id IN (
            SELECT id FROM public.external_actions
            WHERE org_id = current_setting('app.current_org_id')::uuid
        )
    );

-- ============================================================
-- 7. GRANT PRIVILEGES TO ag_app (RUNTIME ROLE)
-- ============================================================

GRANT SELECT, INSERT, UPDATE ON public.external_actions TO ag_app;
GRANT SELECT, INSERT, UPDATE ON public.action_attempts TO ag_app;
GRANT USAGE, SELECT ON SEQUENCE public.external_actions_id_seq TO ag_app;
GRANT USAGE, SELECT ON SEQUENCE public.action_attempts_id_seq TO ag_app;

-- ============================================================
-- 8. TRIGGER FOR UPDATED_AT
-- ============================================================

DROP TRIGGER IF EXISTS update_external_actions_updated_at ON public.external_actions;
CREATE TRIGGER update_external_actions_updated_at
    BEFORE UPDATE ON public.external_actions
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- ============================================================
-- 9. HELPER FUNCTIONS
-- ============================================================

-- Function to generate idempotency key
CREATE OR REPLACE FUNCTION public.generate_idempotency_key(
    p_org_id UUID,
    p_case_id UUID,
    p_action_type TEXT,
    p_payload JSONB
) RETURNS CHAR(64) AS $$
DECLARE
    v_key_text TEXT;
BEGIN
    -- Canonical format: org_id:case_id:action_type:payload_hash
    -- case_id can be NULL, use 'none' placeholder
    v_key_text := p_org_id::text || ':' ||
                  COALESCE(p_case_id::text, 'none') || ':' ||
                  p_action_type || ':' ||
                  encode(digest(p_payload::text, 'sha256'), 'hex');

    RETURN encode(digest(v_key_text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to propose an external action (creates PROPOSED action)
CREATE OR REPLACE FUNCTION public.propose_external_action(
    p_org_id UUID,
    p_action_type TEXT,
    p_payload JSONB,
    p_case_id UUID DEFAULT NULL,
    p_workflow_instance_id UUID DEFAULT NULL,
    p_approval_request_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_idempotency_key CHAR(64);
    v_action_id UUID;
BEGIN
    v_idempotency_key := public.generate_idempotency_key(p_org_id, p_case_id, p_action_type, p_payload);

    INSERT INTO public.external_actions (
        org_id,
        case_id,
        workflow_instance_id,
        approval_request_id,
        action_type,
        payload_json,
        idempotency_key,
        status
    ) VALUES (
        p_org_id,
        p_case_id,
        p_workflow_instance_id,
        p_approval_request_id,
        p_action_type,
        p_payload,
        v_idempotency_key,
        'PROPOSED'
    ) ON CONFLICT (idempotency_key) DO UPDATE SET
        -- If already exists, only update if still PROPOSED (allows re-proposing same action)
        status = CASE
            WHEN external_actions.status = 'PROPOSED' THEN 'PROPOSED'
            ELSE external_actions.status
        END,
        updated_at = NOW()
    RETURNING id INTO v_action_id;

    RETURN v_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to transition action through policy check
CREATE OR REPLACE FUNCTION public.policy_check_external_action(
    p_action_id UUID,
    p_policy_evaluation_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_action_status action_status;
BEGIN
    SELECT status INTO v_action_status
    FROM public.external_actions
    WHERE id = p_action_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    IF v_action_status != 'PROPOSED' THEN
        RAISE EXCEPTION 'Action must be in PROPOSED status for policy check';
    END IF;

    UPDATE public.external_actions
    SET status = 'POLICY_CHECKED',
        updated_at = NOW()
    WHERE id = p_action_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to move action to approval pending (after policy check = REQUIRE_APPROVAL)
CREATE OR REPLACE FUNCTION public.request_approval_for_action(
    p_action_id UUID,
    p_approval_request_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_action_status action_status;
BEGIN
    SELECT status INTO v_action_status
    FROM public.external_actions
    WHERE id = p_action_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    IF v_action_status != 'POLICY_CHECKED' THEN
        RAISE EXCEPTION 'Action must be in POLICY_CHECKED status for approval request';
    END IF;

    UPDATE public.external_actions
    SET status = 'APPROVAL_PENDING',
        approval_request_id = p_approval_request_id,
        updated_at = NOW()
    WHERE id = p_action_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve an external action (called after approval_requests is APPROVED)
CREATE OR REPLACE FUNCTION public.approve_external_action(
    p_action_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_action_status action_status;
    v_approval_status approval_status;
BEGIN
    SELECT ea.status, ar.status
    INTO v_action_status, v_approval_status
    FROM public.external_actions ea
    LEFT JOIN public.approval_requests ar ON ea.approval_request_id = ar.id
    WHERE ea.id = p_action_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    IF v_action_status != 'APPROVAL_PENDING' THEN
        RAISE EXCEPTION 'Action must be in APPROVAL_PENDING status for approval';
    END IF;

    IF v_approval_status != 'APPROVED' THEN
        RAISE EXCEPTION 'Approval request must be APPROVED';
    END IF;

    UPDATE public.external_actions
    SET status = 'APPROVED',
        updated_at = NOW()
    WHERE id = p_action_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start execution of an approved action
-- Returns action_attempt_id
CREATE OR REPLACE FUNCTION public.start_action_execution(
    p_action_id UUID
) RETURNS UUID AS $$
DECLARE
    v_action_status action_status;
    v_attempt_number INTEGER;
    v_attempt_id UUID;
BEGIN
    SELECT status INTO v_action_status
    FROM public.external_actions
    WHERE id = p_action_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    IF v_action_status != 'APPROVED' THEN
        RAISE EXCEPTION 'Action must be APPROVED to start execution';
    END IF;

    -- Get next attempt number
    SELECT COALESCE(MAX(attempt_number), 0) + 1 INTO v_attempt_number
    FROM public.action_attempts
    WHERE external_action_id = p_action_id;

    -- Create attempt record
    INSERT INTO public.action_attempts (
        external_action_id,
        attempt_number,
        status
    ) VALUES (
        p_action_id,
        v_attempt_number,
        'STARTED'
    ) RETURNING id INTO v_attempt_id;

    -- Update action status to EXECUTING
    UPDATE public.external_actions
    SET status = 'EXECUTING',
        updated_at = NOW()
    WHERE id = p_action_id;

    RETURN v_attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete an action attempt
CREATE OR REPLACE FUNCTION public.complete_action_attempt(
    p_attempt_id UUID,
    p_status attempt_status, -- SUCCEEDED or FAILED
    p_response JSONB DEFAULT '{}',
    p_error_message TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_action_id UUID;
    v_final_status action_status;
BEGIN
    IF p_status NOT IN ('SUCCEEDED', 'FAILED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Invalid final status for attempt';
    END IF;

    UPDATE public.action_attempts
    SET
        status = p_status,
        response_json = p_response,
        error_message = p_error_message,
        completed_at = NOW()
    WHERE id = p_attempt_id
      AND status = 'STARTED';

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Get the external_action_id
    SELECT external_action_id INTO v_action_id
    FROM public.action_attempts
    WHERE id = p_attempt_id;

    -- Determine final action status
    IF p_status = 'SUCCEEDED' THEN
        v_final_status := 'SUCCEEDED';
    ELSIF p_status = 'CANCELLED' THEN
        v_final_status := 'CANCELLED';
    ELSE
        -- Check if there are more retries allowed (max 3 attempts)
        IF (
            SELECT COUNT(*) FROM public.action_attempts
            WHERE external_action_id = v_action_id
              AND status = 'FAILED'
        ) >= 3 THEN
            v_final_status := 'FAILED';
        ELSE
            -- Allow retry - back to APPROVED
            v_final_status := 'APPROVED';
        END IF;
    END IF;

    UPDATE public.external_actions
    SET
        status = v_final_status,
        executed_at = CASE WHEN p_status = 'SUCCEEDED' THEN NOW() ELSE executed_at END,
        external_ref_ids_json = CASE
            WHEN p_status = 'SUCCEEDED' THEN COALESCE(external_ref_ids_json, '{}') || p_response
            ELSE external_ref_ids_json
        END,
        updated_at = NOW()
    WHERE id = v_action_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel an external action
CREATE OR REPLACE FUNCTION public.cancel_external_action(
    p_action_id UUID,
    p_reason TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_action_status action_status;
BEGIN
    SELECT status INTO v_action_status
    FROM public.external_actions
    WHERE id = p_action_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    IF v_action_status IN ('SUCCEEDED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Cannot cancel action in status: %', v_action_status;
    END IF;

    UPDATE public.external_actions
    SET status = 'CANCELLED',
        updated_at = NOW()
    WHERE id = p_action_id;

    -- Cancel any in-progress attempt
    UPDATE public.action_attempts
    SET status = 'CANCELLED',
        error_message = p_reason,
        completed_at = NOW()
    WHERE external_action_id = p_action_id
      AND status = 'STARTED';

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if action can be retried
CREATE OR REPLACE FUNCTION public.can_retry_action(
    p_action_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_failed_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_failed_count
    FROM public.action_attempts
    WHERE external_action_id = p_action_id
      AND status = 'FAILED';

    RETURN v_failed_count < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get action with attempts for audit
CREATE OR REPLACE FUNCTION public.get_action_audit_trail(
    p_action_id UUID
) RETURNS TABLE (
    action_id UUID,
    action_type TEXT,
    action_status action_status,
    org_id UUID,
    case_id UUID,
    approval_request_id UUID,
    payload_json JSONB,
    idempotency_key CHAR(64),
    created_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    external_ref_ids_json JSONB,
    attempt_id UUID,
    attempt_number INTEGER,
    attempt_status attempt_status,
    attempt_started_at TIMESTAMPTZ,
    attempt_completed_at TIMESTAMPTZ,
    attempt_error_message TEXT,
    attempt_response_json JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ea.id,
        ea.action_type,
        ea.status,
        ea.org_id,
        ea.case_id,
        ea.approval_request_id,
        ea.payload_json,
        ea.idempotency_key,
        ea.created_at,
        ea.executed_at,
        ea.external_ref_ids_json,
        aa.id,
        aa.attempt_number,
        aa.status,
        aa.started_at,
        aa.completed_at,
        aa.error_message,
        aa.response_json
    FROM public.external_actions ea
    LEFT JOIN public.action_attempts aa ON aa.external_action_id = ea.id
    WHERE ea.id = p_action_id
    ORDER BY aa.attempt_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.generate_idempotency_key(UUID, UUID, TEXT, JSONB) TO ag_app;
GRANT EXECUTE ON FUNCTION public.propose_external_action(UUID, TEXT, JSONB, UUID, UUID, UUID) TO ag_app;
GRANT EXECUTE ON FUNCTION public.policy_check_external_action(UUID, UUID) TO ag_app;
GRANT EXECUTE ON FUNCTION public.request_approval_for_action(UUID, UUID) TO ag_app;
GRANT EXECUTE ON FUNCTION public.approve_external_action(UUID) TO ag_app;
GRANT EXECUTE ON FUNCTION public.start_action_execution(UUID) TO ag_app;
GRANT EXECUTE ON FUNCTION public.complete_action_attempt(UUID, attempt_status, JSONB, TEXT) TO ag_app;
GRANT EXECUTE ON FUNCTION public.cancel_external_action(UUID, TEXT) TO ag_app;
GRANT EXECUTE ON FUNCTION public.can_retry_action(UUID) TO ag_app;
GRANT EXECUTE ON FUNCTION public.get_action_audit_trail(UUID) TO ag_app;

-- ============================================================
-- 10. VERIFICATION QUERIES (run after migration)
-- ============================================================

/*
-- Verify table structures
\d public.external_actions
\d public.action_attempts

-- Verify enums
SELECT * FROM pg_type WHERE typname IN ('action_status', 'attempt_status');

-- Verify indexes
\di idx_external_actions_*
\di idx_action_attempts_*

-- Verify RLS
SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('external_actions', 'action_attempts');

-- Verify policies
SELECT * FROM pg_policies WHERE tablename IN ('external_actions', 'action_attempts');

-- Verify grants
SELECT * FROM information_schema.table_privileges WHERE table_name IN ('external_actions', 'action_attempts');

-- Verify functions
SELECT proname FROM pg_proc WHERE proname IN (
    'generate_idempotency_key',
    'propose_external_action',
    'policy_check_external_action',
    'request_approval_for_action',
    'approve_external_action',
    'start_action_execution',
    'complete_action_attempt',
    'cancel_external_action',
    'can_retry_action',
    'get_action_audit_trail'
);

-- Test idempotency key generation
-- SELECT public.generate_idempotency_key(
--     '7f45dc5f-6bef-4fae-b46a-a2306e69936d'::uuid,
--     '00000000-0000-0000-0000-000000000001'::uuid,
--     'SEND_RECOVERY_NOTICE',
--     '{"recipient":"borrower@example.com","template":"notice_1"}'::jsonb
-- );

-- Test full lifecycle
-- 1. Propose
-- SELECT public.propose_external_action(
--     '7f45dc5f-6bef-4fae-b46a-a2306e69936d'::uuid,
--     'SEND_RECOVERY_NOTICE',
--     '{"recipient":"borrower@example.com","template":"notice_1"}'::jsonb,
--     '00000000-0000-0000-0000-000000000001'::uuid,
--     '00000000-0000-0000-0000-000000000002'::uuid
-- );
-- 2. Policy check
-- 3. Request approval (creates approval_request)
-- 4. After approval: approve_external_action
-- 5. Execute: start_action_execution -> adapter -> complete_action_attempt
*/

-- Migration complete: external_actions and action_attempts tables with Action Gateway lifecycle management