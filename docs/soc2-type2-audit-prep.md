# SOC 2 Type II Audit Prep: AG Associates Platform

**Date:** 2026-06-13
**Observation Period:** Proposed — 2026-07-01 to 2027-06-30
**Scope:** AI Document Pipeline + Legal Operations Platform + Services

---

## The Decision Being Made
**pre-observation** — scoping and gap analysis before the Type II observation period begins.

---

## 1. What's the scope, and which TSC categories are in?

| TSC Category | Status | Rationale |
|-------------|--------|-----------|
| **Security** (CC1–CC9) | ✅ **INCLUDED** | Always required. Core controls in place: JWT auth, RBAC (48 permissions, 5 roles), RLS on 17+ tables, API key auth, CORS whitelist, rate limiting, immutable audit logs |
| **Availability** (A1) | ✅ **INCLUDED** | SaaS platform with 10 Docker services; VPS has 32 GB RAM, 4 vCPU; health checks on all containers; post-deploy smoke tests; Sentry monitoring. SLA needed by audit time |
| **Processing Integrity** (PI1) | ✅ **INCLUDED** | Transactional data: case state machine (10 states, 13 case types), NOI state machine (9 states), bank statement reconciliation via Accountant agent, stamp duty calculation via Bouncer agent |
| **Confidentiality** (C1) | ✅ **INCLUDED** | Client legal documents, bank data, property records. Document vault with 60-second signed URLs, RLS isolation per org/bank, file uploads to private buckets |
| **Privacy** (P1–P8) | ⚠️ **BOUNDARY** | Processes personal data (client names, phone, PAN). Overlaps with GDPR/India DPDP Act. Recommend including if processing personal data of EU/UK clients or Indian DPDA-regulated data |

**AT-C 205 Description of System:** Needs to be drafted. Covers:
- Systems: AI Pipeline (FastAPI + LangGraph + vLLM), Operations Platform (Express + Vite + Supabase), Services (Intake API, Coordinator, Email Intake, n8n)
- Infrastructure: Hetzner VPS (NBG1), Supabase Cloud, Docker Compose
- Data: Cases, documents, bank statements, client profiles
- Boundaries: Subdomains at `advadiityagade.com`, n8n workflow triggers

---

## 2. Did any control skip a cycle during observation period?

**Status: PRE-OBSERVATION — no observation data yet**

For readiness, here are the controls that will need quarterly/monthly/annual operation:

| Control Type | Frequency | Evidence Required | Ready? |
|-------------|-----------|-------------------|--------|
| Access reviews | Quarterly | Reviewed user list per org | ❌ No process documented |
| Vulnerability scans | Monthly | Scan results + remediation | ⚠️ CodeQL runs weekly, no SAST/DAST |
| Penetration tests | Annual | Test report + remediation plan | ❌ Not performed |
| Security awareness training | Annual | Training records | ❌ Not implemented |
| BCP/DR exercise | Annual | Test evidence + lessons learned | ❌ Not implemented |
| Log review & monitoring | Continuous | SIEM/console evidence | ⚠️ Sentry configured, no SOC |
| Patch management | Monthly | Patch records | ⚠️ Docker images rebuilt on push |
| Change management | Per change | PR + approval + deploy log | ⚠️ PRs required, no formal CAB |

**Gaps identified for pre-observation remediation:**
1. Document quarterly access review process
2. Stand up monthly vulnerability scanning (add Trivy/grype to CI)
3. Establish annual security training program
4. Create BCP/DR plan with annual test cycle
5. Define log review SLA and escalation path

---

## 3. Show me the change-management evidence for any control implemented mid-period.

**Status: PRE-OBSERVATION — N/A (no controls implemented yet in a period)**

For readiness, the following change management controls exist:

- **CI/CD Pipeline**: `.github/workflows/ci.yml` — lint + type-check + test + build on every PR
- **Pre-commit hooks**: `.pre-commit-config.yaml` — ruff, eslint, trailing-whitespace, detect-private-key
- **Deploy pipeline**: `.github/workflows/deploy.yml` — path-filtered, 6 Docker images, smoke tests
- **ADRs**: `docs/adr/0001-monorepo-orchestration.md`, `docs/adr/0002-noi-state-machine.md`
- **Release workflow**: `.github/workflows/release.yml` — Changeset-based versioning

**Gap:** No formal change advisory board (CAB), no separation of duties between author and deployer, no approval gates beyond PR review.

---

## 4. Where's the exception log, and what's the materiality assessment?

**Status: PRE-OBSERVATION — exception log needs to be created**

Recommended exception log template for the observation period:

| # | Date | Control | Finding | Impact | Remediation | Owner | Status |
|---|------|---------|---------|--------|-------------|-------|--------|

**Known pre-existing gaps (should be remediated before observation starts):**

| Gap | Severity | Materiality | Recommended Action |
|-----|----------|-------------|-------------------|
| Auth bypass when `SUPABASE_JWT_SECRET` unset (`auth.py:20-22`) | **HIGH** | Could expose all endpoints | Add production guard: exit process if secret missing |
| Coordinator webhook no auth (`coordinator/src/server.ts:33-57`) | **MEDIUM** | Unauthorized webhook calls | Add `x-telegram-bot-api-secret-token` validation |
| No encryption at rest for PII | **MEDIUM** | Personal data stored in plaintext | Add column-level encryption for PAN/phone |
| No vulnerability scanning per PR | **MEDIUM** | Vulnerabilities may ship to prod | Add Trivy/grype to CI matrix |
| No BCP/DR documentation | **MEDIUM** | No recovery plan for outages | Create BCP doc with RTO/RPO targets |
| No backup automation evidence | **MEDIUM** | Data loss risk | Document Supabase backup schedule |

**Materiality threshold recommendation:** Following SOC 2 convention, 1-2 exceptions per control acceptable; 3+ per control = finding.

---

## 5. Show me sample evidence from each TSC criterion in the FIRST month of observation.

**Status: PRE-OBSERVATION — no samples exist yet**

**Recommended first-month evidence collection plan:**

| Criterion | Evidence to Collect | Source |
|-----------|-------------------|--------|
| **CC6.1** (Logical access) | JWT auth middleware in `server.ts:37-67`, `auth.py:13-52` | Git snapshot + prod config (redacted) |
| **CC6.2** (User registration) | Supabase auth logs, user creation via magic link | Supabase dashboard |
| **CC6.3** (Access removal) | Deactivated user audit trail | To be implemented |
| **CC7.1** (System monitoring) | Sentry error logs, container health checks | Sentry dashboard + deploy.yml smoke tests |
| **CC7.2** (Incident response) | Case audit logs `case_audit_logs` table | Database query |
| **CC8.1** (Change management) | PRs merged in month 1 + CI pipeline logs | GitHub API |
| **A1.1** (Capacity planning) | VPS resource utilization (CPU/memory/disk) | Hetzner Cloud dashboard |
| **A1.2** (Monitoring) | Uptime monitoring logs | To be implemented |
| **PI1.1** (Complete processing) | Case state machine transitions | `case_audit_logs` table |
| **PI1.4** (Error handling) | Circuit breaker state transitions | `circuit_breaker.py` logs |
| **C1.1** (Data classification) | Document vault signed URL access logs | Supabase storage logs |
| **C1.2** (Data disposal) | Document deletion process | To be documented |

---

## 6. What's the cross-walk to ISO 27001, and which evidence reuses?

| ISO 27001 Annex A | SOC 2 TSC | Shared Evidence | Status |
|-------------------|-----------|-----------------|--------|
| A.9.1.1 (Access control policy) | CC6.1 | JWT auth, RBAC framework | ✅ Ready |
| A.9.2.3 (Privileged access) | CC6.3 | Role hierarchy (`rbac.py:25-31`) | ✅ Ready |
| A.12.4.1 (Event logging) | CC7.2 | `case_audit_logs`, `voice_command_logs`, `staff_activity` | ✅ Ready |
| A.12.6.1 (Vulnerability mgmt) | CC7.1 | CodeQL weekly scan | ⚠️ Needs monthly addition |
| A.12.1.2 (Change management) | CC8.1 | CI/CD pipelines, ADRs | ⚠️ Needs CAB process |
| A.13.1.1 (Network security) | CC6.6 | Caddy reverse proxy, Docker bridge network | ✅ Ready |
| A.16.1.1 (Incident response) | CC7.3 | To be documented | ❌ Not ready |
| A.17.1.2 (Availability) | A1.1 | Docker health checks, deploys | ⚠️ Needs BCP |
| A.18.1.4 (Privacy/PII) | P1–P8 | RLS policies, document vault | ⚠️ Needs DPIA |
| A.11.1.4 (Physical security) | CC6.4 | Hetzner NBG1 datacenter | ⚠️ Needs vendor SOC 2 report |

**Estimated reuse:** ~75% control overlap consistent with canonical ISO 27001 / SOC 2 mapping.

---

## Exception Log (Pre-Observation Gaps)

| # | Area | Finding | Severity | Remediation | Owner | Target |
|---|------|---------|----------|-------------|-------|--------|
| 1 | CC6.1 | Auth bypass in dev mode (`auth.py:20-22`) | HIGH | Add production guard; remove dev fallback | Backend | Pre-period |
| 2 | CC6.1 | Coordinator webhook no auth (`coordinator/src/server.ts:33-57`) | MEDIUM | Add Telegram secret validation middleware | Coordinator | Pre-period |
| 3 | CC6.2 | No quarterly access review process | MEDIUM | Document + schedule quarterly reviews | Ops | Pre-period |
| 4 | CC7.1 | No vulnerability scanning per PR | MEDIUM | Add Trivy to CI matrix | DevOps | Pre-period |
| 5 | CC7.2 | No formal incident response plan | MEDIUM | Create IR plan with severity taxonomy | Ops | Pre-period |
| 6 | CC8.1 | No separation of duties in deploy | LOW | Add CODEOWNERS + required reviewers | DevOps | Pre-period |
| 7 | A1.2 | No SLA commitment defined | MEDIUM | Define uptime SLA + monitoring | Product | Pre-period |
| 8 | P4.x | No DPIA for personal data processing | MEDIUM | Conduct DPIA for client data flows | Privacy | Pre-period |

---

## Verdict
🟡 **NEEDS-ATTENTION** — 8 pre-existing gaps identified, all remediable before observation period starts. Auth bypass gap is HIGH severity and must be closed before day 1.

---

## Top 3 Actions

| # | Action | Owner | Timeline |
|---|--------|-------|---------|
| 1 | **Fix auth bypass:** Add production guard in `auth.py` so missing `SUPABASE_JWT_SECRET` exits the process instead of falling back to anonymous | Backend | Before period start |
| 2 | **Harden coordinator webhook:** Add Telegram secret validation to `/telegram/webhook` endpoint | Coordinator | Before period start |
| 3 | **Build evidence collection pipeline:** Set up automated evidence export for all 5 (or 4) TSC categories — audit logs, RLS config, CI pipeline runs, deploy records | DevOps | Month 1 |

---

*Generated from codebase analysis — see `docs/soc2-type2-audit-prep.md` for source.*
