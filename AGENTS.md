# AGENTS.md — OpenCode session guide

## Must read first

**`CLAUDE.md`** is the primary reference for architecture and design. This file only adds corrections and gaps an agent would likely miss.

## Two independent subsystems

| Directory | Stack | Tests | CI order |
|-----------|-------|-------|----------|
| `ag-associates-ai/` | FastAPI + LangGraph + vLLM + Next.js 15 + pgvector + Supabase | No suite (do not invent) | `ruff check → ruff format --check → pip install --dry-run` |
| `ag-platform/` | Turborepo: Vite + Express + Supabase + Google Gemini + shadcn/ui | Vitest (`npm test`) | `lint → type-check → test → build` |

**Plus workspace services** under `ag-platform/services/` — separate apps not covered by root turbo pipeline:
- **`services/intake-api/`** — Fastify gateway for bank intake webhooks + OTP SMS bridge (Redis, Zod). Dev: `npm run dev` from its own dir, `PORT=3000` default.
- **`services/coordinator/`** — Telegraf Telegram bot for hierarchical agent orchestration (separate process, not in main monorepo build).

No code coupling between subsystems. Never reuse config patterns across stacks.

### Key paths that differ from defaults

- **`vitest.config.ts`** has `globals: true` — tests use `describe`/`it` without imports. Already set.
- **`autoprefixer`** is in `ag-platform` devDependencies — no longer missing. Build should work.
- **`turbo.json`** declares `workspaces: ["apps/*", "packages/*", "services/*"]` but only `packages/` is populated. The Vite+Express app lives at `ag-platform/` root, not under `apps/`.

## Verified commands

### ag-associates-ai/ (run from `ag-associates-ai/`, not repo root)

```bash
docker-compose up -d              # pgvector:5432 + n8n:5678
docker-compose down -v            # wipe volumes

cd backend && source venv/bin/activate
pip install -r requirements.txt
python generate_embeddings.py     # one-time: populate vector column

# Multi-agent + multi-modal DB migration (one-time):
psql -U agadmin -d agdb -f database/agent_migrations.sql

python main.py                    # dev: runs on :8000 (__main__ block)
uvicorn main:app --reload --host 0.0.0.0 --port 8001  # matches config.py API_PORT

cd frontend && npm install && npm run dev  # Next.js on :3000
```

### ag-platform/ (run from `ag-platform/`)

```bash
npm install            # root + all workspaces
npm run dev            # turbo dev → Vite + Express on :3001
npm test               # vitest run
npx vitest run tests/logger.test.ts  # single test
npm run type-check     # turbo type-check
npm run build          # vite build (not next build)
npm run start          # NODE_ENV=production tsx server.ts
```

### services/intake-api/ (run from `ag-platform/services/intake-api/`)

```bash
npm install            # installs Fastify + Redis deps
npm run dev            # ts-node-dev with hot reload, PORT defaults to 3000
npm run build          # tsc compile to dist/
```

## CI pipeline

GitHub Actions on push/PR to `main` — 4 parallel jobs:
1. **Pre-commit hooks**: ruff lint+fix, ruff-format, eslint
2. **ag-associates-ai frontend**: `npm ci → npm run lint → npm run build`
3. **ag-associates-ai backend**: `pip install ruff → ruff check → ruff format --check → pip install --dry-run -r requirements.txt`
4. **ag-platform**: `npm ci → npm run lint → npm run type-check → npm test → npm run build`

Local verification order: `make ci` or manually `lint → type-check → test → build`.

## Production deploy

Docker → GHCR (`ghcr.io/rajkhemani`) → Hetzner VPS. Triggered by `deploy.yml` on push to `main` with path filters (code changes). Builds 3 images via matrix:
- `ag-ai-backend` (from `ag-associates-ai/backend`)
- `ag-ai-dashboard` (from `ag-associates-ai/frontend`)
- `ag-platform` (from `ag-platform/`)

Next.js dashboard separately deploys to GitHub Pages via `nextjs.yml` (CNAME at root → `advadiityagade.com`).

Root `Caddyfile` + `docker-compose.prod.yml` handle reverse proxy + TLS. Root `.env.example` has all required env vars.

## Repository-specific gotchas

### Configuration
- **`.env.example` exists only at repo root** — NOT in `ag-associates-ai/` or `ag-associates-ai/backend/`. Trust `config.py` defaults for backend vars, set env directly.
- **Webhook paths**: `ag-associates-ai` uses `/webhooks/whatsapp` (with 's') at `backend/main.py:120`. `intake-api` uses `/api/v1/webhook/sms-incoming` (no 's') at `services/intake-api/src/routes/webhook.ts:152`.
- **`process_rental_request` signature** is `(raw_input, sender, org_id=None)` — the `org_id` parameter is newer and easy to miss.
- **Embedding dimension = 384** everywhere. If changed, update `config.py`, `database/init.sql`, and re-run `generate_embeddings.py`. Then `docker-compose down -v` to wipe pgvector volume.
- **LangGraph is synchronous.** API endpoints calling the pipeline must wrap it in `asyncio.to_thread(...)`. Preserve this pattern.

### Backend architecture (ag-associates-ai)
- **FastAPI has grown beyond the original pipeline.** `main.py` now includes voice, workforce, oauth, playground, and payment routers plus a `UnifiedController`.
- **NOI Agent** (`backend/noi_agent.py`) with full state machine: `DOCUMENTS_RECEIVED → CHALLAN_GENERATED → CHALLAN_PAID → VERIFIED → NOI_DROP_RECEIVED → RECTIFY → NOI_FILED → ACKNOWLEDGED → COMPLETED`.
- **Multi-Agent System** (`backend/agents/`) — 7 conversational agents with Hinglish personalities:
  - **Auditor** — Financial auditor (bank statements, anomalies, Excel audit)
  - **Vyasa** — Legal researcher (property law, compliance)
  - **Bouncer** — Math validator (stamp duty calculations)
  - **Accountant** — Financial reports, billing, receivables
  - **NOI** — Notice of Intimation workflow specialist
  - **Executor** — RPA automation runner
  - **Drafter** — Legal document drafting
  - All agents share Qwen2.5 via vLLM at `http://localhost:8000/v1`
  - Communicate via **Redis Streams** (agent_bus.py, consumer groups, max 5 hops)
  - PostgreSQL-backed conversation memory (per-agent tables, agents/agent_memory.py)
  - RBAC-gated via per-agent permissions (`agent.<name>.access`) in `auth/rbac.py`
- **Multi-Modal Pipeline** (`backend/media/`) — any-to-any file understanding:
  - Audio → Whisper transcription via vLLM
  - Image → OCR via Qwen2.5-VL vision endpoint
  - PDF → pdfplumber text extraction
  - Excel → openpyxl structured data extraction
  - DOCX → python-docx text extraction
  - Telegram photo handler + enhanced document handler route through pipeline
- **Private Messenger** (`telegram_bot/private_messenger.py`) — agents can send proactive Telegram DMs to whitelisted users.
- **No mock LLM mode.** Agents use `ChatOpenAI` pointed at local vLLM (`LLM_BASE_URL`). Without vLLM running, agents raise errors. `LLM_MOCK_MODE` in config has no effect.
- **n8n → FastAPI networking:** n8n must reach FastAPI via `http://host.docker.internal:8001`, not `localhost`.

### Frontend (ag-platform) + services
- **Uses Google Gemini** (`@ai-sdk/google`), not vLLM. See `src/server/aiRouter.ts`.
- **Migrations auto-run on boot.** `server.ts` executes `src/server/migrations.sql` before mounting routes. Schema changes go there. `supabase/` dir is for hosted env only.
- **Webhook auth** requires `x-api-key` header matched against `N8N_WEBHOOK_KEY` via `secrets.compare_digest`.
- **Sentry optional.** Set `SENTRY_DSN` to enable; `ENVIRONMENT` controls sample rates.
- **Intake-api OTP bridge** (`services/intake-api/src/routes/webhook.ts`): SMS webhook at `POST /api/v1/webhook/sms-incoming` accepts `{text, from}`. Parses OTP digits with `/\b(\d{4,8})\b/`, detects portal via regex keywords (gras, igr, cersai, sbi, noc). Publishes to Redis `otp:incoming` channel + stores in `otp_incoming:*` lists with 600s TTL.
- **Coordinator Telegram bot** (`services/coordinator/src/telegram-bot.ts`): Telegraf-based, requires `TELEGRAM_BOT_TOKEN` + `GEMINI_API_KEY`. Separate process.

### Workflow conventions
- **Pre-commit** runs `ruff` (lint+fix + format) on Python, `eslint` on JS/TS. Install: `pre-commit install`. Not enforced in CI, but commits fail locally if the hooks run.
- **Root-level `*_GUIDELINES.md` files are policy.** Read the relevant one before touching that domain (error handling, RAG, TDD, git, UI, refactoring, hallucination).
- **`tasks/todo.md` and `tasks/lessons.md`** are tracked. On session start, check `tasks/lessons.md`. When the user corrects an approach, append the pattern there.

### Deploy multi-agent system to VPS (Docker)

The Telegram bot runs as container `ag_telegram_bot`. To deploy new agent code:

```bash
# 1. Copy new files to VPS
rsync -avz --include='*/' --include='agent_bus.py' --include='base_agent.py' \
  --include='agent_registry.py' --include='agent_memory.py' --include='agent_init.py' \
  --include='auditor/' --include='vyasa/' --include='bouncer/' --include='accountant/' \
  --include='noi/' --include='executor/' --include='drafter/' \
  --include='media/' --include='private_messenger.py' \
  backend/ deploy@46.225.185.91:~/ag-associates-ai/backend/

# 2. Run DB migrations
ssh deploy@46.225.185.91 "docker exec ag_postgres psql -U agadmin -d agdb -f /backend/database/agent_migrations.sql"

# 3. Rebuild and restart
ssh deploy@46.225.185.91 "cd ~ && docker compose build ag_telegram_bot && docker compose up -d ag_telegram_bot"
```

## Telegram commands added

- `/agents` — List all available agents with RBAC status
- `/agent <name> <message>` — Talk to a specific agent (e.g., `/agent auditor yeh Excel check karo`)
- File uploads → auto-routed through multi-modal pipeline (Auditor for Excel, OCR for images, Whisper for audio)

## Key file paths

- `ag-associates-ai/backend/main.py` — FastAPI entry. Webhook: `/webhooks/whatsapp` (with 's').
- `ag-associates-ai/backend/agents.py` — LangGraph pipeline (Aisha → Drafter → Auditor)
- `ag-associates-ai/backend/agents/` — LangGraph pipeline agents (12 modular agents: intake, drafter, auditor, etc.)
- `ag-associates-ai/backend/agents/agent_bus.py` — Redis Streams agent communication bus
- `ag-associates-ai/backend/agents/base_agent.py` — BaseAgent class for conversational agents
- `ag-associates-ai/backend/agents/agent_registry.py` — Agent discovery and RBAC mapping
- `ag-associates-ai/backend/agents/agent_memory.py` — PostgreSQL conversation memory
- `ag-associates-ai/backend/agents/agent_init.py` — Call `init_agents()` at startup
- `ag-associates-ai/backend/agents/auditor/` — Hinglish financial auditor agent
- `ag-associates-ai/backend/agents/vyasa/` — Hinglish legal researcher agent
- `ag-associates-ai/backend/agents/bouncer/` — Hinglish math validator agent
- `ag-associates-ai/backend/agents/accountant/` — Hinglish accounting agent
- `ag-associates-ai/backend/agents/noi/` — Hinglish NOI specialist agent
- `ag-associates-ai/backend/agents/executor/` — Hinglish RPA executor agent
- `ag-associates-ai/backend/agents/drafter/` — Hinglish document drafter agent
- `ag-associates-ai/backend/media/` — Multi-modal file processors + router
- `ag-associates-ai/backend/media/processors.py` — Audio/Image/PDF/Excel/DOCX processors
- `ag-associates-ai/backend/media/router.py` — File type → processor routing
- `ag-associates-ai/backend/telegram_bot/private_messenger.py` — Agent-initiated Telegram DMs
- `ag-associates-ai/backend/database/agent_migrations.sql` — DB migration for agent tables
- `ag-associates-ai/backend/config.py` — env-based config with defaults
- `ag-associates-ai/backend/noi_agent.py` — NOI workflow orchestrator with state machine
- `ag-platform/server.ts` — Express + Vite middleware entry. Port 3001.
- `ag-platform/services/intake-api/src/server.ts` — Fastify gateway (separate process, port 3000)
- `ag-platform/services/intake-api/src/routes/webhook.ts` — OTP SMS + bank intake webhooks
- `ag-platform/services/coordinator/src/telegram-bot.ts` — Telegraf bot for agent orchestration
- `ag-platform/src/server/aiRouter.ts` — Gemini AI endpoints
- `ag-platform/src/server/migrations.sql` — boot-time schema
- `ag-platform/src/server/routes/cases.ts` — case CRUD + state machine transitions
- `.pre-commit-config.yaml` — ruff + eslint hooks
- `Makefile` — unified `make ci`, `make dev`, `make lint`, etc.
- `.github/workflows/main.yml` — CI pipeline (4 parallel jobs)
- `.github/workflows/deploy.yml` — VPS deploy via GHCR (3 images)
- `Caddyfile` — reverse proxy for production Docker stack
- `docker-compose.prod.yml` — production compose with Caddy
- `.env.example` — single source of truth for all env vars
