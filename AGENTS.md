# AGENTS.md — OpenCode session guide

## Must read first

**`CLAUDE.md`** is the primary reference for architecture and design. This file only adds corrections and gaps an agent would likely miss.

## Two independent subsystems

| Directory | Stack | Tests | CI order |
|-----------|-------|-------|----------|
| `ag-associates-ai/` | FastAPI + LangGraph + vLLM + Next.js 15 + pgvector + Supabase | No suite (do not invent) | `ruff check → ruff format --check → pip install --dry-run` |
| `ag-platform/` | Turborepo: Vite + Express + Supabase + Google Gemini + shadcn/ui | Vitest (`npm test`) | `lint → type-check → test → build` |

No code coupling between them. Never reuse config patterns across stacks.

## Verified commands

### ag-associates-ai/ (run from `ag-associates-ai/`, not repo root)

```bash
# Infrastructure
docker-compose up -d              # pgvector:5432 + n8n:5678
docker-compose down -v            # wipe volumes

# Backend
cd backend && source venv/bin/activate
pip install -r requirements.txt
python generate_embeddings.py     # one-time: populate vector column
python main.py                    # dev: runs on :8000 (__main__ block)
uvicorn main:app --reload --host 0.0.0.0 --port 8001  # prod-matching: respects config.py API_PORT

# Frontend
cd frontend && npm install && npm run dev  # Next.js on :3000
```

### ag-platform/ (run from `ag-platform/`)

```bash
npm install            # root + all workspaces
npm run dev            # turbo dev → Vite + Express on :3001
npm test               # vitest run (see Testing notes below)
npx vitest run tests/logger.test.ts  # single test
npm run type-check     # turbo type-check
npm run build          # vite build (not next build)
npm run start          # NODE_ENV=production tsx server.ts
```

## Testing notes

- **ag-associates-ai backend**: No test suite exists. Do not invent one.
- **ag-platform**: `vitest.config.ts` must have `globals: true` for tests using `describe`/`it` without imports. `apps/mobile/__tests__/queue-drain.test.ts` requires this.
- Missing dev dependency: `autoprefixer` needed for `npm run build` to work. Install if build fails.

## CI pipeline (from `main.yml`)

Jobs run in parallel on push/PR to `main`:
1. **Pre-commit hooks**: ruff lint+fix, ruff-format, eslint
2. **ag-associates-ai frontend**: `npm ci → npm run lint → npm run build`
3. **ag-associates-ai backend**: `pip install ruff → ruff check → ruff format --check → pip install --dry-run -r requirements.txt`
4. **ag-platform**: `npm ci → npm run lint → npm run type-check → npm test → npm run build`

Local verification order: `lint → type-check → test → build`.

## Repository-specific gotchas

### Configuration
- **`.env.example` files do not exist** — not in `ag-associates-ai/` or `ag-associates-ai/backend/`. Trust `config.py` defaults and set environment variables directly.
- **Webhook path** is `/webhooks/whatsapp` (with 's'), not `/webhook/whatsapp`. See `backend/main.py:89`.
- **`process_rental_request` signature** is `(raw_input, sender, org_id=None)` — the `org_id` parameter is newer and easy to miss.
- **Embedding dimension = 384** everywhere. If changed, update `config.py`, `database/init.sql`, and re-run `generate_embeddings.py`. Then `docker-compose down -v` to wipe pgvector volume.
- **LangGraph is synchronous.** API endpoints calling the pipeline must wrap it in `asyncio.to_thread(...)`. Preserve this pattern.

### Backend architecture
- **FastAPI has grown beyond the original pipeline.** `main.py` now includes voice, workforce, oauth, and playground routers plus a `UnifiedController`.
- **NOI Agent exists** (`backend/noi_agent.py`) with full state machine: `DOCUMENTS_RECEIVED → CHALLAN_GENERATED → CHALLAN_PAID → VERIFIED → NOI_DROP_RECEIVED → RECTIFY → NOI_FILED → ACKNOWLEDGED → COMPLETED`.
- **Email Intake Agent** (`backend/email_intake/agent.py`) polls IMAP for bank emails and creates cases. Configured for `admin@advadiityagade.com` (Zoho Mail, `imap.zoho.in:993`).
- **No mock LLM mode.** Agents use `ChatOpenAI` pointed at local vLLM (`LLM_BASE_URL`). Without vLLM running, agents raise errors. `LLM_MOCK_MODE` in config has no effect in `agents.py`.
- **n8n → FastAPI networking:** n8n must reach FastAPI via `http://host.docker.internal:8001`, not `localhost`.

### Frontend (ag-platform)
- **Uses Google Gemini** (`@ai-sdk/google`, model: `gemini-3.1-pro-preview`), not vLLM. See `src/server/aiRouter.ts`.
- **Migrations auto-run on boot.** `server.ts` executes `src/server/migrations.sql` before mounting routes. Schema changes go there, not in raw migration dirs. `supabase/` is for hosted env only.
- **Webhook auth** requires `x-api-key` header matched against `N8N_WEBHOOK_KEY` via `secrets.compare_digest`.
- **Sentry optional.** Set `SENTRY_DSN` to enable; `ENVIRONMENT` controls sample rates.

### Workflow conventions
- **Pre-commit** runs `ruff` (lint+fix + format) on Python, `eslint` on JS/TS. Install: `pre-commit install`. Not enforced in CI, but commits fail locally if the hooks run.
- **Root-level `*_GUIDELINES.md` files are policy.** Read the relevant one before touching that domain (error handling, RAG, TDD, git, UI, refactoring, hallucination).
- **`tasks/todo.md` and `tasks/lessons.md`** are checked in and tracked. On session start, check `tasks/lessons.md`. When the user corrects an approach, append the pattern there.

## Key file paths

- `ag-associates-ai/backend/main.py` — FastAPI entry. Note: webhook path is `/webhooks/whatsapp`.
- `ag-associates-ai/backend/agents.py` — LangGraph pipeline (Aisha → Drafter → Auditor)
- `ag-associates-ai/backend/agents/` — 12 modular agents (intake, drafter, auditor, etc.)
- `ag-associates-ai/backend/config.py` — env-based config with defaults
- `ag-associates-ai/backend/controller_agent.py` — UnifiedController (conversations + MCP)
- `ag-associates-ai/backend/pdf_generator.py` — ReportLab PDF generation
- `ag-associates-ai/backend/email_intake/agent.py` — IMAP email poller for NOI intake
- `ag-associates-ai/backend/noi_agent.py` — NOI workflow orchestrator with state machine
- `ag-platform/server.ts` — Express + Vite middleware entry. Port 3001.
- `ag-platform/src/server/aiRouter.ts` — Gemini AI endpoints
- `ag-platform/src/server/migrations.sql` — boot-time schema
- `ag-platform/src/server/routes/cases.ts` — case CRUD + state machine transitions
- `ag-platform/vitest.config.ts` — needs `globals: true` for mobile tests
- `.pre-commit-config.yaml` — ruff + eslint hooks
- `Makefile` — unified `make ci`, `make dev`, `make lint`, etc.
- `.github/workflows/main.yml` — CI pipeline (full)
- `.github/workflows/deploy.yml` — production VPS deploy via GHCR

## Production deploy

Docker → GHCR → VPS (`deploy.yml` on push to `main`). Builds 3 images: `ag-ai-backend`, `ag-ai-dashboard`, `ag-platform`.

Next.js dashboard deploys to GitHub Pages (`nextjs.yml`). CNAME at root → `advadiityagade.com`.
