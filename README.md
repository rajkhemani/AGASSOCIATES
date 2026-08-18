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
  <a href="https://github.com/rajkhemani/AGASSOCIATES/stargazers"><img src="https://img.shields.io/github/stars/rajkhemani/AGASSOCIATES?style=flat-square" alt="Stars"></a>
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
│   └── server.ts                  #   Express + Vite middleware entry
│
├── landing/
│   └── index.html                # 🎨 Editorial-theme GSAP scroll landing page
├── docker-compose.prod.yml       # 🐳 10-service production stack
├── Caddyfile                     # 🌐 Caddy reverse proxy + auto-TLS
├── Makefile                      # 🔧 Automation targets (ci, dev, lint, etc.)
├── scripts/                      # 📜 Provision, deploy, bootstrap helpers
├── .github/workflows/            # ⚙️ CI + Deploy + Tagging workflows
├── tasks/                        # 📋 Task tracking (todo.md) + lessons (lessons.md)
├── docs/                         # 📚 ADRs, NOI pipeline, strategic plan
├── content/                      # 📄 Static marketing content (GitHub Pages)
├── CLAUDE.md                     # 📖 AI agent playbook (architecture, gotchas)
└── *_GUIDELINES.md               # 📐 Domain-specific engineering policies
```

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

## 🏗 Phase-by-Phase Feature Overview

### Phase 1: Security Hardening ✅
- **JWT bypass replaced** with real Supabase Auth (`@supabase/ssr`)
- **RLS enabled** on all 10 tables with org isolation policies
- **Zod validation** on all API routes (cases, timesheets, documents, invoices, banks)
- **CORS** with strict allowlist + credentials
- **Rate limiting**: global (1000/15min), auth (20/15min), webhooks (60/min), AI (100/15min)

### Phase 2: Test Suites ✅
- **ag-associates-ai (pytest)**: 55 tests (NOI agent, executor/RPA, multi-agent)
- **ag-platform (Vitest)**: 9 tests (validation, auth, routes)
- **CI**: GitHub Actions runs both suites with coverage thresholds

### Phase 3: Observability ✅
- **ag-associates-ai**: `structlog` + correlation IDs, Prometheus metrics (`/metrics`), OpenTelemetry tracing, `/health/deep`
- **ag-platform**: `pino` structured logging, Prometheus metrics (`/metrics`), deep health checks

### Phase 4: API Versioning & Architecture ✅
- All routes under `/api/v1/` prefix
- OpenAPI 3.0 spec + Scalar docs at `/api/v1/docs`
- Turborepo fixed: Vite app moved to `apps/web/`

### Phase 5: Data Integrity & Workflow Engine ✅

| Sub-phase | Feature | Key Capabilities |
|-----------|---------|------------------|
| **5A** | Real NeSL/IGR | Idempotency keys, retry logic, Redis deduplication, circuit breaker + HITL |
| **5B** | Billing Engine | `generateInvoiceFromTimesheets()`, bank advance reconciliation, cron for overdue |
| **5C** | Job Queue | BullMQ (10 queues), workers, cron (overdue 9AM, reconciliation 10-6PM, bank sync 30min) |
| **5D** | File Upload | Supabase Storage signed URLs, direct client-to-storage, complete flow |
| **5E** | Audit Trail | `audit_trail` table + triggers, `AuditEvents` namespace (40+ event types) |
| **5F** | SLA/Escalation | Per-case-type configs, business-hours deadlines, auto-escalation, dashboard |
| **5G** | Bank Portals | White-label configs, per-bank workflows (Kotak/HDFC/ICICI defaults) |

---

## 🔌 API Reference

### Base URL
```
Development: http://localhost:3001/api/v1
Production:  https://api.advadiityagade.com/api/v1
```

### Authentication
```
Authorization: Bearer <Supabase JWT>
X-Request-ID: <auto-generated>
```

### Core Endpoints

| Resource | Endpoints |
|----------|-----------|
| **Auth** | `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `POST /auth/logout`, `POST /auth/refresh` |
| **Cases** | `GET /cases`, `POST /cases`, `GET /cases/:id`, `PATCH /cases/:id`, `PUT /cases/:id/status`, `GET /cases/:id/timeline`, `GET /cases/stats` |
| **Documents** | `GET /cases/:caseId/documents`, `POST /cases/:caseId/documents/upload-url`, `POST /cases/:caseId/documents/complete`, `GET /cases/:caseId/documents/:documentId/download`, `DELETE /cases/:caseId/documents/:documentId`, `GET /cases/:caseId/documents/list` |
| **Timesheets** | `GET /timesheets`, `POST /timesheets`, `GET /cases/:caseId/billable`, `GET /summary` |
| **Invoices** | `POST /invoices`, `GET /invoices`, `GET /invoices/outstanding`, `GET /invoices/:id`, `POST /invoices/:id/send`, `POST /invoices/:id/paid`, `POST /invoices/auto-overdue` |
| **Bank Portal** | `GET /bank-portal`, `POST /bank-portal`, `GET /bank-portal/:bankId`, `GET/POST /bank-portal/:bankId/workflows`, `POST /bank-portal/:bankId/initialize`, `GET /bank-portal/public/:domain` |
| **Dashboard** | `GET /dashboard/status`, `GET /dashboard/sla`, `POST /dashboard/sla/check` |
| **AI** | `POST /ai/generate-brief`, `POST /ai/suggest-tasks`, `POST /ai/draft-email`, `POST /ai/send-email`, `POST /ai/invoice-line-item`, `POST /ai/summarize-document`, `POST /ai/search-projects`, `POST /ai/ingest-project`, `POST /ai/vet-document` |
| **System** | `GET /health`, `GET /health/deep`, `GET /metrics`, `GET /api/v1/queue/metrics` |
| **Webhooks** | `POST /webhooks/virus-scan`, `POST /webhooks/whatsapp`, `POST /webhooks/n8n/intake` |

### Example: Create Case

```bash
curl -X POST http://localhost:3001/api/v1/cases \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "borrower_name": "Rajesh Kumar",
    "org_id": "7f45dc5f-6bef-4fae-b46a-a2306e69936d",
    "bank_id": "7407ac8f-0cb7-434e-994c-4329a11939a7",
    "case_type": "INTIMATION_MORTGAGE",
    "loan_amount": 5000000,
    "property_address": "Flat 101, Building A, Thane West",
    "property_city": "Thane"
  }'
```

### Example: Generate Invoice from Timesheets

```bash
curl -X POST http://localhost:3001/api/v1/invoices \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "case_ids": ["uuid-1", "uuid-2"],
    "bank_id": "7407ac8f-0cb7-434e-994c-4329a11939a7",
    "tax_rate": 0.18,
    "payment_terms_days": 30
  }'
```

### Example: Get Signed Document Upload URL

```bash
curl -X POST http://localhost:3001/api/v1/cases/<case-id>/documents/upload-url \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "sanction_letter.pdf",
    "contentType": "application/pdf",
    "category": "sanction_letter"
  }'
```

---

## 🏭 Production Deployment

### Prerequisites

- Hetzner Cloud VPS (CCX23, 4 vCPU, 32 GB RAM) — Ubuntu 22.04 LTS
- Docker 24+ & Docker Compose v2
- Domain with DNS pointing to VPS (`advadiityagade.com`)
- GitHub repository with Actions enabled

### One-Command Deploy

```bash
# On VPS (as deploy user)
cd /srv/ag/repo
docker compose -f docker-compose.prod.yml up -d
```

### CI/CD Pipeline (Automatic on push to `main`)

```yaml
# .github/workflows/deploy.yml triggers on:
# - ag-associates-ai/** changes
# - ag-platform/** changes
# - docker-compose.prod.yml changes

# Builds 3 images → GHCR → SSH deploy to VPS
# Smoke test: GET https://api.advadiityagade.com/health → 200 OK
```

### Required GitHub Secrets

| Secret | Value |
|--------|-------|
| `VPS_HOST` | `46.225.185.91` |
| `VPS_PORT` | `22` |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | Ed25519 private key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `SUPABASE_JWT_SECRET` | JWT secret |
| `GITHUB_TOKEN` | Auto-provided |

### Manual VPS Bootstrap

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

---

## 🔒 Security

- **Row-Level Security**: Supabase RLS isolates bank/client data at database level
- **Agent RBAC**: Per-agent access control (`agent.<name>.access`)
- **Data Sovereignty**: Deployed in `ap-south-1` (Mumbai) for Indian banking compliance
- **Audit Logging**: Every case state transition logged to immutable `audit_trail`
- **Document Vault**: Private buckets with 60-second signed URLs
- **Magic Links**: Passwordless client access with time-limited tokens
- **Webhook Auth**: `x-api-key` verification via `secrets.compare_digest`
- **Secret Scanning**: Pre-commit hook (`detect-private-key`) prevents credential leaks
- **Circuit Breaker**: External API resilience with HITL failover

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