# AGASSOCIATES Repository Architecture Findings Report

**Generated:** 2026-08-20  
**Scope:** Complete read-only architectural inventory of the AGASSOCIATES repository  
**Subsystems Inspected:** `apps/web`, `ag-associates-ai`, `ag-platform`, root-level infrastructure

---

## 1. ARCHITECTURE MAP — Three Subsystems & Their Relationships

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         AGASSOCIATES MONOREPO                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────────────┐  │
│  │   apps/web       │    │ ag-associates-ai │    │      ag-platform         │  │
│  │   (Marketing)    │    │   (AI Pipeline)  │    │   (LegalOps Platform)    │  │
│  ├──────────────────┤    ├──────────────────┤    ├──────────────────────────┤  │
│  │ Next.js 15       │    │ FastAPI +        │    │ Turborepo: Vite +        │  │
│  │ Static Export    │    │ LangGraph +      │    │ Express +                │  │
│  │ → GitHub Pages   │    │ vLLM (Qwen2.5)   │    │ Supabase +               │  │
│  │ advadiityagade.com│   │ Next.js 15 Dash  │    │ Google Gemini            │  │
│  └────────┬─────────┘    └────────┬─────────┘    └───────────┬─────────────┘  │
│           │                       │                        │                 │
│           │         ┌─────────────┴─────────────┐          │                 │
│           │         │   SHARED INFRASTRUCTURE   │          │                 │
│           │         │  (No code coupling)       │          │                 │
│           │         ├───────────────────────────┤          │                 │
│           │         │ • Supabase PostgreSQL     │◄─────────┘                 │
│           │         │   (RLS multi-tenant)      │                            │
│           │         │ • Redis (agent bus, OTP,  │◄───────────────────────────│
│           │         │   job queue, cache)       │                            │
│           │         │ • pgvector (embeddings)   │◄───────────────────────────│
│           │         │ • Caddy (reverse proxy,   │◄───────────────────────────│
│           │         │   auto-TLS, WAF)          │                            │
│           │         │ • Docker Compose (prod)   │                            │
│           │         │ • Coolify (GitOps PaaS)   │                            │
│           │         └───────────────────────────┘                            │
│           │                                                                    │
│           ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    MICROSERVICES (ag-platform/services/)                 │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐   │
│  │  │ intake-api   │  │ coordinator  │  │ email-intake │  │ telegram-  │   │
│  │  │ (Fastify)    │  │ (Telegraf)   │  │ (IMAP poll)  │  │ bot        │   │
│  │  │ Port 3002    │  │ Port 3005    │  │ Port 3004    │  │ (pgram)    │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Key Relationship Observations

| Aspect | Finding |
|--------|---------|
| **Code Coupling** | **Zero** — The three subsystems share no TypeScript/Python imports. They communicate only via HTTP APIs and shared PostgreSQL/Redis. |
| **Database** | Two separate Postgres connections: `ag-associates-ai` uses local pgvector Docker; `ag-platform` uses Supabase (hosted) + local pgvector via `packages/db`. |
| **Auth** | `ag-associates-ai` uses custom JWT (`SUPABASE_JWT_SECRET`); `ag-platform` uses Supabase Auth (SSR cookies). **No SSO between them.** |
| **API Contract** | `ag-platform` calls `ag-associates-ai` via `AI_BACKEND_URL` (e.g., `/api/generate-agreement`). One-way: platform → AI. |
| **Case Stores** | **Two disconnected case databases:** Telegram bot → local Postgres `noi_cases`; email intake + intake-api → Supabase `cases`. No reconciliation. |

---

## 2. PACKAGES/SERVICES — Boundaries & Dependencies

### Root Workspace (Turborepo)
```
AGASSOCIATES/
├── apps/web/                    # Next.js 15 marketing site (GitHub Pages)
├── ag-associates-ai/            # AI Document Pipeline (Python + Next.js)
│   ├── backend/                 # FastAPI + LangGraph + 7 conversational agents
│   ├── frontend/                # Next.js 15 dashboard (separate from apps/web)
│   ├── database/                # pgvector init.sql + agent_migrations.sql
│   └── docker-compose.yml       # PostgreSQL + n8n (dev)
├── ag-platform/                 # LegalOps Platform (Turborepo)
│   ├── src/                     # Vite + React + Express (monolith)
│   │   ├── components/          # UI (admin, AI, bank, collaboration, etc.)
│   │   ├── server/              # Express routes, services, migrations.sql
│   │   ├── hooks/               # React hooks (realtime, notifications)
│   │   ├── lib/                 # Utilities (billing, storage, supabase)
│   │   └── types/               # Domain types
│   ├── packages/                # Shared Turborepo packages
│   │   ├── db/                  # Drizzle ORM + pgvector migrations
│   │   ├── types/               # Shared TypeScript interfaces
│   │   └── ui/                  # shadcn/ui components
│   ├── services/                # Independent microservices (NOT in turbo pipeline)
│   │   ├── intake-api/          # Fastify gateway (SMS webhook, OTP bridge)
│   │   ├── coordinator/         # Telegraf Telegram bot orchestration
│   │   └── email-intake/        # IMAP poller (in ag-associates-ai/backend!)
│   ├── supabase/migrations/     # 23 migration files (Supabase hosted)
│   ├── tests/                   # Vitest suite
│   └── server.ts                # Express + Vite entry (port 3001)
├── landing/                     # Static GSAP landing page (served by Caddy)
├── supabase/migrations/         # Root-level: 1 file (noi_status)
├── docker-compose.prod.yml      # 10-service production stack
├── Caddyfile                    # Reverse proxy + auto-TLS
├── Makefile                     # Automation targets
└── turbo.json                   # Workspaces: apps/*, packages/*, services/*
```

### Dependency Matrix

| Package/Service | Language | Runtime | Depends On | Consumed By |
|-----------------|----------|---------|------------|-------------|
| `apps/web` | TS/Next.js | Node 20 | None (static) | GitHub Pages |
| `ag-associates-ai/backend` | Python 3.11 | FastAPI/Uvicorn | pgvector, Redis, vLLM, Supabase | `ag-platform` (HTTP), Telegram bot, n8n |
| `ag-associates-ai/frontend` | TS/Next.js | Node 20 | AI Backend API | Docker → `ai-dashboard` |
| `ag-platform/src` | TS/Express | Node 20 | Supabase, Redis, AI Backend | Caddy → `app.domain` |
| `ag-platform/packages/db` | TS | Node | pgvector (local) | `ag-platform/src`, `services/*` |
| `ag-platform/packages/types` | TS | Node | None | All TS packages |
| `ag-platform/packages/ui` | TS/React | Node | shadcn/ui, Tailwind | `ag-platform/src` |
| `services/intake-api` | TS/Fastify | Node 20 | Redis, Supabase | Caddy → `intake.domain` |
| `services/coordinator` | TS/Hono | Node 20 | Redis, Telegram, Gemini | Caddy → `coordinator.domain` |
| `backend/email_intake` | Python | FastAPI | IMAP, Supabase, LLM, Redis | Docker → `email-intake` |
| `backend/telegram_bot` | Python | pgram | Redis, AI Backend | Docker → `telegram-bot` |

---

## 3. SCHEMA SOURCES — SQL Migrations, Authority & Conflicts

### Migration Locations (4 Distinct Sources)

| Location | File Count | Authority | Purpose |
|----------|------------|-----------|---------|
| `ag-platform/src/server/migrations.sql` | 1 (826 lines) | **Primary for ag-platform** | Boot-time auto-run on Express startup. Contains ALL schema: enums, tables, RLS, triggers, billing, audit, job queue, bank portal configs. |
| `ag-platform/supabase/migrations/` | 23 files | **Supabase hosted** | Historical Supabase migrations. Some overlap with `migrations.sql` (e.g., core schema). |
| `ag-platform/packages/db/migrations/` | 2 files | **Local pgvector** | `001_ag_initial_schema.sql` (core), `002_pgvector_templates.sql` (legal_templates). Used by `packages/db` pool. |
| `ag-associates-ai/database/init.sql` | 1 (62 lines) | **AI Pipeline pgvector** | Legal templates table + embeddings index for RAG. |
| `ag-associates-ai/database/agent_migrations.sql` | 1 (82 lines) | **AI Multi-agent** | Per-agent conversation tables, agent_bus_log, user_telegram_map, agent_access_grants. |
| `supabase/migrations/` (root) | 1 (15 lines) | **Legacy/Orphan** | Adds `noi_status` column + enum to `cases`. **Conflicts** with `ag-platform` case status enum. |

### Critical Schema Conflicts

| Conflict | Details |
|----------|---------|
| **Case Status Enums Differ** | `ag-platform`: 12 states (`RECEIVED`→`CLOSED`). `ag-associates-ai` NOI: 11 states (`DOCUMENTS_RECEIVED`→`COMPLETED`). Root migration adds `noi_status` TEXT column with separate enum. **No shared status model.** |
| **Case Type Enums Differ** | `ag-platform`: 17 types (snake_case: `INTIMATION_MORTGAGE`). `ag-associates-ai` email intake: uses `INTIMATION_MORTGAGE` but Supabase `cases` table expects `ag-platform` enum. |
| **Organizations Table** | `ag-platform` has `organizations` (multi-tenant). `ag-associates-ai` has NO org table — uses `org_id` header only. |
| **Banks Table** | `ag-platform`: `banks` with `short_code` (HDFC, ICICI, SBI, LICHFL). `ag-associates-ai` config: expects `Kotak`, `Axis`, `Muthoot` — **different bank roster**. |
| **pgvector Dimension** | `ag-associates-ai`: 384 (MiniLM-L6-v2). `ag-platform/packages/db`: 384. **Consistent** — but if changed, both must update. |

### Migration Execution Model

| System | How Migrations Run |
|--------|-------------------|
| `ag-platform` (Express) | **Auto on boot** — `server.ts` calls `runMigrations()` reading `src/server/migrations.sql`. |
| `ag-platform` (Supabase) | **Manual** — 23 files in `supabase/migrations/`; no CI/CD runs them. Must apply via SQL Editor. |
| `ag-platform/packages/db` | **Manual** — Drizzle migrations; no auto-runner. |
| `ag-associates-ai` | **Manual** — `psql -f database/init.sql` and `psql -f database/agent_migrations.sql` per README. |
| Root `supabase/migrations` | **Never runs** — no workflow or script executes it. |

---

## 4. CASE MODELS — All Case-Related Tables Across Both Systems

### ag-platform (Supabase + Local pgvector)

```sql
-- Core case table (from migrations.sql)
cases (
  id UUID PK,
  case_number TEXT UNIQUE,        -- AGA-2026-XXXXX
  org_id UUID FK → organizations, -- RLS isolation
  bank_id UUID FK → banks,        -- RLS: bank_viewer sees only their bank
  case_type case_type ENUM,       -- 17 types
  status case_status ENUM,        -- 12 states (RECEIVED→CLOSED)
  borrower_name TEXT,
  loan_amount NUMERIC(15,2),
  received_date TIMESTAMPTZ,
  sla_deadline TIMESTAMPTZ,
  assigned_executive_id UUID FK → profiles,
  disbursement_total NUMERIC(15,2),
  professional_fee NUMERIC(15,2),
  sla_warning_sent BOOLEAN,
  sla_breached BOOLEAN,
  sla_escalated BOOLEAN,
  created_at, updated_at TIMESTAMPTZ
)

-- NOI-specific (from root supabase migration)
ALTER TABLE cases ADD COLUMN noi_status TEXT DEFAULT 'DOCUMENTS_RECEIVED';
CREATE TYPE noi_status_enum AS ENUM (11 states...);

-- Related tables
case_timeline (case_id, status_from, status_to, notes, changed_by, created_at)
documents (case_id, org_id, storage_path, bucket_id, version_number, ...)
disbursements (case_id, type, amount, paid_date, is_reimbursed)
timesheets (org_id, case_id, profile_id, task_description, start/end, duration, billable)
invoices (org_id, bank_id, line_items → timesheets, advance_adjusted, net_receivable)
bank_portal_configs (bank_id UNIQUE, org_id, branding, features, workflow_overrides, SSO)
bank_workflow_variants (bank_id, case_type, stages[], transitions JSON, required_documents[])
staff_activity (source, capability_code, case_id, org_id, summary, payload, status)
audit_trail (org_id, event_type, actor, subject, old/new values, correlation_id, severity)
legal_templates (title, content, template_type, jurisdiction, language, embedding vector(384))
```

### ag-associates-ai (Local PostgreSQL + pgvector)

```sql
-- From database/init.sql
legal_templates (
  id SERIAL PK,
  title, content, template_type, jurisdiction, language,
  embedding vector(384),  -- MiniLM-L6-v2
  created_at, updated_at
)

-- From database/agent_migrations.sql (per-agent tables)
agent_{auditor,vyasa,bouncer,accountant,noi,executor,drafter}_conversations (
  id UUID PK, user_id, title, metadata JSONB, created_at, updated_at
)
agent_{...}_messages (
  id BIGSERIAL PK, conversation_id FK, role, content, metadata JSONB, created_at
)
agent_{...}_context (
  id SERIAL PK, conversation_id FK, key, value JSONB, UNIQUE(conversation_id, key)
)

agent_bus_log (message_id, source, target, msg_type, payload JSONB, conversation_id, correlation_id, hop_count)
user_telegram_map (user_id UNIQUE, chat_id UNIQUE, username, is_active)
agent_access_grants (user_id, agent_name, granted_by, UNIQUE(user_id, agent_name))

-- In-memory/Redis fallback (noi_agent.py)
NOI case store: Redis hash `noi:case:{case_id}` or in-memory dict
Fields: id, case_id, noi_status, borrower_name, bank_name, loan_amount, property_address, property_city, grn_number, acknowledgment_number, created_at, updated_at
```

### Case Model Comparison

| Attribute | ag-platform | ag-associates-ai (NOI) |
|-----------|-------------|------------------------|
| **Primary Key** | UUID | String (e.g., `TEST-20260301120000`) |
| **Tenant Isolation** | `org_id` (RLS) | Header `X-Org-ID` (no enforcement) |
| **Bank Reference** | `bank_id` FK → `banks` | `bank_name` TEXT (free-form) |
| **Case Type** | Enum (17 values) | Hardcoded `INTIMATION_MORTGAGE` |
| **Status** | Enum (12 states) | NOI state machine (11 states) |
| **Timeline** | `case_timeline` table | `case_timeline` via Supabase REST (if configured) |
| **Documents** | `documents` table + Supabase Storage | Not modeled |
| **SLA Tracking** | `sla_deadline`, warning/breach flags | Section 89B deadline (30 days) in workflow def |
| **Billing** | Timesheets, invoices, disbursements | None |

---

## 5. AUTH/TENANT BOUNDARIES — org_id/tenant Isolation Implementation

### ag-platform (Supabase Auth + RLS)

```typescript
// src/server/auth.ts — Supabase SSR cookie-based auth
createSupabaseMiddleware() {
  // 1. Validate JWT from cookie
  // 2. Fetch profile from `profiles` table (user_id → org_id, role)
  // 3. Attach req.user = { id, email, role, orgId }
}

// RLS Policy Pattern (all tables):
CREATE POLICY table_org_isolation ON table
  FOR ALL USING (org_id = current_setting('app.current_org_id')::uuid);

// get_app_org_id() extracts from JWT app_metadata.app_org_id
// Middleware sets: SET LOCAL app.current_org_id = <org_id>
```

**Tenant Model:**
- `organizations` table → each user belongs to one org via `profiles.org_id`
- `banks` are global; `bank_portal_configs` link bank + org
- `BANK_VIEWER` role: profile has `bank_id`; RLS filters `cases.bank_id = profile.bank_id`

### ag-associates-ai (Custom JWT + Header-based)

```python
# config.py — No auth framework, just env vars
SUPABASE_JWT_SECRET = _required_env("SUPABASE_JWT_SECRET")
N8N_WEBHOOK_KEY = _required_env("N8N_WEBHOOK_KEY")

# main.py — _verify_n8n_key() checks x-api-key header against N8N_WEBHOOK_KEY
# AuthContext (from auth.deps) provides require_permission("noi.initiate")
# org_id passed via X-Org-ID header (optional, no validation)
```

**Tenant Model:**
- **No organizations table** — multi-tenancy via `X-Org-ID` header only
- `noi_agent.py` reads `org_id` from headers but **does not enforce** it in Supabase queries
- Agent RBAC: `agent.<name>.access` permissions in `auth/rbac.py`
- Telegram bot: `user_telegram_map` links user_id → chat_id (no org)

### Critical Gaps

| Gap | Impact |
|-----|--------|
| **No shared org_id** | `ag-platform` org ≠ `ag-associates-ai` org. Cases created by email intake have no org linkage. |
| **Bank roster mismatch** | `ag-platform` banks: HDFC, ICICI, SBI, LICHFL. `ag-associates-ai` expects: Kotak, Axis, Muthoot, Karur Vysya, Cholamandalam. |
| **RLS bypass in AI** | `noi_agent.py` uses service role key → bypasses RLS entirely. |
| **No auth on intake-api** | SMS webhook only checks `N8N_WEBHOOK_KEY`; no org context. |

---

## 6. WORKFLOWS — Definitions, Versions, Instances in Both Systems

### ag-associates-ai: Declarative Workflow Definitions (`workflows/definitions.py`)

**Three WorkflowDefinitions** with structural validation at import time:

| Workflow | Slug | States | Transitions | Deadlines |
|----------|------|--------|-------------|-----------|
| **NOI** | `noi` | 11 (incl. RECTIFY, MISMATCH, REJECTED) | Linear + branches | Section 89B: 30 days from mortgage date |
| **Mortgage Registration** | `mortgage_registration` | 9 | Linear + review→draft back | None defined |
| **Public Notice** | `public_notice` | 9 | Branch at AWAITING_OBJECTIONS | Objection window: 7/15/30 days (per case) |

**Key Features:**
- `WorkflowDefinition.__post_init__` validates: unique names, real transitions, reachability, no stranded states, terminal states actually terminate
- Exception states (MISMATCH, REJECTED, ON_HOLD) always enterable, must have exit or be terminal
- `validate_transition(current, new)` used by `noi_agent.update_noi_status()`
- `deadlines.py` evaluates clocks: `scan()` returns `Severity` (OK/DUE_SOON/DUE_TODAY/OVERDUE)

**NOI State Machine (Live):**
```
DOCUMENTS_RECEIVED → CHALLAN_GENERATED → CHALLAN_PAID → VERIFIED
                                                          ↓
                                              ┌───────────┴───────────┐
                                              ▼                       ▼
                                        NOI_DROP_RECEIVED         RECTIFY
                                              ↓                       ↓
                                        NOI_FILED ←─────────────────┘
                                              ↓
                                        ACKNOWLEDGED
                                              ↓
                                        COMPLETED (terminal)
Exception: MISMATCH → VERIFIED | REJECTED (terminal)
```

### ag-platform: Case Status State Machine (Implicit)

**10-State Case Lifecycle** (from `case_status` enum + routes):
```
RECEIVED → ASSIGNED → DOCUMENT_COLLECTION → IN_PROGRESS
                                              ↓
                                        PENDING_REGISTRATION → REGISTERED
                                              ↓
                                        QUALITY_CHECK → DELIVERED → INVOICED → CLOSED
Exception: ON_HOLD, REJECTED, CANCELLED
```

**Workflow Variants per Bank** (`bank_workflow_variants` table + `bankPortal.ts` defaults):
- **Kotak**: Full NOI stages + RECTIFY branch, amount-based auto-assignment
- **HDFC**: No RECTIFY, requires title_report, 12h SLA warning, region-based assignment
- **ICICI**: No RECTIFY, amount-based assignment only

**Transition Enforcement:**
- `CaseService.updateStatus()` — **no validation**, just writes status + timeline entry
- Frontend `AdvisorCockpit` / `NoiPipeline` components drive transitions
- **No server-side state machine validation** — unlike `ag-associates-ai`

### Workflow Instances & Versioning

| System | Instance Storage | Versioning |
|--------|------------------|------------|
| `ag-associates-ai` | Redis hash (`noi:case:{id}`) or Supabase `cases.noi_status` | WorkflowDefinition is code; changes = deploy |
| `ag-platform` | `cases.status` + `case_timeline` | Bank workflow variants in DB (mutable via API) |

---

## 7. AI EXECUTION — Agent Pipelines, Runs, Provenance Tracking

### LangGraph Document Pipeline (ag-associates-ai/backend/agents.py)

```python
# StateGraph: Aisha (Intake) → Drafter (RAG + Template) → Auditor (QA Loop)
# should_revise(): score < 85 → back to Drafter (max 3 revisions)
```

### Conversational Multi-Agent System (7 Specialists)

| Agent | Role | Personality | Tools/Capabilities |
|-------|------|-------------|-------------------|
| **Auditor** | Financial Auditor | Hinglish | Bank statement analysis, anomaly detection, Excel audit reports |
| **Vyasa** | Legal Researcher | Hinglish | Property law research, compliance checks, precedent analysis |
| **Bouncer** | Math Validator | Hinglish | Stamp duty calculations, numerical verification |
| **Accountant** | Financial Reporter | Hinglish | Billing, receivables, financial reports |
| **NOI** | NOI Specialist | Hinglish | Notice of Intimation workflow state machine |
| **Executor** | RPA Runner | Hinglish | Automation execution (IGR, GRAS, NeSL), workflow triggers |
| **Drafter** | Document Drafter | Hinglish | Legal document drafting, agreement generation |

**Architecture:**
- **Shared LLM**: All use `Qwen2.5-7B-Instruct` via local vLLM (`http://localhost:8000/v1`)
- **Communication**: Redis Streams (`agent:bus`) with consumer groups, max 5 hops
- **Memory**: Per-agent PostgreSQL tables (`agent_{name}_conversations`, `_messages`, `_context`)
- **RBAC**: `agent.<name>.access` permission checked via `auth/rbac.py`
- **Multi-Modal**: `media/processors.py` routes audio→Whisper, images→Qwen-VL, PDF→pdfplumber, Excel→openpyxl, DOCX→python-docx

**Supervisor Agent** (`controller_agent.py`): Orchestrates agents, handles webhook hardening, HTTP deployment to ai-backend.

### Provenance & Observability

| Mechanism | Coverage |
|-----------|----------|
| **Agent Bus Log** | `agent_bus_log` table: source, target, type, payload, correlation_id, hop_count |
| **Conversation Memory** | Per-agent tables with full message history + context KV |
| **Sentry** | Optional (requires `SENTRY_DSN`); traces_sample_rate configurable |
| **OpenTelemetry** | `tracing.py` — setup_tracing, instrument_app; not confirmed in prod |
| **Metrics** | `metrics.py` — Prometheus `/metrics` endpoint |
| **Audit Trail** | `ag-platform` has comprehensive `audit_trail` table; `ag-associates-ai` uses `workforce.ledger.record_activity()` |
| **HITL Queue** | `hitl_queue.py` — circuit breaker fallbacks requiring human action |

### Known Broken Paths (from CLAUDE.md)

| Component | Issue |
|-----------|-------|
| `noi_agent.generate_challan` | Calls `executor_agent.generate_noi_challan` — **does not exist** (AttributeError swallowed) |
| `auto_comms._send_email` | Hardcodes `"to": []` — **no emails ever sent** |
| GRAS challan generation | Mock with hardcoded GRN; all portal interactions commented out |
| `executor_agent.wait_for_otp` | Uses `r.setEx(...)` — **JavaScript spelling**; Python redis is `setex` |
| NeSL clients | **Four implementations**; inline in `main.py` shadows `nesl_client.py` import |
| Scheduler | **No scheduler** in backend (APScheduler imported but not wired in main.py startup) |

---

## 8. INTEGRATIONS — External Systems

| Integration | System | Implementation Status | Location |
|-------------|--------|----------------------|----------|
| **IGR (Inspector General of Registration)** | `ag-associates-ai` | Playwright automation complete but **unconfigured** (blank creds in prod) | `igr_executor.py`, `executor_agent.py` |
| **GRAS (Government Receipt Accounting System)** | `ag-associates-ai` | Mock only — hardcoded GRN, forms commented out | `executor_agent.py` |
| **NeSL (National e-Governance Services Ltd)** | Both | **4 implementations**; `ag-platform`: mock only; `ag-associates-ai`: mock + inline client | `nesl_client.py`, `main.py` inline, `ag-platform/src/server/routes/nesl.ts` |
| **Banks (Kotak, Axis, Muthoot, HDFC, ICICI, SBI, Karur Vysya, Cholamandalam)** | Both | Panel configs in `ag-platform` (bank_portal_configs); email intake recognizes domains | `email_intake/panel.py`, `bankPortal.ts` |
| **Email (Zoho IMAP)** | `ag-associates-ai` | **Only working intake** — polls every 60s, extracts via LLM, creates Supabase cases | `email_intake/agent.py` |
| **WhatsApp (Meta Business API)** | `ag-associates-ai` | Endpoint exists (`/webhooks/whatsapp`) but **no n8n workflow** behind it | `main.py:369` |
| **Telegram** | Both | `ag-associates-ai`: bot + private messenger; `ag-platform`: coordinator bot | `telegram_bot/`, `services/coordinator/` |
| **SMS/OTP Bridge** | `ag-platform` | `intake-api` Fastify: `/api/v1/webhook/sms-incoming` → Redis `otp:incoming` | `services/intake-api/src/routes/webhook.ts` |
| **n8n** | Both | Webhook receiver in `ag-associates-ai` (`/webhooks/n8n/intake` stub); n8n container in prod | `docker-compose.prod.yml`, `main.py:459` |
| **Payment Gateways** | `ag-platform` | Stripe + Razorpay models/webhooks in `ag-associates-ai/backend/payment/` | `payment/router.py`, `webhook.py` |

---

## 9. CI/CD — GitHub Actions Workflows, Gates, Failure Modes

### Workflow Inventory (`.github/workflows/`)

| Workflow | Trigger | Purpose | Status |
|----------|---------|---------|--------|
| `main.yml` | Push/PR to main | **Primary CI** — 4 parallel jobs | Active |
| `deploy.yml` | Push to main (path filter) | Build → GHCR → SSH deploy to VPS | Active |
| `coolify-deploy.yml` | Push/Dispatch | Trigger Coolify deploy via API | Active |
| `nextjs.yml` | Push to main | Build `apps/web` → GitHub Pages | Active |
| `ci.yml` | Push/PR | Duplicate of main.yml jobs? | Active |
| `security-scan.yml` | Push/PR | Trivy vulnerability scan | Active |
| `codeql.yml` | Weekly/PR | CodeQL analysis (Python + JS/TS) | Active |
| Others | Various | DNS, SSH, permissions, preview | Various |

### CI Pipeline (main.yml) — 4 Parallel Jobs

| Job | Working Dir | Steps | Known Issues |
|-----|-------------|-------|--------------|
| **Pre-commit** | Root | `pre-commit/action` | **Permanently red** — whitespace in `session-ses_19a4.md` |
| **ag-associates-ai frontend** | `ag-associates-ai/frontend` | `npm ci → lint → build` | — |
| **ag-associates-ai backend** | `ag-associates-ai/backend` | `pip install ruff → ruff check → ruff format --check → pip install --dry-run` | **Ruff unpinned** — version drift changes error count (0.15: 48 errors, 0.16: 874 errors) |
| **ag-platform** | `ag-platform` | `npm ci → lint → type-check → test → build` | **Vitest needs `ws` transport** on Node < 22; Cloudflare preview deploys fail (invalid token) |

### Critical CI Observations

1. **Ruff baseline is version-dependent** — Must pin `ruff==0.16.1` locally to match CI. Working directory MUST be `ag-associates-ai/backend` (ruff resolves imports relative to cwd).

2. **Pytest job cannot fail** — `ci.yml` runs `pytest ... 2>/dev/null || echo "No pytest tests found"` — swallows stderr AND exit code.

3. **Pre-existing permanent failures:**
   - Pre-commit (whitespace in committed session file)
   - ag-platform turbo (vitest transport)
   - Cloudflare preview (invalid token)
   - Trivy security scan

4. **Commitlint enforced** — `subject-case: lower-case` rejects uppercase (including "NOI", "89B"). Scopes gated by enum.

### Deploy Pipeline (deploy.yml)

```
Push to main (code paths) 
    → Build & Push 8 Docker images to GHCR (matrix)
    → SSH to VPS (ubuntu-latest, not self-hosted runner)
    → Clone to /srv/ag/deploy-<sha> (NOT /srv/ag/repo — docs stale)
    → docker compose -p ag -f docker-compose.prod.yml pull/up
    → Smoke test 4 endpoints (intake, api, app, dashboard) — **fails workflow if unhealthy**
```

---

## 10. DEPLOYMENTS — Docker Compose, Coolify, GHCR, VPS

### Production Stack (docker-compose.prod.yml) — 10 Services

| Service | Image | Port | Domain | Health Check |
|---------|-------|------|--------|--------------|
| `caddy` | caddy:2-alpine | 80/443 | All subdomains | `/config/` |
| `postgres` | pgvector/pgvector:pg16 | 5432 | Internal | `pg_isready` |
| `redis` | redis:7-alpine | 6379 | Internal | `redis-cli ping` |
| `ai-backend` | ghcr.io/luxoranova9/ag-ai-backend | 8000 | `api.domain` | `/health` |
| `ai-dashboard` | ghcr.io/luxoranova9/ag-ai-dashboard | 3000 | `dashboard.domain` | `wget /` |
| `ag-platform` | ghcr.io/luxoranova9/ag-platform | 3001 | `app.domain` | `/api/health` |
| `n8n` | n8nio/n8n:latest | 5678 | `n8n.domain` | `/healthz` |
| `intake-api` | ghcr.io/luxoranova9/intake-api | 3002 | `intake.domain` | `/health` |
| `telegram-bot` | ghcr.io/luxoranova9/telegram-bot | 3003 | Internal | `/health` (port 3004?) |
| `email-intake` | ghcr.io/luxoranova9/email-intake | 3004 | Internal | `/health` |
| `coordinator` | ghcr.io/luxoranova9/coordinator | 3005 | `coordinator.domain` | Custom node fetch |

### Caddy Routing (Caddyfile)

```
api.domain     → ai-backend:8000 (with /webhook* → telegram-bot, /api/sms/ingest* → intake-api)
app.domain     → ag-platform:3001
dashboard.domain → ai-dashboard:3000
intake.domain  → intake-api:3002
n8n.domain     → n8n:5678 (basic auth)
domain (HTTP)  → /srv/landing (static)
docs.domain    → /srv/docs (static)
www.domain     → redirect to domain
```

### Coolify Configuration (`coolify/*.json`)

| Service | Config File | Type | Port | Domain |
|---------|-------------|------|------|--------|
| `ag-ai-backend` | `coolify-ag-ai-backend.json` | Docker Compose | 8000 | `api.domain` |
| `ag-platform` | `coolify-ag-platform.json` | Docker Compose | 3001 | `app.domain` |
| `ai-dashboard` | `coolify-ai-dashboard.json` | Docker Compose | 3000 | `dashboard.domain` |
| `intake-api` | `coolify-intake-api.json` | Docker Compose | 3002 | `intake.domain` |
| `telegram-bot` | `coolify-telegram-bot.json` | Worker | — | — |
| `email-intake` | `coolify-email-intake.json` | Worker | — | — |
| `coordinator` | `coolify-coordinator.json` | Worker | 3005 | `coordinator.domain` |
| `n8n` | `coolify-n8n.json` | Docker Compose | 5678 | `n8n.domain` |

### VPS Specs
- **Hetzner CPX31**: 4 vCPU, 8GB RAM, 160GB NVMe — €16.90/mo
- **Ubuntu 24.04**, Coolify (open-source PaaS)
- **Managed**: PostgreSQL (pgvector), Redis, MinIO (S3), Prometheus+Grafana+Loki
- **DNS**: Cloudflare (grey cloud for apex/www), Let's Encrypt auto-TLS

---

## 11. EXISTING TESTS — Coverage, Locations, What They Actually Test

### ag-platform (Vitest)

| Test File | Coverage | What It Tests |
|-----------|----------|---------------|
| `tests/auth.test.ts` | Auth middleware | Unauthorized responses, role checks |
| `tests/validation.test.ts` | Zod schemas | CreateCaseSchema, UpdateCaseStatusSchema, etc. |
| `tests/routes/cases.test.ts` | Cases routes | 401 on all endpoints, validation errors (400/401) |
| `tests/setup.ts` | Test setup | — |

**Run:** `npm test` (from `ag-platform/`)

**Gaps:** No integration tests (no test DB), no AI router tests, no bank portal tests, no workflow variant tests.

### ag-associates-ai (Python)

| Test File | Coverage | What It Tests |
|-----------|----------|---------------|
| `test_workflow_definitions.py` | **424 lines** | Structural validation of WorkflowDefinition, NOI machine pinned, all 3 workflows |
| `test_workflow_deadlines.py` | **310 lines** | Boundary arithmetic (due today, overdue, warning threshold), scan ordering, fault handling |
| `test_noi_agent.py` | Not read | NOI agent workflow actions |
| `test_executor_agent.py` | Not read | Executor agent |
| `test_multi_agent.py` | Not read | Multi-agent system |
| `test_accountant_agent.py` | Not read | Requires pdfplumber + gspread at import time |
| `test_email_panel.py` | Not read | Email intake panel recognition |
| `test_otp_bridge.py` | Not read | OTP bridge |

**Run:** `python -m pytest -q` (from `ag-associates-ai/backend/`)

**Gaps:** No tests for `main.py` endpoints, no LangGraph pipeline tests, no multi-modal processor tests, no Telegram bot tests. CI pytest job **cannot fail** (stderr + exit code swallowed).

---

## 12. CONTRADICTIONS — Code vs Docs, Code vs Code

| # | Contradiction | Evidence |
|---|---------------|----------|
| **1** | README claims vLLM in production | `docker-compose.prod.yml` has **no vLLM service**; `config.py` defaults to `localhost:8000/v1` but `CLAUDE.md` states: *"Production LLM is Groq llama-3.3-70b-versatile... there is no vLLM service in docker-compose.prod.yml"* |
| **2** | README says "7 conversational agents" | `agents/agent_registry.py` lists 7, but `agent_init.py` imports 8 (includes `aisha` separately) |
| **3** | `ag-platform` README is empty (0 bytes) | File exists but no content |
| **4** | `ag-associates-ai` README says "Groq" for LLM | `config.py` defaults to vLLM (`qwen2.5-7b-instruct`); `CLAUDE.md` confirms Groq in prod |
| **5** | `ag-platform` `server.ts` serves `apps/web` in prod | But `apps/web` is Next.js static export → GitHub Pages; `ag-platform` is Vite SPA. **Serving wrong artifact.** |
| **6** | `turbo.json` declares `workspaces: ["apps/*", "packages/*", "services/*"]` | `apps/web` is NOT a Turborepo workspace (no package.json in turbo sense); `ag-platform` is at root, not under `apps/` |
| **7** | `ag-platform` `supabase/migrations/` has 23 files | `src/server/migrations.sql` contains consolidated schema; **dual migration sources** with overlap |
| **8** | Root `supabase/migrations/` has 1 file adding `noi_status` | `ag-platform` already has `case_status` enum; **two different status systems** for NOI |
| **9** | `ag-associates-ai` `noi_agent.py` imports `workflows.definitions.NOI` | But also defines `NOI_STATES`, `NOI_TRANSITIONS` as module aliases — **duplication** |
| **10** | `email_intake/agent.py` creates cases with `case_type: INTIMATION_MORTGAGE` | `ag-platform` `cases.case_type` enum has `INTIMATION_MORTGAGE` but email intake writes to same Supabase — **may work but org_id missing** |
| **11** | `ag-platform` `bankPortal.ts` defaults for Kotak/HDFC/ICICI | `ag-associates-ai` config expects Kotak, Axis, Muthoot, Karur Vysya, Cholamandalam — **different bank roster** |
| **12** | `CLAUDE.md` says "No scheduler anywhere in backend" | `main.py` imports `AsyncIOScheduler` and defines `start_scheduler()` with 4 jobs — **scheduler exists but not confirmed running** |
| **13** | `ag-platform` `docker-compose.prod.yml` has `ag-platform` service | But `ag-platform` also has its own `docker-compose.yml` (dev only) |
| **14** | `ag-associates-ai` `main.py` has `/webhooks/whatsapp` (with 's') | `intake-api` has `/api/v1/webhook/sms-incoming` (no 's') — **inconsistent webhook paths** |
| **15** | `ag-platform` `CreateCaseSchema` includes `HOME_LOAN`, `LOAN_AGAINST_PROPERTY` etc. | These were added via `ALTER TYPE case_type ADD VALUE` in migrations.sql — **enum extended post-facto** |

---

## 13. RISKS — Prioritized Risk List

### 🔴 CRITICAL (P0 — Immediate Action Required)

| Risk | Description | Impact | Location |
|------|-------------|--------|----------|
| **R1: Two disconnected case stores** | Telegram bot → local Postgres `noi_cases`; Email intake → Supabase `cases`. No reconciliation, no unified view. | Data fragmentation, duplicate cases, lost work | `telegram_bot/db.py`, `email_intake/agent.py` |
| **R2: GRAS challan generation broken** | `executor_agent.generate_noi_challan` **does not exist**; `noi_agent.generate_challan` calls it and swallows `AttributeError`. CHALLAN_GENERATED state unreachable. | NOI workflow **cannot progress past DOCUMENTS_RECEIVED** | `executor_agent.py`, `noi_agent.py:267` |
| **R3: No email notifications ever sent** | `auto_comms._send_email` hardcodes `"to": []`. All notification dispatch silent. | Client/bank notifications never sent; SLA warnings silent | `auto_comms.py` |
| **R4: RLS bypass in AI pipeline** | `noi_agent.py` uses `SUPABASE_SERVICE_ROLE_KEY` for all queries — bypasses Row Level Security entirely. | **Multi-tenant data leakage** — any org can access any case | `noi_agent.py:85-103` |
| **R5: No scheduler running** | APScheduler defined in `main.py` but `start_scheduler()` only called in `@app.on_event("startup")` — not confirmed working in Docker. No periodic deadline scans. | Section 89B deadlines **never evaluated automatically**; cases miss filing windows | `main.py:66-115` |
| **R6: Bank roster mismatch** | `ag-platform` banks ≠ `ag-associates-ai` expected banks. Email intake `panel.py` has different domains. | Cases created with wrong bank_id; bank portal configs don't match | `email_intake/panel.py`, `bankPortal.ts`, `migrations.sql` seed data |

### 🟠 HIGH (P1 — Fix Before Production Scale)

| Risk | Description | Impact |
|------|-------------|--------|
| **R7: No org_id enforcement in AI** | `X-Org-ID` header optional, not validated. Cases created by email intake have no org linkage. | Cross-org data access possible |
| **R8: Four NeSL implementations** | Inline in `main.py`, `nesl_client.py`, `ag-platform/routes/nesl.ts`, mock. Unknown which runs. | Unpredictable filing behavior; maintenance burden |
| **R9: `executor_agent.wait_for_otp` uses `setEx`** | JavaScript method name; Python redis-py uses `setex`. **Runtime error** when OTP waited. | IGR filing fails at OTP step |
| **R10: No migration automation** | 4 migration sources, none auto-applied in CI/CD. Supabase migrations manual. | Schema drift; deploy failures |
| **R11: CI cannot detect regressions** | Ruff unpinned, pytest swallows failures, pre-commit permanently red. | "Green CI" ≠ working code |
| **R12: Telegram bot port mismatch** | `docker-compose.prod.yml` healthcheck calls `:3004` but bot env says `TELEGRAM_BOT_PORT=3003` | Health checks fail; container restart loops |

### 🟡 MEDIUM (P2 — Technical Debt)

| Risk | Description |
|------|-------------|
| **R13: Duplicate workflow definitions** | NOI states in `workflows/definitions.py`, `noi_agent.py` aliases, root migration enum, `bankPortal.ts` defaults |
| **R14: No shared types between subsystems** | `ag-platform` Typescript types vs `ag-associates-ai` Pydantic models — manual sync |
| **R15: `ag-platform` serves `apps/web` in production** | `server.ts` line 255: `express.static(distPath)` where `distPath = apps/web/dist` — but `apps/web` deploys to GitHub Pages |
| **R16: No test coverage for critical paths** | No tests for AI pipeline, IGR/GRAS/NeSL executors, multi-agent bus, bank portal |
| **R17: Hardcoded secrets in committed files** | `session-ses_19a4.md` contains leaked credential (pre-commit fails on it) |
| **R18: `ag-platform/packages/db` duplicates `src/server/db.ts`** | Two pg Pool instances, two migration systems |

### 🟢 LOW (P3 — Polish)

| Risk | Description |
|------|-------------|
| **R19: `ag-platform` README empty** | Documentation gap |
| **R20: Multiple `.env` locations** | Root, `ag-associates-ai/backend/.env`, `ag-platform/.env`, `services/*/.env` — confusion |
| **R21: `landing/` superseded but still in prod compose** | Served by Caddy at root domain; `apps/web` is the "live site" per README |

---

## 14. RECOMMENDED NEXT TASK — Specific, Actionable for P0-A

### **P0-A: Unblock NOI Workflow End-to-End**

**Objective:** Make the Notice of Intimation workflow executable from `DOCUMENTS_RECEIVED` → `COMPLETED` without manual intervention.

**Scope:** Fix the three showstopper bugs in `ag-associates-ai/backend/` that prevent NOI progression.

**Tasks:**

| Task | File | Fix |
|------|------|-----|
| **T1** | `executor_agent.py` | Implement `generate_noi_challan(case_id, loan_amount, borrower_name, bank_name, property_address)` — currently **missing entirely**. Must return `{success: true, grn_number, amount_paid}`. |
| **T2** | `executor_agent.py` | Fix `wait_for_otp` — change `r.setEx(...)` → `await r.setex(...)` (async, correct method name). |
| **T3** | `auto_comms.py` | Fix `_send_email` — remove hardcoded `"to": []`, accept recipient list from case/notification context. |
| **T4** | `noi_agent.py` | Add defensive check: if `executor_agent.generate_noi_challan` missing, raise explicit error instead of swallowing `AttributeError`. |
| **T5** | `main.py` | Verify `start_scheduler()` actually runs in container; add health check for scheduler. |
| **T6** | `ag-platform/src/server/routes/cases.ts` | When status → `IN_PROGRESS`, trigger AI pipeline with correct `org_id` (currently sends userId as sender). |

**Acceptance Criteria:**
1. `noi_agent.run_workflow(case_id, "generate_challan")` returns `{success: true, grn_number: "GRN123..."}`
2. `noi_agent.run_workflow(case_id, "verify_docs")` returns `{success: true, documents: {...}}`
3. `noi_agent.run_workflow(case_id, "file_noi")` returns `{success: true, acknowledgment_number: "..."}`
4. `noi_agent.run_workflow(case_id, "acknowledge", acknowledgment_number="...")` returns `{success: true}` and case reaches `COMPLETED`
5. Email notification sent at each transition (check logs)
6. Scheduler runs daily SLA scan (check logs at 9 AM IST)

**Estimated Effort:** 2-3 days (mostly `executor_agent.py` implementation)

**Dependencies:** Requires GRAS portal credentials (or mock mode) and IGR portal credentials for full E2E. Can develop against mocks first.

---

## FILES — Key File Paths with Brief Purpose

| Path | Purpose |
|------|---------|
| `ag-associates-ai/backend/main.py` | FastAPI entry; webhooks, NOI endpoints, scheduler, health checks |
| `ag-associates-ai/backend/noi_agent.py` | NOI workflow orchestrator (state machine, challan, verify, file, acknowledge) |
| `ag-associates-ai/backend/workflows/definitions.py` | **Source of truth** for 3 workflow state machines + validation |
| `ag-associates-ai/backend/workflows/deadlines.py` | Statutory clock evaluation (Section 89B, objection windows) |
| `ag-associates-ai/backend/agents/agent_bus.py` | Redis Streams agent communication bus |
| `ag-associates-ai/backend/agents/agent_init.py` | `init_agents()` — starts 7 conversational agents |
| `ag-associates-ai/backend/executor_agent.py` | **BROKEN** — missing `generate_noi_challan`, `setEx` bug |
| `ag-associates-ai/backend/auto_comms.py` | **BROKEN** — `_send_email` hardcodes empty recipients |
| `ag-associates-ai/backend/email_intake/agent.py` | **Only working intake** — IMAP poll → LLM extract → Supabase case |
| `ag-associates-ai/database/init.sql` | pgvector legal_templates schema (384-dim) |
| `ag-associates-ai/database/agent_migrations.sql` | Multi-agent conversation tables |
| `ag-platform/src/server/migrations.sql` | **Primary schema** — auto-run on Express boot (826 lines) |
| `ag-platform/src/server/routes/cases.ts` | Case CRUD + status transitions + AI pipeline trigger |
| `ag-platform/src/server/services/caseService.ts` | Case business logic (create, timeline, status update) |
| `ag-platform/src/server/bankPortal.ts` | Bank portal configs + per-bank workflow variants |
| `ag-platform/src/server/auth.ts` | Supabase SSR auth + RLS context setting |
| `ag-platform/services/intake-api/src/routes/webhook.ts` | SMS webhook → Redis OTP bridge |
| `ag-platform/services/coordinator/src/telegram-bot.ts` | Telegraf bot for agent orchestration |
| `docker-compose.prod.yml` | 10-service production stack |
| `Caddyfile` | Reverse proxy routing for all subdomains |
| `.github/workflows/main.yml` | Primary CI (4 parallel jobs) |
| `.github/workflows/deploy.yml` | GHCR build → SSH deploy → smoke test |
| `Makefile` | Automation targets (dev, deploy, provision, etc.) |
| `.env.example` | Single source of truth for 89+ env vars |

---

## DEPENDENCIES — Cross-System Dependencies

| Dependency | Direction | Mechanism | Status |
|------------|-----------|-----------|--------|
| `ag-platform` → `ag-associates-ai` | HTTP | `AI_BACKEND_URL` → `/api/generate-agreement` | Works (when AI backend up) |
| `ag-associates-ai` → `ag-platform` (Supabase) | Direct DB | Service role key (bypasses RLS) | **Risk R4** |
| `email_intake` → `ag-platform` (Supabase) | Direct DB | Service role key | Works but no org_id |
| `intake-api` → `ag-platform` (Supabase) | Direct DB | Service role key | Works |
| `telegram-bot` → `ag-associates-ai` | HTTP | `AISHA_API_URL` | Works |
| `coordinator` → Gemini | HTTP | `GEMINI_API_KEY` | Independent |
| All → Redis | Direct | `REDIS_URL` | Shared infrastructure |
| All → PostgreSQL | Direct | `DATABASE_URL` / Supabase | Two separate clusters |

---

*End of Report*