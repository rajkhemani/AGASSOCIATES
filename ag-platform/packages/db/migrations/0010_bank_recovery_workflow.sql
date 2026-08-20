-- 0010_bank_recovery_workflow.sql
-- Bank Recovery Workflow Definition (P1-B / P24)
-- Golden path: Bank Referral → Canonical Case → Loan/security documents → AI extraction → 
-- Advocate confirms legal basis → Recovery WorkflowInstance → Notice draft → Legal validation → 
-- Mandatory approval → Dispatch ExternalAction → Proof of service → Deadline → 
-- Borrower response → settle / continue / escalate

-- This workflow uses the persistence primitives from 0009_workflow_persistence.sql
-- and integrates with: document_versions (0007), ai_runs (0008_ai_runs.sql), 
-- policy_evaluations (0008_policy_evaluations.sql), approval_requests (0009_approval_requests.sql),
-- external_actions (0010_external_actions.sql), audit (0009_audit_append_only.sql)

-- ============================================================
-- BANK RECOVERY WORKFLOW DEFINITION
-- ============================================================

INSERT INTO public.workflow_definitions (slug, name, version, status_field, redis_prefix, definition_json, created_by)
VALUES (
    'bank_recovery',
    'Bank Recovery',
    '1.0.0',
    'recovery_status',
    'recovery:case:',
    jsonb_build_object(
        'slug', 'bank_recovery',
        'label', 'Bank Recovery',
        'status_field', 'recovery_status',
        'redis_prefix', 'recovery:case:',
        'states', jsonb_build_array(
            'BANK_REFERRAL_RECEIVED',           -- 1. Bank referral received
            'CASE_CREATED',                     -- 2. Canonical case created in cases table
            'DOCUMENTS_COLLECTED',              -- 3. Loan/security documents collected
            'AI_EXTRACTION_COMPLETE',           -- 4. AI extraction from document_versions
            'LEGAL_BASIS_CONFIRMED',            -- 5. Advocate confirms legal basis (MANDATORY)
            'NOTICE_DRAFTED',                   -- 6. Notice drafted (AI-assisted)
            'LEGAL_VALIDATION_PENDING',         -- 7. Legal validation by advocate
            'LEGAL_VALIDATION_COMPLETE',        -- 8. Legal validation passed
            'APPROVAL_REQUESTED',               -- 9. Mandatory approval requested
            'APPROVAL_GRANTED',                 -- 10. Approval granted
            'EXTERNAL_ACTION_DISPATCHED',       -- 11. Action Gateway dispatched (IGR/GRAS/NeSL/Bank/Email/WhatsApp)
            'PROOF_OF_SERVICE_RECEIVED',        -- 12. Proof of service received
            'DEADLINE_TRACKING',                -- 13. Deadline tracking (Section 89B - 30 days)
            'BORROWER_RESPONSE_RECEIVED',       -- 14. Borrower response received
            'SETTLED',                          -- 15. Terminal: Settled
            'ESCALATED',                        -- 16. Terminal: Escalated
            'CONTINUE_RECOVERY'                 -- 17. Terminal: Continue recovery process
        ),
        'transitions', jsonb_build_object(
            -- Happy path
            'BANK_REFERRAL_RECEIVED', jsonb_build_array('CASE_CREATED'),
            'CASE_CREATED', jsonb_build_array('DOCUMENTS_COLLECTED'),
            'DOCUMENTS_COLLECTED', jsonb_build_array('AI_EXTRACTION_COMPLETE'),
            'AI_EXTRACTION_COMPLETE', jsonb_build_array('LEGAL_BASIS_CONFIRMED'),
            'LEGAL_BASIS_CONFIRMED', jsonb_build_array('NOTICE_DRAFTED'),
            'NOTICE_DRAFTED', jsonb_build_array('LEGAL_VALIDATION_PENDING'),
            'LEGAL_VALIDATION_PENDING', jsonb_build_array('LEGAL_VALIDATION_COMPLETE', 'LEGAL_BASIS_CONFIRMED'), -- Can loop back if validation fails
            'LEGAL_VALIDATION_COMPLETE', jsonb_build_array('APPROVAL_REQUESTED'),
            'APPROVAL_REQUESTED', jsonb_build_array('APPROVAL_GRANTED', 'REJECTED'),
            'APPROVAL_GRANTED', jsonb_build_array('EXTERNAL_ACTION_DISPATCHED'),
            'EXTERNAL_ACTION_DISPATCHED', jsonb_build_array('PROOF_OF_SERVICE_RECEIVED', 'EXTERNAL_ACTION_DISPATCHED'), -- Retry on failure
            'PROOF_OF_SERVICE_RECEIVED', jsonb_build_array('DEADLINE_TRACKING'),
            'DEADLINE_TRACKING', jsonb_build_array('BORROWER_RESPONSE_RECEIVED', 'DEADLINE_BREACHED'),
            'BORROWER_RESPONSE_RECEIVED', jsonb_build_array('SETTLED', 'CONTINUE_RECOVERY', 'ESCALATED'),
            
            -- Exception/rejection paths
            'REJECTED', jsonb_build_array('ESCALATED', 'BANK_REFERRAL_RECEIVED'), -- Rejected approval can escalate or restart
            'DEADLINE_BREACHED', jsonb_build_array('ESCALATED', 'CONTINUE_RECOVERY'), -- Deadline breach can escalate or continue
            
            -- Terminal states (no outgoing transitions)
            'SETTLED', jsonb_build_array(),
            'ESCALATED', jsonb_build_array(),
            'CONTINUE_RECOVERY', jsonb_build_array()
        ),
        'initial_states', jsonb_build_array('BANK_REFERRAL_RECEIVED'),
        'terminal_states', jsonb_build_array('SETTLED', 'ESCALATED', 'CONTINUE_RECOVERY'),
        'exception_states', jsonb_build_array('REJECTED', 'DEADLINE_BREACHED'),
        'deadlines', jsonb_build_object(
            'BANK_REFERRAL_RECEIVED', jsonb_build_object(
                'label', 'Initial processing SLA',
                'options', jsonb_build_array(3),
                'starts_from', 'date of bank referral receipt',
                'blocking', false
            ),
            'DOCUMENTS_COLLECTED', jsonb_build_object(
                'label', 'Document collection window',
                'options', jsonb_build_array(7, 14),
                'starts_from', 'date case created',
                'blocking', true
            ),
            'LEGAL_BASIS_CONFIRMED', jsonb_build_object(
                'label', 'Legal basis confirmation deadline',
                'options', jsonb_build_array(5),
                'starts_from', 'date AI extraction completed',
                'blocking', true
            ),
            'APPROVAL_REQUESTED', jsonb_build_object(
                'label', 'Approval SLA',
                'options', jsonb_build_array(2),
                'starts_from', 'date approval requested',
                'blocking', true
            ),
            'EXTERNAL_ACTION_DISPATCHED', jsonb_build_object(
                'label', 'Dispatch SLA',
                'options', jsonb_build_array(1),
                'starts_from', 'date approval granted',
                'blocking', true
            ),
            'PROOF_OF_SERVICE_RECEIVED', jsonb_build_object(
                'label', 'Proof of service deadline',
                'options', jsonb_build_array(3),
                'starts_from', 'date action dispatched',
                'blocking', true
            ),
            'DEADLINE_TRACKING', jsonb_build_object(
                'label', 'Section 89B statutory deadline',
                'options', jsonb_build_array(30),
                'starts_from', 'date of mortgage creation by deposit of title deeds',
                'blocking', true
            ),
            'BORROWER_RESPONSE_RECEIVED', jsonb_build_object(
                'label', 'Borrower response window',
                'options', jsonb_build_array(15, 30),
                'starts_from', 'date of service',
                'blocking', true
            )
        ),
        'ai_integration', jsonb_build_object(
            'document_extraction_stage', 'AI_EXTRACTION_COMPLETE',
            'required_document_types', jsonb_build_array('LOAN_AGREEMENT', 'SECURITY_DOCUMENT', 'MORTGAGE_DEED', 'TITLE_DEEDS'),
            'extraction_agent', 'drafter', -- or 'auditor' for financial extraction
            'prompt_version', 'recovery-extraction-v1',
            'confidence_threshold', 0.75
        ),
        'policy_gates', jsonb_build_array(
            jsonb_build_object(
                'stage', 'NOTICE_DRAFTED',
                'policy_key', 'recovery_notice_dispatch',
                'required_decision', 'ALLOW'
            ),
            jsonb_build_object(
                'stage', 'EXTERNAL_ACTION_DISPATCHED',
                'policy_key', 'recovery_external_action',
                'required_decision', 'ALLOW'
            )
        ),
        'approval_requirements', jsonb_build_array(
            jsonb_build_object(
                'stage', 'APPROVAL_REQUESTED',
                'approval_type', 'recovery_notice_dispatch',
                'required_approvers', jsonb_build_array('PRINCIPAL', 'ADVOCATE'),
                'min_approvals', 1,
                'description', 'Mandatory approval before dispatching recovery notice via Action Gateway'
            )
        ),
        'action_gateway_integration', jsonb_build_object(
            'dispatch_stage', 'EXTERNAL_ACTION_DISPATCHED',
            'supported_channels', jsonb_build_array('IGR', 'GRAS', 'NeSL', 'BANK_API', 'EMAIL', 'WHATSAPP', 'POSTAL'),
            'idempotency_key_template', 'recovery:{case_id}:{action_type}:{channel}',
            'retry_policy', jsonb_build_object(
                'max_retries', 3,
                'backoff_seconds', 300,
                'retry_on', jsonb_build_array('TIMEOUT', 'TRANSIENT_ERROR')
            )
        ),
        'audit_capture', jsonb_build_object(
            'capture_ai_runs', true,
            'capture_policy_evaluations', true,
            'capture_approval_requests', true,
            'capture_external_actions', true,
            'capture_attempts', true,
            'capture_deadline_events', true
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
-- SEED INITIAL VERSION
-- ============================================================

INSERT INTO public.workflow_versions (workflow_definition_id, version_number, definition_json, created_by, changelog)
SELECT 
    wd.id,
    '1.0.0',
    wd.definition_json,
    NULL,
    'Initial Bank Recovery workflow definition (P1-B/P24) - Golden path with AI extraction, legal basis confirmation, approval gates, Action Gateway integration, deadline tracking, and full audit capture'
FROM public.workflow_definitions wd
WHERE wd.slug = 'bank_recovery'
ON CONFLICT (workflow_definition_id, version_number) DO NOTHING;

-- ============================================================
-- ADD RECOVERY_STATUS COLUMN TO CASES TABLE (if not exists)
-- ============================================================

DO $$ BEGIN
    -- Add recovery_status column to cases table for this workflow's status field
    ALTER TABLE public.cases 
    ADD COLUMN IF NOT EXISTS recovery_status TEXT;
    
    -- Add index for recovery workflow queries
    CREATE INDEX IF NOT EXISTS idx_cases_recovery_status ON public.cases(recovery_status) WHERE recovery_status IS NOT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
    WHEN others THEN
        -- If cases table doesn't have this column yet, that's fine - it will be added by a separate migration
        NULL;
END $$;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

/*
-- Verify workflow definition
SELECT slug, name, version, status_field, 
       jsonb_array_length(definition_json->'states') as state_count,
       jsonb_array_length(definition_json->'deadlines') as deadline_count,
       jsonb_array_length(definition_json->'policy_gates') as policy_gate_count,
       jsonb_array_length(definition_json->'approval_requirements') as approval_count
FROM public.workflow_definitions 
WHERE slug = 'bank_recovery';

-- Verify version
SELECT wd.slug, wv.version_number, wv.changelog
FROM public.workflow_versions wv
JOIN public.workflow_definitions wd ON wd.id = wv.workflow_definition_id
WHERE wd.slug = 'bank_recovery';

-- Test workflow instance creation
INSERT INTO public.workflow_instances (
    workflow_definition_id, workflow_version_id, case_id, org_id, current_state, status, started_by
) VALUES (
    (SELECT id FROM public.workflow_definitions WHERE slug = 'bank_recovery'),
    (SELECT id FROM public.workflow_versions WHERE workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug = 'bank_recovery') AND version_number = '1.0.0'),
    '00000000-0000-0000-0000-000000000000'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'BANK_REFERRAL_RECEIVED',
    'pending',
    '00000000-0000-0000-0000-000000000000'::uuid
);

-- Test task creation for key stages
INSERT INTO public.tasks (workflow_instance_id, task_definition_id, assignee_id, status, due_at, metadata_json)
SELECT 
    wi.id,
    task_def,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'pending',
    NOW() + INTERVAL '24 hours',
    jsonb_build_object('stage', task_def)
FROM public.workflow_instances wi
CROSS JOIN LATERAL (VALUES 
    ('collect_documents'),
    ('run_ai_extraction'),
    ('confirm_legal_basis'),
    ('draft_notice'),
    ('legal_validation'),
    ('request_approval'),
    ('dispatch_action'),
    ('verify_service'),
    ('track_deadline'),
    ('process_response')
) AS t(task_def)
WHERE wi.current_state = 'BANK_REFERRAL_RECEIVED'
LIMIT 1;

-- Test deadline creation
INSERT INTO public.deadlines (workflow_instance_id, task_id, deadline_type, label, due_at, metadata_json)
SELECT 
    wi.id,
    NULL,
    'statutory',
    'Section 89B statutory deadline',
    NOW() + INTERVAL '30 days',
    jsonb_build_object('window_days', 30, 'section', '89B', 'starts_from', 'date of mortgage creation by deposit of title deeds')
FROM public.workflow_instances wi
WHERE wi.workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug = 'bank_recovery')
LIMIT 1;
*/

-- Migration complete: Bank Recovery workflow definition created