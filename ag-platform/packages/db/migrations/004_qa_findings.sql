-- Deterministic, auditable QA findings attached to matters.
CREATE TABLE IF NOT EXISTS public.qa_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES public.organizations(id) NOT NULL,
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
    finding_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
    source TEXT NOT NULL DEFAULT 'rule',
    evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.profiles(id),
    resolved_by UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qa_findings_case_id ON public.qa_findings(case_id);
CREATE INDEX IF NOT EXISTS idx_qa_findings_org_status ON public.qa_findings(org_id, status);

ALTER TABLE public.qa_findings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS qa_findings_org_isolation ON public.qa_findings;
CREATE POLICY qa_findings_org_isolation ON public.qa_findings
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

DROP TRIGGER IF EXISTS update_qa_findings_updated_at ON public.qa_findings;
CREATE TRIGGER update_qa_findings_updated_at
  BEFORE UPDATE ON public.qa_findings
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
