-- 0008_ai_runs.sql
-- Create canonical AI runs table for legal AI governance
-- This enables reproducibility and auditability of AI decisions

-- ============================================================
-- 1. CREATE ENUMS FOR AI RUN STATUS
-- ============================================================

DO $$ BEGIN
    CREATE TYPE ai_run_status AS ENUM (
        'pending',      -- Run queued, not yet started
        'running',      -- Model inference in progress
        'completed',    -- Model returned output successfully
        'failed',       -- Model error, timeout, or exception
        'cancelled',    -- Cancelled by user/system before completion
        'review_required' -- Completed but flagged for human review
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 2. CREATE AI_RUNS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    agent TEXT NOT NULL,                    -- Agent name (e.g., 'drafter', 'auditor', 'vyasa')
    agent_version TEXT NOT NULL,            -- Semantic version of agent code (e.g., '1.2.0')
    model_provider TEXT NOT NULL,           -- Provider name (e.g., 'groq', 'vllm', 'gemini', 'openai')
    model_route TEXT NOT NULL,              -- Route/endpoint (e.g., 'llama-3.3-70b-versatile', 'qwen2.5-7b-instruct')
    model_version TEXT NOT NULL,            -- Model version/tag (e.g., '2024-12', 'main', 'v1.0')
    prompt_version TEXT NOT NULL,           -- Prompt template version (e.g., 'noi-v3', 'audit-v1.2')
    document_version_ids UUID[] NOT NULL DEFAULT '{}',  -- Array of document_version IDs referenced
    input_hash CHAR(64) NOT NULL,           -- SHA-256 of serialized input (prompts, context, params)
    output_hash CHAR(64),                   -- SHA-256 of raw model output (NULL if failed)
    structured_output JSONB,                -- Parsed structured output (see spec below)
    evidence JSONB NOT NULL DEFAULT '[]',   -- Array of evidence references: [{doc_version_id, excerpt, location, relevance}]
    confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1), -- 0.00 to 1.00
    risk_flags TEXT[] NOT NULL DEFAULT '{}', -- Array of risk identifiers (e.g., 'hallucination_risk', 'missing_citation')
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status ai_run_status NOT NULL DEFAULT 'pending',
    human_decision TEXT CHECK (human_decision IN ('approved', 'rejected', 'modified', 'escalated')),
    human_decision_by UUID REFERENCES public.profiles(id),
    human_decision_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT ai_runs_completed_when_done CHECK (
        (status IN ('completed', 'failed', 'cancelled', 'review_required') AND completed_at IS NOT NULL)
        OR (status IN ('pending', 'running') AND completed_at IS NULL)
    ),
    CONSTRAINT ai_runs_human_decision_complete CHECK (
        (human_decision IS NOT NULL AND human_decision_by IS NOT NULL AND human_decision_at IS NOT NULL)
        OR (human_decision IS NULL AND human_decision_by IS NULL AND human_decision_at IS NULL)
    )
);

-- ============================================================
-- 3. STRUCTURED OUTPUT SPECIFICATION (as JSONB schema)
-- ============================================================
/*
structured_output JSONB structure (not enforced by DB, but by application):

{
  "answer": "string | null",              -- Direct answer or draft text
  "draft": "string | null",               -- Full document draft (for drafting agents)
  "evidence_refs": [                       -- References to evidence in this run
    {
      "document_version_id": "uuid",
      "excerpt": "string",
      "location": "string",                -- e.g., "page 3, para 2" or "clause 4.1"
      "relevance": "string"                -- Why this evidence matters
    }
  ],
  "document_version_ids": ["uuid", ...],  -- Subset of input document_version_ids actually used
  "confidence": 0.85,                      -- Per-output confidence (may differ from run-level)
  "risk_flags": ["string", ...],           -- Output-specific risk flags
  "proposed_actions": [                    -- Suggested next steps
    {
      "action": "string",
      "rationale": "string",
      "priority": "high|medium|low"
    }
  ],
  "missing_information": [                 -- Gaps identified
    {
      "field": "string",
      "description": "string",
      "impact": "high|medium|low"
    }
  ],
  "metadata": {                            -- Extensible metadata
    "tokens_input": 1234,
    "tokens_output": 567,
    "latency_ms": 1450,
    "temperature": 0.1
  }
}

IMPORTANT: Free-form model prose (answer/draft) is NOT automatically authoritative
workflow state. Human decision (approved/rejected/modified/escalated) is required
to transition to official state.
*/

-- ============================================================
-- 4. CREATE INDEXES
-- ============================================================

-- Org-scoped queries (primary access pattern for RLS)
CREATE INDEX IF NOT EXISTS idx_ai_runs_org_id 
    ON public.ai_runs(org_id);

-- Case-scoped queries
CREATE INDEX IF NOT EXISTS idx_ai_runs_case_id 
    ON public.ai_runs(case_id);

-- Task-scoped queries
CREATE INDEX IF NOT EXISTS idx_ai_runs_task_id 
    ON public.ai_runs(task_id);

-- Agent lookup (which agent runs)
CREATE INDEX IF NOT EXISTS idx_ai_runs_agent 
    ON public.ai_runs(agent);

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_ai_runs_status 
    ON public.ai_runs(status);

-- Time-range queries
CREATE INDEX IF NOT EXISTS idx_ai_runs_started_at 
    ON public.ai_runs(started_at);

-- Composite: org + status (common dashboard query)
CREATE INDEX IF NOT EXISTS idx_ai_runs_org_status 
    ON public.ai_runs(org_id, status);

-- Composite: org + agent (agent performance)
CREATE INDEX IF NOT EXISTS idx_ai_runs_org_agent 
    ON public.ai_runs(org_id, agent);

-- Composite: org + case (case AI history)
CREATE INDEX IF NOT EXISTS idx_ai_runs_org_case 
    ON public.ai_runs(org_id, case_id);

-- Document version lookup (which runs used a document version)
-- GIN index for array containment queries
CREATE INDEX IF NOT EXISTS idx_ai_runs_document_version_ids 
    ON public.ai_runs USING GIN (document_version_ids);

-- Input/output hash lookups (deduplication, reproducibility verification)
CREATE INDEX IF NOT EXISTS idx_ai_runs_input_hash 
    ON public.ai_runs(input_hash);

CREATE INDEX IF NOT EXISTS idx_ai_runs_output_hash 
    ON public.ai_runs(output_hash);

-- ============================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;

-- Org-scoped access policy
-- Users can only access AI runs within their organization
CREATE POLICY ai_runs_org_isolation ON public.ai_runs
    FOR ALL
    USING (org_id = current_setting('app.current_org_id')::uuid);

-- ============================================================
-- 6. GRANT PRIVILEGES TO ag_app (RUNTIME ROLE)
-- ============================================================

GRANT SELECT, INSERT, UPDATE ON public.ai_runs TO ag_app;
GRANT USAGE, SELECT ON SEQUENCE public.ai_runs_id_seq TO ag_app;

-- Note: DELETE not granted - AI runs are immutable audit records
-- UPDATE only for: status transitions, human_decision fields, risk_flags append

-- ============================================================
-- 7. VERIFICATION QUERIES (run after migration)
-- ============================================================

/*
-- Verify table structure
\d public.ai_runs

-- Verify indexes
\di idx_ai_runs_*

-- Verify RLS is enabled
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'ai_runs';

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'ai_runs';

-- Verify grants
SELECT * FROM information_schema.table_privileges WHERE table_name = 'ai_runs';

-- Test insert (as ag_owner)
INSERT INTO public.ai_runs (
    org_id, case_id, task_id, agent, agent_version, 
    model_provider, model_route, model_version, prompt_version,
    document_version_ids, input_hash, status
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    NULL,
    NULL,
    'drafter',
    '1.0.0',
    'groq',
    'llama-3.3-70b-versatile',
    '2024-12',
    'noi-v3',
    ARRAY['00000000-0000-0000-0000-000000000000'::uuid],
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'pending'
);

-- Test structured_output insert
UPDATE public.ai_runs
SET structured_output = jsonb_build_object(
    'answer', 'Test answer',
    'evidence_refs', jsonb_build_array(),
    'document_version_ids', ARRAY['00000000-0000-0000-0000-000000000000'::uuid],
    'confidence', 0.90,
    'risk_flags', ARRAY[]::text[],
    'proposed_actions', jsonb_build_array(),
    'missing_information', jsonb_build_array(),
    'metadata', jsonb_build_object('tokens_input', 100, 'tokens_output', 50)
),
    status = 'completed',
    completed_at = NOW(),
    output_hash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    confidence = 0.90
WHERE id = '00000000-0000-0000-0000-000000000000'::uuid;
*/

-- Migration complete: ai_runs table created for canonical AI governance