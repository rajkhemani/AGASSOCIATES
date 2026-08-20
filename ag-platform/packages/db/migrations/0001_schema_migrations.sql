-- 0001_schema_migrations.sql
-- Create schema_migrations table for tracking applied migrations
-- This is the FIRST migration to be run, establishing the migration tracking system

CREATE TABLE IF NOT EXISTS public.schema_migrations (
    id BIGSERIAL PRIMARY KEY,
    filename TEXT UNIQUE NOT NULL,
    checksum TEXT NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_schema_migrations_filename ON public.schema_migrations(filename);

-- Grant to ag_app (runtime role)
GRANT SELECT, INSERT ON public.schema_migrations TO ag_app;
GRANT USAGE, SELECT ON SEQUENCE public.schema_migrations_id_seq TO ag_app;

-- RLS: Only ag_owner can see all migrations, ag_app only sees for current org if needed
-- Since this is a system table, we don't enforce org_id RLS on it
ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY schema_migrations_owner_all ON public.schema_migrations
  FOR ALL USING (
    current_user = 'ag_owner'
  );

CREATE POLICY schema_migrations_app_select ON public.schema_migrations
  FOR SELECT USING (
    current_user = 'ag_app'
  );

CREATE POLICY schema_migrations_app_insert ON public.schema_migrations
  FOR INSERT WITH CHECK (
    current_user = 'ag_app'
  );

-- Migration complete: schema_migrations table created