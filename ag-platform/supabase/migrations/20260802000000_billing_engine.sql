-- Invoices and Billing Engine Schema
-- Run after base migrations.sql

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