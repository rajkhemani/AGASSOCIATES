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
- 🏦 **Bank-panel ready from day one** — Kotak, Axis, Muthoot, Chola, Karur Vysya integration
- 🇮🇳 **India-first** — Maharashtra SRO data, stamp duty engines, Marathi/Hindi support baked in
- 🔄 **White-label DNA** — Multi-tenant from the first commit, not bolted on later

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

### AI Pipeline (LangGraph)

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
python main.py                   # API at http://localhost:8001
```

### vLLM (for conversational agents)

```bash
# Required for 7-agent conversational system
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-7B-Instruct \
  --host 0.0.0.0 --port 8000
```

### Multi-Agent System (Redis Streams)

```bash
# Multi-agent DB tables (one-time)
cd ag-associates-ai/backend
psql -U agadmin -d agdb -f database/agent_migrations.sql

# Then start main.py (agents initialize automatically)
python main.py
```

### AI Frontend Dashboard

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
npm test                         # Vitest test suite
```

### Platform Services

```bash
# Intake API (Fastify gateway)
cd AGASSOCIATES/ag-platform/services/intake-api
npm install
npm run dev                      # Fastify at http://localhost:3002

# Coordinator Telegram bot
cd AGASSOCIATES/ag-platform/services/coordinator
npm install
npm run dev                      # Telegraf bot (separate process)
```

### Pre-commit Hooks

```bash
cd AGASSOCIATES
pre-commit install               # ruff lint+fix + eslint on commit
pre-commit run --all-files       # run all hooks manually
```

### Production Deploy

```bash
cd AGASSOCIATES
docker compose -f docker-compose.prod.yml up -d
```

---

## 🚢 Deployment Architecture

The platform is deployed on a **Hetzner Cloud VPS** (CCX23, NBG1 datacenter) via a fully automated CI/CD pipeline.

### Infrastructure

| Layer | Technology | Details |
|-------|-----------|---------|
| **Host** | Hetzner CCX23 (4 vCPU, 32 GB RAM) | Ubuntu 22.04 LTS, Docker 24+ |
| **Reverse Proxy** | Caddy 2 | Auto-TLS via Let's Encrypt, subdomain routing |
| **Container Runtime** | Docker Compose | 10-service production stack |
| **CI/CD** | GitHub Actions + GHCR | Build → Push → SSH deploy |
| **Secrets** | GitHub Actions Secrets + Vars | `VPS_HOST`, `VPS_SSH_KEY`, `VPS_USER`, `SUPABASE_*` |
| **Monitoring** | Sentry (optional) | Error tracking with env-based sampling rate |

### Production Stack (10 Services)

| Service | Image / Source | Port(s) | Healthcheck | Purpose |
|---------|---------------|---------|-------------|---------|
| `caddy` | caddy:2-alpine | 80, 443 | — | Reverse proxy + auto-TLS (Let's Encrypt) |
| `postgres` | postgres:17-alpine | 5432 | pg_isready | Platform database (cases, users, timesheets) |
| `redis` | redis:8-alpine | 6379 | redis-ping | OTP cache, job queue, session store |
| `ai-backend` | `ghcr.io/rajkhemani/ag-ai-backend` | 8000 | `/health` | FastAPI + LangGraph agent pipeline |
| `ai-dashboard` | `ghcr.io/rajkhemani/ag-ai-dashboard` | 3000 | wget :3000 | Next.js 15 admin dashboard |
| `ag-platform` | `ghcr.io/rajkhemani/ag-platform` | 3001 | — | Express + Vite operations platform |
| `n8n` | n8nio/n8n | 5678 | — | Workflow automation engine |
| `intake-api` | `services/intake-api/` | 3002 | — | Fastify SMS webhook + OTP bridge |
| `telegram-bot` | `ghcr.io/rajkhemani/ag-telegram-bot` | 3003, 3004 | :3004/health | Standalone Telegram microservice |
| `email-intake` | `services/email-intake/` | — | — | IMAP-based email → case creation |

All services share a Docker bridge network and log to `docker logs`. Healthchecks restart unhealthy containers automatically.

### Caddy Routing

| Domain / Path | Backend | Auth |
|---------------|---------|------|
| `advadiityagade.com` | Static landing page | None |
| `app.advadiityagade.com` | ag-platform (:3001) | Supabase Auth + RLS |
| `api.advadiityagade.com` | ai-backend (:8000) | API key |
| `dashboard.advadiityagade.com` | ai-dashboard (:3000) | Supabase Auth |
| `intake.advadiityagade.com` | intake-api (:3002) | API key |
| `n8n.advadiityagade.com` | n8n (:5678) | Basic auth |
| `docs.advadiityagade.com` | Static docs | None |
| `/webhook*` | telegram-bot (:3003) | Telegram secret |

### CI/CD Pipeline

Three CI workflows run on push to `main`:

**1. Docker Deploy (`deploy.yml`)** — triggers on changes to `ag-associates-ai/`, `ag-platform/`, or compose files:

```
Push → Git checkout → docker/build-push-action × 3
  ├─ ag-ai-backend (FastAPI + Python deps)
  ├─ ag-ai-dashboard (Next.js output)
  └─ ag-platform (Vite build + Express runtime)

Push to ghcr.io/rajkhemani/*:latest + :{sha}

SSH into VPS (deploy@46.225.185.91):
  ├─ git fetch && reset --hard origin/main
  ├─ docker compose pull
  ├─ docker compose up -d --remove-orphans
  └─ docker image prune -f

Smoke test: GET https://api.advadiityagade.com/health → 200 OK
```

**2. GitHub Pages (`nextjs.yml`)** — builds and deploys the Next.js dashboard to GitHub Pages on every push to `main` (CNAME at root → `advadiityagade.com`).

**3. CodeQL (`codeql.yml`)** — security analysis on `javascript-typescript` and `python` for pushes/PRs to `main` and weekly.

Secrets required in the GitHub repository:

| Secret | Value | Used In |
|--------|-------|---------|
| `VPS_HOST` | `46.225.185.91` | SSH deploy step |
| `VPS_PORT` | `22` | SSH deploy step |
| `VPS_USER` | `deploy` | SSH deploy step |
| `VPS_SSH_KEY` | Ed25519 private key | SSH authentication |
| `GITHUB_TOKEN` | Auto-provided | GHCR push auth |
| `PROD_DOMAIN` (var) | `advadiityagade.com` | `NEXT_PUBLIC_API_URL` build arg |
| `SUPABASE_URL` (var) | Supabase project URL | Backend connection |
| `SUPABASE_ANON_KEY` (var) | Supabase anon key | Client-side auth |

### Deployment Directory Layout (VPS)

```
/srv/ag/
├── repo/                    # Git clone (owned by deploy user)
│   ├── docker-compose.prod.yml
│   ├── Caddyfile
│   ├── ag-associates-ai/
│   └── ag-platform/
├── .env                     # Runtime env vars (Postgres, Redis, tokens)
├── data/                    # Persistent volumes (DB, Redis, uploads)
└── deploy_key               # (Not on disk — provided via SSH agent)
```

### Bootstrapping a New VPS

```bash
# Prerequisites
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
docker compose -f repo/docker-compose.prod.yml up -d
```

A self-hosted GitHub Actions runner (`ag-prod-runner`) can be installed as an alternative deploy path — see `scripts/setup-runner.sh`.

---

## ⚙️ Environment Variables

| File | Purpose | Key Variables |
|------|---------|---------------|
| `.env.example` (repo root) | Single source of truth for all env vars | `SUPABASE_*`, `LLM_*`, `TELEGRAM_*`, `REDIS_*`, `N8N_*`, `WHATSAPP_*`, `NESL_*`, `IGR_*`, `STRIPE_*`, `SENTRY_*` |
| `ag-associates-ai/backend/config.py` | Python backend (env-based defaults) | `LLM_BASE_URL`, `LLM_MODEL_NAME`, `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| `ag-platform/.env` | Platform + Supabase | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GEMINI_API_KEY` |
| `docker-compose.prod.yml` | Production stack | `POSTGRES_*`, `REDIS_*`, `CADDY_*`, `SENTRY_*`, `N8N_*` |

> **Note:** `.env.example` at repo root is the single authoritative source with 89 variables across 15 categories. Copy it to `.env` and customize before running. Backend defaults in `config.py` include `secure_password_123` (dev-only).

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

### Phase 2: Multi-Agent Intelligence ✅
- [x] 7 conversational agents with Hinglish personalities (Auditor, Vyasa, Bouncer, Accountant, NOI, Executor, Drafter)
- [x] Redis Streams agent bus with consumer groups (max 5 hops)
- [x] RBAC-gated agent access (per-agent permissions)
- [x] Multi-modal pipeline (audio, images, PDF, Excel, DOCX)
- [x] Telegram agent commands (`/agents`, `/agent <name>`)
- [x] Supervisor agent with webhook hardening
- [x] NOI workflow state machine (9 states)
- [x] Agent-initiated private messenger (proactive Telegram DMs)
- [x] Intake API (Fastify gateway) + Coordinator bot (Telegraf)
- [x] Editorial-theme landing page (GSAP scroll storytelling)

### Phase 3: White-Label SaaS
- [ ] Multi-tenant architecture (org_id parameterized)
- [ ] Theming engine (logo, colors, fonts per firm)
- [ ] Maharashtra-specific legal module (SRO data, stamp duty rates)
- [ ] Onboarding for 5,000–15,000 panel advocate firms across India

---

## 🔒 Security

- **Row-Level Security**: Supabase RLS isolates bank/client data at the database level
- **Agent RBAC**: Per-agent access control (`agent.<name>.access`) — users see only agents they're authorized for
- **Data Sovereignty**: Deployed in `ap-south-1` (Mumbai) for Indian banking compliance
- **Audit Logging**: Every case state transition logged to immutable `case_audit_logs`
- **Conversation Memory**: Per-agent PostgreSQL tables with RBAC-gated access
- **Document Vault**: Private buckets with 60-second signed URLs
- **Magic Links**: Passwordless client access with time-limited tokens
- **Webhook Auth**: `x-api-key` verification via `secrets.compare_digest`
- **Secret Scanning**: Pre-commit hook (`detect-private-key`) prevents credential leaks
- **Circuit Breaker**: External API resilience with failover patterns

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

Domain-specific policies are encoded in root-level `*_GUIDELINES.md` files — read the relevant one before touching that domain:

- [`GIT_GUIDELINES.md`](./GIT_GUIDELINES.md) · [`TDD_GUIDELINES.md`](./TDD_GUIDELINES.md) · [`REFACTORING_GUIDELINES.md`](./REFACTORING_GUIDELINES.md)
- [`ERROR_HANDLING_GUIDELINES.md`](./ERROR_HANDLING_GUIDELINES.md) · [`HALLUCINATION_MITIGATION_GUIDELINES.md`](./HALLUCINATION_MITIGATION_GUIDELINES.md)
- [`FRONTEND_UI_GUIDELINES.md`](./FRONTEND_UI_GUIDELINES.md) · [`RAG_AND_MEMORY_GUIDELINES.md`](./RAG_AND_MEMORY_GUIDELINES.md)
- [`GOAL_DRIVEN_EXECUTION_GUIDELINES.md`](./GOAL_DRIVEN_EXECUTION_GUIDELINES.md) · [`DEPLOYMENT_PLAYBOOK.md`](./DEPLOYMENT_PLAYBOOK.md)

### Pre-commit Enforcement

[`.pre-commit-config.yaml`](./.pre-commit-config.yaml) runs `ruff` (lint + format) on Python and `eslint` on `.[jt]sx?` files plus standard hygiene hooks (trailing-whitespace, large-files, detect-private-key). Install once with `pre-commit install`; run on demand with `pre-commit run --all-files`.

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
