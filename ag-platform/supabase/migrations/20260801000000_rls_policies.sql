-- RLS Policies for Multi-Tenant Isolation
-- Run this after the base migrations.sql

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE disbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_embeddings ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see their own org
CREATE POLICY org_isolation ON organizations
  FOR ALL USING (id = current_setting('app.current_org_id')::uuid);

-- Banks: All authenticated users can read (reference data)
CREATE POLICY banks_read ON banks
  FOR SELECT USING (true);

-- Profiles: Users can see profiles in their org, admins can see all
CREATE POLICY profiles_org_isolation ON profiles
  FOR ALL USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY profiles_admin_all ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'PRINCIPAL'
    )
  );

-- Cases: Org isolation
CREATE POLICY cases_org_isolation ON cases
  FOR ALL USING (org_id = current_setting('app.current_org_id')::uuid);

-- Disbursements: Org isolation via cases
CREATE POLICY disbursements_org_isolation ON disbursements
  FOR ALL USING (
    case_id IN (SELECT id FROM cases WHERE org_id = current_setting('app.current_org_id')::uuid)
  );

-- Case Timeline: Org isolation via cases
CREATE POLICY case_timeline_org_isolation ON case_timeline
  FOR ALL USING (
    case_id IN (SELECT id FROM cases WHERE org_id = current_setting('app.current_org_id')::uuid)
  );

-- Timesheets: Org isolation
CREATE POLICY timesheets_org_isolation ON timesheets
  FOR ALL USING (org_id = current_setting('app.current_org_id')::uuid);

-- Documents: Org isolation
CREATE POLICY documents_org_isolation ON documents
  FOR ALL USING (org_id = current_setting('app.current_org_id')::uuid);

-- Files: Org isolation
CREATE POLICY files_org_isolation ON files
  FOR ALL USING (organization_id = current_setting('app.current_org_id')::uuid);

-- Project Embeddings: Org isolation
CREATE POLICY project_embeddings_org_isolation ON project_embeddings
  FOR ALL USING (
    project_id IN (
      SELECT id FROM cases WHERE org_id = current_setting('app.current_org_id')::uuid
    )
  );

-- Bank Viewer role: Can only read cases for their assigned bank
CREATE POLICY bank_viewer_cases ON cases
  FOR SELECT USING (
    bank_id = (
      SELECT bank_id FROM profiles WHERE user_id = auth.uid() AND role = 'BANK_VIEWER'
    )
  );

CREATE POLICY bank_viewer_disbursements ON disbursements
  FOR SELECT USING (
    case_id IN (
      SELECT id FROM cases WHERE bank_id = (
        SELECT bank_id FROM profiles WHERE user_id = auth.uid() AND role = 'BANK_VIEWER'
      )
    )
  );

-- Function to set current org_id for RLS
CREATE OR REPLACE FUNCTION set_current_org_id(org_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_org_id', org_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION set_current_org_id(uuid) TO authenticated;