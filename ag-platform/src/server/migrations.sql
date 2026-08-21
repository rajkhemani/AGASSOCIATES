
-- 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ROLES ENUM
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('PRINCIPAL', 'ADVOCATE', 'EXECUTIVE', 'CLERK', 'BANK_VIEWER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CASE TYPES ENUM
DO $$ BEGIN
CREATE TYPE case_type AS ENUM (
    'TITLE_SEARCH',
    'LEGAL_VETTING',
    'CTC',
    'PROPERTY_REGISTRATION',
    'MORTGAGE_REGISTRATION',
    'INTIMATION_MORTGAGE',
    'FRANKING',
    'BALANCE_TRANSFER',
    'PUBLIC_NOTICE',
    'POWER_OF_ATTORNEY',
    'LEAVE_AND_LICENSE',
    'GIFT_DEED',
    'MARKET_VALUATION'
);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Extend case_type enum with financial types (runs on existing DB too)
DO $$ BEGIN
    ALTER TYPE case_type ADD VALUE IF NOT EXISTS 'HOME_LOAN';
    ALTER TYPE case_type ADD VALUE IF NOT EXISTS 'LOAN_AGAINST_PROPERTY';
    ALTER TYPE case_type ADD VALUE IF NOT EXISTS 'MACHINERY_LOAN';
    ALTER TYPE case_type ADD VALUE IF NOT EXISTS 'PROJECT_LOAN';
EXCEPTION WHEN others THEN null;
END $$;

-- CASE STATUS ENUM
DO $$ BEGIN
    CREATE TYPE case_status AS ENUM (
        'RECEIVED', 'ASSIGNED', 'DOCUMENT_COLLECTION', 'IN_PROGRESS',
        'PENDING_REGISTRATION', 'REGISTERED', 'QUALITY_CHECK',
        'DELIVERED', 'INVOICED', 'CLOSED', 'ON_HOLD', 'REJECTED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- DISBURSEMENT TYPES ENUM
DO $$ BEGIN
    CREATE TYPE disbursement_type AS ENUM (
        'STAMP_DUTY', 'REGISTRATION_FEE', 'FRANKING_CHARGE', 'CTC_FEE',
        'CHALLAN_0_3_PCT', 'MTR_FEE', 'ESBTR_FEE', 'NEWSPAPER_CHARGE', 'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- BANKS
CREATE TABLE IF NOT EXISTS banks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    short_code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('BANK', 'NBFC')),
    billing_contact TEXT,
    advance_balance NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ORGANIZATIONS (Multi-tenancy)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USER PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE, -- Link to auth.users if using Supabase Auth
    org_id UUID REFERENCES organizations(id),
    bank_id UUID REFERENCES banks(id), -- Only for BANK_VIEWER
    full_name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'EXECUTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CASES
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number TEXT UNIQUE NOT NULL,
    org_id UUID REFERENCES organizations(id) NOT NULL,
    bank_id UUID REFERENCES banks(id) NOT NULL,
    case_type case_type NOT NULL,
    status case_status NOT NULL DEFAULT 'RECEIVED',
    borrower_name TEXT NOT NULL,
    loan_amount NUMERIC(15, 2),
    received_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sla_deadline TIMESTAMP WITH TIME ZONE,
    assigned_executive_id UUID REFERENCES profiles(id),
    disbursement_total NUMERIC(15, 2) DEFAULT 0,
    professional_fee NUMERIC(15, 2) DEFAULT 0,
    sla_warning_sent BOOLEAN DEFAULT FALSE,
    sla_breached BOOLEAN DEFAULT FALSE,
    sla_escalated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DISBURSEMENTS
CREATE TABLE IF NOT EXISTS disbursements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    type disbursement_type NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    paid_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_reimbursed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CASE TIMELINE
CREATE TABLE IF NOT EXISTS case_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    status_from case_status,
    status_to case_status NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TIMESHEETS (P5: Billing Engine)
CREATE TABLE IF NOT EXISTS timesheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) NOT NULL,
    task_description TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    is_billable BOOLEAN DEFAULT TRUE,
    hourly_rate NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DOCUMENTS (files linked to cases)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    org_id UUID REFERENCES organizations(id) NOT NULL,
    uploader_id UUID REFERENCES profiles(id),
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    bucket_id TEXT NOT NULL DEFAULT 'case-documents',
    content_type TEXT,
    size_bytes BIGINT DEFAULT 0,
    category TEXT,
    version_number INTEGER DEFAULT 1,
    parent_file_id UUID REFERENCES documents(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_org_id ON documents(org_id);

-- FILES (Supabase mirror for storage uploads)
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    project_id UUID,
    uploader_id TEXT,
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    bucket_id TEXT NOT NULL DEFAULT 'case-documents',
    size_bytes BIGINT DEFAULT 0,
    content_type TEXT,
    version_number INTEGER DEFAULT 1,
    parent_file_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QA findings are deterministic, auditable outputs attached to a matter.
CREATE TABLE IF NOT EXISTS qa_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    finding_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
    source TEXT NOT NULL DEFAULT 'rule',
    evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES profiles(id),
    resolved_by UUID REFERENCES profiles(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qa_findings_case_id ON qa_findings(case_id);
CREATE INDEX IF NOT EXISTS idx_qa_findings_org_status ON qa_findings(org_id, status);

ALTER TABLE qa_findings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS qa_findings_org_isolation ON qa_findings;
CREATE POLICY qa_findings_org_isolation ON qa_findings
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

DROP TRIGGER IF EXISTS update_qa_findings_updated_at ON qa_findings;
CREATE TRIGGER update_qa_findings_updated_at
  BEFORE UPDATE ON qa_findings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- TRIGGERS for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_cases_updated_at ON cases;
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- SEED DATA
INSERT INTO organizations (id, name) VALUES ('7f45dc5f-6bef-4fae-b46a-a2306e69936d', 'AG Associates HQs') ON CONFLICT DO NOTHING;

INSERT INTO banks (id, name, short_code, type) VALUES
('7407ac8f-0cb7-434e-994c-4329a11939a7', 'HDFC Bank', 'HDFC', 'BANK'),
('2a32c22f-e7a2-487c-b9de-2bfd51455080', 'ICICI Bank', 'ICICI', 'BANK'),
('f4bfbc33-985d-4368-9b95-85c9bb6bf77f', 'State Bank of India', 'SBI', 'BANK'),
('acb64097-628f-45e9-8d66-88c21d410dee', 'LIC Housing Finance', 'LICHFL', 'NBFC')
ON CONFLICT (short_code) DO NOTHING;

-- Create a internal principal profile (fixed ID for dev consistency)
INSERT INTO profiles (id, full_name, role, org_id)
SELECT '28a4eb7d-162c-4161-817d-20c30ffa5f46', 'Head Advocate', 'PRINCIPAL', id FROM organizations LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================================
-- BILLING ENGINE MIGRATION (Phase 5B)
-- ============================================================

-- INVOICE STATUS ENUM
DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM (
        'DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- INVOICES TABLE
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE NOT NULL,
    org_id UUID REFERENCES organizations(id) NOT NULL,
    bank_id UUID REFERENCES banks(id),
    subtotal NUMERIC(15, 2) NOT NULL,
    tax_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.18,
    tax_amount NUMERIC(15, 2) NOT NULL,
    total NUMERIC(15, 2) NOT NULL,
    advance_adjusted NUMERIC(15, 2) NOT NULL DEFAULT 0,
    net_receivable NUMERIC(15, 2) NOT NULL,
    status invoice_status NOT NULL DEFAULT 'DRAFT',
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_at TIMESTAMP WITH TIME ZONE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INVOICE LINE ITEMS (links timesheets to invoices)
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    timesheet_id UUID REFERENCES timesheets(id) ON DELETE SET NULL,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL, -- hours
    rate NUMERIC(10, 2) NOT NULL, -- hourly rate
    amount NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BANK ADVANCE RECONCILIATION TRACKING
CREATE TABLE IF NOT EXISTS bank_advance_reconciliation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_id UUID REFERENCES banks(id) NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL,
    reconciled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- EXTEND TIMESHEETS WITH INVOICE LINK
DO $$ BEGIN
    ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;
    ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS invoiced BOOLEAN DEFAULT FALSE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- EXTEND DISBURSEMENTS FOR REIMBURSEMENT TRACKING
DO $$ BEGIN
    ALTER TABLE disbursements ADD COLUMN IF NOT EXISTS reimbursed_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE disbursements ADD COLUMN IF NOT EXISTS reconciliation_notes TEXT;
    ALTER TABLE disbursements ADD COLUMN IF NOT EXISTS bank_advance_used NUMERIC(15, 2) DEFAULT 0;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_bank_id ON invoices(bank_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_at ON invoices(due_at);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_bank_advance_reconciliation_bank_id ON bank_advance_reconciliation(bank_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_invoice_id ON timesheets(invoice_id);

-- TRIGGER for updated_at on invoices
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS POLICIES
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_advance_reconciliation ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoices_org_isolation ON invoices
  FOR ALL USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY invoice_line_items_org_isolation ON invoice_line_items
  FOR ALL USING (
    invoice_id IN (SELECT id FROM invoices WHERE org_id = current_setting('app.current_org_id')::uuid)
  );

CREATE POLICY bank_advance_reconciliation_org_isolation ON bank_advance_reconciliation
  FOR ALL USING (
    bank_id IN (SELECT id FROM banks WHERE id IN (
      SELECT bank_id FROM invoices WHERE org_id = current_setting('app.current_org_id')::uuid
    ))
  );

-- ============================================================
-- JOB QUEUE MIGRATION (Phase 5C)
-- ============================================================

-- STAFF ACTIVITY TABLE (for job queue audit trail)
CREATE TABLE IF NOT EXISTS staff_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source TEXT NOT NULL, -- 'agent' | 'human' | 'voice' | 'system' | 'job_queue'
    staff_short_name TEXT,
    staff_kind TEXT, -- 'agent' | 'human' | 'system'
    capability_code TEXT,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    summary TEXT DEFAULT '',
    payload JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'ok', -- 'ok' | 'error' | 'warn'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_activity_org_id ON staff_activity(org_id);
CREATE INDEX IF NOT EXISTS idx_staff_activity_case_id ON staff_activity(case_id);
CREATE INDEX IF NOT EXISTS idx_staff_activity_capability ON staff_activity(capability_code);
CREATE INDEX IF NOT EXISTS idx_staff_activity_created_at ON staff_activity(created_at DESC);

-- RLS POLICY
ALTER TABLE staff_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_activity_org_isolation ON staff_activity
  FOR ALL USING (
    org_id = current_setting('app.current_org_id')::uuid
    OR org_id IS NULL
  );

-- ============================================================
-- AUDIT TRAIL MIGRATION (Phase 5E)
-- ============================================================

-- AUDIT EVENT TYPE ENUM
DO $$ BEGIN
    CREATE TYPE audit_event_type AS ENUM (
        'CASE_CREATED',
        'CASE_STATUS_CHANGED',
        'CASE_ASSIGNED',
        'CASE_REASSIGNED',
        'DOCUMENT_UPLOADED',
        'DOCUMENT_DOWNLOADED',
        'DOCUMENT_DELETED',
        'DOCUMENT_VERSIONED',
        'DISBURSEMENT_CREATED',
        'DISBURSEMENT_REIMBURSED',
        'DISBURSEMENT_RECONCILED',
        'INVOICE_GENERATED',
        'INVOICE_SENT',
        'INVOICE_PAID',
        'INVOICE_OVERDUE',
        'INVOICE_CANCELLED',
        'TIMESHEET_LOGGED',
        'TIMESHEET_INVOICED',
        'BANK_ADVANCE_ADJUSTED',
        'BANK_ADVANCE_SYNCED',
        'USER_LOGIN',
        'USER_LOGOUT',
        'ROLE_CHANGED',
        'ORG_SETTINGS_CHANGED',
        'BANK_CONFIG_CHANGED',
        'RPA_TASK_STARTED',
        'RPA_TASK_COMPLETED',
        'RPA_TASK_FAILED',
        'AI_REQUEST_MADE',
        'WEBHOOK_RECEIVED',
        'WEBHOOK_PROCESSED',
        'NOTIFICATION_SENT',
        'SLA_WARNING',
        'SLA_BREACHED',
        'ESCALATION_TRIGGERED',
        'ACTION_REQUESTED',
        'ACTION_APPROVED',
        'ACTION_BLOCKED',
        'ACTION_EXECUTED',
        'MATTER_STATE_CHANGED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'ACTION_REQUESTED';
    ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'ACTION_APPROVED';
    ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'ACTION_BLOCKED';
    ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'ACTION_EXECUTED';
    ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'MATTER_STATE_CHANGED';
EXCEPTION WHEN others THEN null;
END $$;

-- ACTION GATEWAY: durable approval records for consequential operations
CREATE TABLE IF NOT EXISTS action_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('L0', 'L1', 'L2', 'L3')),
    requested_by UUID NOT NULL,
    subject_type TEXT,
    subject_id UUID,
    payload JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXECUTED', 'EXPIRED')),
    required_approvals INTEGER NOT NULL DEFAULT 0 CHECK (required_approvals >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS action_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_request_id UUID REFERENCES action_requests(id) ON DELETE CASCADE NOT NULL,
    approver_id UUID NOT NULL,
    approver_role TEXT NOT NULL,
    decision TEXT NOT NULL CHECK (decision IN ('APPROVED', 'REJECTED')),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (action_request_id, approver_id)
);

CREATE INDEX IF NOT EXISTS idx_action_requests_org_id ON action_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_action_requests_status ON action_requests(status);
CREATE INDEX IF NOT EXISTS idx_action_approvals_request ON action_approvals(action_request_id);

ALTER TABLE action_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_approvals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY action_requests_org_isolation ON action_requests
    FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  CREATE POLICY action_approvals_org_isolation ON action_approvals
    FOR ALL USING (EXISTS (
      SELECT 1 FROM action_requests r
      WHERE r.id = action_request_id
        AND r.org_id = current_setting('app.current_org_id', true)::uuid
    ));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- AUDIT TRAIL TABLE
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    event_type audit_event_type NOT NULL,
    event_category TEXT NOT NULL, -- 'case', 'document', 'disbursement', 'invoice', 'timesheet', 'bank', 'user', 'system', 'rpa', 'ai', 'webhook', 'notification', 'sla', 'escalation'
    
    -- Actor
    actor_id UUID, -- profile_id or user_id
    actor_type TEXT, -- 'user', 'system', 'rpa', 'ai', 'webhook'
    actor_name TEXT,
    actor_role TEXT,
    
    -- Subject (what was affected)
    subject_type TEXT, -- 'case', 'document', 'disbursement', 'invoice', 'timesheet', 'bank', 'user'
    subject_id UUID,
    subject_reference TEXT, -- case_number, invoice_number, etc.
    
    -- Change details
    old_values JSONB DEFAULT '{}',
    new_values JSONB DEFAULT '{}',
    changed_fields TEXT[],
    
    -- Context
    correlation_id UUID, -- for linking related events
    causation_id UUID, -- what caused this event
    ip_address INET,
    user_agent TEXT,
    request_id UUID,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_trail_org_id ON audit_trail(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_event_type ON audit_trail(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_trail_subject ON audit_trail(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_actor ON audit_trail(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_correlation ON audit_trail(correlation_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON audit_trail(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trail_severity ON audit_trail(severity);

-- RLS POLICY
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_trail_org_isolation ON audit_trail
  FOR ALL USING (org_id = current_setting('app.current_org_id')::uuid);

-- AUDIT TRAIL HELPER FUNCTION
CREATE OR REPLACE FUNCTION log_audit_event(
    p_org_id UUID,
    p_event_type audit_event_type,
    p_event_category TEXT,
    p_actor_id UUID DEFAULT NULL,
    p_actor_type TEXT DEFAULT 'user',
    p_actor_name TEXT DEFAULT NULL,
    p_actor_role TEXT DEFAULT NULL,
    p_subject_type TEXT DEFAULT NULL,
    p_subject_id UUID DEFAULT NULL,
    p_subject_reference TEXT DEFAULT NULL,
    p_old_values JSONB DEFAULT '{}',
    p_new_values JSONB DEFAULT '{}',
    p_changed_fields TEXT[] DEFAULT '{}',
    p_correlation_id UUID DEFAULT NULL,
    p_causation_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_request_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}',
    p_severity TEXT DEFAULT 'info'
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO audit_trail (
        org_id, event_type, event_category,
        actor_id, actor_type, actor_name, actor_role,
        subject_type, subject_id, subject_reference,
        old_values, new_values, changed_fields,
        correlation_id, causation_id,
        ip_address, user_agent, request_id,
        metadata, severity
    ) VALUES (
        p_org_id, p_event_type, p_event_category,
        p_actor_id, p_actor_type, p_actor_name, p_actor_role,
        p_subject_type, p_subject_id, p_subject_reference,
        p_old_values, p_new_values, p_changed_fields,
        p_correlation_id, p_causation_id,
        p_ip_address, p_user_agent, p_request_id,
        p_metadata, p_severity
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER FUNCTION FOR CASE STATUS CHANGES
CREATE OR REPLACE FUNCTION audit_case_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_old_status TEXT;
    v_new_status TEXT;
    v_actor_id UUID;
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        -- Get actor from request context (set by middleware)
        v_actor_id := current_setting('app.current_user_id', true)::UUID;
        
        PERFORM log_audit_event(
            p_org_id := NEW.org_id,
            p_event_type := 'CASE_STATUS_CHANGED',
            p_event_category := 'case',
            p_actor_id := v_actor_id,
            p_actor_type := 'user',
            p_subject_type := 'case',
            p_subject_id := NEW.id,
            p_subject_reference := NEW.case_number,
            p_old_values := jsonb_build_object('status', OLD.status),
            p_new_values := jsonb_build_object('status', NEW.status),
            p_changed_fields := ARRAY['status'],
            p_severity := 'info'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_audit_case_status ON cases;
CREATE TRIGGER trigger_audit_case_status
    AFTER UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION audit_case_status_change();

-- TRIGGER FUNCTION FOR DOCUMENT CHANGES
CREATE OR REPLACE FUNCTION audit_document_change()
RETURNS TRIGGER AS $$
DECLARE
    v_event_type audit_event_type;
    v_actor_id UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_event_type := 'DOCUMENT_UPLOADED';
    ELSIF TG_OP = 'DELETE' THEN
        v_event_type := 'DOCUMENT_DELETED';
    ELSIF TG_OP = 'UPDATE' THEN
        v_event_type := 'DOCUMENT_VERSIONED';
    END IF;
    
    v_actor_id := current_setting('app.current_user_id', true)::UUID;
    
    PERFORM log_audit_event(
        p_org_id := COALESCE(NEW.org_id, OLD.org_id),
        p_event_type := v_event_type,
        p_event_category := 'document',
        p_actor_id := v_actor_id,
        p_actor_type := 'user',
        p_subject_type := 'document',
        p_subject_id := COALESCE(NEW.id, OLD.id),
        p_subject_reference := COALESCE(NEW.name, OLD.name),
        p_old_values := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE '{}' END,
        p_new_values := CASE WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW) ELSE to_jsonb(NEW) END,
        p_changed_fields := CASE 
            WHEN TG_OP = 'UPDATE' THEN ARRAY(SELECT jsonb_object_keys(to_jsonb(NEW) - to_jsonb(OLD)))
            ELSE ARRAY[]::TEXT[]
        END,
        p_severity := 'info'
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_audit_document ON documents;
CREATE TRIGGER trigger_audit_document
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION audit_document_change();

-- TRIGGER FUNCTION FOR DISBURSEMENT CHANGES
CREATE OR REPLACE FUNCTION audit_disbursement_change()
RETURNS TRIGGER AS $$
DECLARE
    v_event_type audit_event_type;
    v_actor_id UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_event_type := 'DISBURSEMENT_CREATED';
    ELSIF TG_OP = 'UPDATE' AND OLD.is_reimbursed IS DISTINCT FROM NEW.is_reimbursed AND NEW.is_reimbursed THEN
        v_event_type := 'DISBURSEMENT_REIMBURSED';
    ELSIF TG_OP = 'UPDATE' AND OLD.bank_advance_used IS DISTINCT FROM NEW.bank_advance_used THEN
        v_event_type := 'DISBURSEMENT_RECONCILED';
    ELSE
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    v_actor_id := current_setting('app.current_user_id', true)::UUID;
    
    PERFORM log_audit_event(
        p_org_id := (SELECT org_id FROM cases WHERE id = COALESCE(NEW.case_id, OLD.case_id)),
        p_event_type := v_event_type,
        p_event_category := 'disbursement',
        p_actor_id := v_actor_id,
        p_actor_type := 'user',
        p_subject_type := 'disbursement',
        p_subject_id := COALESCE(NEW.id, OLD.id),
        p_subject_reference := (SELECT case_number FROM cases WHERE id = COALESCE(NEW.case_id, OLD.case_id)),
        p_old_values := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE '{}' END,
        p_new_values := to_jsonb(NEW),
        p_changed_fields := CASE 
            WHEN TG_OP = 'UPDATE' THEN ARRAY(SELECT jsonb_object_keys(to_jsonb(NEW) - to_jsonb(OLD)))
            ELSE ARRAY[]::TEXT[]
        END,
        p_severity := 'info'
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_audit_disbursement ON disbursements;
CREATE TRIGGER trigger_audit_disbursement
    AFTER INSERT OR UPDATE OR DELETE ON disbursements
    FOR EACH ROW EXECUTE FUNCTION audit_disbursement_change();

-- TRIGGER FUNCTION FOR INVOICE CHANGES
CREATE OR REPLACE FUNCTION audit_invoice_change()
RETURNS TRIGGER AS $$
DECLARE
    v_event_type audit_event_type;
    v_actor_id UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_event_type := 'INVOICE_GENERATED';
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        CASE NEW.status
            WHEN 'SENT' THEN v_event_type := 'INVOICE_SENT';
            WHEN 'PAID' THEN v_event_type := 'INVOICE_PAID';
            WHEN 'OVERDUE' THEN v_event_type := 'INVOICE_OVERDUE';
            WHEN 'CANCELLED' THEN v_event_type := 'INVOICE_CANCELLED';
            ELSE v_event_type := 'INVOICE_GENERATED'; -- fallback
        END CASE;
    ELSE
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    v_actor_id := current_setting('app.current_user_id', true)::UUID;
    
    PERFORM log_audit_event(
        p_org_id := NEW.org_id,
        p_event_type := v_event_type,
        p_event_category := 'invoice',
        p_actor_id := v_actor_id,
        p_actor_type := 'user',
        p_subject_type := 'invoice',
        p_subject_id := NEW.id,
        p_subject_reference := NEW.invoice_number,
        p_old_values := CASE WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('status', OLD.status) ELSE '{}' END,
        p_new_values := CASE WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('status', NEW.status) ELSE to_jsonb(NEW) END,
        p_changed_fields := CASE 
            WHEN TG_OP = 'UPDATE' THEN ARRAY['status']
            ELSE ARRAY[]::TEXT[]
        END,
        p_severity := CASE WHEN NEW.status IN ('OVERDUE', 'CANCELLED') THEN 'warning' ELSE 'info' END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_audit_invoice ON invoices;
CREATE TRIGGER trigger_audit_invoice
    AFTER INSERT OR UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION audit_invoice_change();

-- TRIGGER FUNCTION FOR TIMESHEET CHANGES
CREATE OR REPLACE FUNCTION audit_timesheet_change()
RETURNS TRIGGER AS $$
DECLARE
    v_event_type audit_event_type;
    v_actor_id UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_event_type := 'TIMESHEET_LOGGED';
    ELSIF TG_OP = 'UPDATE' AND OLD.invoiced IS DISTINCT FROM NEW.invoiced AND NEW.invoiced THEN
        v_event_type := 'TIMESHEET_INVOICED';
    ELSE
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    v_actor_id := current_setting('app.current_user_id', true)::UUID;
    
    PERFORM log_audit_event(
        p_org_id := NEW.org_id,
        p_event_type := v_event_type,
        p_event_category := 'timesheet',
        p_actor_id := v_actor_id,
        p_actor_type := 'user',
        p_subject_type := 'timesheet',
        p_subject_id := NEW.id,
        p_subject_reference := NEW.task_description,
        p_old_values := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE '{}' END,
        p_new_values := to_jsonb(NEW),
        p_changed_fields := CASE 
            WHEN TG_OP = 'UPDATE' THEN ARRAY(SELECT jsonb_object_keys(to_jsonb(NEW) - to_jsonb(OLD)))
            ELSE ARRAY[]::TEXT[]
        END,
        p_severity := 'info'
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_audit_timesheet ON timesheets;
CREATE TRIGGER trigger_audit_timesheet
    AFTER INSERT OR UPDATE ON timesheets
    FOR EACH ROW EXECUTE FUNCTION audit_timesheet_change();

-- ============================================================
-- BANK PORTAL CONFIG MIGRATION (Phase 5G)
-- ============================================================

-- BANK PORTAL CONFIGS TABLE
CREATE TABLE IF NOT EXISTS bank_portal_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_id UUID REFERENCES banks(id) ON DELETE CASCADE NOT NULL UNIQUE,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    
    -- Branding
    logo_url TEXT,
    primary_color TEXT DEFAULT '#1e40af',
    secondary_color TEXT DEFAULT '#3b82f6',
    favicon_url TEXT,
    custom_domain TEXT,
    
    -- Portal settings
    portal_name TEXT NOT NULL DEFAULT 'Bank Portal',
    welcome_message TEXT,
    support_email TEXT,
    support_phone TEXT,
    
    -- Feature flags
    features JSONB DEFAULT '{"caseTracking": true, "documentDownload": true, "invoiceView": true, "paymentStatus": true, "slaDashboard": true, "notifications": true, "apiAccess": false}',
    
    -- Workflow overrides
    workflow_overrides JSONB DEFAULT '{}',
    
    -- SSO settings
    sso JSONB DEFAULT '{"enabled": false, "provider": null, "entityId": null, "ssoUrl": null, "certificate": null, "attributeMapping": {}}',
    
    -- Custom CSS/JS
    custom_css TEXT,
    custom_js TEXT,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BANK WORKFLOW VARIANTS TABLE
CREATE TABLE IF NOT EXISTS bank_workflow_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_id UUID REFERENCES banks(id) ON DELETE CASCADE NOT NULL,
    case_type case_type NOT NULL,
    stages TEXT[] NOT NULL DEFAULT '{}',
    transitions JSONB NOT NULL DEFAULT '{}',
    required_documents TEXT[] NOT NULL DEFAULT '{}',
    sla_warning_hours INTEGER NOT NULL DEFAULT 24,
    sla_breach_hours INTEGER NOT NULL DEFAULT 0,
    auto_assignment_rules JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(bank_id, case_type)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_bank_portal_configs_bank_id ON bank_portal_configs(bank_id);
CREATE INDEX IF NOT EXISTS idx_bank_portal_configs_org_id ON bank_portal_configs(org_id);
CREATE INDEX IF NOT EXISTS idx_bank_workflow_variants_bank_id ON bank_workflow_variants(bank_id);
CREATE INDEX IF NOT EXISTS idx_bank_workflow_variants_case_type ON bank_workflow_variants(case_type);

-- TRIGGER for updated_at on bank_portal_configs
DROP TRIGGER IF EXISTS update_bank_portal_configs_updated_at ON bank_portal_configs;
CREATE TRIGGER update_bank_portal_configs_updated_at BEFORE UPDATE ON bank_portal_configs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- TRIGGER for updated_at on bank_workflow_variants
DROP TRIGGER IF EXISTS update_bank_workflow_variants_updated_at ON bank_workflow_variants;
CREATE TRIGGER update_bank_workflow_variants_updated_at BEFORE UPDATE ON bank_workflow_variants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS POLICIES
ALTER TABLE bank_portal_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_workflow_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY bank_portal_configs_org_isolation ON bank_portal_configs
  FOR ALL USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY bank_workflow_variants_org_isolation ON bank_workflow_variants
  FOR ALL USING (
    bank_id IN (SELECT id FROM banks WHERE id IN (
      SELECT bank_id FROM cases WHERE org_id = current_setting('app.current_org_id')::uuid
    ))
  );

-- VIEW for bank portal with workflow variants
CREATE OR REPLACE VIEW bank_portal_with_workflows AS
SELECT 
  bpc.*,
  b.name as bank_name,
  b.short_code as bank_short_code,
  jsonb_agg(
    jsonb_build_object(
      'caseType', bvw.case_type,
      'stages', bvw.stages,
      'transitions', bvw.transitions,
      'requiredDocuments', bvw.required_documents,
      'slaWarningHours', bvw.sla_warning_hours,
      'slaBreachHours', bvw.sla_breach_hours,
      'autoAssignmentRules', bvw.auto_assignment_rules
    ) ORDER BY bvw.case_type
  ) as workflow_variants
FROM bank_portal_configs bpc
JOIN banks b ON b.id = bpc.bank_id
LEFT JOIN bank_workflow_variants bvw ON bvw.bank_id = bpc.bank_id
GROUP BY bpc.id, b.name, b.short_code;
