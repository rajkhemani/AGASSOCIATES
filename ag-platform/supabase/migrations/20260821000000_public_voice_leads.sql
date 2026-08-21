-- Consent-based public voice lead intake.
-- No transcript or audio is persisted; only structured contact data.

CREATE TABLE IF NOT EXISTS public.public_voice_leads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 160),
    organization    TEXT CHECK (organization IS NULL OR length(organization) <= 160),
    phone           TEXT CHECK (phone IS NULL OR length(phone) <= 32),
    email           TEXT CHECK (email IS NULL OR length(email) <= 320),
    preferred_time  TEXT CHECK (preferred_time IS NULL OR length(preferred_time) <= 120),
    intent          TEXT NOT NULL CHECK (intent IN ('lead_capture', 'callback_request')),
    status          TEXT NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new', 'contacted', 'closed', 'spam')),
    consented_at   TIMESTAMPTZ NOT NULL,
    source         TEXT NOT NULL DEFAULT 'public_voice',
    session_id     TEXT NOT NULL,
    dedup_key      TEXT NOT NULL UNIQUE,
    last_seen_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT public_voice_leads_contact_check CHECK (phone IS NOT NULL OR email IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_public_voice_leads_org_status
    ON public.public_voice_leads(org_id, status, created_at DESC);

ALTER TABLE public.public_voice_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public voice leads are isolated by organization"
    ON public.public_voice_leads;
CREATE POLICY "Public voice leads are isolated by organization"
    ON public.public_voice_leads FOR SELECT
    USING (org_id = public.get_app_org_id());

DROP POLICY IF EXISTS "Public voice leads are writable by service role"
    ON public.public_voice_leads;
CREATE POLICY "Public voice leads are writable by service role"
    ON public.public_voice_leads FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
