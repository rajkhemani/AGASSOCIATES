-- 0009_approval_requests.sql
-- Create approval_requests table and approval lifecycle (P3-B / P29)
-- Integration with policy_evaluations: when decision = REQUIRE_APPROVAL, create approval_request

-- ============================================================
-- 1. CREATE APPROVAL STATUS ENUM
-- ============================================================

DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM (
        'PENDING',
        'APPROVED',
        'REJECTED',
        'EXPIRED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 2. CREATE APPROVAL REQUESTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.approval_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Requestor information
    requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    required_role TEXT NOT NULL, -- Role required to approve (PRINCIPAL, ADVOCATE, EXECUTIVE, etc.)
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Decision information (populated when decision made)
    decision_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    decision_at TIMESTAMPTZ,
    decision_reason TEXT,

    -- Object reference - the exact action/version being approved
    object_type TEXT NOT NULL, -- e.g., 'document_generation', 'external_api_call', 'case_transition', 'data_export'
    object_id UUID NOT NULL, -- Reference to the specific object (case_id, document_id, workflow_instance_id, etc.)
    object_version TEXT NOT NULL, -- Version/hash of the object at time of request (for immutability verification)
    payload_hash CHAR(64) NOT NULL, -- SHA-256 hash of the full request payload (detects tampering)

    -- Status and lifecycle
    status approval_status NOT NULL DEFAULT 'PENDING',

    -- Optional: link back to policy evaluation that triggered this approval
    policy_evaluation_id UUID REFERENCES public.policy_evaluations(id) ON DELETE SET NULL,

    -- Optional: expiry for time-bound approvals
    expires_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. CREATE INDEXES
-- ============================================================

-- Primary lookup: pending approvals for a user/role
CREATE INDEX IF NOT EXISTS idx_approval_requests_status
    ON public.approval_requests(status)
    WHERE status = 'PENDING';

-- Requestor lookups
CREATE INDEX IF NOT EXISTS idx_approval_requests_requested_by
    ON public.approval_requests(requested_by);

-- Decision maker lookups
CREATE INDEX IF NOT EXISTS idx_approval_requests_decision_by
    ON public.approval_requests(decision_by);

-- Object reference lookups (for checking existing approvals)
CREATE INDEX IF NOT EXISTS idx_approval_requests_object
    ON public.approval_requests(object_type, object_id);

-- Object version lookups (for immutability verification)
CREATE INDEX IF NOT EXISTS idx_approval_requests_object_version
    ON public.approval_requests(object_type, object_id, object_version);

-- Policy evaluation linkage
CREATE INDEX IF NOT EXISTS idx_approval_requests_policy_evaluation
    ON public.approval_requests(policy_evaluation_id);

-- Time-series queries
CREATE INDEX IF NOT EXISTS idx_approval_requests_requested_at
    ON public.approval_requests(requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_approval_requests_decision_at
    ON public.approval_requests(decision_at DESC)
    WHERE decision_at IS NOT NULL;

-- Expiry queries
CREATE INDEX IF NOT EXISTS idx_approval_requests_expires_at
    ON public.approval_requests(expires_at)
    WHERE expires_at IS NOT NULL;

-- Role-based queries (for authorization checks)
CREATE INDEX IF NOT EXISTS idx_approval_requests_required_role
    ON public.approval_requests(required_role);

-- Composite: pending approvals by required role (for approval queues)
CREATE INDEX IF NOT EXISTS idx_approval_requests_pending_by_role
    ON public.approval_requests(required_role, requested_at)
    WHERE status = 'PENDING';

-- ============================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- Org-scoped access policy
-- Users can only access approval requests within their organization
-- We join through requested_by profile to get org_id
CREATE POLICY approval_requests_org_isolation ON public.approval_requests
    FOR ALL
    USING (
        requested_by IN (
            SELECT id FROM public.profiles
            WHERE org_id = current_setting('app.current_org_id')::uuid
        )
    );

-- ============================================================
-- 5. GRANT PRIVILEGES TO ag_app (RUNTIME ROLE)
-- ============================================================

GRANT SELECT, INSERT, UPDATE ON public.approval_requests TO ag_app;
GRANT USAGE, SELECT ON SEQUENCE public.approval_requests_id_seq TO ag_app;

-- ============================================================
-- 6. TRIGGER FOR UPDATED_AT
-- ============================================================

DROP TRIGGER IF EXISTS update_approval_requests_updated_at ON public.approval_requests;
CREATE TRIGGER update_approval_requests_updated_at
    BEFORE UPDATE ON public.approval_requests
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- ============================================================
-- 7. HELPER FUNCTIONS
-- ============================================================

-- Function to verify payload hash matches (prevents tampering after approval)
CREATE OR REPLACE FUNCTION public.verify_approval_payload_hash(
    p_approval_id UUID,
    p_payload JSONB
) RETURNS BOOLEAN AS $$
DECLARE
    v_stored_hash CHAR(64);
    v_computed_hash CHAR(64);
BEGIN
    SELECT payload_hash INTO v_stored_hash
    FROM public.approval_requests
    WHERE id = p_approval_id;

    IF v_stored_hash IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Compute SHA-256 of the canonical JSON payload
    v_computed_hash := encode(digest(p_payload::text, 'sha256'), 'hex');

    RETURN v_stored_hash = v_computed_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user can approve a request (based on required_role)
CREATE OR REPLACE FUNCTION public.can_user_approve(
    p_approval_id UUID,
    p_user_profile_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_required_role TEXT;
    v_user_role TEXT;
    v_approval_status approval_status;
    v_requested_by UUID;
BEGIN
    SELECT required_role, status, requested_by
    INTO v_required_role, v_approval_status, v_requested_by
    FROM public.approval_requests
    WHERE id = p_approval_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Can only approve PENDING requests
    IF v_approval_status != 'PENDING' THEN
        RETURN FALSE;
    END IF;

    -- Requestor cannot approve their own request
    IF v_requested_by = p_user_profile_id THEN
        RETURN FALSE;
    END IF;

    -- Get user's role
    SELECT role INTO v_user_role
    FROM public.profiles
    WHERE id = p_user_profile_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Check role hierarchy: PRINCIPAL > ADVOCATE > EXECUTIVE > CLERK > BANK_VIEWER
    -- A user can approve if their role >= required_role
    CASE v_required_role
        WHEN 'PRINCIPAL' THEN
            RETURN v_user_role = 'PRINCIPAL';
        WHEN 'ADVOCATE' THEN
            RETURN v_user_role IN ('PRINCIPAL', 'ADVOCATE');
        WHEN 'EXECUTIVE' THEN
            RETURN v_user_role IN ('PRINCIPAL', 'ADVOCATE', 'EXECUTIVE');
        WHEN 'CLERK' THEN
            RETURN v_user_role IN ('PRINCIPAL', 'ADVOCATE', 'EXECUTIVE', 'CLERK');
        WHEN 'BANK_VIEWER' THEN
            RETURN v_user_role IN ('PRINCIPAL', 'ADVOCATE', 'EXECUTIVE', 'CLERK', 'BANK_VIEWER');
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create approval request from policy evaluation
-- This integrates with policy_evaluations when decision = REQUIRE_APPROVAL
CREATE OR REPLACE FUNCTION public.create_approval_from_policy_evaluation(
    p_policy_evaluation_id UUID,
    p_requested_by UUID,
    p_required_role TEXT,
    p_object_type TEXT,
    p_object_id UUID,
    p_object_version TEXT,
    p_payload JSONB,
    p_expires_at TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_approval_id UUID;
    v_payload_hash CHAR(64);
BEGIN
    -- Compute payload hash for tamper detection
    v_payload_hash := encode(digest(p_payload::text, 'sha256'), 'hex');

    INSERT INTO public.approval_requests (
        policy_evaluation_id,
        requested_by,
        required_role,
        object_type,
        object_id,
        object_version,
        payload_hash,
        expires_at
    ) VALUES (
        p_policy_evaluation_id,
        p_requested_by,
        p_required_role,
        p_object_type,
        p_object_id,
        p_object_version,
        v_payload_hash,
        p_expires_at
    ) RETURNING id INTO v_approval_id;

    RETURN v_approval_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process approval decision
CREATE OR REPLACE FUNCTION public.process_approval_decision(
    p_approval_id UUID,
    p_decision_by UUID,
    p_decision approval_status, -- Must be APPROVED or REJECTED
    p_decision_reason TEXT,
    p_payload JSONB -- Current payload for hash verification
) RETURNS BOOLEAN AS $$
DECLARE
    v_can_approve BOOLEAN;
    v_hash_matches BOOLEAN;
BEGIN
    -- Verify user can approve
    v_can_approve := public.can_user_approve(p_approval_id, p_decision_by);
    IF NOT v_can_approve THEN
        RAISE EXCEPTION 'User not authorized to approve this request';
    END IF;

    -- Verify payload hash matches (detects tampering)
    v_hash_matches := public.verify_approval_payload_hash(p_approval_id, p_payload);
    IF NOT v_hash_matches THEN
        RAISE EXCEPTION 'Payload hash mismatch - request may have been tampered with';
    END IF;

    -- Update approval request
    UPDATE public.approval_requests
    SET
        status = p_decision,
        decision_by = p_decision_by,
        decision_at = NOW(),
        decision_reason = p_decision_reason
    WHERE id = p_approval_id
      AND status = 'PENDING';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old pending approvals (can be called by cron job)
CREATE OR REPLACE FUNCTION public.expire_old_approvals() RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.approval_requests
    SET status = 'EXPIRED'
    WHERE status = 'PENDING'
      AND expires_at IS NOT NULL
      AND expires_at < NOW();

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.verify_approval_payload_hash(UUID, JSONB) TO ag_app;
GRANT EXECUTE ON FUNCTION public.can_user_approve(UUID, UUID) TO ag_app;
GRANT EXECUTE ON FUNCTION public.create_approval_from_policy_evaluation(UUID, UUID, TEXT, TEXT, UUID, TEXT, JSONB, TIMESTAMPTZ) TO ag_app;
GRANT EXECUTE ON FUNCTION public.process_approval_decision(UUID, UUID, approval_status, TEXT, JSONB) TO ag_app;
GRANT EXECUTE ON FUNCTION public.expire_old_approvals() TO ag_app;

-- ============================================================
-- 8. VERIFICATION QUERIES (run after migration)
-- ============================================================

/*
-- Verify table structure
\d public.approval_requests

-- Verify enums
SELECT * FROM pg_type WHERE typname = 'approval_status';

-- Verify indexes
\di idx_approval_requests_*

-- Verify RLS is enabled
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'approval_requests';

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'approval_requests';

-- Verify grants
SELECT * FROM information_schema.table_privileges WHERE table_name = 'approval_requests';

-- Verify functions
SELECT proname, proargtypes::regtype[] FROM pg_proc
WHERE proname IN (
    'verify_approval_payload_hash',
    'can_user_approve',
    'create_approval_from_policy_evaluation',
    'process_approval_decision',
    'expire_old_approvals'
);

-- Test insert (as ag_owner)
-- First, get a profile ID for testing
-- INSERT INTO public.approval_requests (
--     requested_by, required_role, object_type, object_id, object_version,
--     payload_hash, status, expires_at
-- ) VALUES (
--     '28a4eb7d-162c-4161-817d-20c30ffa5f46'::uuid, -- Head Advocate
--     'ADVOCATE',
--     'document_generation',
--     '00000000-0000-0000-0000-000000000001'::uuid,
--     'v1.0',
--     encode(digest('{"action":"generate","template":"mortgage_deed"}'::jsonb::text, 'sha256'), 'hex'),
--     'PENDING',
--     NOW() + INTERVAL '24 hours'
-- );

-- Test approval decision (as authorized user)
-- SELECT public.process_approval_decision(
--     '<approval_id>',
--     '28a4eb7d-162c-4161-817d-20c30ffa5f46'::uuid, -- Principal
--     'APPROVED',
--     'Legal basis confirmed',
--     '{"action":"generate","template":"mortgage_deed"}'::jsonb
-- );
*/

-- Migration complete: approval_requests table created with full approval lifecycle and policy_evaluations integration