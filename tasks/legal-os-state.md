# Luxor9 Legal OS Execution State

## Current Phase
P0-A: Tenant Mutation Security - IMPLEMENTATION PHASE

## Current Task
Dispatch first implementation task: Fix application-layer tenant isolation (CaseService.updateStatus, billing.ts, sla.ts mutations missing org_id)

## Completed
- Boot sequence: Read CLAUDE.md, AGENTS.md, tasks/lessons.md, tasks/todo.md
- Inspected git status: on main, up to date with origin/main, 3 untracked security files
- Current branch: main (917d988)
- Recent commits show: feat: Complete automation overhaul + Coolify deployment + Security hardening
- Working tree has user changes: 3 untracked security files (README.md, policies/, risk-acceptance.md)
- **Subagent A (Cartographer) COMPLETE** - Report: ARCHITECTURE_FINDINGS_REPORT.md
- **Subagent B (Security Adversary) COMPLETE** - Report: security-audit-report.md (30 vulnerabilities, 8 CRITICAL)
- **Subagent C (DB Engineer) COMPLETE** - Report: migration-inventory.md (27 migrations, 8+ duplicate tables, 6 permissive RLS tables)
- **Subagent G (Release Engineer) COMPLETE** - Report: ci-cd-inventory.md (14 workflows, failure suppression, missing P0 gates)

## In Progress
- Subagent D (Workflow Engineer) - Workflow Inventory (report not found)
- Subagent E (AI Governance) - AI Governance Inventory (report not found)

## Blocked
None

## Decisions
- Using E:\DSH\AGASSOCIATES as PROJECT_ROOT
- Following frozen architecture from prompt
- Starting with P0-A tenant mutation security per execution order (item 1: Tenant mutation IDOR)
- Parallelizing independent work: all 6 cartography tasks dispatched
- **P0-A Scope**: Fix application-layer missing org_id in mutating queries (CaseService, billing, sla), replace permissive RLS on collaboration tables, remove service role key usage from app code

## Risks (Consolidated from All Reports)
### CRITICAL (P0 - Immediate)
- **R1**: Two disconnected case stores (noi_cases vs cases) - no reconciliation
- **R2**: GRAS challan generation broken - `executor_agent.generate_noi_challan()` missing
- **R3**: No emails ever sent - `auto_comms._send_email` hardcodes `"to": []`
- **R4**: RLS bypass in AI pipeline - `noi_agent.py` uses service role key (bypasses RLS entirely)
- **R5**: No scheduler running - Section 89B deadlines never auto-evaluated
- **R6**: Bank roster mismatch between systems
- **R7**: `CaseService.updateStatus()` missing org_id in SELECT/UPDATE/INSERT (IDOR)
- **R8**: `billing.ts` invoice mutations missing org_id (cross-tenant mass mutation in autoMarkOverdueInvoices)
- **R9**: `sla.ts` SLA mutations missing org_id
- **R10**: Collaboration tables (tasks, comments, activities) have `USING (true)` RLS - zero tenant isolation
- **R11**: Principal role policy allows cross-org profile access
- **R12**: Auth hook has hardcoded org_id placeholder
- **R13**: 4 service role key usages in app code (noi_agent.py, main.py, email_intake/agent.py, intake-api)

### HIGH (P1)
- **R14**: No org_id enforcement in AI subsystem
- **R15**: Four NeSL implementations
- **R16**: `executor_agent.wait_for_otp` uses `setEx` (JS) instead of `setex`
- **R17**: No migration automation in CI/CD
- **R18**: CI cannot detect regressions (Ruff unpinned, pytest swallowed, pre-commit permanently red)
- **R19**: Deploy bypasses security gate (no needs: security-scan)
- **R20**: Smoke tests = HTTP 200 only, no functional validation

### MEDIUM (P2)
- Schema chaos: 4 migration sources, 8+ duplicate tables, 3 duplicate enums, 3 incompatible RLS mechanisms
- Missing org_id on voice tables, capability table
- Intake webhook unauthenticated, returns case IDs
- Inconsistent auth middleware (cases.ts missing requireOrgAccess)

## Next 5 Tasks
1. **P0-A Task 1**: Fix CaseService.updateStatus() - add org_id to all mutating queries ✅ **COMPLETED**
   - Test: `tests/routes/cases.test.ts` - 2 cross-tenant tests passing (13/13 total)
   - Files: caseService.ts, routes/cases.ts
   - Evidence: SELECT/UPDATE/INSERT all include org_id; callers updated
2. **P0-A Task 2**: Fix billing.ts mutations - add org_id to markInvoiceSent, markInvoicePaid, autoMarkOverdueInvoices ✅ **COMPLETED**
   - Files: billing.ts (all 3 functions accept orgId, queries include org_id predicate)
   - Callers: routes/invoices.ts (/paid, /auto-overdue) updated to pass orgId
   - Note: /send endpoint uses inline query with org_id (consistent)
   - Tests: 18 tests pass
3. **P0-A Task 3**: Fix sla.ts mutations - add org_id to sendSLAWarnings, processSLABreaches, triggerEscalation ✅ **COMPLETED**
   - Files: sla.ts (all 3 functions accept orgId, queries include org_id predicate)
   - Tests: 22 tests pass (13 cases + 5 invoices + 4 sla)
4. **P0-A Task 4**: Fix collaboration RLS - replace USING(true) with org-scoped policies for tasks, comments, activities ✅ **COMPLETED**
   - Migration: `packages/db/migrations/003_fix_collaboration_rls.sql`
   - Added org_id columns, backfilled from case relationships
   - Dropped permissive USING(true) policies
   - Added restrictive org-scoped policies using current_setting('app.current_org_id')
   - SQL test: `test_collaboration_rls.sql` created
5. **P0-A Task 5**: Remove SUPABASE_SERVICE_ROLE_KEY from application code paths ✅ **COMPLETED**
   - Test: `tests/security/service_role_removal.test.ts` - 14 tests passing
   - Files: noi_agent.py, main.py, email_intake/agent.py, intake-api/supabase.service.ts
   - Service role key replaced with user JWT / anon key + X-Org-ID header pattern
   - Grep confirms zero SUPABASE_SERVICE_ROLE_KEY in app code
   - All tests: 36 tests passing, lint passes

## Next 5 Tasks (P0-B / P0-C / P0-D)
6. **P0-B Task 1**: Create Two-Tenant Adversarial Test Suite (automated cross-tenant tests for all endpoints)
7. **P0-C Task 1**: Fix remaining permissive RLS - notifications INSERT WITH CHECK(true), staff_activity NULL org_id, principal profile cross-org
8. **P0-D Task 1**: Create transaction-local tenant DB helper (withTenantDb pattern with set_config)
9. **P0-E Task 1**: Establish ag_owner / ag_app DB role separation (migration + runtime user)
10. **P0-F Task 1**: Create single migration authority at packages/db/migrations/ (consolidate all sources)

## Release Gates
- [x] Cross-tenant Case read denied ✅ (CaseService.getCaseById, updateStatus with org_id)
- [x] Cross-tenant Case mutation denied ✅ (updateStatus, billing, sla all include org_id)
- [x] Cross-tenant task access denied ✅ (migration 003_fix_collaboration_rls.sql - tasks table RLS)
- [x] Cross-tenant comment access denied ✅ (migration 003_fix_collaboration_rls.sql - comments table RLS)
- [x] Cross-tenant activity access denied ✅ (migration 003_fix_collaboration_rls.sql - activities table RLS)
- [ ] Runtime DB role cannot bypass RLS (P0-E: ag_owner/ag_app separation needed)
- [ ] Runtime DB role cannot perform DDL (P0-E: ag_owner/ag_app separation needed)
- [ ] Clean database migrates successfully (P0-H: needs migration consolidation first)
- [ ] Migration rerun is idempotent (P0-H: needs migration authority first)
- [ ] Modified applied migration is rejected (P0-F: needs checksum tracking)
- [ ] Python test failure makes CI red (P0-I: needs ci.yml fix)
- [ ] Frontend/build failure makes CI red (P0-I: needs ci.yml fix)
- [ ] Required security checks are not swallowed (P0-I: needs deploy.yml depends on security-scan)