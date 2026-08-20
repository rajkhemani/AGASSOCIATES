-- 0007_document_versions.sql
-- Create document_versions table and document provenance system
-- This is foundational for AI governance - AI runs must reference specific document versions

-- ============================================================
-- 1. CREATE ENUMS FOR OCR AND MALWARE STATES
-- ============================================================

DO $$ BEGIN
    CREATE TYPE ocr_state AS ENUM ('pending', 'processing', 'completed', 'failed', 'skipped');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE malware_state AS ENUM ('pending', 'scanning', 'clean', 'infected', 'quarantined', 'skipped');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 2. CREATE DOCUMENT_VERSIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
    sha256 CHAR(64) NOT NULL, -- SHA-256 hash as 64 hex characters
    storage_ref TEXT NOT NULL, -- Storage reference (e.g., S3 key, Supabase Storage path)
    mime TEXT NOT NULL, -- MIME type (e.g., application/pdf, image/png)
    size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
    creator UUID NOT NULL REFERENCES public.profiles(id),
    source TEXT NOT NULL CHECK (source IN ('upload', 'ocr', 'ai-generated', 'template', 'import', 'system')),
    ocr_state ocr_state NOT NULL DEFAULT 'pending',
    malware_state malware_state NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. CREATE INDEXES
-- ============================================================

-- Primary lookup: versions for a document
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id 
    ON public.document_versions(document_id);

-- Org-scoped queries (for RLS and tenant isolation)
CREATE INDEX IF NOT EXISTS idx_document_versions_org_id 
    ON public.document_versions(org_id);

-- Case-scoped queries
CREATE INDEX IF NOT EXISTS idx_document_versions_case_id 
    ON public.document_versions(case_id);

-- SHA-256 lookup (deduplication, integrity verification)
CREATE INDEX IF NOT EXISTS idx_document_versions_sha256 
    ON public.document_versions(sha256);

-- Creator lookup (audit trail)
CREATE INDEX IF NOT EXISTS idx_document_versions_creator 
    ON public.document_versions(creator);

-- Composite index for org + document lookups
CREATE INDEX IF NOT EXISTS idx_document_versions_org_document 
    ON public.document_versions(org_id, document_id);

-- Composite index for org + case lookups
CREATE INDEX IF NOT EXISTS idx_document_versions_org_case 
    ON public.document_versions(org_id, case_id);

-- ============================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- Org-scoped access policy
-- Users can only access document versions within their organization
CREATE POLICY document_versions_org_isolation ON public.document_versions
    FOR ALL
    USING (org_id = current_setting('app.current_org_id')::uuid);

-- ============================================================
-- 5. GRANT PRIVILEGES TO ag_app (RUNTIME ROLE)
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_versions TO ag_app;
GRANT USAGE, SELECT ON SEQUENCE public.document_versions_id_seq TO ag_app;

-- Note: UPDATE/DELETE are granted but should be restricted in practice
-- Document versions are IMMUTABLE - application logic should enforce this
-- The grants exist for edge cases (admin corrections, GDPR deletion)

-- ============================================================
-- 6. ADD UPDATED_AT TRIGGER (for audit trail, though versions are immutable)
-- ============================================================

-- We don't add an updated_at column since versions are immutable
-- created_at is the only timestamp - it represents when this version was created

-- ============================================================
-- 7. UNIQUE CONSTRAINT: One version per document per SHA-256
-- ============================================================

-- This prevents duplicate versions with the same content hash for the same document
-- A changed file creates a new version (different SHA-256)
ALTER TABLE public.document_versions 
    ADD CONSTRAINT document_versions_document_sha256_unique 
    UNIQUE (document_id, sha256);

-- ============================================================
-- 8. VERIFICATION QUERIES (run after migration)
-- ============================================================

/*
-- Verify table structure
\d public.document_versions

-- Verify indexes
\di idx_document_versions_*

-- Verify RLS is enabled
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'document_versions';

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'document_versions';

-- Verify grants
SELECT * FROM information_schema.table_privileges WHERE table_name = 'document_versions';

-- Test insert (as ag_owner)
INSERT INTO public.document_versions (
    document_id, org_id, case_id, sha256, storage_ref, mime, size_bytes, 
    creator, source, ocr_state, malware_state
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid, -- placeholder document_id
    '00000000-0000-0000-0000-000000000000'::uuid, -- placeholder org_id
    NULL,
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', -- SHA-256 of empty string
    'test/path/document.pdf',
    'application/pdf',
    1024,
    '00000000-0000-0000-0000-000000000000'::uuid, -- placeholder creator
    'upload',
    'pending',
    'pending'
);

-- Test unique constraint (should fail on duplicate sha256 for same document)
-- INSERT with same document_id and sha256 should fail
*/

-- Migration complete: document_versions table created with full provenance tracking