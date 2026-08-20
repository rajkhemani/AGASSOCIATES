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
  <a href="https://github.com/rajkhemani/AGASSOCIATES/blob/main/LICENSE"><img src="https://img.shields.io/github/license/rajkhemani/AGASSOCIATES?style=flat-square&alt=License"></a>
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
  <a href="#-contributing">Contributing</a> ·
  <a href="#-whatsapp-connect">WhatsApp Connect</a>
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
│  │  WhatsApp Business API (Cloud)                                │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │  Infrastructure Layer (Docker Compose · Caddy · GHCR)        │   │
│  │  Supabase (PostgreSQL + RLS + Auth) · pgvector · Groq        │   │
│  │  FastAPI (Python) · Express (Node.js) · Redis                │   │
│  │  Coolify (GitOps · Monitoring · Auto-HTTPS)                  │   │
│  └───────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **AI Reasoning** | Groq `llama-3.3-70b-versatile` | Complex legal document analysis, contract vetting |
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui | Dashboard app with glassmorphism design |
| **Backend (AI)** | FastAPI + LangGraph + Uvicorn | Multi-agent pipeline, document generation |
| **Backend (Platform)** | Express 5 + Vite | Case management, collaboration, billing |
| **Database** | Supabase PostgreSQL + pgvector | Multi-tenant data, RLS, embeddings |
| **Cache / Jobs** | Redis | Agent bus, OTP storage, job queue, session cache |
| **Microservices** | Telegram Bot (pgram), Intake API (Fastify), Email Intake | Decoupled communication channels |
| **LLM (fallback)** | Qwen2.5-7B-Instruct (local vLLM) | Aisha/Auditor chat, document drafting |
| **Embeddings** | SentenceTransformer (`all-MiniLM-L6-v2`) | RAG template retrieval (384-dim) |
| **Webhook** | Caddy reverse proxy + auto-TLS | Public-facing unified ingress |
| **CI/CD** | GitHub Actions → GHCR → Docker Compose | Fully automated deploy to VPS |
| **Monitoring** | Prometheus + Grafana + Loki | Metrics, logs, dashboards |
| **Orchestration** | Coolify (Open-Source PaaS) | GitOps deploy, managed DBs, auto-HTTPS |

---

## 🤖 The AI "Agentic" Workforce

The platform deploys two layers of AI agents — a **LangGraph document pipeline** for automated document processing, and a **multi-agent conversational system** with Hinglish personalities, Redis Streams coordination, RBAC, and multi-modal capabilities.

### Document Pipeline (LangGraph)

A `StateGraph` pipeline processing raw intake → structured data → drafted document → audited output:

| Agent | Role | What It Does |
|-------|------|-------------|
| **Aisha** | Intake | Parses incoming case requests, extracts structured JSON (tenant, landlord, rent, dates, deposit) via Groq, classifies case type |
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

- **Intake API** (Fastify) — high-performance gateway for bank-panel intake, SMS webhook, Redis-backed OTP bridge at `ag-platform/services/intake-api/`
- **Coordinator Bot** (Telegraf) — hierarchical agent orchestration via Telegram at `ag-platform/services/coordinator/`
- **Telegram Bot** — `/agents`, `/agent <name> <message>`, `/otp`, `/autootp`, `/claim`, `/voicemode`, `/hindi`, `/audit` commands
- **Email Intake** — IMAP-based case creation from forwarded emails at `ag-associates-ai/backend/email_intake/`
- **WhatsApp Business API** — Direct Cloud API connection with QR/barcode provisioning (see [WhatsApp Connect](#-whatsapp-connect))

---

## 📁 Repository Structure

```
AGASSOCIATES/
│
├── ag-associates-ai/              # 🤖 AI Document Pipeline
│   ├── backend/                   #   FastAPI + LangGraph + multi-agent
│   │   ├── agents/                #   7 conversational agents
│   │   │   ├── agent_bus.py       #   Redis Streams communication bus
│   │   │   ├── base_agent.py      #   BaseAgent class for all agents
│   │   │   ├── agent_registry.py  #   Agent discovery + RBAC mapping
│   │   │   ├── agent_memory.py    #   PostgreSQL conversation memory
│   │   │   ├── agent_init.py      #   init_agents() at startup
│   │   │   ├── auditor/           #   Financial auditor
│   │   │   ├── vyasa/             #   Legal researcher
│   │   │   ├── bouncer/           #   Math validator
│   │   │   ├── accountant/        #   Accounting agent
│   │   │   ├── noi/               #   NOI workflow specialist
│   │   │   ├── executor/          #   RPA executor
│   │   │   └── drafter/           #   Document drafter
│   │   ├── telegram_bot/          #   Telegram microservice
│   │   │   └── private_messenger.py # Agent-initiated proactive DMs
│   │   ├── media/                 #   Multi-modal file processors
│   │   │   ├── processors.py      #   Audio/Image/PDF/Excel/DOCX
│   │   │   └── router.py          #   File type → processor routing
│   │   ├── email_intake/          #   IMAP-based email → case creation
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
│   ├── apps/web/                  #   Marketing site + dashboard scaffold
│   ├── src/                       #   Vite + React frontend + Express backend
│   │   ├── app/                   #   App routes (login, dashboard, cases)
│   │   ├── components/            #   React UI (admin, AI, bank, collaboration)
│   │   ├── server/                #   Express routes, AI router, migrations
│   │   └── lib/                   #   Shared utilities, billing, storage
│   ├── packages/                  #   Shared workspaces
│   │   ├── ai/                    #   Gemini AI utilities (Vercel AI SDK)
│   │   ├── db/                    #   Drizzle ORM schemas
│   │   ├── types/                 #   Shared TypeScript interfaces
│   │   └── ui/                    #   Shared shadcn/ui components
│   ├── services/                  #   Microservices
│   │   ├── intake-api/            #   🚀 Fastify gateway for bank intake + OTP
│   │   └── coordinator/           #   🤖 Telegraf Telegram bot orchestration
│   ├── tests/                     #   Vitest test suite
│   ├── supabase/migrations/       #   Database migrations
│   ├── server.ts                  #   Express + Vite middleware entry
│   └── docker-compose.yml         #   PostgreSQL + n8n services
│
├── landing/
│   └── index.html                 # 🎨 Editorial-theme GSAP scroll landing page
├── docker-compose.prod.yml        # 🐳 Production stack
├── Caddyfile                      # 🌐 Caddy reverse proxy + auto-TLS
├── Caddyfile.waf                  # 🛡️ ModSecurity WAF with OWASP CRS
├── Makefile                       # 🔧 Automation targets (ci, dev, lint, etc.)
├── scripts/                       # 📜 Provision, deploy, bootstrap helpers
├── coolify/                       # 🌐 Coolify service configurations
├── monitoring/                    # 📊 Prometheus alerts + Grafana dashboards
├── docs/                          # 📚 ADRs, NOI pipeline, strategic plan
├── .github/workflows/             # ⚙️ CI + Deploy + Tagging + Security workflows
├── tasks/                         # 📋 Task tracking (todo.md) + lessons (lessons.md)
├── AGENTS.md                      # 📖 OpenCode session guide
├── CLAUDE.md                      # 📖 AI agent playbook (architecture, gotchas)
├── AUTOMATION_PLAN.md             # 📋 Full automation roadmap
└── *_GUIDELINES.md                # 📐 Domain-specific engineering policies
```

---

## 🌐 Coolify Deployment (Production)

### Prerequisites

- Hetzner Cloud VPS (CPX31, 4 vCPU, 8GB RAM, 160GB NVMe) — €16.90/mo
- Domain with DNS pointing to VPS (`advadiityagade.com`)

### One-Command Deploy

```bash
# On VPS (as deploy user), from repo root checked out to main
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

GitHub Actions builds on push to `main`:
- `ag-associates-ai/backend` — ruff lint/format check
- `ag-associates-ai/frontend` — lint + build
- `ag-platform` — lint + type-check + test + build
- Security scan — Trivy

Images are published to GHCR; production deploys via SSH + Docker Compose on VPS.

---

## ⚙️ Environment Variables

### Required Variables (copy `.env.example` to `.env` and fill in)

| Category | Variables | Description |
|----------|-----------|-------------|
| **Domain/Infra** | `DOMAIN`, `ACME_EMAIL` | Caddy/Let's Encrypt |
| **Supabase** | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` | Database, auth, RLS |
| **Database** | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL` | PostgreSQL |
| **Redis** | `REDIS_PASSWORD`, `REDIS_URL` | Agent bus, OTP, job queue |
| **LLM / AI** | `LLM_BASE_URL`, `LLM_MODEL_NAME`, `LLM_API_KEY`, `LLM_MOCK_MODE` | Production LLM (Groq) |
| **AI Backend** | `OPENAI_API_KEY`, `JWT_SECRET`, `AG_SESSION_SECRET` | Auth, fallback key |
| **Telegram** | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET` | Bot, OTP, notifications |
| **WhatsApp** | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_VERIFY_TOKEN` | Meta WhatsApp Business API |
| **n8n** | `N8N_WEBHOOK_KEY` | Webhook auth |
| **Email** | `EMAIL_IMAP_HOST`, `EMAIL_IMAP_PORT`, `EMAIL_IMAP_USER`, `EMAIL_IMAP_PASS` | Email intake |
| **Governments** | `NESL_API_KEY`, `NESL_CLIENT_ID`, `NESL_CLIENT_SECRET`, `IGR_PORTAL_USERNAME`, `IGR_PORTAL_PASSWORD` | Portals |
| **Payments** | `STRIPE_SECRET_KEY`, `RESEND_API_KEY` | Billing + email delivery |
| **Observability** | `SENTRY_DSN`, `ENVIRONMENT` | Error tracking |

> **Note:** `.env.example` at repo root is the single authoritative source. Backend defaults in `ag-associates-ai/backend/config.py` are dev-only and overridden in production.

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.10+ (AI pipeline)
- Node.js 20+ (platform)
- Supabase account (PostgreSQL + auth)
- Redis (for agent bus, OTP cache, job queue)

### Full Stack (recommended order)

```bash
# 1. Clone and configure
git clone https://github.com/rajkhemani/AGASSOCIATES.git
cd AGASSOCIATES
cp .env.example .env
# Edit .env for your environment

# 2. AI Pipeline
cd ag-associates-ai
docker-compose up -d
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
playwright install chromium && playwright install-deps chromium
python generate_embeddings.py
uvicorn main:app --reload --host 0.0.0.0 --port 8001

# 3. AI Frontend (optional)
cd ../frontend
npm install && npm run dev   # Next.js at http://localhost:3000

# 4. Operations Platform
cd ../../ag-platform
npm install
npm run dev   # Vite + Express at http://localhost:3001

# 5. Services
cd services/intake-api && npm install && npm run dev   # Fastify at http://localhost:3002
cd ../coordinator && npm install && npm run dev        # Telegram bot orchestrator
cd ../../ag-associates-ai/backend/email_intake && npm install && npm run dev  # IMAP poller
```

### Pre-commit Hooks

```bash
cd E:\DSH\AGASSOCIATES
pre-commit install
pre-commit run --all-files
```

---

## 📖 Detailed Setup Guide

### Phase 1: Infrastructure Setup

```bash
git clone https://github.com/rajkhemani/AGASSOCIATES.git
cd AGASSOCIATES
cp .env.example .env
```

### Phase 2: AI Pipeline (LangGraph + Multi-Agent)

```bash
cd ag-associates-ai

# Start infrastructure (PostgreSQL + n8n)
docker-compose up -d

# Set up backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# One-time pgvector seeding
python generate_embeddings.py

# Migrate DB
psql -U agadmin -d agdb -f database/agent_migrations.sql
psql -U agadmin -d agdb -f database/init.sql

# Start AI backend (FastAPI at http://localhost:8001)
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### Phase 3: Operations Platform (`ag-platform/`)

```bash
cd ag-platform
npm install
npm run dev   # turbo: Vite frontend + Express backend
npm test
npm run type-check
npm run build
```

### Phase 4: AI Frontend Dashboard

```bash
cd ag-associates-ai/frontend
npm install
npm run dev   # Next.js at http://localhost:3000
```

---

## 🏭 Production Deployment

### Health Checks

```bash
curl https://api.advadiityagade.com/health
curl https://api.advadiityagade.com/health/deep
curl https://api.advadiityagade.com/metrics
curl https://api.advadiityagade.com/api/v1/queue/metrics
```

### Production Bootstrap

```bash
# On fresh VPS
apt update && apt install -y docker.io docker-compose-v2 fail2ban ufw
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw enable

useradd -m -s /bin/bash deploy
usermod -aG docker deploy
mkdir -p ~deploy/.ssh && chmod 700 ~deploy/.ssh

# As deploy user
cd /srv && mkdir -p ag && chown deploy:deploy ag
su - deploy
git clone https://github.com/rajkhemani/AGASSOCIATES.git repo
cd repo
git checkout main
cp .env.example .env
# Edit .env with production values
docker compose -f docker-compose.prod.yml up -d
```

---

## 📱 WhatsApp Connect (Direct QR/Barcode)

Use the built-in WhatsApp connection endpoint to provision or re-link WhatsApp Business via QR/barcode without relying on unofficial scrapers.

### Prerequisites

- Meta WhatsApp Business Account
- Verified Business Phone Number
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID` in `.env`

### Direct Connect Flow

```bash
# 1. Request a direct-session QR/barcode from the AI backend
curl -H "x-api-key: $N8N_WEBHOOK_KEY" \
  https://api.advadiityagade.com/api/whatsapp/directConnect/qr

# 2. Response includes an image or data URL for the current pairing session
#    Example response:
#    {
#      "status": "awaiting_scan",
#      "qr": "https://cdn.agassociates.in/whatsapp/qr/session-<id>.png",
#      "session_id": "<uuid>",
#      "expires_in_seconds": 120
#    }

# 3. Open the QR in the dashboard or display it on the terminal
#    Scan with WhatsApp → Linked Devices → Link a Device

# 4. Poll for connection status
curl -H "x-api-key: $N8N_WEBHOOK_KEY" \
  https://api.advadiityagade.com/api/whatsapp/directConnect/status/<session_id>
```

### Environment Variables for WhatsApp Direct Connect

| Variable | Purpose |
|----------|---------|
| `WHATSAPP_ACCESS_TOKEN` | Meta Graph API token for the WhatsApp Business app |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone number ID to send/receive messages |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Business account containing the phone number |
| `WHATSAPP_VERIFY_TOKEN` | Webhook verification token for inbound events |
| `WHATSAPP_DIRECT_CONNECT_TTL_SECONDS` | Optional: QR session TTL (default `120`) |

### Notes

- Prefer **WhatsApp Business Cloud API** direct flow over unofficial WhatsApp Web scraping.
- If QR provisioning fails, verify the phone number is registered and the access token has `whatsapp_business_messaging` + `whatsapp_business_management` scopes.
- For testing, you can use Meta's test phone numbers to avoid sending real user messages.

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines, commit conventions, and code standards.

### Engineering Guidelines

Domain-specific policies in root-level `*_GUIDELINES.md` files:

- `GIT_GUIDELINES.md` · `TDD_GUIDELINES.md` · `REFACTORING_GUIDELINES.md`
- `ERROR_HANDLING_GUIDELINES.md` · `HALLUCINATION_MITIGATION_GUIDELINES.md`
- `FRONTEND_UI_GUIDELINES.md` · `RAG_AND_MEMORY_GUIDELINES.md`
- `GOAL_DRIVEN_EXECUTION_GUIDELINES.md` · `DEPLOYMENT_PLAYBOOK.md`

### Pre-commit Enforcement

```bash
pre-commit install  # ruff lint+fix + eslint on commit
pre-commit run ---all-files  # run all hooks manually
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