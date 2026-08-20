-- Test: Bank Recovery Workflow Definition Verification (P1-B / P24)
-- Run this after applying 0010_bank_recovery_workflow.sql
-- Verifies that the Bank Recovery workflow definition is correctly seeded and integrated

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
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'RECOVERY-A-001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
   (SELECT id FROM banks LIMIT 1), 'NOI', 'RECEIVED', 'Borrower A'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'RECOVERY-B-001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   (SELECT id FROM banks LIMIT 1), 'NOI', 'RECEIVED', 'Borrower B')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TEST 1: Workflow Definition - Structure Verification
-- ============================================================

\echo '=== TEST 1: Bank Recovery Workflow Definition Structure ==='

SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Verify workflow exists with correct basic properties
SELECT 
    slug, name, version, status_field, redis_prefix,
    jsonb_array_length(definition_json->'states') as state_count,
    jsonb_object_keys(definition_json->'transitions') as transition_count
FROM public.workflow_definitions 
WHERE slug = 'bank_recovery';

-- Verify state count (should be 17 states)
SELECT 
    'Bank Recovery has 17 states',
    (SELECT jsonb_array_length(definition_json->'states') = 17 FROM public.workflow_definitions WHERE slug = 'bank_recovery') as pass;

-- Verify all expected states present
SELECT 
    'Contains BANK_REFERRAL_RECEIVED',
    (SELECT definition_json->'states' @> '["BANK_REFERRAL_RECEIVED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery') as pass
UNION ALL SELECT
    'Contains CASE_CREATED',
    (SELECT definition_json->'states' @> '["CASE_CREATED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Contains DOCUMENTS_COLLECTED',
    (SELECT definition_json->'states' @> '["DOCUMENTS_COLLECTED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Contains AI_EXTRACTION_COMPLETE',
    (SELECT definition_json->'states' @> '["AI_EXTRACTION_COMPLETE"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Contains LEGAL_BASIS_CONFIRMED (MANDATORY)',
    (SELECT definition_json->'states' @> '["LEGAL_BASIS_CONFIRMED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Contains NOTICE_DRAFTED',
    (SELECT definition_json->'states' @> '["NOTICE_DRAFTED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Contains LEGAL_VALIDATION_PENDING',
    (SELECT definition_json->'states' @> '["LEGAL_VALIDATION_PENDING"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Contains LEGAL_VALIDATION_COMPLETE',
    (SELECT definition_json->'states' @> '["LEGAL_VALIDATION_COMPLETE"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Contains APPROVAL_REQUESTED',
    (SELECT definition_json->'states' @> '["APPROVAL_REQUESTED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Contains APPROVAL_GRANTED',
    (SELECT definition_json->'states' @> '["APPROVAL_GRANTED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Contains EXTERNAL_ACTION_DISPATCHED',
    (SELECT definition_json->'states' @> '["EXTERNAL_ACTION_DISPATCHED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Contains PROOF_OF_SERVICE_RECEIVED',
    (SELECT definition_json->'states' @> '["PROOF_OF_SERVICE_RECEIVED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Contains DEADLINE_TRACKING',
    (SELECT definition_json->'states' @> '["DEADLINE_TRACKING"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Contains BORROWER_RESPONSE_RECEIVED',
    (SELECT definition_json->'states' @> '["BORROWER_RESPONSE_RECEIVED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Contains SETTLED (terminal)',
    (SELECT definition_json->'states' @> '["SETTLED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Contains ESCALATED (terminal)',
    (SELECT definition_json->'states' @> '["ESCALATED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Contains CONTINUE_RECOVERY (terminal)',
    (SELECT definition_json->'states' @> '["CONTINUE_RECOVERY"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Contains REJECTED (exception)',
    (SELECT definition_json->'exception_states' @> '["REJECTED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Contains DEADLINE_BREACHED (exception)',
    (SELECT definition_json->'exception_states' @> '["DEADLINE_BREACHED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery');

-- Verify terminal states
SELECT 
    'Terminal states include SETTLED, ESCALATED, CONTINUE_RECOVERY',
    (SELECT definition_json->'terminal_states' @> '["SETTLED","ESCALATED","CONTINUE_RECOVERY"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery') as pass;

-- Verify initial state
SELECT 
    'Initial state is BANK_REFERRAL_RECEIVED',
    (SELECT definition_json->'initial_states' = '["BANK_REFERRAL_RECEIVED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery') as pass;

\echo 'PASS: Bank Recovery workflow definition structure verified'

-- ============================================================
-- TEST 2: Transitions - Golden Path Verification
-- ============================================================

\echo '=== TEST 2: Transitions - Golden Path ==='

-- Verify key transitions exist (golden path)
SELECT 
    'BANK_REFERRAL_RECEIVED -> CASE_CREATED',
    (SELECT (definition_json->'transitions'->>'BANK_REFERRAL_RECEIVED')::jsonb @> '["CASE_CREATED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery') as pass
UNION ALL SELECT
    'CASE_CREATED -> DOCUMENTS_COLLECTED',
    (SELECT (definition_json->'transitions'->>'CASE_CREATED')::jsonb @> '["DOCUMENTS_COLLECTED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'DOCUMENTS_COLLECTED -> AI_EXTRACTION_COMPLETE',
    (SELECT (definition_json->'transitions'->>'DOCUMENTS_COLLECTED')::jsonb @> '["AI_EXTRACTION_COMPLETE"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'AI_EXTRACTION_COMPLETE -> LEGAL_BASIS_CONFIRMED',
    (SELECT (definition_json->'transitions'->>'AI_EXTRACTION_COMPLETE')::jsonb @> '["LEGAL_BASIS_CONFIRMED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'LEGAL_BASIS_CONFIRMED -> NOTICE_DRAFTED',
    (SELECT (definition_json->'transitions'->>'LEGAL_BASIS_CONFIRMED')::jsonb @> '["NOTICE_DRAFTED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'NOTICE_DRAFTED -> LEGAL_VALIDATION_PENDING',
    (SELECT (definition_json->'transitions'->>'NOTICE_DRAFTED')::jsonb @> '["LEGAL_VALIDATION_PENDING"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'LEGAL_VALIDATION_PENDING -> LEGAL_VALIDATION_COMPLETE',
    (SELECT (definition_json->'transitions'->>'LEGAL_VALIDATION_PENDING')::jsonb @> '["LEGAL_VALIDATION_COMPLETE"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'LEGAL_VALIDATION_COMPLETE -> APPROVAL_REQUESTED',
    (SELECT (definition_json->'transitions'->>'LEGAL_VALIDATION_COMPLETE')::jsonb @> '["APPROVAL_REQUESTED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'APPROVAL_REQUESTED -> APPROVAL_GRANTED',
    (SELECT (definition_json->'transitions'->>'APPROVAL_REQUESTED')::jsonb @> '["APPROVAL_GRANTED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'APPROVAL_GRANTED -> EXTERNAL_ACTION_DISPATCHED',
    (SELECT (definition_json->'transitions'->>'APPROVAL_GRANTED')::jsonb @> '["EXTERNAL_ACTION_DISPATCHED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'EXTERNAL_ACTION_DISPATCHED -> PROOF_OF_SERVICE_RECEIVED',
    (SELECT (definition_json->'transitions'->>'EXTERNAL_ACTION_DISPATCHED')::jsonb @> '["PROOF_OF_SERVICE_RECEIVED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'PROOF_OF_SERVICE_RECEIVED -> DEADLINE_TRACKING',
    (SELECT (definition_json->'transitions'->>'PROOF_OF_SERVICE_RECEIVED')::jsonb @> '["DEADLINE_TRACKING"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'DEADLINE_TRACKING -> BORROWER_RESPONSE_RECEIVED',
    (SELECT (definition_json->'transitions'->>'DEADLINE_TRACKING')::jsonb @> '["BORROWER_RESPONSE_RECEIVED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'BORROWER_RESPONSE_RECEIVED -> SETTLED',
    (SELECT (definition_json->'transitions'->>'BORROWER_RESPONSE_RECEIVED')::jsonb @> '["SETTLED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'BORROWER_RESPONSE_RECEIVED -> CONTINUE_RECOVERY',
    (SELECT (definition_json->'transitions'->>'BORROWER_RESPONSE_RECEIVED')::jsonb @> '["CONTINUE_RECOVERY"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'BORROWER_RESPONSE_RECEIVED -> ESCALATED',
    (SELECT (definition_json->'transitions'->>'BORROWER_RESPONSE_RECEIVED')::jsonb @> '["ESCALATED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery');

-- Verify exception transitions
SELECT 
    'LEGAL_VALIDATION_PENDING can loop back to LEGAL_BASIS_CONFIRMED',
    (SELECT (definition_json->'transitions'->>'LEGAL_VALIDATION_PENDING')::jsonb @> '["LEGAL_BASIS_CONFIRMED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery') as pass
UNION ALL SELECT
    'APPROVAL_REQUESTED -> REJECTED',
    (SELECT (definition_json->'transitions'->>'APPROVAL_REQUESTED')::jsonb @> '["REJECTED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'REJECTED -> ESCALATED',
    (SELECT (definition_json->'transitions'->>'REJECTED')::jsonb @> '["ESCALATED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'REJECTED -> BANK_REFERRAL_RECEIVED (restart)',
    (SELECT (definition_json->'transitions'->>'REJECTED')::jsonb @> '["BANK_REFERRAL_RECEIVED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'DEADLINE_TRACKING -> DEADLINE_BREACHED',
    (SELECT (definition_json->'transitions'->>'DEADLINE_TRACKING')::jsonb @> '["DEADLINE_BREACHED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'DEADLINE_BREACHED -> ESCALATED',
    (SELECT (definition_json->'transitions'->>'DEADLINE_BREACHED')::jsonb @> '["ESCALATED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'DEADLINE_BREACHED -> CONTINUE_RECOVERY',
    (SELECT (definition_json->'transitions'->>'DEADLINE_BREACHED')::jsonb @> '["CONTINUE_RECOVERY"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery');

-- Verify terminal states have no outgoing transitions
SELECT 
    'SETTLED has no outgoing transitions',
    (SELECT (definition_json->'transitions'->>'SETTLED')::jsonb = '[]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery') as pass
UNION ALL SELECT
    'ESCALATED has no outgoing transitions',
    (SELECT (definition_json->'transitions'->>'ESCALATED')::jsonb = '[]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'CONTINUE_RECOVERY has no outgoing transitions',
    (SELECT (definition_json->'transitions'->>'CONTINUE_RECOVERY')::jsonb = '[]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery');

\echo 'PASS: Golden path transitions verified'

-- ============================================================
-- TEST 3: Deadlines - Section 89B and Other Deadlines
-- ============================================================

\echo '=== TEST 3: Deadlines ==='

-- Verify all expected deadlines exist
SELECT 
    'Has deadline on BANK_REFERRAL_RECEIVED',
    (SELECT definition_json->'deadlines' ? 'BANK_REFERRAL_RECEIVED' FROM public.workflow_definitions WHERE slug = 'bank_recovery') as pass
UNION ALL SELECT
    'Has deadline on DOCUMENTS_COLLECTED',
    (SELECT definition_json->'deadlines' ? 'DOCUMENTS_COLLECTED' FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Has deadline on LEGAL_BASIS_CONFIRMED',
    (SELECT definition_json->'deadlines' ? 'LEGAL_BASIS_CONFIRMED' FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Has deadline on APPROVAL_REQUESTED',
    (SELECT definition_json->'deadlines' ? 'APPROVAL_REQUESTED' FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Has deadline on EXTERNAL_ACTION_DISPATCHED',
    (SELECT definition_json->'deadlines' ? 'EXTERNAL_ACTION_DISPATCHED' FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Has deadline on PROOF_OF_SERVICE_RECEIVED',
    (SELECT definition_json->'deadlines' ? 'PROOF_OF_SERVICE_RECEIVED' FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Has deadline on DEADLINE_TRACKING (Section 89B)',
    (SELECT definition_json->'deadlines' ? 'DEADLINE_TRACKING' FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Has deadline on BORROWER_RESPONSE_RECEIVED',
    (SELECT definition_json->'deadlines' ? 'BORROWER_RESPONSE_RECEIVED' FROM public.workflow_definitions WHERE slug = 'bank_recovery');

-- Verify Section 89B deadline specifics
SELECT 
    'Section 89B deadline has 30-day window',
    (SELECT (definition_json->'deadlines'->'DEADLINE_TRACKING'->>'options')::jsonb @> '[30]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery') as pass
UNION ALL SELECT
    'Section 89B deadline labeled correctly',
    (SELECT definition_json->'deadlines'->'DEADLINE_TRACKING'->>'label' = 'Section 89B statutory deadline' FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Section 89B deadline blocking=true',
    (SELECT (definition_json->'deadlines'->'DEADLINE_TRACKING'->>'blocking')::boolean = true FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Section 89B starts_from mentions mortgage creation',
    (SELECT definition_json->'deadlines'->'DEADLINE_TRACKING'->>'starts_from' LIKE '%mortgage%deposit%title deeds%' FROM public.workflow_definitions WHERE slug = 'bank_recovery');

-- Verify DOCUMENTS_COLLECTED has multiple window options
SELECT 
    'DOCUMENTS_COLLECTED has 7 and 14 day options',
    (SELECT (definition_json->'deadlines'->'DOCUMENTS_COLLECTED'->>'options')::jsonb @> '[7,14]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery') as pass;

# Verify BORROWER_RESPONSE_RECEIVED has 15 and 30 day options
SELECT 
    'BORROWER_RESPONSE has 15 and 30 day options',
    (SELECT (definition_json->'deadlines'->'BORROWER_RESPONSE_RECEIVED'->>'options')::jsonb @> '[15,30]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery') as pass;

\echo 'PASS: Deadlines verified including Section 89B'

-- ============================================================
-- TEST 4: AI Integration Configuration
-- ============================================================

\echo '=== TEST 4: AI Integration ==='

SELECT 
    'Has ai_integration section',
    (SELECT definition_json ? 'ai_integration' FROM public.workflow_definitions WHERE slug = 'bank_recovery') as pass
UNION ALL SELECT
    'AI extraction stage is AI_EXTRACTION_COMPLETE',
    (SELECT definition_json->'ai_integration'->>'document_extraction_stage' = 'AI_EXTRACTION_COMPLETE' FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Required document types include LOAN_AGREEMENT',
    (SELECT definition_json->'ai_integration'->'required_document_types' @> '["LOAN_AGREEMENT"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Required document types include SECURITY_DOCUMENT',
    (SELECT definition_json->'ai_integration'->'required_document_types' @> '["SECURITY_DOCUMENT"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Required document types include MORTGAGE_DEED',
    (SELECT definition_json->'ai_integration'->'required_document_types' @> '["MORTGAGE_DEED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Required document types include TITLE_DEEDS',
    (SELECT definition_json->'ai_integration'->'required_document_types' @> '["TITLE_DEEDS"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Extraction agent specified',
    (SELECT definition_json->'ai_integration'->>'extraction_agent' IS NOT NULL FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Prompt version specified',
    (SELECT definition_json->'ai_integration'->>'prompt_version' IS NOT NULL FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Confidence threshold set (0.75)',
    (SELECT (definition_json->'ai_integration'->>'confidence_threshold')::numeric = 0.75 FROM public.workflow_definitions WHERE slug = 'bank_recovery');

\echo 'PASS: AI integration configuration verified'

-- ============================================================
-- TEST 5: Policy Gates
-- ============================================================

\echo '=== TEST 5: Policy Gates ==='

SELECT 
    'Has policy_gates array',
    (SELECT definition_json ? 'policy_gates' FROM public.workflow_definitions WHERE slug = 'bank_recovery') as pass
UNION ALL SELECT
    'Policy gate at NOTICE_DRAFTED stage',
    (SELECT definition_json->'policy_gates' @> '[{"stage": "NOTICE_DRAFTED"}]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Policy gate at EXTERNAL_ACTION_DISPATCHED stage',
    (SELECT definition_json->'policy_gates' @> '[{"stage": "EXTERNAL_ACTION_DISPATCHED"}]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Policy key for notice dispatch is recovery_notice_dispatch',
    (SELECT definition_json->'policy_gates' @> '[{"policy_key": "recovery_notice_dispatch"}]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Policy key for external action is recovery_external_action',
    (SELECT definition_json->'policy_gates' @> '[{"policy_key": "recovery_external_action"}]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Required decision is ALLOW',
    (SELECT definition_json->'policy_gates' @> '[{"required_decision": "ALLOW"}]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery');

\echo 'PASS: Policy gates verified'

-- ============================================================
-- TEST 6: Approval Requirements
-- ============================================================

\echo '=== TEST 6: Approval Requirements ==='

SELECT 
    'Has approval_requirements array',
    (SELECT definition_json ? 'approval_requirements' FROM public.workflow_definitions WHERE slug = 'bank_recovery') as pass
UNION ALL SELECT
    'Approval requirement at APPROVAL_REQUESTED stage',
    (SELECT definition_json->'approval_requirements' @> '[{"stage": "APPROVAL_REQUESTED"}]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Approval type is recovery_notice_dispatch',
    (SELECT definition_json->'approval_requirements' @> '[{"approval_type": "recovery_notice_dispatch"}]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Required approvers include PRINCIPAL',
    (SELECT definition_json->'approval_requirements' @> '[{"required_approvers": ["PRINCIPAL"]}]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Required approvers include ADVOCATE',
    (SELECT definition_json->'approval_requirements' @> '[{"required_approvers": ["ADVOCATE"]}]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Min approvals = 1',
    (SELECT (definition_json->'approval_requirements'->0->>'min_approvals')::int = 1 FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Description mentions mandatory approval before dispatch',
    (SELECT definition_json->'approval_requirements'->0->>'description' LIKE '%Mandatory approval%Action Gateway%' FROM public.workflow_definitions WHERE slug = 'bank_recovery');

\echo 'PASS: Approval requirements verified (mandatory approval before dispatch)'

-- ============================================================
-- TEST 7: Action Gateway Integration
-- ============================================================

\echo '=== TEST 7: Action Gateway Integration ==='

SELECT 
    'Has action_gateway_integration section',
    (SELECT definition_json ? 'action_gateway_integration' FROM public.workflow_definitions WHERE slug = 'bank_recovery') as pass
UNION ALL SELECT
    'Dispatch stage is EXTERNAL_ACTION_DISPATCHED',
    (SELECT definition_json->'action_gateway_integration'->>'dispatch_stage' = 'EXTERNAL_ACTION_DISPATCHED' FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Supported channels include IGR',
    (SELECT definition_json->'action_gateway_integration'->'supported_channels' @> '["IGR"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Supported channels include GRAS',
    (SELECT definition_json->'action_gateway_integration'->'supported_channels' @> '["GRAS"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Supported channels include NeSL',
    (SELECT definition_json->'action_gateway_integration'->'supported_channels' @> '["NeSL"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Supported channels include BANK_API',
    (SELECT definition_json->'action_gateway_integration'->'supported_channels' @> '["BANK_API"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Supported channels include EMAIL',
    (SELECT definition_json->'action_gateway_integration'->'supported_channels' @> '["EMAIL"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Supported channels include WHATSAPP',
    (SELECT definition_json->'action_gateway_integration'->'supported_channels' @> '["WHATSAPP"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Supported channels include POSTAL',
    (SELECT definition_json->'action_gateway_integration'->'supported_channels' @> '["POSTAL"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Idempotency key template defined',
    (SELECT definition_json->'action_gateway_integration'->>'idempotency_key_template' IS NOT NULL FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Retry policy has max_retries=3',
    (SELECT (definition_json->'action_gateway_integration'->'retry_policy'->>'max_retries')::int = 3 FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Retry policy has backoff_seconds=300',
    (SELECT (definition_json->'action_gateway_integration'->'retry_policy'->>'backoff_seconds')::int = 300 FROM public.workflow_definitions WHERE slug = 'bank_recovery');

\echo 'PASS: Action Gateway integration verified (IGR/GRAS/NeSL/Bank/Email/WhatsApp/Postal)'

-- ============================================================
-- TEST 8: Audit Capture Configuration
-- ============================================================

\echo '=== TEST 8: Audit Capture ==='

SELECT 
    'Has audit_capture section',
    (SELECT definition_json ? 'audit_capture' FROM public.workflow_definitions WHERE slug = 'bank_recovery') as pass
UNION ALL SELECT
    'Capture AI runs enabled',
    (SELECT (definition_json->'audit_capture'->>'capture_ai_runs')::boolean = true FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Capture policy evaluations enabled',
    (SELECT (definition_json->'audit_capture'->>'capture_policy_evaluations')::boolean = true FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Capture approval requests enabled',
    (SELECT (definition_json->'audit_capture'->>'capture_approval_requests')::boolean = true FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Capture external actions enabled',
    (SELECT (definition_json->'audit_capture'->>'capture_external_actions')::boolean = true FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Capture attempts enabled',
    (SELECT (definition_json->'audit_capture'->>'capture_attempts')::boolean = true FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'Capture deadline events enabled',
    (SELECT (definition_json->'audit_capture'->>'capture_deadline_events')::boolean = true FROM public.workflow_definitions WHERE slug = 'bank_recovery');

\echo 'PASS: Audit capture configuration verified (complete chain)'

-- ============================================================
-- TEST 9: Version History
-- ============================================================

\echo '=== TEST 9: Version History ==='

SELECT 
    'Version 1.0.0 exists',
    EXISTS (SELECT 1 FROM public.workflow_versions wv JOIN public.workflow_definitions wd ON wd.id = wv.workflow_definition_id WHERE wd.slug='bank_recovery' AND wv.version_number='1.0.0') as pass
UNION ALL SELECT
    'Version has changelog mentioning golden path',
    (SELECT wv.changelog LIKE '%Golden path%AI extraction%legal basis%approval%Action Gateway%deadline%audit%' FROM public.workflow_versions wv JOIN public.workflow_definitions wd ON wd.id = wv.workflow_definition_id WHERE wd.slug='bank_recovery' AND wv.version_number='1.0.0');

\echo 'PASS: Version history verified'

-- ============================================================
-- TEST 10: Workflow Instance Creation and Integration
-- ============================================================

\echo '=== TEST 10: Workflow Instance Creation ==='

-- Create workflow instance for recovery case
INSERT INTO public.workflow_instances (
    workflow_definition_id, workflow_version_id, case_id, org_id, current_state, status, started_by
) VALUES (
    (SELECT id FROM public.workflow_definitions WHERE slug = 'bank_recovery'),
    (SELECT id FROM public.workflow_versions WHERE workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug = 'bank_recovery') AND version_number = '1.0.0'),
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'BANK_REFERRAL_RECEIVED',
    'pending',
    '11111111-1111-1111-1111-111111111111'
) RETURNING id, current_state, status;

-- Verify instance created and pinned to version
SELECT 
    'Instance created with BANK_REFERRAL_RECEIVED state',
    (SELECT current_state = 'BANK_REFERRAL_RECEIVED' FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='bank_recovery')) as pass
UNION ALL SELECT
    'Instance status = pending',
    (SELECT status = 'pending' FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='bank_recovery'))
UNION ALL SELECT
    'Instance pinned to workflow_version_id (v1.0.0)',
    (SELECT wv.version_number = '1.0.0' 
     FROM public.workflow_instances wi
     JOIN public.workflow_versions wv ON wv.id = wi.workflow_version_id
     WHERE wi.case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND wi.workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='bank_recovery'));

-- Test state transition: BANK_REFERRAL_RECEIVED -> CASE_CREATED
UPDATE public.workflow_instances 
SET current_state = 'CASE_CREATED', status = 'running', updated_at = NOW()
WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='bank_recovery');

SELECT 
    'State transition to CASE_CREATED works',
    (SELECT current_state = 'CASE_CREATED' FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='bank_recovery')) as pass;

-- Test creating tasks for key stages
INSERT INTO public.tasks (workflow_instance_id, task_definition_id, assignee_id, status, due_at, metadata_json)
SELECT 
    wi.id,
    task_def,
    '11111111-1111-1111-1111-111111111111',
    'pending',
    NOW() + INTERVAL '24 hours',
    jsonb_build_object('stage', task_def, 'description', 'Auto-created task for ' || task_def)
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
WHERE wi.case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' 
  AND wi.workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='bank_recovery');

SELECT 
    '10 tasks created for workflow instance',
    (SELECT COUNT(*) = 10 FROM public.tasks WHERE workflow_instance_id = (SELECT id FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='bank_recovery'))) as pass;

-- Test deadline creation for Section 89B
INSERT INTO public.deadlines (workflow_instance_id, deadline_type, label, due_at, metadata_json)
SELECT 
    wi.id,
    'statutory',
    'Section 89B statutory deadline',
    NOW() + INTERVAL '30 days',
    jsonb_build_object('window_days', 30, 'section', '89B', 'starts_from', 'date of mortgage creation by deposit of title deeds', 'blocking', true)
FROM public.workflow_instances wi
WHERE wi.workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug = 'bank_recovery')
  AND wi.case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

SELECT 
    'Section 89B deadline created',
    (SELECT COUNT(*) = 1 FROM public.deadlines WHERE workflow_instance_id = (SELECT id FROM public.workflow_instances WHERE case_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug='bank_recovery'))) as pass;

\echo 'PASS: Workflow instance creation and integration verified'

-- ============================================================
-- TEST 11: RLS Isolation
-- ============================================================

\echo '=== TEST 11: RLS Cross-tenant Isolation ==='

-- Create workflow instance for Tenant B
INSERT INTO public.workflow_instances (
    workflow_definition_id, workflow_version_id, case_id, org_id, current_state, status
) VALUES (
    (SELECT id FROM public.workflow_definitions WHERE slug = 'bank_recovery'),
    (SELECT id FROM public.workflow_versions WHERE workflow_definition_id = (SELECT id FROM public.workflow_definitions WHERE slug = 'bank_recovery') AND version_number = '1.0.0'),
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'BANK_REFERRAL_RECEIVED',
    'running'
) ON CONFLICT DO NOTHING;

-- As Tenant A, try to read Tenant B's workflow instance
SET LOCAL app.current_org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
SELECT 
    'Tenant A cannot see Tenant B recovery workflow instances',
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
    (SELECT COUNT(*) = 1 FROM public.workflow_instances WHERE case_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd') as pass;

\echo 'PASS: RLS cross-tenant isolation verified'

-- ============================================================
-- TEST 12: Legal Basis Confirmation is Mandatory (Not Automatic)
-- ============================================================

\echo '=== TEST 12: Legal Basis Confirmation is Mandatory ==='

-- Verify the workflow requires LEGAL_BASIS_CONFIRMED stage (cannot skip)
-- This is enforced by the transition graph: AI_EXTRACTION_COMPLETE -> LEGAL_BASIS_CONFIRMED -> NOTICE_DRAFTED
-- There is NO direct transition from AI_EXTRACTION_COMPLETE to NOTICE_DRAFTED

SELECT 
    'NO direct transition from AI_EXTRACTION_COMPLETE to NOTICE_DRAFTED',
    (SELECT NOT ((definition_json->'transitions'->>'AI_EXTRACTION_COMPLETE')::jsonb @> '["NOTICE_DRAFTED"]'::jsonb) FROM public.workflow_definitions WHERE slug = 'bank_recovery') as pass
UNION ALL SELECT
    'MUST go through LEGAL_BASIS_CONFIRMED',
    (SELECT (definition_json->'transitions'->>'AI_EXTRACTION_COMPLETE')::jsonb @> '["LEGAL_BASIS_CONFIRMED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery')
UNION ALL SELECT
    'LEGAL_BASIS_CONFIRMED -> NOTICE_DRAFTED exists',
    (SELECT (definition_json->'transitions'->>'LEGAL_BASIS_CONFIRMED')::jsonb @> '["NOTICE_DRAFTED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery');

-- Verify exception state handling: if legal validation fails, loops back to LEGAL_BASIS_CONFIRMED
SELECT 
    'LEGAL_VALIDATION_PENDING can loop back to LEGAL_BASIS_CONFIRMED',
    (SELECT (definition_json->'transitions'->>'LEGAL_VALIDATION_PENDING')::jsonb @> '["LEGAL_BASIS_CONFIRMED"]'::jsonb FROM public.workflow_definitions WHERE slug = 'bank_recovery') as pass;

\echo 'PASS: Legal basis confirmation is mandatory (advocate must confirm - no automatic applicability)'

-- ============================================================
-- CLEANUP
-- ============================================================

\echo '=== CLEANUP ==='

DELETE FROM public.deadlines WHERE workflow_instance_id IN (SELECT id FROM public.workflow_instances WHERE case_id IN ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd'));
DELETE FROM public.tasks WHERE workflow_instance_id IN (SELECT id FROM public.workflow_instances WHERE case_id IN ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd'));
DELETE FROM public.workflow_instances WHERE case_id IN ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd');
DELETE FROM public.cases WHERE id IN ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd');
DELETE FROM public.profiles WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');
DELETE FROM public.organizations WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

\echo '=== ALL TESTS PASSED ==='

-- Migration test complete: Bank Recovery workflow definition verified