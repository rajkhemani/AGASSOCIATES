# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

Three active subsystems, plus the superseded `landing/` page and shared docs.
They share a domain (legal ops for Indian panel advocates) and the root guideline
files — **no code-level coupling**. Don't assume a change in one carries over.

```text
AGASSOCIATES/
├── apps/web/            # Marketing site — Next.js 15 static export → GitHub Pages
│                        #   THE LIVE SITE at advadiityagade.com. src/content/site.ts
│                        #   is the single source for every firm fact on the page.
├── ag-associates-ai/    # AI Document Pipeline (FastAPI + Groq + pgvector)
│   ├── backend/         #   main.py, noi_agent.py, workflows/, email_intake/,
│   │                    #   telegram_bot/, igr_executor.py, executor_agent.py
│   └── frontend/        #   Next.js ops dashboard — a SECOND, separate Next.js app.
│                        #   Ships as the `ag-ai-dashboard` container via deploy.yml,
│                        #   NOT to Pages. nextjs.yml builds apps/web only.
├── ag-platform/         # LegalTech Collaboration Platform (Turborepo + Supabase)
│   ├── src/             #   Vite + React frontend + Express backend (src/server/)
│   └── services/        #   intake-api — Fastify gateway (built, NOT deployed)
├── landing/             # Older static marketing page, served from the VPS
├── supabase/migrations/ # Root-level, SEPARATE from ag-platform/supabase/migrations/
└── tasks/               # todo.md + lessons.md (real, tracked — append to lessons.md)
```

## Common Commands

### apps/web (the live marketing site)

```bash
cd apps/web
npm install
npm run dev
npx tsc --noEmit && npm run lint && npm run build   # what to run before pushing
```

Static export (`output: "export"`), so `out/` is the artifact. `public/CNAME`
ships inside it and governs the Pages custom domain.

### ag-associates-ai/backend

```bash
cd ag-associates-ai/backend
python -m pytest -q                             # whole suite
python -m pytest test_workflow_deadlines.py -q  # one file
```

**Two** jobs run the Python lint — `AI Backend — Python` in `ci.yml` and
`ag-associates-ai / backend` in `main.yml`. They differ only in Python version
(3.12 vs 3.11); both set `working-directory: ag-associates-ai/backend` and run
the same bare command, so there is one baseline, not two:

```bash
pip install ruff==0.16.1            # pin it — see below, the version IS the ruleset
cd ag-associates-ai/backend
ruff check . && ruff format --check .
```

CI installs `ruff` unpinned, so it drifts to whatever is current; 0.16.1 is what
it resolved to when the 874 baseline below was taken. Pin locally to reproduce
that number, and re-take the baseline against `origin/main` when CI moves on.

Run it from anywhere else and the number is not comparable to CI's — ruff
resolves first-party imports relative to its working directory, so `I001` fires
on files at the repo root that are clean from `backend/`.

Four test files exist (`test_workflow_definitions.py`, `test_workflow_deadlines.py`,
`test_email_panel.py`, `test_accountant_agent.py`). The first three are pure Python —
no DB, no network, no fixtures. `test_accountant_agent.py` needs `pdfplumber` and
`gspread` at import time and won't collect without them.

### ag-platform

```bash
npm install && npm run dev      # turbo: Vite frontend + Express backend
npm test                        # vitest run
npx vitest run tests/logger.test.ts
```

## Architecture

### apps/web — the published site

Every firm-level fact (panel institutions, credentials, SLA figures, FAQ copy)
lives in `src/content/site.ts`. Components read from it; nothing is hardcoded in
JSX. Changing a lender name or a statutory citation is a one-line edit there.

**Statutory copy must be sourced, never inferred.** Past incidents: an invented
Section 89B trigger ("starts at disbursement" — it does not; the window runs 30
days from the date the mortgage is created by deposit of title deeds) and a wrong
stamp-duty article. If a claim isn't in the SOPs or confirmed by the firm, don't
publish it.

Named lender institutions are a confidentiality question, not just a content one —
panel agreements often restrict naming the lender. Confirm before adding.

### ag-associates-ai — workflow engine

**`backend/workflows/definitions.py` is the source of truth for workflow state.**
A `WorkflowDefinition` holds stages, permitted transitions, storage keys and
deadlines, and validates its own structure at import: every transition target must
exist, every stage must be reachable, terminal stages must terminate, and no stage
(including exception stages) may strand a case. A malformed workflow fails at
import rather than on a half-filed case. Three workflows are defined: `NOI`,
`MORTGAGE_REGISTRATION`, `PUBLIC_NOTICE`.

`backend/workflows/deadlines.py` evaluates the statutory clocks — Section 89B
(30 days) and the public-notice objection window (7/15/30 days, set per case).
Pure functions, no I/O. `scan()` returns a `ScanResult` with both `due` and
`faults`; a row it cannot judge is surfaced, never dropped.

**State knowledge is still duplicated.** `main.py`'s `valid_statuses` literal and
`auto_comms.py`'s `NOI_TEMPLATES` do not read from the registry. ADR 0002
(`docs/adr/0002-noi-state-machine.md`) describes this; the registry closed one of
its three touch points, not all three.

**Known-broken paths** (don't assume these work):
- `noi_agent.generate_challan` calls `executor_agent.generate_noi_challan`, which
  **does not exist**. The `AttributeError` is swallowed, so `CHALLAN_GENERATED` is
  unreachable through code.
- `auto_comms._send_email` hardcodes `"to": []` — no client email has ever sent.
- GRAS challan generation is a mock with a hardcoded GRN; every portal form
  interaction is commented out.
- `executor_agent.wait_for_otp` calls `r.setEx(...)` — JavaScript spelling; Python
  redis is `setex`.
- NeSL has four client implementations; the one actually served is defined inline
  in `main.py` and shadows the `nesl_client.py` import.

**Two disconnected case stores.** Telegram bot → self-hosted Postgres `noi_cases`;
`email_intake` and `intake-api` → Supabase `cases`. Nothing reconciles them.

**The only working intake is the IMAP poller** (`email_intake/agent.py`). The
website form is a `mailto:`, `intake-api` is built but absent from `render.yaml`,
and WhatsApp has an authenticated endpoint with no n8n workflow behind it.
Recognised senders live in `email_intake/panel.py`, overridable via
`BANK_EMAIL_DOMAINS`. Unrecognised mail is set aside for review, never discarded.

**There is no scheduler anywhere in the backend.** No APScheduler, Celery, or
`repeat_every`. The single recurring loop is the email poller's `run_poller()`,
which runs in its own container. Anything periodic needs a host decided first.

### ag-platform

`Cases` is the central entity; every table carries `org_id` for RLS-enforced
multi-tenancy. A 10-state lifecycle (`RECEIVED → … → CLOSED`) spans all 13 case
types, with transitions gated on role. Note this is a *different, coarser* model
from `ag-associates-ai`'s per-workflow SOP state machines — they are not shared.

Stack diverges deliberately: Supabase (not raw pgvector), Google Gemini via Vercel
AI SDK (not Groq), shadcn/ui + Tailwind on Vite (not Next.js).

## Environment & Deployment

**Production LLM is Groq `llama-3.3-70b-versatile`,** written into `/srv/ag/.env`
by `scripts/deploy-all.sh`. The `config.py` defaults (`localhost:8000/v1`,
`qwen2.5-7b-instruct`) are dev-only and always overridden — **there is no vLLM
service in `docker-compose.prod.yml`.** Several docs still claim vLLM; they are wrong.

**Government portal credentials are blank in production** and `NESL_USE_MOCK`
defaults true. The IGR Playwright automation is real and complete but unconfigured.

Eleven containers behind Caddy on `advadiityagade.com` subdomains, deployed by
`.github/workflows/deploy.yml` — `ubuntu-latest` + GHCR build + SSH, **not** a
self-hosted runner, into `/srv/ag/deploy-<sha>` (docs saying `/srv/ag/repo` are stale).
The smoke test now fails the workflow on unhealthy endpoints.

**Migrations do not auto-apply.** Root `supabase/migrations/` holds exactly one
file and is separate from `ag-platform/supabase/migrations/`. No workflow or script
runs either against Supabase — plan on manual execution in the SQL Editor.

### The GitHub Pages hazard

Pages **Source must stay "GitHub Actions"**. When set to "Deploy from a branch",
GitHub's built-in Jekyll builder races the real deploy and overwrites the live site
with a rendered README on every push. This has happened twice. A healthy HTTP 200
is not proof the site is up — check the `<title>`; correct is
`AG Associates — Banking Panel Advocates, Thane`.

The apex and `www` must both resolve to Pages, DNS-only (grey cloud) on Cloudflare.
If `www` points elsewhere, cert provisioning fails, "Enforce HTTPS" stays greyed
out, and apex/www can form a redirect loop that takes the whole site down.

## CI & Conventions

**`ruff` is the only enforced Python gate**, and it reports pre-existing errors,
so the job is permanently red. A change is clean when it does not *add* to the
count. Getting that judgement right has failed here more than once, in three
different ways:

- **There is no `pyproject.toml` or `ruff.toml` anywhere in the repo**, so the
  rule set is whatever the installed ruff defaults to — and **ruff 0.16 widened
  that default** to include `UP`, `RUF`, `I`, `B`, `SIM`, `BLE`, `S` and `DTZ`.
  CI does `pip install ruff` unpinned, so it gets the wide set. Ruff 0.15
  reports **48** errors for the identical command where 0.16 reports **874**.
  A stale local ruff will tell you the tree is nearly clean. Check
  `ruff --version` before trusting any number.
- **The working directory changes the answer.** Ruff resolves first-party
  imports relative to where it is invoked, so `I001` fires on files run from the
  repo root that are clean from `backend/`. Both CI jobs set
  `working-directory: ag-associates-ai/backend`; a root-level run is a different
  number that no job checks. Read the job's `defaults.run.working-directory`
  rather than inferring it from the `ruff` line — that inference was wrong here.
- The rule set moves with the unpinned version, so an absolute number goes stale
  on unchanged code.

So **an absolute error count proves nothing.** The only sound check is a delta:
same binary, same directory, `origin/main` vs. the branch. Baseline as of
ruff 0.16.1, from `ag-associates-ai/backend` — **874**.

**The pytest job cannot fail.** `ci.yml`'s `AI Backend — Tests` runs
`python -m pytest -v --tb=short 2>/dev/null || echo "No pytest tests found"` —
it swallows stderr *and* the exit code, so it stays green whatever happens.
Tests prove nothing in CI as configured; run them locally.

**commitlint is enforced.** `subject-case: lower-case` rejects *any* uppercase in
the subject — including acronyms like "NOI" or "89B". Scopes are gated by
`scope-enum`: `ai`, `dashboard`, `web`, `platform`, `mobile`, `intake`, `docs`,
`proto`, `ci`, `noi`, `rpa`, `telegram`, `otp`, `comms`, `email`, `release`.
Validate locally with `npx commitlint --from HEAD~1 --to HEAD`.

Other permanently-red checks, all pre-existing: `Lint — Pre-commit` (whitespace in
`session-ses_19a4.md`), `ag-platform / turbo` (vitest needs a `ws` transport on
Node < 22), both Cloudflare `Preview` deploys (invalid `CLOUDFLARE_API_TOKEN`),
and `Security — Trivy`.

## Secrets

`session-ses_19a4.md` is a committed session transcript at the repo root. It has
leaked one live credential already and is the source of the pre-commit failure. It
serves no build purpose. **Do not add transcripts to the repo**, and treat any
credential found in it as compromised — deleting the line does not help, since it
remains in history.

## Project Policies

Root-level `*_GUIDELINES.md` files are policy, not aspiration. Read the relevant
one before substantial work: `ERROR_HANDLING_GUIDELINES.md` (note the load-bearing
`sanitize()` in `ag-platform/src/server/utils/logger.ts`),
`FRONTEND_UI_GUIDELINES.md`, `REFACTORING_GUIDELINES.md`, `TDD_GUIDELINES.md`,
`GIT_GUIDELINES.md`, `HALLUCINATION_MITIGATION_GUIDELINES.md`,
`RAG_AND_MEMORY_GUIDELINES.md`, `GOAL_DRIVEN_EXECUTION_GUIDELINES.md`,
`DEPLOYMENT_PLAYBOOK.md`.

When the user corrects an approach, append the pattern with cause and remedy to
`tasks/lessons.md`, and read it at the start of a new session.

The status markers in `ag-associates-ai/README.md` ("Day 1/2/3 ✅/❌"),
`DAY3_COMPLETE.md`, `LANGGRAPH_AGENTS.md` and `docs/noi-automation-plan.md`
describe an original build roadmap. They are historical narrative and contradict
the code in places — trust the code.
