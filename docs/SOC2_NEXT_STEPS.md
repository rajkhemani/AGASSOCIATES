# SOC 2 Type II — Next Steps Plan

**Date:** 2026-06-13
**Status:** 🟡 NEEDS-ATTENTION (process items remaining)

---

## ✅ What's Done

| # | Gap | Artifact |
|---|-----|----------|
| 1 | Auth bypass (HIGH) | `auth.py`, `server.ts` — fail closed |
| 2 | Coordinator webhook auth | `coordinator/src/server.ts` — token validation |
| 3 | Trivy vulnerability scanning | `.github/workflows/ci.yml` |
| 4 | Incident response plan | `docs/INCIDENT_RESPONSE_PLAN.md` |
| 5 | BCP/DR plan | `docs/BCP_DR_PLAN.md` |
| 6 | SLA definitions | `docs/SLA_DEFINITION.md` |
| 7 | Quarterly access review process | `docs/ACCESS_REVIEW_PROCESS.md` |
| 8 | PII encryption utilities | `backend/utils/encryption.py` + `src/server/lib/encryption.ts` |
| 9 | CODEOWNERS expanded | `CODEOWNERS` with coordinator + email-intake |
| 10 | README updated | Architecture, multi-agent, services, roadmap |

---

## 🟡 Remaining Work (by sprint)

### Sprint 1: Wire PII Encryption into Application Code

**Goal:** Encrypt PAN and phone at write, decrypt at read — no plaintext in database.

| Task | File(s) | Effort | Notes |
|------|---------|--------|-------|
| 1a | Encrypt `pan_number` on case create | `routes/cases.ts` → call `encryptPii()` before INSERT | PAN is the highest-risk field |
| 1b | Decrypt `pan_number` on case read | `routes/cases.ts` → call `decryptPii()` after SELECT | Add `decrypt: true` query param |
| 1c | Encrypt `profiles.phone` on profile create/update | Profile route handler | |
| 1d | Encrypt `staff.phone` + `staff.email` | `workforce/api.py` + coordinator routes | |
| 1e | Create DB migration for existing data | `scripts/encrypt-existing-pii.py` | Read plaintext → encrypt → write back |
| 1f | Add `--decrypt` flag for admin export | `scripts/export-pii.py` | For legitimate bulk access |
| 1g | Add tests for encrypt/decrypt roundtrip | `tests/test_encryption.py` | Key missing → returns null |
| 1h | Add `PII_ENCRYPTION_KEY` to deploy secrets | GitHub Actions + VPS `.env` | Generate with `openssl rand -base64 32` |

**Risk:** Once encrypted, `WHERE pan_number = 'ABCDE1234F'` queries will break. Must search by case ID, not PAN.

---

### Sprint 2: Automated Backups

**Goal:** Move from "documented backup plan" to "automated, verified backups."

| Task | File(s) | Effort | Notes |
|------|---------|--------|-------|
| 2a | Add cron job for PostgreSQL `pg_dump` | VPS crontab or Docker cron container | Every 6h, upload to S3-compatible storage |
| 2b | Add Docker volume backup script | `scripts/backup-volumes.sh` | `tar -czf` for redis, uploads |
| 2c | Add backup health check to CI | `.github/workflows/backup-check.yml` | Weekly: verify latest backup < 24h old |
| 2d | Document Supabase backup restore procedure | `docs/BCP_DR_PLAN.md` (update) | Supabase has managed backups; document PITR window |
| 2e | Add monitoring for backup failures | Sentry + Telegram alert | |

---

### Sprint 3: Operationalize Processes

**Goal:** Move documented processes into repeatable, scheduled operations.

| Task | Details | Owner | Cadence |
|------|---------|-------|---------|
| 3a | Schedule quarterly access review | Add calendar reminder | Quarterly (Mar/Jun/Sep/Dec) |
| 3b | Run first access review | Use `docs/ACCESS_REVIEW_PROCESS.md` queries | Month 1 of observation period |
| 3c | Conduct BCP tabletop exercise | Walk through VPS failure scenario from `docs/BCP_DR_PLAN.md` | Quarterly |
| 3d | Review vulnerability scan results | Check Trivy output in GitHub Security tab | Monthly (aligned with CI) |
| 3e | Update SLA compliance report | Track uptime via Docker health checks + Sentry | Monthly |
| 3f | Create evidence collection pipeline | Automated export of audit logs, CI runs, deploy records | Month 1 (setup) |

---

### Sprint 4: Observation Period Readiness

**Goal:** Ready for the 12-month Type II observation window.

| Task | Details | Owner |
|------|---------|-------|
| 4a | Draft AT-C 205 description of system | Describe boundaries, infrastructure, data flows | Product |
| 4b | Schedule auditor scoping discussion | Confirm TSC categories and evidence requirements | Ops |
| 4c | Run mock audit | Use `audit_simulator.py` from compliance-os | DevOps |
| 4d | Generate ISO 27001 cross-walk evidence map | Map shared controls, tag evidence for dual use | DevOps |
| 4e | Set observation period start date | Target: 2026-07-01 or Q3 2026 | Ops |
| 4f | Conduct security awareness training | Document training records for annual control | All |

---

## 📊 Effort Summary

| Sprint | Tasks | Est. Effort | Priority |
|--------|-------|-------------|----------|
| **Sprint 1** | Wire PII encryption | 3-5 days | 🔴 HIGH |
| **Sprint 2** | Automated backups | 2-3 days | 🟡 MEDIUM |
| **Sprint 3** | Operationalize processes | 1-2 days | 🟡 MEDIUM |
| **Sprint 4** | Observation readiness | 3-5 days | 🟡 MEDIUM |

**Total:** ~9-15 days of focused work before the observation period can start.

---

## 🚨 Key Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| PAN encryption breaks search | Operational slowdown | Search by case ID instead of PAN; add hash column for lookups if needed |
| No dedicated security personnel | All tasks fall on founder | Accept for now; document single-person constraints in SOC 2 report |
| Dependabot (38 vulns) | Audit finding if unpatched | Triage weekly: fix CRITICAL/HIGH, track MEDIUM/LOW |
| No privacy/DPIA for client data | P1-P8 scope gap | Conduct DPIA before including Privacy TSC |
