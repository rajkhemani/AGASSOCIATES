# CI/CD Inventory — AGASSOCIATES Repository

**Generated:** 2025-09-18  
**Scope:** All GitHub Actions workflows in `AGASSOCIATES/.github/workflows/` + production deployment stack

---

## 1. Workflow Inventory

| Workflow | File | Trigger | Purpose | Status |
|----------|------|---------|---------|--------|
| **CI (main)** | `main.yml` | push/PR to `main`, `workflow_dispatch` | Primary CI pipeline — 4 parallel jobs + CodeQL | **Active** |
| **CI (alt)** | `ci.yml` | push/PR to `main`, `workflow_dispatch` | Alternative CI pipeline — 7 jobs (pre-commit, python-backend, python-tests, platform, ai-dashboard, vulnerability-scan, commitlint) | **Active** |
| **Deploy to Production** | `deploy.yml` | push to `main` (path-filtered), `workflow_dispatch` | Build 7 Docker images → GHCR → SSH to VPS → docker-compose.prod.yml → Caddy | **Active** |
| **Preview Deployment** | `preview.yml` | PR opened/sync/reopened | Cloudflare Pages preview for Platform + AI Dashboard | **Broken** (invalid `CLOUDFLARE_API_TOKEN`) |
| **Deploy Multi-Agent** | `deploy-agents.yml` | push to `main` (path-filtered), `workflow_dispatch` | Self-hosted runner: copy agent files → DB migrations → rebuild `ag_telegram_bot` | **Active** |
| **Security Scan** | `security-scan.yml` | push/PR/schedule/workflow_dispatch/workflow_run(Deploy) | Comprehensive Trivy (image/fs/k8s/secrets), TruffleHog, SBOM, Compliance, Dependency Review, CodeQL | **Active** |
| **CodeQL Advanced** | `codeql.yml` | push/PR/schedule/weekly/dispatch | CodeQL analysis (JS/TS + Python) | **Active** |
| **SonarCloud** | `ag-platform/.github/workflows/sonarcloud.yml` | push/PR to `main`, dispatch | SonarCloud analysis (project key/org empty) | **Misconfigured** |
| **Release** | `release.yml` | push to `main` | Changesets version bump + GitHub Releases | **Active** |
| **Deploy Next.js** | `nextjs.yml` | push to `main`, dispatch | Build `apps/web` → GitHub Pages (CNAME `advadiityagade.com`) | **Active** |
| **Other utility** | `configure-domain.yml`, `create-env.yml`, `fix-ssh.yml`, `setup-pages-domain.yml`, `setup-telegram-sms.yml`, `test-*.yml`, `update-dns.yml` | Various | One-off/infrastructure helpers | **Mixed** |

**Total: 14 workflows in root `.github/workflows/`, 1 in `ag-platform/.github/workflows/`**

---

## 2. Primary CI Pipeline Analysis (`main.yml`)

### 4 Parallel Jobs

| Job | Working Dir | Steps | Failure Modes |
|-----|-------------|-------|---------------|
| **pre-commit** | repo root | `checkout → setup-python@3.11 → setup-node@20 → pre-commit/action@v3.0.1` | Ruff unpinned (see §3), whitespace in `session-ses_19a4.md` |
| **ag-associates-ai / frontend** | `ag-associates-ai/frontend` | `checkout → setup-node@20 (npm cache) → npm ci → npm run lint → npm run build` | Build requires env vars (no fallback) |
| **ag-associates-ai / backend** | `ag-associates-ai/backend` | `checkout → setup-python@3.11 (pip cache) → pip install -r requirements.txt → playwright install chromium → ruff check . → ruff format --check . → pip install --dry-run -r requirements.txt → pytest --cov=./ --cov-report=xml --cov-fail-under=50` | **Ruff unpinned**, **pytest cannot fail** (see §3), coverage gate at 50% |
| **ag-platform / turbo** | `ag-platform` | `checkout → setup-node@20 (npm cache) → npm ci → npm run lint → npm run type-check → npm test → npm run build` | **vitest `ws` transport fails on Node < 22** (see §3) |

### CodeQL Job (Separate)
- Matrix: `python`, `javascript-typescript`
- `fail-fast: false`
- Runs weekly (Mon 13:37 UTC) + on PR/push

---

## 3. Failure Suppression Patterns (Critical)

| Location | Pattern | Impact |
|----------|---------|--------|
| `ci.yml:62` | `python -m pytest -v --tb=short 2>/dev/null \|\| echo "No pytest tests found"` | **Swallows ALL test failures** — stderr discarded, exit code ignored. Job always green. |
| `ci.yml:46` | `pip install --dry-run -r requirements.txt 2>/dev/null` | Hides dependency resolution errors |
| `ci.yml:98` | `npm run build 2>/dev/null \|\| echo "Build skipped (requires env vars)"` | Swallows Next.js build failures |
| `main.yml:72` | `pytest --cov=./ --cov-report=xml --cov-fail-under=50` | **Only job with real pytest gate** (but ruff unpinned) |
| `ci.yml:43-45` | `pip install ruff` (unpinned) → `ruff check .` → `ruff format --check .` | **Ruff version drifts** — 0.15 = 48 errors, 0.16 = 874 errors. No `pyproject.toml`/`ruff.toml` exists. |
| `ag-platform/vitest.config.ts:11` | `environment: 'node'` (no `pool: 'threads'` or `ws` polyfill) | **vitest fails on Node < 22** — needs `ws` transport for WebSocket tests |

### Permanently Red Checks (Pre-existing, Unfixed)
1. **`Lint — Pre-commit`** (`ci.yml`) — trailing whitespace in `session-ses_19a4.md` (committed session transcript with leaked credential)
2. **`ag-platform / turbo`** (`main.yml` & `ci.yml`) — vitest `ws` transport issue on Node 20
3. **`Preview — Platform`** & **`Preview — AI Dashboard`** (`preview.yml`) — invalid `CLOUDFLARE_API_TOKEN` secret
4. **`Security — Trivy`** (`ci.yml`) — `exit-code: '1'` on CRITICAL/HIGH; images have unfixed vulnerabilities
5. **`SonarCloud`** (`sonarcloud.yml`) — empty `sonar.projectKey` and `sonar.organization`

---

## 4. Deploy Flow Analysis (`deploy.yml`)

### Build Matrix (7 Images)
| Image | Context | Build Args | Registry |
|-------|---------|------------|----------|
| `ag-ai-backend` | `ag-associates-ai/backend` | — | `ghcr.io/rajkhemani/` |
| `ag-ai-dashboard` | `ag-associates-ai/frontend` | `NEXT_PUBLIC_API_URL=https://api.${PROD_DOMAIN}` | `ghcr.io/rajkhemani/` |
| `ag-platform` | `ag-platform` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL=/api` | `ghcr.io/rajkhemani/` |
| `telegram-bot` | `ag-associates-ai/backend/telegram_bot` | — | `ghcr.io/rajkhemani/` |
| `intake-api` | `ag-platform/services/intake-api` | — | `ghcr.io/rajkhemani/` |
| `email-intake` | `ag-associates-ai/backend/email_intake` | — | `ghcr.io/rajkhemani/` |
| `coordinator` | `ag-platform/services/coordinator` | — | `ghcr.io/rajkhemani/` |

### Deploy Job (SSH → VPS)
```bash
# On VPS (Hetzner, ubuntu-latest runner):
1. Cleanup deploy dirs > 3 days
2. git clone repo to /srv/ag/deploy-${SHA}
3. docker login ghcr.io
4. Force-remove orphaned ag_* containers
5. docker compose -p ag -f docker-compose.prod.yml --env-file /srv/ag/.env pull
6. docker compose -p ag -f docker-compose.prod.yml --env-file /srv/ag/.env up -d
7. docker image prune -f
8. Diagnostic: container status + logs (immediate + 120s delayed)
9. Smoke test: 6 retries × 15s = 90s max
```

### Smoke Test Endpoints (Health Checks Only)
```bash
curl https://intake.${PROD_DOMAIN}/health   # intake-api
curl https://api.${PROD_DOMAIN}/health       # ai-backend
curl https://app.${PROD_DOMAIN}/             # ag-platform (root, not /api/health)
curl https://dashboard.${PROD_DOMAIN}/       # ai-dashboard (root)
```
**All checks are HTTP 200 only** — no functional validation (auth, DB, Redis, business logic).

### docker-compose.prod.yml Services (11 containers)
| Service | Image | Healthcheck | Depends On |
|---------|-------|-------------|------------|
| `caddy` | `caddy:2-alpine` | `curl http://localhost:2019/config/` | all app services |
| `postgres` | `pgvector/pgvector:pg16` | `pg_isready` | — |
| `redis` | `redis:7-alpine` | `redis-cli ping` | — |
| `ai-backend` | `ghcr.io/luxoranova9/ag-ai-backend` | `curl http://127.0.0.1:8000/health` | postgres, redis |
| `ai-dashboard` | `ghcr.io/luxoranova9/ag-ai-dashboard` | `wget http://127.0.0.1:3000/` | ai-backend |
| `ag-platform` | `ghcr.io/luxoranova9/ag-platform` | `wget http://127.0.0.1:3001/api/health` | postgres |
| `n8n` | `n8nio/n8n:latest` | `wget http://localhost:5678/healthz` | postgres |
| `intake-api` | `ghcr.io/luxoranova9/intake-api` | `wget http://127.0.0.1:3002/health` | redis |
| `telegram-bot` | `ghcr.io/luxoranova9/telegram-bot` | `curl http://localhost:3004/health` | redis, ai-backend |
| `email-intake` | `ghcr.io/luxoranova9/email-intake` | `curl http://localhost:3004/health` | redis |
| `coordinator` | `ghcr.io/luxoranova9/coordinator` | `fetch http://127.0.0.1:3005/health` | redis |

### Caddy Routing (Production TLS)
- `api.{DOMAIN}` → `ai-backend:8000` (with `/webhook*` → `telegram-bot:3003`, `/api/sms/ingest*` → `intake-api:3002`)
- `app.{DOMAIN}` → `ag-platform:3001` (health_uri `/api/health`)
- `dashboard.{DOMAIN}` → `ai-dashboard:3000`
- `intake.{DOMAIN}` → `intake-api:3002`
- `n8n.{DOMAIN}` → `n8n:5678` (Caddy basic_auth)
- `http://{DOMAIN}` → `/srv/landing` (HTTP only, Cloudflare TLS)
- `docs.{DOMAIN}` → `/srv/docs`
- `www.{DOMAIN}` → redirect to apex

---

## 5. Coolify Staging Configuration

**No Coolify configuration found in repository.**  
- `security-scan.yml` mentions "Compatible with Coolify deployment" in comments only
- No `.coolify/`, `coolify.yml`, or Coolify-specific workflows
- Staging appears to be **GitHub Pages preview** (`preview.yml` → Cloudflare Pages) + **PR deployments**
- Production is **VPS (Hetzner) via SSH** — not Coolify

---

## 6. Smoke Tests — Coverage Gap

**Current smoke tests only verify HTTP 200 on health/root endpoints.**

| Endpoint | Check | Missing Validation |
|----------|-------|-------------------|
| `intake.{DOMAIN}/health` | 200 OK | No OTP bridge test, no Redis pub/sub test, no Supabase write test |
| `api.{DOMAIN}/health` | 200 OK | No `/webhook*` routing test, no agent bus test, no pgvector test |
| `app.{DOMAIN}/` | 200 OK | No `/api/health` (actual health), no Supabase RLS test, no case CRUD test |
| `dashboard.{DOMAIN}/` | 200 OK | No Next.js API route test, no auth test, no backend connectivity test |

**No integration tests, no contract tests, no DB migration verification, no secret validation.**

---

## 7. Security Scanning

### Trivy (ci.yml)
```yaml
- uses: aquasecurity/trivy-action@master
  with:
    scan-type: 'fs'
    scan-ref: '.'
    format: 'sarif'
    output: 'trivy-results.sarif'
    severity: 'CRITICAL,HIGH'
    exit-code: '1'
```
- Runs on every CI (`ci.yml` job `vulnerability-scan`)
- Uploads SARIF to GitHub Security (`if: always()`)
- **Fails on CRITICAL/HIGH** — currently permanently red

### Security Scan Workflow (security-scan.yml) — Comprehensive
| Scan Type | Scope | Severity Gate | Exit Code |
|-----------|-------|---------------|-----------|
| **Image Scan** | 6 GHCR images (matrix) | CRITICAL,HIGH (dashboard: +MEDIUM) | 1 |
| **Filesystem Scan** | 7 source dirs | CRITICAL,HIGH (configurable) | 1 |
| **Kubernetes Scan** | Cluster (if KUBECONFIG) | CRITICAL,HIGH | 0 (warn only) |
| **Secret Scan** | TruffleHog + Trivy secret scanner | All severities | 1 |
| **Compliance** | CIS K8s + CIS Docker | — | 0 (report only) |
| **SBOM** | CycloneDX + SPDX for 6 images | — | — |
| **Dependency Review** | PR only, `.github/dependency-review-config.yml` | HIGH | — |
| **CodeQL** | python, javascript, typescript | — | — |

**Security Gate Job** (`security-gate`) aggregates all scans — fails workflow if any CRITICAL/HIGH in image/fs/secrets.

---

## 8. Commitlint Enforcement (`ci.yml` job `commitlint`)

```yaml
- run: npm init -y
- run: npm install @commitlint/cli @commitlint/config-conventional
- run: npx commitlint --from ${{ github.event.pull_request.base.sha }} --to ${{ github.event.pull_request.head.sha }} --verbose
```

### Rules (from `@commitlint/config-conventional`)
- `subject-case: lower-case` — **rejects ANY uppercase in subject** (including "NOI", "89B", "API", "CI")
- `scope-enum`: `ai`, `dashboard`, `web`, `platform`, `mobile`, `intake`, `docs`, `proto`, `ci`, `noi`, `rpa`, `telegram`, `otp`, `comms`, `email`, `release`
- Runs **only on PRs** (`if: github.event_name == 'pull_request'`)

---

## 9. Missing Gates per P0-I / P0-H Requirements

From `tasks/legal-os-state.md` Release Gates:

| Gate | Required | Current Status | Gap |
|------|----------|----------------|-----|
| Cross-tenant Case read denied | P0-A | ❌ Not tested in CI | No multi-tenant test suite |
| Cross-tenant Case mutation denied | P0-A | ❌ Not tested in CI | No multi-tenant test suite |
| Cross-tenant task/comment/activity access denied | P0-A | ❌ Not tested in CI | No multi-tenant test suite |
| Runtime DB role cannot bypass RLS | P0-A | ❌ Not tested in CI | No RLS regression test |
| Runtime DB role cannot perform DDL | P0-A | ❌ Not tested in CI | No DDL attempt test |
| Clean database migrates successfully | P0-C | ❌ Not in CI | No migration test job |
| Migration rerun is idempotent | P0-C | ❌ Not in CI | No idempotency test |
| Modified applied migration is rejected | P0-C | ❌ Not in CI | No drift detection |
| **Python test failure makes CI red** | P0-I | ❌ **Swallowed in `ci.yml`** | `2>/dev/null \|\| echo` |
| **Frontend/build failure makes CI red** | P0-I | ❌ **Swallowed in `ci.yml`** | `2>/dev/null \|\| echo` |
| Required security checks are not swallowed | P0-H | ❌ **Trivy fails but deploy continues** | `deploy.yml` has no `needs: security-scan` |

### Critical Missing Gates
1. **No pytest gate in primary CI** — `main.yml` has pytest with coverage but `ci.yml` swallows it
2. **No build gate for Next.js** — `ci.yml:98` suppresses build failures
3. **Deploy does not depend on security scan** — `deploy.yml` runs independently; `security-scan.yml` triggers on `workflow_run: ["Deploy to Production"]` (post-deploy, not pre-deploy)
4. **No migration test** — Supabase migrations (root + ag-platform) never validated in CI
5. **No RLS/tenant isolation tests** — Core P0-A requirement, zero coverage
6. **No contract tests between services** — ai-backend ↔ ag-platform ↔ intake-api ↔ telegram-bot

---

## 10. Version Pinning Drift

| Tool | Pinned? | Where | Risk |
|------|---------|-------|------|
| `ruff` | ❌ No | `ci.yml:43`, `main.yml:29` (pre-commit uses v0.3.0) | Rule set widens unpredictably |
| `pre-commit` | ✅ v3.0.1 | `main.yml:29` | OK |
| `actions/checkout` | ✅ SHA-pinned in `ci.yml`, `@v4` in `main.yml` | Mixed | `ci.yml` more secure |
| `actions/setup-node` | ✅ SHA-pinned in `ci.yml`, `@v4` in `main.yml` | Mixed | `ci.yml` more secure |
| `actions/setup-python` | ✅ SHA-pinned in `ci.yml`, `@v5` in `main.yml` | Mixed | `ci.yml` more secure |
| `docker/build-push-action` | ✅ `@v6` | `deploy.yml:72` | OK |
| `trivy-action` | ❌ `@master` | `ci.yml:109`, `security-scan.yml` | **Unpinned — supply chain risk** |
| `cloudflare/wrangler-action` | ✅ SHA-pinned | `preview.yml:29,65` | OK |
| `SonarSource/sonarcloud-github-action` | ✅ SHA-pinned | `sonarcloud.yml:50` | OK |

---

## 11. Dependency & Supply Chain

- **No `dependency-review-config.yml` found** — `security-scan.yml:508` references it but file missing
- **No `pyproject.toml` / `ruff.toml`** — Ruff runs with defaults (widened in 0.16)
- **No `package-lock.json` validation** — `npm ci` used but no integrity check job
- **GHCR images tagged `:latest` + `:sha`** — `:latest` mutable, sha immutable
- **Trivy DB auto-updated** (`TRIVY_SKIP_DB_UPDATE: 'false'`) — good

---

## 12. Summary: Top 10 Critical Fixes Needed

| # | Issue | Workflow | Fix |
|---|-------|----------|-----|
| 1 | **Pytest failures swallowed** | `ci.yml:62` | Remove `2>/dev/null \|\| echo`; add `--tb=short` only |
| 2 | **Next.js build failures swallowed** | `ci.yml:98` | Remove suppression; provide test env vars or skip conditionally |
| 3 | **Ruff unpinned → rule drift** | `ci.yml:43`, `main.yml` pre-commit | Add `pyproject.toml` with `[tool.ruff]`; pin `ruff==0.16.1` |
| 4 | **Vitest ws transport fails on Node 20** | `ag-platform/vitest.config.ts` | Add `pool: 'threads'` or `poolOptions: { threads: { singleThread: true } }` + `ws` polyfill |
| 5 | **Deploy bypasses security gate** | `deploy.yml` | Add `needs: [security-scan]` or make `security-scan.yml` required check |
| 6 | **No migration validation in CI** | (new job) | Add job: `supabase db reset --linked` or test migration apply/rollback |
| 7 | **No RLS/tenant isolation tests** | (new job) | Add multi-tenant test suite using Supabase CLI + pgTAP |
| 8 | **Trivy @master unpinned** | `ci.yml:109`, `security-scan.yml` | Pin to SHA (e.g., `aquasecurity/trivy-action@0.24.0`) |
| 9 | **Preview deployments broken** | `preview.yml` | Fix `CLOUDFLARE_API_TOKEN` secret or remove jobs |
| 10 | **SonarCloud misconfigured** | `sonarcloud.yml:58-59` | Set `sonar.projectKey` and `sonar.organization` or remove |

---

## 13. Workflow Dependency Graph

```mermaid
graph TD
    %% CI Layer
    main_yml[main.yml CI] --> precommit[pre-commit]
    main_yml --> aife[ag-associates-ai frontend]
    main_yml --> aibe[ag-associates-ai backend]
    main_yml --> agplt[ag-platform turbo]
    main_yml --> codeql[CodeQL]
    
    ci_yml[ci.yml CI] --> precommit2[Lint Pre-commit]
    ci_yml --> pybackend[Python Backend]
    ci_yml --> pytests[Python Tests - SWALLOWED]
    ci_yml --> platform2[Platform Turbo - WS FAIL]
    ci_yml --> aidash[AI Dashboard - BUILD SWALLOWED]
    ci_yml --> trivy_ci[Trivy FS - PERMA RED]
    ci_yml --> commitlint[Commitlint]
    
    %% Security Layer
    secscan[security-scan.yml] --> precheck[Pre-check]
    precheck --> trivy_img[Trivy Image Scan]
    precheck --> trivy_fs[Trivy FS Scan]
    precheck --> trivy_k8s[Trivy K8s Scan]
    precheck --> secret[Secret Scan]
    precheck --> comply[Compliance Scan]
    precheck --> sbom[SBOM Generation]
    precheck --> dep_rev[Dependency Review]
    precheck --> codeql2[CodeQL]
    trivy_img --> secgate[Security Gate]
    trivy_fs --> secgate
    trivy_k8s --> secgate
    secret --> secgate
    comply --> secgate
    sbom --> secgate
    dep_rev --> secgate
    codeql2 --> secgate
    secgate --> notify[Notify]
    
    %% Deploy Layer
    deploy[deploy.yml] --> build[Build & Push 7 Images]
    build --> deploy_ssh[Deploy via SSH]
    deploy_ssh --> smoke[Smoke Test - HTTP 200 ONLY]
    
    deploy_agents[deploy-agents.yml] --> selfhosted[Self-hosted Runner]
    selfhosted --> copy[Copy Agent Files]
    copy --> migrate[DB Migrations - SWALLOWED]
    migrate --> rebuild[Rebuild ag_telegram_bot]
    
    %% Preview Layer
    preview[preview.yml] --> cf_platform[CF Pages Platform - BROKEN]
    preview --> cf_dashboard[CF Pages Dashboard - BROKEN]
    
    %% Cross-links (MISSING)
    deploy -.x. secgate[NO DEPENDENCY]
    main_yml -.x. secgate[NO DEPENDENCY]
```

---

## 14. Recommendations (Priority Order)

### P0 — Blockers for Production Confidence
1. **Fix `ci.yml` failure suppression** — Remove `2>/dev/null || echo` from pytest, build, pip dry-run
2. **Add `pyproject.toml` with pinned Ruff config** — Lock rule set, make CI reproducible
3. **Fix vitest on Node 20** — Add `pool: 'threads'` to `vitest.config.ts`
4. **Wire security gate to deploy** — `deploy.yml` must `needs: [security-scan]` or use required status checks
5. **Add migration test job** — Validate both `supabase/migrations/` and `ag-platform/supabase/migrations/`

### P1 — Reliability
6. **Pin `trivy-action` to SHA** — Supply chain security
7. **Fix/remove broken preview jobs** — Cloudflare token or delete
8. **Fix SonarCloud config** — Provide project key/org or remove
9. **Add integration smoke tests** — Beyond HTTP 200: auth, DB, Redis, inter-service calls

### P2 — Hygiene
10. **Delete `session-ses_19a4.md`** — Leaked credential in history (pre-commit failure source)
11. **Standardize action pinning** — Use SHA pins everywhere (like `ci.yml` does)
12. **Add `dependency-review-config.yml`** — Referenced but missing
13. **Document Coolify vs VPS strategy** — Confusion in docs vs reality

---

## Appendix: File References

| File | Lines | Purpose |
|------|-------|---------|
| `AGASSOCIATES/.github/workflows/main.yml` | 1-124 | Primary CI (4 jobs + CodeQL) |
| `AGASSOCIATES/.github/workflows/ci.yml` | 1-136 | Alt CI (7 jobs, suppression patterns) |
| `AGASSOCIATES/.github/workflows/deploy.yml` | 1-165 | Production deploy (build → GHCR → SSH → compose) |
| `AGASSOCIATES/.github/workflows/preview.yml` | 1-69 | PR previews (Cloudflare Pages) |
| `AGASSOCIATES/.github/workflows/security-scan.yml` | 1-715 | Comprehensive security pipeline |
| `AGASSOCIATES/.github/workflows/codeql.yml` | 1-102 | CodeQL analysis |
| `AGASSOCIATES/.github/workflows/deploy-agents.yml` | 1-62 | Self-hosted agent deploy |
| `AGASSOCIATES/.github/workflows/release.yml` | 1-25 | Changesets release |
| `AGASSOCIATES/.github/workflows/nextjs.yml` | 1-91 | GitHub Pages deploy |
| `AGASSOCIATES/ag-platform/.github/workflows/sonarcloud.yml` | 1-67 | SonarCloud (misconfigured) |
| `AGASSOCIATES/docker-compose.prod.yml` | 1-333 | Production stack (11 services) |
| `AGASSOCIATES/Caddyfile` | 1-73 | Reverse proxy + TLS termination |
| `AGASSOCIATES/.pre-commit-config.yaml` | 1-18 | Pre-commit hooks (ruff v0.3.0) |
| `AGASSOCIATES/ag-platform/vitest.config.ts` | 1-29 | Vitest config (ws issue) |
| `AGASSOCIATES/tasks/legal-os-state.md` | 1-58 | Release gates reference |

---
*Report generated by release-engineer (luxor9-legal-os team)*