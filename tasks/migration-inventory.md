# Migration Inventory — Luxor9 Legal OS

**Catalog Date:** 2025-08-07  
**Target Canonical Authority:** `ag-platform/packages/db/migrations/` (to be created)  
**Total Sources Inspected:** 5 locations, 27 migration files

---

## 1. Source Inventory

### 1.1 Root `supabase/migrations/` (1 file)
| File | Description |
|------|-------------|
| `20260525000000_add_noi_status.sql` | Adds `noi_status` column to `cases` table + `noi_status_enum` type |

### 1.2 `ag-platform/supabase/migrations/` (23 files)
| # | File | Primary Purpose |
|---|------|-----------------|
| 1 | `20260423_ai_setup.sql` | pgvector extension, `project_embeddings`, `projects`, `organizations` AI columns |
| 2 | `20260423_ai_tokens.sql` | `increment_org_tokens()` function |
| 3 | `20260423_collaboration_setup.sql` | `tasks`, `comments`, `notifications`, `activities` + Realtime publication |
| 4 | `20260423_document_storage_setup.sql` | Storage buckets, `files` table, storage quota, Storage RLS |
| 5 | `20260514000000_init_schema.sql` | Core schema: `organizations`, `cases`, enums (`bank_partner`, `case_status`), indexes, RLS |
| 6 | `20260514000000_core_schema.sql` | **DUPLICATE TIMESTAMP** — Core schema with different enums, `get_app_org_id()`, RLS |
| 7 | `20260514000001_auth_hooks.sql` | `custom_access_token_hook` (stub with hardcoded org_id) |
| 8 | `20260514000002_rbac_setup.sql` | `user_roles` table, roles enum, signup trigger |
| 9 | `20260514000003_voice_system_setup.sql` | `voice_command_logs`, `voice_system_config`, `voice_tools` |
| 10 | `20260514000004_workforce_management.sql` | `workforce`, `workforce_tasks`, `brainstorm_messages` + **PERMISSIVE RLS (USING true)** |
| 11 | `20260515000000_voice_command_logs.sql` | **DUPLICATE TABLE** `voice_command_logs` with different schema |
| 12 | `20260515000001_voice_tool_config.sql` | `voice_tool_config` table |
| 13 | `20260515000002_workforce.sql` | **DUPLICATE DOMAIN** `staff`, `capability`, `staff_capability`, `staff_activity` |
| 14 | `20260515000003_workforce_phase4.sql` | Rate limits, anomaly view, indexes on workforce tables |
| 15 | `20260518000000_field_app.sql` | Field app: `executive` role, `documents`, `case_audit_logs`, `field_activity_logs`, `device_push_tokens` |
| 16 | `20260519000000_push_trigger.sql` | `notify_case_assigned()` trigger + pg_net HTTP push |
| 17 | `20260520000000_fix_auth_token_hook.sql` | Fixes auth hook, adds `user_roles.org_id`, admin policy |
| 18 | `20260527000000_noi_pipeline.sql` | **PARALLEL DOMAIN** `noi_cases`, `noi_tasks`, `challans` (separate from `cases`) |
| 19 | `20260801000000_rls_policies.sql` | RLS policies for `organizations`, `banks`, `profiles`, `cases`, `disbursements`, `case_timeline`, `timesheets`, `documents`, `files`, `project_embeddings` using `current_setting('app.current_org_id')` |
| 20 | `20260802000000_billing_engine.sql` | `invoices`, `invoice_line_items`, `bank_advance_reconciliation`, extends `timesheets`/`disbursements` |
| 21 | `20260807000000_bank_partner_panel_codes.sql` | Extends `bank_partner` enum with panel codes |

### 1.3 `ag-platform/src/server/migrations.sql` (Boot-time, 1 file, 826 lines)
**Single monolithic file** that runs on every server boot. Contains:
- All enums: `user_role`, `case_type`, `case_status`, `disbursement_type`, `invoice_status`, `audit_event_type`
- Tables: `banks`, `organizations`, `profiles`, `cases`, `disbursements`, `case_timeline`, `timesheets`, `documents`, `files`
- **Billing Engine** (Phase 5B): `invoices`, `invoice_line_items`, `bank_advance_reconciliation`
- **Job Queue** (Phase 5C): `staff_activity` (different schema from workforce)
- **Audit Trail** (Phase 5E): `audit_trail` + `log_audit_event()` + triggers on cases/documents/disbursements/invoices/timesheets
- **Bank Portal Config** (Phase 5G): `bank_portal_configs`, `bank_workflow_variants`
- RLS using `current_setting('app.current_org_id')`
- Seed data for org + banks

### 1.4 `ag-associates-ai/database/init.sql` (1 file)
- pgvector extension
- `legal_templates` table with `embedding vector(384)` (all-MiniLM-L6-v2)
- IVFFlat index on embeddings
- 3 seed templates (English, Marathi, Hindi rent agreements)

### 1.5 `ag-associates-ai/backend/database/agent_migrations.sql` (1 file)
- Per-agent conversation tables: `agent_{auditor,vyasa,bouncer,accountant,noi,executor,drafter}_conversations`
- Per-agent messages: `agent_{...}_messages`
- Per-agent context: `agent_{...}_context`
- `agent_bus_log` (inter-agent communication audit)
- `user_telegram_map` (Telegram chat_id mapping)
- `agent_access_grants` (RBAC overrides)

---

## 2. Table Catalog by Source

### 2.1 Core Multi-Tenant Tables

| Table | Root | ag-platform/supabase | ag-platform/server | ag-associates-ai | Notes |
|-------|------|---------------------|-------------------|------------------|-------|
| `organizations` | | ✅ (2 variants) | ✅ | | **CONFLICT**: init_schema vs core_schema differ |
| `cases` | ✅ (col added) | ✅ (2 variants) | ✅ | | **CONFLICT**: different columns, enums, RLS |
| `banks` | | | ✅ | | Only in boot-time |
| `profiles` / `user_roles` | | ✅ `user_roles` | ✅ `profiles` | | Different schemas |

### 2.2 Document / File Tables

| Table | ag-platform/supabase | ag-platform/server | Notes |
|-------|---------------------|-------------------|-------|
| `documents` | ✅ (field_app) | ✅ | **CONFLICT**: different columns, RLS approaches |
| `files` | ✅ (doc_storage) | ✅ | **CONFLICT**: different schemas |
| `project_embeddings` | ✅ (ai_setup) | ✅ | **CONFLICT**: vector(768) vs vector(384) |

### 2.3 Workforce / Staff Tables (Multiple Parallel Systems)

| Table | 20260514000004 | 20260515000002 | 20260801000000_rls | Boot-time | Notes |
|-------|----------------|----------------|-------------------|-----------|-------|
| `workforce` | ✅ | | | | |
| `workforce_tasks` | ✅ | | | | |
| `brainstorm_messages` | ✅ | | | | |
| `staff` | | ✅ | | | |
| `capability` | | ✅ | | | |
| `staff_capability` | | ✅ | | | |
| `staff_activity` | | ✅ | | ✅ (different) | **3 VERSIONS** |
| `voice_command_logs` | ✅ | ✅ | | | **2 VERSIONS** |
| `voice_system_config` | ✅ | | | | |
| `voice_tools` | ✅ | | | | |
| `voice_tool_config` | | ✅ | | | |

### 2.4 NOI Pipeline Tables (Parallel to cases)

| Table | 20260527000000_noi_pipeline | Root (adds column) | Notes |
|-------|----------------------------|-------------------|-------|
| `noi_cases` | ✅ | | Separate from `cases` |
| `noi_tasks` | ✅ | | |
| `challans` | ✅ | | |
| `cases.noi_status` | | ✅ | Added to main cases |

### 2.5 Billing / Audit / Portal (Boot-time only)

| Table | Boot-time only |
|-------|----------------|
| `invoices` | ✅ |
| `invoice_line_items` | ✅ |
| `bank_advance_reconciliation` | ✅ |
| `audit_trail` | ✅ |
| `bank_portal_configs` | ✅ |
| `bank_workflow_variants` | ✅ |

### 2.6 AI / Agent Tables (ag-associates-ai only)

| Table | init.sql | agent_migrations.sql |
|-------|----------|---------------------|
| `legal_templates` | ✅ (vector 384) | |
| `agent_*_conversations` (7x) | | ✅ |
| `agent_*_messages` (7x) | | ✅ |
| `agent_*_context` (7x) | | ✅ |
| `agent_bus_log` | | ✅ |
| `user_telegram_map` | | ✅ |
| `agent_access_grants` | | ✅ |

### 2.7 Collaboration / Realtime (ag-platform/supabase only)

| Table | Source |
|-------|--------|
| `tasks` | 20260423_collaboration_setup |
| `comments` | 20260423_collaboration_setup |
| `notifications` | 20260423_collaboration_setup |
| `activities` | 20260423_collaboration_setup |

### 2.8 Field App Tables (ag-platform/supabase only)

| Table | Source |
|-------|--------|
| `case_audit_logs` | 20260518000000_field_app |
| `field_activity_logs` | 20260518000000_field_app |
| `device_push_tokens` | 20260518000000_field_app |

---

## 3. Conflict Analysis

### 3.1 Critical Conflicts (Block Canonicalization)

| Conflict | Sources | Impact |
|----------|---------|--------|
| **Duplicate `organizations` table** | `init_schema.sql` vs `core_schema.sql` | Different PK default (`gen_random_uuid()` vs `uuid_generate_v4()`), different columns |
| **Duplicate `cases` table** | `init_schema.sql` vs `core_schema.sql` vs boot-time | Different columns, different enums (`bank_partner` values differ), different RLS |
| **Duplicate `bank_partner` enum** | `init_schema.sql`: 6 values (UPPER_SNAKE) vs `core_schema.sql`: 5 values (Title Case) | **INSERT failures** — 20260807 tries to ADD VALUES to whichever exists |
| **Duplicate `case_status` enum** | `init_schema.sql`: 7 values vs `core_schema.sql`: 5 values vs boot-time: 12 values | RLS policies reference different values |
| **Duplicate `voice_command_logs`** | `20260514000003` vs `20260515000000` | Different columns, different enums, different RLS |
| **Three `staff_activity` variants** | workforce_management, workforce.sql, boot-time | Different columns, different RLS |
| **Parallel NOI domain** | `noi_pipeline.sql` creates `noi_cases` separate from `cases` | Data fragmentation, dual state machines |
| **Two `user_roles` / `profiles` systems** | `rbac_setup.sql` (`user_roles` + auth.users) vs boot-time (`profiles`) | Different role enums, different RLS |

### 3.2 Security Issues

| Issue | Location | Severity |
|-------|----------|----------|
| **Permissive RLS: `USING (true)`** | `20260514000004_workforce_management.sql` lines 93-95: `workforce`, `workforce_tasks`, `brainstorm_messages` | **CRITICAL** — No tenant isolation |
| **Permissive RLS: `USING (true)`** | `20260423_collaboration_setup.sql` lines 69-73: `tasks`, `comments`, `activities` | **CRITICAL** — No tenant isolation |
| **Auth hook stub** | `20260514000001_auth_hooks.sql` line 26: hardcoded `'0000...'` UUID | **HIGH** — All users get same fake org_id |
| **RLS uses different mechanisms** | `get_app_org_id()` (JWT) vs `current_setting('app.current_org_id')` (GUC) | **HIGH** — Incompatible, policies won't compose |
| **Missing `org_id` on tenant tables** | `voice_system_config`, `voice_tools`, `capability` | **MEDIUM** — Global tables leak across orgs |

### 3.3 Migration Ordering Issues

| Issue | Details |
|-------|---------|
| **Duplicate timestamp prefix** | `20260514000000_init_schema.sql` AND `20260514000000_core_schema.sql` — Supabase applies in lexical order; non-deterministic which runs first |
| **Boot-time runs AFTER supabase migrations** | `server.ts` executes `migrations.sql` on every boot; supabase migrations may not have run |
| **RLS policies reference tables not yet created** | `20260801000000_rls_policies.sql` references `banks`, `profiles`, `disbursements`, `case_timeline`, `timesheets`, `project_embeddings` — these only exist in boot-time file |
| **Enum values added in later migration** | `20260807000000_bank_partner_panel_codes.sql` adds values to `bank_partner` but cannot run in same transaction as CREATE TYPE |

### 3.4 Missing `org_id` on Tenant Tables

| Table | Source | Missing |
|-------|--------|---------|
| `voice_system_config` | 20260514000003 | ✅ |
| `voice_tools` | 20260514000003 | ✅ |
| `voice_tool_config` | 20260515000001 | ✅ |
| `capability` | 20260515000002 | ✅ |
| `staff` | 20260515000002 | Has `org_id` ✓ |
| `workforce` | 20260514000004 | Has `org_id` ✓ |

---

## 4. RLS Policy Comparison

| Table | init_schema | core_schema | 20260801_rls_policies | Boot-time | Field App |
|-------|-------------|-------------|----------------------|-----------|-----------|
| `organizations` | ENABLE | | `current_setting` | | |
| `cases` | `user_roles` JOIN | `get_app_org_id()` | `current_setting` | `current_setting` | `get_app_org_id()` + `executive_id` |
| `user_roles` / `profiles` | | `auth.uid() = user_id` | `current_setting` | `current_setting` | |
| `documents` | | | `current_setting` | `current_setting` | `get_app_org_id()` |
| `workforce*` | | | | | `USING (true)` ❌ |
| `collaboration*` | | | | | `USING (true)` ❌ |
| `noi_cases` | | | | | `get_app_org_id()` |

**Three incompatible RLS patterns in use:**
1. `auth.uid() IN (SELECT user_id FROM user_roles WHERE org_id = cases.org_id)` — JWT + user_roles join
2. `org_id = public.get_app_org_id()` — JWT claim extraction
3. `org_id = current_setting('app.current_org_id')::uuid` — GUC set by middleware

---

## 5. Index & Constraint Coverage

| Table | PK | FK org_id | FK case_id | Unique Constraints | Key Indexes |
|-------|----|-----------|------------|-------------------|-------------|
| `organizations` | ✅ | — | — | — | — |
| `cases` (init) | ✅ | ✅ | — | — | org_id, bank_name, status, (org_id,status) |
| `cases` (core) | ✅ | ✅ | — | — | org_id |
| `cases` (boot) | ✅ | ✅ | — | case_number | — |
| `documents` (field) | ✅ | ✅ | ✅ | client_event_id | case_id, org_id |
| `documents` (boot) | ✅ | ✅ | ✅ | — | case_id, org_id |
| `noi_cases` | ✅ | ✅ | — | — | (org_id,status), assigned_staff |
| `staff` | ✅ | ✅ | — | (kind, short_name) | state, kind |
| `staff_activity` (workforce) | ✅ | — | — | — | (staff_id,time), case_id, source |
| `staff_activity` (boot) | ✅ | ✅ | ✅ | — | org_id, case_id, capability, created_at |
| `invoices` | ✅ | ✅ | — | invoice_number | org_id, bank_id, status, due_at |
| `audit_trail` | ✅ | ✅ | — | — | org_id, event_type, subject, actor, correlation, created_at, severity |

---

## 6. Recommended Canonical Authority

### Target: `ag-platform/packages/db/migrations/`

**Strategy:** Consolidate into a **single linear migration history** with:
1. **Phase 0** — Extensions, enums, core tables (`organizations`, `banks`, `profiles`)
2. **Phase 1** — `cases` + `documents` + `case_timeline` (unified case model)
3. **Phase 2** — RLS policies (single mechanism: `current_setting('app.current_org_id')`)
4. **Phase 3** — Workforce (unified `staff` + `staff_activity` + capabilities)
5. **Phase 4** — NOI pipeline (as case_type + tasks, not separate tables)
6. **Phase 5** — Billing, Audit, Bank Portal (from boot-time)
7. **Phase 6** — AI/Vector (pgvector 768 for Gemini, separate schema)
8. **Phase 7** — Agent system (separate database or schema)

### Migration Files to Supersede/Delete

| Superseded | Replaced By |
|------------|-------------|
| `20260514000000_init_schema.sql` | Phase 0+1 consolidated |
| `20260514000000_core_schema.sql` | Phase 0+1 consolidated |
| `20260514000001_auth_hooks.sql` | Phase 2 (fixed hook) |
| `20260514000002_rbac_setup.sql` | Phase 0 (profiles) |
| `20260514000003_voice_system_setup.sql` | Phase 3 (voice tools in capability) |
| `20260514000004_workforce_management.sql` | Phase 3 (staff) |
| `20260515000000_voice_command_logs.sql` | Phase 3 (staff_activity) |
| `20260515000001_voice_tool_config.sql` | Phase 3 (capability) |
| `20260515000002_workforce.sql` | Phase 3 (staff) |
| `20260515000003_workforce_phase4.sql` | Phase 3 (rate limits on capability) |
| `20260518000000_field_app.sql` | Phase 1 (documents, case_audit_logs, field_activity_logs) |
| `20260519000000_push_trigger.sql` | Phase 1 (trigger on cases) |
| `20260520000000_fix_auth_token_hook.sql` | Phase 2 |
| `20260527000000_noi_pipeline.sql` | Phase 4 (NOI as case_type) |
| `20260801000000_rls_policies.sql` | Phase 2 |
| `20260802000000_billing_engine.sql` | Phase 5 |
| `20260807000000_bank_partner_panel_codes.sql` | Phase 0 (enum values) |
| `20260423_ai_setup.sql` | Phase 6 (separate schema) |
| `20260423_ai_tokens.sql` | Phase 6 |
| `20260423_collaboration_setup.sql` | Phase 3 (tasks in staff_activity) or separate app |
| `20260423_document_storage_setup.sql` | Phase 1 (files/documents) |
| Root `20260525000000_add_noi_status.sql` | Phase 4 (noi_status as case status) |
| Boot-time `migrations.sql` | **Split into Phases 0-7 above** |

### ag-associates-ai Migrations (Separate Database)

These belong to a **separate PostgreSQL instance** (self-hosted, not Supabase):
- `database/init.sql` → `ag-associates-ai/packages/db/migrations/`
- `backend/database/agent_migrations.sql` → `ag-associates-ai/packages/db/migrations/`

---

## 7. Action Plan

| Step | Action | Owner |
|------|--------|-------|
| 1 | Create `ag-platform/packages/db/` directory structure | db-engineer |
| 2 | Write Phase 0 migration: extensions, enums, organizations, banks, profiles | db-engineer |
| 3 | Write Phase 1 migration: cases, documents, case_timeline, disbursements, timesheets | db-engineer |
| 4 | Write Phase 2 migration: RLS policies (single mechanism), fixed auth hook | db-engineer |
| 5 | Write Phase 3 migration: staff, capability, staff_capability, staff_activity (unified) | db-engineer |
| 6 | Write Phase 4 migration: NOI as case_type + tasks (merge noi_cases into cases) | db-engineer |
| 7 | Write Phase 5 migration: invoices, invoice_line_items, bank_advance_reconciliation, audit_trail | db-engineer |
| 8 | Write Phase 6 migration: project_embeddings (vector 768), legal_templates (vector 384) | db-engineer |
| 9 | Write Phase 7 migration: agent_* tables (separate schema or DB) | db-engineer |
| 10 | Update `ag-platform/src/server/migrations.sql` to **no-op** (verify canonical applied) | workflow-engineer |
| 11 | Update CI to run canonical migrations via Supabase CLI | release-engineer |
| 12 | Document rollback procedure for each phase | db-engineer |

---

## 8. Summary

| Metric | Count |
|--------|-------|
| Total migration files inspected | 27 |
| Duplicate table definitions | 8+ |
| Duplicate enum definitions | 3 |
| Permissive RLS (`USING true`) | 6 tables |
| Missing `org_id` on tenant tables | 4 |
| Incompatible RLS mechanisms | 3 |
| Parallel case domains (`cases` vs `noi_cases`) | 2 |
| Boot-time monolith lines | 826 |

**Verdict:** The current state is **not production-safe**. Multiple conflicting schemas, permissive RLS on workforce/collaboration tables, and three incompatible isolation mechanisms mean data leakage is guaranteed under load. The boot-time migration running on every server start is an anti-pattern that will cause drift.

**Immediate next step:** Create `ag-platform/packages/db/migrations/` and begin Phase 0 consolidation.