<p align="center">
  <h1 align="center">⚖️ AG Associates</h1>
  <p align="center">
    <strong>AI-Driven Legal Operations &amp; SaaS Platform for Panel Advocates</strong>
  </p>
  <p align="center">
    Zero-Staff Automation · Title Search &amp; Registration · Bank Panel Operations · White-Label SaaS
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
- 🏦 **Bank-panel ready from day one** — ICICI, Kotak, Axis, Muthoot, Chola, Karur Vysya integration
- 🇮🇳 **India-first** — Maharashtra SRO data, stamp duty engines, Marathi/Hindi support baked in
- 🔄 **White-label DNA** — Multi-tenant from the first commit, not bolted on later

## 📖 About

**AG Associates** is a specialized property law firm based in **Thane, Maharashtra**, serving as Panel Advocate for major Indian banks and NBFCs including **Kotak Mahindra Bank, ICICI Bank, Axis Finance, Karur Vysya Bank, Muthoot Homefin, Cholamandalam Finance**, and **Easy Home Finance**.

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
| **LLM** | llama-3.3-70b-versatile (Groq API) | Aisha/Auditor chat, document drafting |
| **Embeddings** | SentenceTransformer (`all-MiniLM-L6-v2`) | RAG template retrieval (384-dim) |
| **Webhook** | Caddy reverse proxy + auto-TLS | Public-facing unified ingress |
| **CI/CD** | GitHub Actions → GHCR → Docker Compose | Fully automated deploy to VPS |
| **Monitoring** | Sentry (optional) | Error tracking with env-based sampling |

---

## 🤖 The AI "Agentic" Workforce

Six specialized AI agents simulate a traditional law firm hierarchy at machine speed:

| Agent | Role | What It Does |
|-------|------|-------------|
| **Aisha** | Intake | Processes incoming case requests, extracts structured data from documents, classifies case type |
| **Vyasa** | Research | Legal opinion generation, Title Search analysis, precedent research |
| **Drafter** | Legal Architect | Automates creation of Title Reports, Legal Scrutiny Reports, Public Notices, Agreement drafts |
| **Executor** | Workflow Manager | Manages workflow triggers, SLA tracking, field assignment, OTP relay via Telegram |
| **Auditor** | Compliance | Legal compliance verification, error-checking, quality scoring (pass ≥ 85/100) |
| **Accountant** | Finance | Ingests bank statements (pdfplumber), parses UTR/Loan numbers, reconciles with master ledgers |

> **"Zero human data entry = Zero errors."**

---

## 📋 Key Modules

### 🤖 AI Document Pipeline (`ag-associates-ai/`)
- **FastAPI** backend with modular `agents/` directory (12 specialized agents)
- **LangGraph** orchestrated pipeline: Aisha → Drafter → Auditor
- **NOI (Notice of Intimidation)** processing with Redis-backed ticking timebomb dashboard
- **NeSL e-Filing** integration for legal notice submission
- **PDF Generation** via ReportLab (Title Reports, Legal Scrutiny Reports)
- **RAG** with pgvector (384-dim) for legal template retrieval
- **Telegram Bot** microservice — OTP relay, voice mode, Hindi support, finance audit
- **Circuit Breaker** pattern for external API resilience

### 📱 Legal Operations Platform (`ag-platform/`)
- **Case Management** with 10-state state machine (RECEIVED → CLOSED), 13 case types
- **Bank Portal** with Supabase RLS isolation per financial institution
- **Document Vault** with 60-second signed URLs
- **Real-time Collaboration** — presence, comments, tasks
- **Time Tracking & Billing** — floating live timer, auto-generated utilization reports
- **Client Portal** — passwordless Magic Links with progress bars
- **Supabase Auth** — magic link, OAuth, RBAC with role-based views

### 📬 Intake & Communications
- **Intake API** (Fastify/Express) — SMS webhook, OTP bridge with Redis
- **Telegram Bot** — `/otp`, `/autootp`, `/claim`, `/aisha`, `/voicemode`, `/hindi`, `/audit` commands
- **Email Intake** — IMAP-based case creation from forwarded emails
- **WhatsApp Webhook** — `/webhooks/whatsapp` endpoint for Meta API integration

---

## 📁 Repository Structure

```
AGASSOCIATES/
│
├── ag-associates-ai/              # 🤖 AI Document Pipeline
│   ├── backend/
│   │   ├── agents/                #   12 modular agents (aisha, drafter, auditor...)
│   │   ├── telegram_bot/          #   Standalone Telegram microservice (bot.py, db.py)
│   │   ├── main.py                #   FastAPI entry (NOI, NeSL, Aisha, SMS, HITL...)
│   │   ├── agents.py              #   LangGraph 6-agent pipeline (legacy entry)
│   │   ├── config.py              #   Environment configuration w/ defaults
│   │   ├── pdf_generator.py       #   ReportLab legal document output
│   │   └── requirements.txt       #   Python dependencies
│   ├── frontend/                  #   Next.js 15 dashboard (NOI, chat, cases)
│   ├── database/
│   │   └── init.sql               #   PostgreSQL + pgvector schema
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
│   │   └── intake-api/            #   🚀 Fastify Intake Bot & OTP Bridge
│   ├── supabase/migrations/       #   Database migrations
│   └── server.ts                  #   Express + Vite middleware entry
│
├── apps/
│   └── agos-android/             # 📱 Android client (AI Studio, Jetpack Compose)
│
├── docker-compose.prod.yml       # 🐳 10-service production stack
├── Caddyfile                     # 🌐 Caddy reverse proxy + auto-TLS
├── Makefile                      # 🔧 19 automation targets
├── scripts/                      # 📜 Provision, deploy, bootstrap helpers
├── .github/workflows/            # ⚙️ CI + Deploy + Tagging workflows
├── CLAUDE.md                     # 📖 AI agent playbook (architecture, gotchas)
├── tasks/                        # 📋 Task tracking & shared agent lessons
└── docs/                         # 📚 ADRs, NOI pipeline, strategic plan
```

---

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- Python 3.10+ (AI pipeline)
- Node.js 20+ (platform)
- Supabase account (PostgreSQL + auth)

### AI Pipeline

```bash
git clone https://github.com/rajkhemani/AGASSOCIATES.git
cd AGASSOCIATES/ag-associates-ai

# Start infrastructure (PostgreSQL + n8n)
docker-compose up -d

# Set up backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python generate_embeddings.py    # seed pgvector (one-time)
python main.py                   # API at http://localhost:8000
```

### Frontend Dashboard

```bash
cd AGASSOCIATES/ag-associates-ai/frontend
npm install
npm run dev                      # Next.js at http://localhost:3000
```

### Operations Platform

```bash
cd AGASSOCIATES/ag-platform
npm install
npm run dev                      # Vite + Express at http://localhost:3001
```

### Production Deploy

```bash
cd AGASSOCIATES
docker compose -f docker-compose.prod.yml up -d
```

---

## ⚙️ Environment Variables

| File | Purpose | Key Variables |
|------|---------|---------------|
| `ag-associates-ai/backend/config.py` | Python backend (env-based defaults) | `LLM_BASE_URL`, `LLM_MODEL_NAME`, `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| `ag-platform/.env` | Platform + Supabase | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GEMINI_API_KEY` |
| `docker-compose.prod.yml` | Production stack | `POSTGRES_*`, `REDIS_*`, `CADDY_*`, `SENTRY_*`, `N8N_*` |

> **Note:** `.env.example` files do not exist in this repo. Trust `config.py` defaults and the production compose file for variable reference.

---

## 🗺 Roadmap

### Phase 1: Internal Automation ✅
- [x] Database schema + Supabase RBAC authentication
- [x] Core case management engine (13 case types)
- [x] AI Document Processor (Index II parsing, stamp duty)
- [x] Accountant Agent (bank statement reconciliation)
- [x] 6-agent LangGraph pipeline
- [x] RAG-powered legal template retrieval
- [x] Bank portal with RLS isolation
- [x] Telegram OTP relay + voice mode

### Phase 2: Field Operations
- [ ] Mobile PWA for field executives
- [ ] Camera scanner with offline queue
- [ ] GPS-tagged field activity tracking
- [ ] Live timer & billing engine

### Phase 3: White-Label SaaS
- [ ] Multi-tenant architecture (org_id parameterized)
- [ ] Theming engine (logo, colors, fonts per firm)
- [ ] Maharashtra-specific legal module (SRO data, stamp duty rates)
- [ ] Onboarding for 5,000–15,000 panel advocate firms across India

---

## 🔒 Security

- **Row-Level Security**: Supabase RLS isolates bank/client data at the database level
- **Data Sovereignty**: Deployed in `ap-south-1` (Mumbai) for Indian banking compliance
- **Audit Logging**: Every case state transition logged to immutable `case_audit_logs`
- **Document Vault**: Private buckets with 60-second signed URLs
- **Magic Links**: Passwordless client access with time-limited tokens
- **Webhook Auth**: `x-api-key` verification via `secrets.compare_digest`

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines, commit conventions, and code standards.

### AI Agent Playbooks

This codebase is built by — and welcomes contributions from — multiple AI engineering agents working alongside humans:

| Agent | Playbook | What it covers |
|-------|----------|---------------|
| **Claude Code** | [`CLAUDE.md`](./CLAUDE.md) | Architecture, dev commands, repo-specific gotchas, workflow orchestration rules |
| **OpenCode** | [`AGENTS.md`](./AGENTS.md) | Session guidance, corrections to CLAUDE.md, subsystem boundaries |

### Engineering Guidelines

Domain-specific conventions are split across topic files:

- [`GIT_GUIDELINES.md`](./GIT_GUIDELINES.md) · [`TDD_GUIDELINES.md`](./TDD_GUIDELINES.md) · [`REFACTORING_GUIDELINES.md`](./REFACTORING_GUIDELINES.md)
- [`ERROR_HANDLING_GUIDELINES.md`](./ERROR_HANDLING_GUIDELINES.md) · [`HALLUCINATION_MITIGATION_GUIDELINES.md`](./HALLUCINATION_MITIGATION_GUIDELINES.md)
- [`FRONTEND_UI_GUIDELINES.md`](./FRONTEND_UI_GUIDELINES.md) · [`RAG_AND_MEMORY_GUIDELINES.md`](./RAG_AND_MEMORY_GUIDELINES.md)
- [`GOAL_DRIVEN_EXECUTION_GUIDELINES.md`](./GOAL_DRIVEN_EXECUTION_GUIDELINES.md) · [`DEPLOYMENT_PLAYBOOK.md`](./DEPLOYMENT_PLAYBOOK.md)

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
