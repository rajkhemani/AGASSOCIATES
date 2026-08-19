<p align="center">
  <h1 align="center">⚖️ AG Associates</h1>
  <p align="center">
    <strong>AI-Driven Legal Operations & SaaS Platform for Panel Advocates</strong>
  </p>
  <p align="center">
    Zero-Staff Automation · Title Search & Registration · Bank Panel Operations · White-Label SaaS
  </p>
</p>

<p align="center">
  <a href="https://github.com/rajkhemani/AGASSOCIATES/actions"><img src="https://img.shields.io/github/actions/workflow/status/rajkhemani/AGASSOCIATES/main.yml?style=flat-square&label=CI" alt="CI Status"></a>
  <a href="https://github.com/rajkhemani/AGASSOCIATES/blob/main/LICENSE"><img src="https://img.shields.io/github/license/rajkhemani/AGASSOCIATES?style=flat-square" alt="License"></a>
  <a href="https://github.com/rajkhemani/AGASSOCIATES/pulls"><img src="https://img.shields.io/github/issues-pr/rajkhemani/AGASSOCIATES?style=flat-square&label=PRs" alt="PRs"></a>
  <a href="https://github.com/rajkhemani/AGASSOCIATES/stargazers"><img src="https://img.shields.io/github/stars/rajkhemani/AGASSOCIATES?style=flat-square&label=Stars" alt="Stars"></a>
</p>

<p align="center">
  <a href="#-about">About</a> ·
  <a href="#-architecture">Architecture</a> ·
  <a href="#-the-ai-agentic-workforce">AI Agents</a> ·
  <a href="#-key-modules">Modules</a> ·
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-detailed-setup-guide">Detailed Setup</a> ·
  <a href="#-deployment">Deployment</a> ·
  <a href="#-api-reference">API Reference</a> ·
  <a href="#-contributing">Contributing</a>
</p>

---

<p align="center">
  <sub>Created by <strong><a href="https://github.com/rajkhemani">Raj Khemani</a></strong> — Founder, LUXORANOVA · Architect of the Zero-Staff Law Firm.</sub>
  <br/>
  <sub>Building the operating system that 15,000 panel advocate firms didn't know they needed.</sub>
</p>

---

## 👤 The Founder

**Raj Khemani** isn't just building legal software — he's rewriting the rules of how Indian law firms operate.

As the founder of **LUXORANOVA**, Raj identified what nobody in LegalTech wanted to admit: **the Indian panel advocate ecosystem — 15,000+ firms handling millions of bank-mandated property transactions — runs on phone calls, paper files, and hope.** No SaaS product existed for this vertical. So he built one.

AG Associates is the result of a radical thesis: **what if a law firm had zero staff and infinite scale?** By deploying six AI agents that mirror a traditional legal hierarchy — from intake to compliance to billing — Raj is proving that the right architecture can make a single firm outperform a 50-person operation.

> *"Your axiomatic imperative is relentless forward momentum. We are not building software — we are building a completely autonomous system that scales without human limitations."*
> — **Raj Khemani**, Founder, LUXORANOVA

**What makes this different:**
- 🎯 **Domain-native** — Built for working advocates, not by a Silicon Valley startup guessing at legal workflows
- ⚡ **72-hour sprint methodology** — Entire platform conceived and deployed in a single sprint
- 🏦 **Bank-panel ready from day one** — Kotak, Axis, Muthoot, Chola, Karur Vysya integration
- 🇮🇳 **India-first** — Maharashtra SRO data, stamp duty engines, Marathi/Hindi support baked in
- 🔄 **White-label DNA** — Multi-tenant from the first commit, not bolted on later

---

## 📖 About

**AG Associates** is a specialized property law firm based in **Thane, Maharashtra**, serving as Panel Advocate for major Indian banks and NBFCs including **Kotak Mahindra Bank, Axis Finance, Karur Vysya Bank, Muthoot Homefin, Cholamandalam Finance**, and **Easy Home Finance**.

This repository contains the firm's **AI-orchestrated "Zero-Staff" platform** — a full-stack SaaS system designed to eliminate manual bottlenecks in high-volume legal operations: Title Search, Legal Vetting, Property Registration, NOI processing, Balance Transfer cases, and more.

### Core Practice Areas

| Service | Description |
|---------|-------------|
| **Search & Title Reports** | Project Title Search, Legal Scrutiny Reports |
| **Document Vetting** | Legal vetting of property and loan documents |
| **Registration Services** | Property registration, mortgage, NOI, POA |
| **Financial Documents** | Franking, Gift Deeds, Leave & License agreements |
| **Public Notices** | English/Marathi newspaper notices, "No Claim" certificates |
| **Balance Transfer (BT)** | Legal transition of loans between financial institutions |

### The Problem We're Solving

| Bottleneck | Before (Manual) | After (AI Platform) |
|-----------|-----------------|-------------------|
| **Data Entry** | Staff spend hours reading Index II, calculating stamp duty | AI parses documents, auto-populates CRM |
| **Field Logistics** | Executives travel to collect docs, deposit cheques, visit SROs | Mobile PWA with instant status updates + offline mode |
| **Status Tracking** | Constant phone calls to track field executives | Real-time progress bars, WhatsApp/Email notifications |
| **Billing** | Manual timesheet management | Floating live timer, auto-generated utilization reports |
| **Client Communication** | High-volume manual updates | Client portal via Magic Links with real-time case tracking |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                    AG Associates AI Platform                         │
│                                                                      │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐  │
│  │      AI Agent Workforce      │  │     Collaboration Platform   │  │
│  │                              │  │                              │  │
│  │  ┌────────┐  ┌────────┐     │  │  Case State Machine          │  │
│  │  │ Aisha  │  │ Vyasa  │     │  │  (RECEIVED → CLOSED)         │  │
│  │  │Intake  │  │Research│     │  │                              │  │
│  │  └───┬────┘  └───┬────┘     │  │  Bank Portal (RLS-isolated)  │  │
│  │      │            │          │  │  ICICI ≠ Kotak ≠ Axis        │  │
│  │      ▼            ▼          │  │                              │  │
│  │  ┌────────┐  ┌────────┐     │  │  Document Vault              │  │
│  │  │Drafter │  │Executor│     │  │  Upload · Preview · Version  │  │
│  │  │Reports │  │Workflow│     │  │                              │  │
│  │  └───┬────┘  └───┬────┘     │  │  Real-time Collaboration     │  │
│  │      │            │          │  │  Presence · Comments · Tasks │  │
│  │      ▼            ▼          │  │                              │  │
│  │  ┌────────┐  ┌────────────┐ │  │  Client Portal               │  │
│  │  │Auditor │  │ Accountant │ │  │  Magic Links · Progress Bars │  │
│  │  │Compli. │  │ Bank Stmts │ │  │                              │  │
│  │  └────────┘  └────────────┘ │  └──────────────────────────────┘  │
│  └──────────────────────────────┘                                    │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │                         Services Layer                        │   │
│  │  Telegram Bot (OTP · Notifications · Voice Mode)             │   │
│  │  Intake API (SMS Webhook · OTP Bridge · Fastify)            │   │
│  │  Email Intake (IMAP → Case) · n8n Workflow Automation         │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │  Infrastructure Layer (Docker Compose · Caddy · GHCR)        │   │
│  │  Supabase (PostgreSQL + RLS + Auth) · pgvector · Gemini Pro  │   │
│  │  FastAPI (Python) · Express (Node.js) · LangGraph · Vercel AI │   │
│  │  Redis (OTP/Jobs) · Postgres (Platform DB) · NeSL e-Filing   │   │
│  └───────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **AI Reasoning** | Google Gemini Pro (via Vercel AI SDK) | Complex legal document analysis, contract vetting |
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui | Dashboard app with glassmorphism design |
| **Backend (AI)** | FastAPI + LangGraph + Uvicorn | Multi-agent pipeline, document generation |
| **Backend (Platform)** | Express 5 + Vite | Case management, collaboration, billing |
| **Database** | Supabase PostgreSQL + pgvector | Multi-tenant data, RLS, embeddings |
| **Cache / Jobs** | Redis | OTP storage, job queue, session cache |
| **Microservices** | Telegram Bot (pgram), Intake API (Fastify), Email Intake | Decoupled communication channels |
| **LLM** | Qwen2.5-7B-Instruct (local vLLM) | Aisha/Auditor chat, document drafting |
| **Embeddings** | SentenceTransformer (`all-MiniLM-L6-v2`) | RAG template retrieval (384-dim) |
| **Webhook** | Caddy reverse proxy + auto-TLS | Public-facing unified ingress |
| **CI/CD** | GitHub Actions → GHCR → Docker Compose | Fully automated deploy to VPS |
| **Monitoring** | Sentry (optional) | Error tracking with env-based sampling |
| **Orchestration** | Coolify (Open-Source PaaS) | GitOps deploy, managed DBs, auto-HTTPS |

---

## 🤖 The AI "Agentic" Workforce

The platform deploys two layers of AI agents — a **LangGraph document pipeline** for automated document processing, and a **multi-agent conversational system** with Hinglish personalities, Redis Streams coordination, RBAC, and multi-modal capabilities.

### Document Pipeline (LangGraph)

A `StateGraph` pipeline processing raw intake → structured data → drafted document → audited output:

| Agent | Role | What It Does |
|-------|------|-------------|
| **Aisha** | Intake | Parses incoming case requests, extracts structured JSON (tenant, landlord, rent, dates, deposit) via vLLM, classifies case type |
| **Drafter** | Legal Architect | Retrieves best template from pgvector RAG, injects extracted fields, generates Markdown + PDF via ReportLab |
| **Auditor** | Compliance | Scores draft 0–100 against extracted fields; loops back to Drafter up to 3 revisions if score < 85 |

Routing via `should_revise()`: fail → loop to Drafter (max 3), then force finish.

### Conversational Agents (7 Specialists)

A separate multi-agent system running on **Redis Streams** (agent bus, consumer groups, max 5 hops) with PostgreSQL conversation memory and RBAC-gated access:

| Agent | Role | Personality | What It Does |
|-------|------|-------------|-------------|
| **Auditor** | Financial Auditor | Hinglish | Bank statement analysis, anomaly detection, Excel audit reports |
| **Vyasa** | Legal Researcher | Hinglish | Property law research, compliance checks, precedent analysis |
| **Bouncer** | Math Validator | Hinglish | Stamp duty calculations, numerical verification |
| **Accountant** | Financial Reporter | Hinglish | Billing, receivables, financial reports |
| **NOI** | NOI Specialist | Hinglish | Notice of Intimation workflow with full state machine |
| **Executor** | RPA Runner | Hinglish | Automation execution, workflow triggers |
| **Drafter** | Document Drafter | Hinglish | Legal document drafting, agreement generation |

All agents share `Qwen2.5-7B-Instruct` via local vLLM, communicate via Redis Streams, and support multi-modal input (audio → Whisper, images → OCR, PDF/Excel/DOCX → text extraction).

### Supervisor Agent

Orchestrates the conversational agents, handles webhook hardening with toggle persistence, and manages agent lifecycle via HTTP deployment to the ai-backend service.

### Telegram Integration

- **OTP Relay** — `/otp`, `/autootp` commands with Redis-backed OTP bridge
- **Agent Commands** — `/agents` (list), `/agent <name> <message>` (direct talk)
- **Voice Mode** — `/voicemode`, Hindi support `/hindi`
- **Finance** — `/audit` for on-demand financial audits
- **Private Messenger** — Agents can send proactive Telegram DMs to whitelisted users

> **"Zero human data entry = Zero errors."**

---

## 📋 Key Modules

### 🤖 AI Document Pipeline (`ag-associates-ai/`)

- **FastAPI** backend with LangGraph pipeline (Aisha → Drafter → Auditor) + 7 conversational agents
- **Multi-Agent System** — Redis Streams agent bus, PostgreSQL conversation memory, RBAC per agent
- **Multi-Modal Pipeline** — any-to-any file understanding: audio → Whisper, images → OCR (Qwen2.5-VL), PDF → pdfplumber, Excel → openpyxl, DOCX → python-docx
- **Supervisor Agent** — orchestrates agents with HTTP deploys, webhook hardening, toggle persistence
- **NOI (Notice of Intimation)** processing with full state machine (DOCUMENTS_RECEIVED → COMPLETED, 9 states)
- **NeSL e-Filing** integration for legal notice submission
- **PDF Generation** via ReportLab (Title Reports, Legal Scrutiny Reports)
- **RAG** with pgvector (384-dim) for legal template retrieval
- **Telegram Bot** microservice — OTP relay, voice mode, Hindi support, 7 agent commands, private messenger
- **Circuit Breaker** pattern for external API resilience

### 📱 Legal Operations Platform (`ag-platform/`)

- **Case Management** with 10-state state machine (RECEIVED → CLOSED), 13 case types
- **Bank Portal** with Supabase RLS isolation per financial institution
- **Document Vault** with 60-second signed URLs
- **Real-time Collaboration** — presence, comments, tasks
- **Time Tracking & Billing** — floating live timer, auto-generated utilization reports
- **Client Portal** — passwordless Magic Links with progress bars
- **Supabase Auth** — magic link, OAuth, RBAC with role-based views
- **Landing Page** — Editorial-theme GSAP scroll storytelling at `landing/index.html`

### 📬 Intake & Communications

- **Intake API** (Fastify) — high-performance gateway for bank-panel intake, SMS webhook, Redis-backed OTP bridge at `services/intake-api/`
- **Coordinator Bot** (Telegraf) — hierarchical agent orchestration via Telegram at `services/coordinator/`
- **Telegram Bot** — `/agents`, `/agent <name> <message>`, `/otp`, `/autootp`, `/claim`, `/voicemode`, `/hindi`, `/audit` commands
- **Email Intake** — IMAP-based case creation from forwarded emails at `services/email-intake/`
- **WhatsApp Webhook** — `/webhooks/whatsapp` endpoint for Meta API integration

---

## 📁 Repository Structure

```
AGASSOCIATES/
│
├── ag-associates-ai/              # 🤖 AI Document Pipeline
│   ├── backend/
│   │   ├── agents/                #   7 conversational agents (Auditor, Vyasa, Bouncer, etc.)
│   │   │   ├── agent_bus.py       #   Redis Streams communication bus
│   │   │   ├── base_agent.py      #   BaseAgent class for all agents
│   │   │   ├── agent_registry.py  #   Agent discovery + RBAC mapping
│   │   │   ├── agent_memory.py    #   PostgreSQL conversation memory
│   │   │   ├── agent_init.py      #   init_agents() at startup
│   │   │   ├── auditor/           #   Hinglish financial auditor
│   │   │   ├── vyasa/             #   Hinglish legal researcher
│   │   │   ├── bouncer/           #   Hinglish math validator
│   │   │   ├── accountant/        #   Hinglish accounting agent
│   │   │   ├── noi/               #   Hinglish NOI specialist
│   │   │   ├── executor/          #   Hinglish RPA executor
│   │   │   └── drafter/           #   Hinglish document drafter
│   │   ├── telegram_bot/          #   Standalone Telegram microservice
│   │   │   └── private_messenger.py # Agent-initiated proactive DMs
│   │   ├── media/                 #   Multi-modal file processors
│   │   │   ├── processors.py      #   Audio/Image/PDF/Excel/DOCX
│   │   │   └── router.py          #   File type → processor routing
│   │   ├── main.py                #   FastAPI entry (NOI, NeSL, voice, agents...)
│   │   ├── agents.py              #   LangGraph pipeline (Aisha → Drafter → Auditor)
│   │   ├── noi_agent.py           #   NOI workflow state machine
│   │   ├── config.py              #   Environment configuration w/ defaults
│   │   ├── pdf_generator.py       #   ReportLab legal document output
│   │   └── requirements.txt       #   Python dependencies
│   ├── frontend/                  #   Next.js 15 dashboard (NOI, chat, cases)
│   ├── database/
│   │   ├── init.sql               #   PostgreSQL + pgvector schema
│   │   └── agent_migrations.sql   #   Multi-agent DB tables
│   └── docker-compose.yml         #   PostgreSQL + n8n services
│
├── ag-platform/                   # 📋 Legal Operations Platform
│   ├── src/
│   │   ├── components/            #   React UI (admin, AI, bank, collaboration)
│   │   ├── server/                #   Express routes, AI router, migrations
│   │   └── lib/                   #   Shared utilities, billing, storage
│   ├── packages/
│   │   ├── ai/                    #   Gemini AI utilities (Vercel AI SDK)
│   │   ├── db/                    #   Drizzle ORM schemas
│   │   ├── types/                 #   Shared TypeScript interfaces
│   │   └── ui/                    #   Shared shadcn/ui components
│   ├── services/
│   │   ├── intake-api/            #   🚀 Fastify gateway for bank intake + OTP
│   │   ├── coordinator/           #   🤖 Telegraf Telegram bot orchestration
│   │   └── email-intake/          #   📧 IMAP-based email → case creation
│   ├── tests/                     #   Vitest test suite
│   ├── supabase/migrations/       #   Database migrations
│   ├── server.ts                  #   Express + Vite middleware entry
│   └── docker-compose.yml         #   PostgreSQL + n8n services
│
├── landing/
│   └── index.html                # 🎨 Editorial-theme GSAP scroll landing page
├── docker-compose.prod.yml       # 🐳 10-service production stack
├── Caddyfile                     # 🌐 Caddy reverse proxy + auto-TLS
├── Caddyfile.waf                 # 🛡️ ModSecurity WAF with OWASP CRS
├── Makefile                      # 🔧 Automation targets (ci, dev, lint, etc.)
├── scripts/                      # 📜 Provision, deploy, bootstrap helpers
├── coolify/                      # 🌐 Coolify service configurations
├── monitoring/                   # 📊 Prometheus alerts + Grafana dashboards
├── scripts/                      # 📜 Provision, deploy, backup, rotate, migrate
├── .github/workflows/            # ⚙️ CI + Deploy + Tagging + Security workflows
├── tasks/                        # 📋 Task tracking (todo.md) + lessons (lessons.md)
├── docs/                         # 📚 ADRs, NOI pipeline, strategic plan
├── content/                      # 📄 Static marketing content (GitHub Pages)
├── CLAUDE.md                     # 📖 AI agent playbook (architecture, gotchas)
├── AGENTS.md                     # 📖 OpenCode session guide
├── AUTOMATION_PLAN.md            # 📋 Full automation roadmap
└── *_GUIDELINES.md               # 📐 Domain-specific engineering policies
```

---

## 🌐 Coolify Deployment (Open-Source PaaS)

**Coolify** is the open-source Heroku/Netlify alternative that runs on your VPS. It provides GitOps deployments, managed databases, auto-HTTPS, and monitoring — all on your own infrastructure.

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      COOLIFY ON HETZNER VPS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Hetzner CPX31 (4 vCPU, 8GB RAM, 160GB NVMe)  €16.90/mo                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Coolify (Open-Source PaaS)                                                 │
│  ├── GitOps: Push to main → Auto-deploy                                     │
│  ├── Auto HTTPS (Let's Encrypt)                                             │
│  ├── Managed PostgreSQL (pgvector enabled)                                  │
│  ├── Managed Redis                                                          │
│  ├── Managed MinIO (S3-compatible storage)                                  │
│  ├── Prometheus + Grafana + Loki (Built-in)                                 │
│  ├── Automated Backups (S3/MinIO)                                           │
│  ├── Resource Monitoring & Alerting                                         │
│  └── Zero-downtime Deployments                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  Services (Auto-deployed via Coolify)                                       │
│  ├── ag-ai-backend (FastAPI)                                                │
│  ├── ai-dashboard (Next.js)                                                 │
│  ├── ag-platform (Vite + Express)                                           │
│  ├── intake-api (Fastify)                                                   │
│  ├── telegram-bot (Worker)                                                  │
│  ├── email-intake (Worker)                                                  │
│  ├── coordinator (Worker)                                                   │
│  ├── n8n (Optional)                                                         │
│  └── Caddy (Static sites via Coolify)                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Coolify Service Configurations

All service definitions are in the `coolify/` directory:

| Service | Config File | Type | Port | Domain |
|---------|-------------|------|------|--------|
| `ag-ai-backend` | `coolify-ag-ai-backend.json` | Docker Compose | 8000 | api.${DOMAIN} |
| `ag-platform` | `coolify-ag-platform.json` | Docker Compose | 3001 | app.${DOMAIN} |
| `ai-dashboard` | `coolify-ai-dashboard.json` | Docker Compose | 3000 | dashboard.${DOMAIN} |
| `intake-api` | `coolify-intake-api.json` | Docker Compose | 3002 | intake.${DOMAIN} |
| `telegram-bot` | `coolify-telegram-bot.json` | Worker | — | — |
| `email-intake` | `coolify-email-intake.json` | Worker | — | — |
| `coordinator` | `coolify-coordinator.json` | Worker | 3005 | coordinator.${DOMAIN} |
| `n8n` | `coolify-n8n.json` | Docker Compose | 5678 | n8n.${DOMAIN} |

### Quick Deploy to Coolify

```bash
# 1. Provision Hetzner VPS (CPX31, Ubuntu 24.04)
# 2. Install Coolify
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# 3. Access Coolify UI at https://<VPS_IP>:8000
# 4. Connect GitHub repo: rajkhemani/AGASSOCIATES
# 5. Add resources in Coolify UI:
#    - PostgreSQL (enable pgvector extension)
#    - Redis
#    - MinIO (S3-compatible storage)
# 6. Add services using coolify/*.json configs
# 7. Configure domains → Auto-HTTPS via Let's Encrypt
# 7. Push to main → Auto-deploy
```

---

## 🔧 Automation Plan & Scripts

### Complete Automation Roadmap

The full automation roadmap is documented in [`AUTOMATION_PLAN.md`](./AUTOMATION_PLAN.md) with 7 phases:

| Phase | Focus | Status |
|-------|-------|--------|
| **1** | Critical Fixes & Migration | ✅ Complete |
| **2** | Coolify Deployment | 🔄 In Progress |
| **3** | GitOps CI/CD | ✅ Workflow Ready |
| **4** | Monitoring & Alerting | ✅ Configs Ready |
| **5** | Backup & DR | ✅ Scripts Ready |
| **6** | NOI Workflow Automation | ✅ Implemented |
| **7** | Security Hardening | ✅ Configs Ready |

### Key Automation Scripts

| Script | Purpose |
|--------|---------|
| `scripts/migrate.py` | Unified migration runner with tracking |
| `scripts/rotate_secrets.py` | 90-day secret rotation via Coolify API |
| `scripts/backup.sh` | Restic backup (PostgreSQL, Redis, volumes) |
| `scripts/bootstrap-vps.sh` | Idempotent VPS provisioning |
| `scripts/deploy-all.sh` | Master deployment automation |
| `scripts/provision.sh` | Infrastructure provisioning |

### GitOps CI/CD Pipeline

The pipeline is defined in `.github/workflows/`:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `main.yml` | Push/PR to main | CI: lint, type-check, test, build |
| `deploy.yml` | Push to main | Build → GHCR → SSH deploy to VPS |
| `coolify-deploy.yml` | Push/Dispatch | Trigger Coolify deploy via API |
| `security-scan.yml` | Push/PR | Trivy vulnerability scan |

---

## 🔒 Security Hardening

### mTLS Configuration

Complete mTLS configuration in [`security/mtls-config.yaml`](./security/mtls-config.yaml):

- **Root CA + Intermediate CA** for service mesh
- **90-day certificate rotation** with auto-renewal
- **STRICT mode** — all service-to-service communication encrypted
- **Coolify integration** for certificate management

### WAF Configuration

ModSecurity WAF with OWASP CRS in [`Caddyfile.waf`](./Caddyfile.waf):

- OWASP CRS 4.x rules
- Custom rules for SQL injection, XSS, path traversal, command injection
- Rate limiting (100 req/5min per IP)
- Geo-blocking support
- Bot detection
- Audit logging in JSON format

### Secret Management

Automated 90-day rotation via [`scripts/rotate_secrets.py`](./scripts/rotate_secrets.py):

- Coolify API integration for secret updates
- Automatic service redeployment
- Slack/Email/Teams notifications
- Dry-run mode for testing
- Rotation status dashboard

---

## 📊 Monitoring & Observability

### Prometheus Alerting Rules

Complete alerting in [`monitoring/alerts.yml`](./monitoring/alerts.yml):

| Alert Group | Key Alerts |
|-----------|------------|
| **Service Health** | ServiceDown, HighErrorRate, HighLatency |
| **Database** | ConnectionsHigh, ReplicationLag, LongRunningQueries |
| **Redis** | MemoryHigh, ConnectionsHigh, Down |
| **Infrastructure** | DiskSpace, CPU, Memory, NetworkErrors |
| **NOI Workflow** | Stuck, Failed, QueueBacklog, Latency, ValidationFailures |
| **Business** | CaseVolumeDrop, ChallanVolumeDrop, RevenueDrop, PaymentFailures |
| **SLA** | AvailabilityBreach, LatencyBreach, ErrorBudgetBurnRate |

### Grafana Dashboards

Pre-built dashboards in `monitoring/dashboards/`:
- Service health overview
- NOI workflow pipeline
- Business metrics (cases, challans, revenue)
- Infrastructure resources

---

## 💾 Backup & Disaster Recovery

### Automated Backups

[`scripts/backup.sh`](./scripts/backup.sh) with Restic:

- **PostgreSQL**: `pg_dump` → MinIO (encrypted)
- **Redis**: RDB snapshot → MinIO
- **Application volumes**: `/srv/ag/ag_output`, `/srv/ag/ag_documents`
- **Encryption**: AES-256
- **Retention**: 30 daily, 12 weekly, 12 monthly

### Disaster Recovery

- **RTO**: 30 minutes, **RPO**: 1 hour
- Automated restore scripts: [`scripts/restore.sh`](./scripts/restore.sh)
- DR test script: [`scripts/dr_test.sh`](./scripts/dr_test.sh)
- Backup verification: [`scripts/verify_backups.sh`](./scripts/verify_backups.sh)

---

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- Python 3.10+ (AI pipeline)
- Node.js 20+ (platform)
- Supabase account (PostgreSQL + auth)
- Redis (for agent bus, OTP cache, job queue)

---

## 📖 Detailed Setup Guide

### Phase 1: Infrastructure Setup

```bash
# Clone the repository
git clone https://github.com/rajkhemani/AGASSOCIATES.git
cd AGASSOCIATES

# Copy environment template
cp .env.example .env
# Edit .env with your credentials (see Environment Variables section below)
```

### Phase 2: AI Pipeline (LangGraph + Multi-Agent)

```bash
cd AGASSOCIATES/ag-associates-ai

# Start infrastructure (PostgreSQL + n8n)
docker-compose up -d

# Set up backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Install Playwright for RPA (required for IGR/GRAS automation)
playwright install chromium
playwright install-deps chromium

# One-time pgvector seeding
python generate_embeddings.py

# Run database migrations
psql -U agadmin -d agdb -f database/agent_migrations.sql
psql -U agadmin -d agdb -f database/init.sql

# Start AI backend (FastAPI at http://localhost:8001)
python main.py
```

#### vLLM Setup (for 7 conversational agents)

```bash
# Required for 7-agent conversational system
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-7B-Instruct \
  --host 0.0.0.0 --port 8000
```

#### Multi-Agent System (Redis Streams)

```bash
# Start Redis (required for agent bus, OTP cache, job queue)
docker run -d --name redis -p 6379:6379 redis:8-alpine

# Start AI backend (agents initialize automatically)
cd AGASSOCIATES/ag-associates-ai/backend
python main.py
```

### Phase 3: Operations Platform (`ag-platform/`)

```bash
cd AGASSOCIATES/ag-platform

# Install dependencies (uses Turborepo workspaces)
npm install

# Set up environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Run database migrations (creates all tables, RLS policies, triggers)
npm run dev  # This runs migrations automatically on startup

# Start development server (Vite + Express at http://localhost:3001)
npm run dev

# Run tests
npm test

# Type-check
npm run type-check

# Lint
npm run lint
```

### Platform Services

```bash
# Intake API (Fastify gateway for bank intake + OTP)
cd AGASSOCIATES/ag-platform/services/intake-api
npm install
npm run dev  # Fastify at http://localhost:3002

# Coordinator Telegram bot
cd AGASSOCIATES/ag-platform/services/coordinator
npm install
npm run dev  # Telegraf bot (separate process)

# Email Intake (IMAP-based)
cd AGASSOCIATES/ag-platform/services/email-intake
npm install
npm run dev
```

### Phase 4: AI Frontend Dashboard

```bash
cd AGASSOCIATES/ag-associates-ai/frontend
npm install
npm run dev  # Next.js at http://localhost:3000
```

### Pre-commit Hooks

```bash
cd AGASSOCIATES
pre-commit install  # ruff lint+fix + eslint on commit
pre-commit run --all-files  # run all hooks manually
```

---

## 🌐 Coolify Deployment (Production)

### Prerequisites

- Hetzner Cloud VPS (CPX31, 4 vCPU, 8GB RAM, 160GB NVMe) — €16.90/mo
- Domain with DNS pointing to VPS (`advadiityagade.com`)

### One-Command Deploy

```bash
# On VPS (as deploy user)
cd /srv/ag/repo
docker compose -f docker-compose.prod.yml up -d
```

### Automated Deploy via Coolify (GitOps)

1. **Provision VPS** (Hetzner CPX31, Ubuntu 24.04)
2. **Install Coolify**: `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash`
3. **Configure Resources** in Coolify UI:
   - PostgreSQL (enable pgvector)
   - Redis
   - MinIO (S3-compatible storage)
4. **Deploy Services** via `coolify/*.json` configs
5. **Configure Domains** → Auto-HTTPS via Let's Encrypt
6. **Push to main** → Auto-deploy via GitHub Actions

### CI/CD Pipeline

```yaml
# .github/workflows/coolify-deploy.yml triggers on push to main
# Triggers Coolify deploy via API
# Waits for deployment completion
# Runs smoke tests against deployed endpoints
```

---

## ⚙️ Environment Variables

### Required Variables (copy `.env.example` to `.env` and fill in)

| Category | Variables | Description |
|----------|-----------|-------------|
| **Supabase** | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` | Database, auth, RLS |
| **LLM** | `LLM_BASE_URL`, `LLM_MODEL_NAME`, `LLM_MOCK_MODE`, `LLM_VISION_API_KEY` | vLLM, Gemini, OCR |
| **Database** | `DATABASE_URL`, `DATABASE_PASSWORD` | PostgreSQL connection |
| **Redis** | `REDIS_URL`, `REDIS_PASSWORD` | Agent bus, OTP, job queue |
| **Telegram** | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET` | Bot, OTP, notifications |
| **NeSL/IGR** | `NESL_API_KEY`, `NESL_API_BASE_URL`, `IGR_PORTAL_USERNAME`, `IGR_PORTAL_PASSWORD` | Government filing |
| **Email** | `ZOHO_EMAIL_USER`, `ZOHO_EMAIL_PASS` | Email intake |
| **Webhooks** | `N8N_WEBHOOK_KEY`, `WHATSAPP_WEBHOOK_SECRET` | n8n, WhatsApp integration |
| **Payments** | `STRIPE_SECRET_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Billing |
| **Monitoring** | `SENTRY_DSN` | Error tracking |
| **CI/CD** | `GITHUB_TOKEN`, `VPS_SSH_KEY`, `VPS_HOST` | Deployment |

> **Note:** `.env.example` at repo root is the single authoritative source with 89+ variables. Copy it to `.env` and customize before running. Backend defaults in `config.py` include `secure_password_123` (dev-only — **must change for production**).

---

## 🏭 Production Deployment

### Health Checks

```bash
# Basic
curl https://api.advadiityagade.com/health

# Deep (checks DB, Redis, vLLM, Supabase, NeSL)
curl https://api.advadiityagade.com/health/deep

# Metrics
curl https://api.advadiityagade.com/metrics

# Queue metrics
curl https://api.advadiityagade.com/api/v1/queue/metrics
```

### Production Bootstrap

```bash
# On fresh VPS
apt update && apt install -y docker.io docker-compose-v2 fail2ban ufw
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw enable

# Create deploy user
useradd -m -s /bin/bash deploy
usermod -aG docker deploy
mkdir -p ~deploy/.ssh && chmod 700 ~deploy/.ssh

# Clone and deploy
cd /srv && mkdir ag && chown deploy:deploy ag
su deploy
git clone https://github.com/rajkhemani/AGASSOCIATES.git repo
cd repo
cp .env.example .env
# Edit .env with production values
docker compose -f docker-compose.prod.yml up -d
```

---

## 🔒 Security

- **Row-Level Security**: Supabase RLS isolates bank/client data at database level
- **Agent RBAC**: Per-agent access control (`agent.<name>.access`)
- **Data Sovereignty**: Deployed in EU (Nuremberg/Falkenstein) for GDPR compliance
- **Audit Logging**: Every case state transition logged to immutable `audit_trail`
- **Document Vault**: Private buckets with 60-second signed URLs
- **Magic Links**: Passwordless client access with time-limited tokens
- **Webhook Auth**: `x-api-key` verification via `secrets.compare_digest`
- **Secret Scanning**: Pre-commit hook (`detect-private-key`) prevents credential leaks
- **Circuit Breaker**: External API resilience with HITL failover
- **mTLS**: Service-to-service encryption via `security/mtls-config.yaml`
- **WAF**: ModSecurity + OWASP CRS in `Caddyfile.waf`

---

## 🗺 Roadmap

### Phase 6: Multi-Agent Intelligence (In Progress)

- [ ] Agent health monitoring (heartbeat, error rate, latency)
- [ ] Agent-to-agent tracing (OpenTelemetry across Redis Streams)
- [ ] RAG evaluation pipeline (precision@k, recall, hallucination rate)
- [ ] Document classification router (auto-route to Auditor/Vyasa/Bouncer)
- [ ] Excel Chat Bot (NL→SQL on case/disbursement data)
- [ ] Semantic case search (pgvector on case_timeline + documents)

### Phase 7: luxor9 SaaS Platform

- [ ] Multi-tenant architecture (org_id parameterized)
- [ ] Stripe/Razorpay billing + webhook handling
- [ ] Self-serve onboarding wizard (org → bank panel → team → go live)
- [ ] White-label bank portal (custom domain, branding, SSO)
- [ ] Usage metering + quota enforcement (AI tokens, RPA runs, API calls)
- [ ] Partner program (referral tracking, revenue share)
- [ ] Documentation portal + API docs (OpenAPI)

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines, commit conventions, and code standards.

### AI Agent Playbooks

| Agent | Playbook | Coverage |
|-------|----------|----------|
| **Claude Code** | [`CLAUDE.md`](./CLAUDE.md) | Architecture, dev commands, repo gotchas, workflow orchestration |
| **OpenCode** | [`AGENTS.md`](./AGENTS.md) | Session guidance, corrections, subsystem boundaries |

### Engineering Guidelines

Domain-specific policies in root-level `*_GUIDELINES.md`:

- `GIT_GUIDELINES.md` · `TDD_GUIDELINES.md` · `REFACTORING_GUIDELINES.md`
- `ERROR_HANDLING_GUIDELINES.md` · `HALLUCINATION_MITIGATION_GUIDELINES.md`
- `FRONTEND_UI_GUIDELINES.md` · `RAG_AND_MEMORY_GUIDELINES.md`
- `GOAL_DRIVEN_EXECUTION_GUIDELINES.md` · `DEPLOYMENT_PLAYBOOK.md`

### Pre-commit Enforcement

```bash
pre-commit install  # ruff lint+format + eslint on commit
pre-commit run --all-files  # run all hooks manually
```

---

## 📜 License

Proprietary — AG Associates, Thane, Maharashtra.

See [LICENSE](./LICENSE) for details.

---

<p align="center">
  <sub>Built by <strong><a href="https://github.com/rajkhemani">Raj Khemani</a></strong> · LUXORANOVA</sub>
  <br/>
  <sub>Powered by LangGraph, Supabase, Gemini Pro & Groq · Serving 15,000 panel advocate firms across India</sub>
</p>