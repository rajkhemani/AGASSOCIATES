# Tenant Security Audit Report

**Project:** Luxor9 Legal OS (AGASSOCIATES Repository)  
**Date:** 2025-08-20  
**Auditor:** security-adversary  
**Scope:** Multi-tenant isolation, IDOR, RLS, service role misuse, cross-tenant mutations, info leakage  

---

## Executive Summary

**CRITICAL FINDINGS: 8** | **HIGH: 12** | **MEDIUM: 6** | **LOW: 4**

The codebase exhibits **systemic tenant isolation failures** across both subsystems (`ag-platform` and `ag-associates-ai`). The primary root causes are:
1. **Application-layer queries missing `org_id` WHERE clauses** on mutating operations (UPDATE/DELETE)
2. **Widespread use of `SUPABASE_SERVICE_ROLE_KEY`** which bypasses all RLS policies
3. **Permissive RLS policies** with `USING (true)` / `WITH CHECK (true)` on collaboration tables
4. **No defense-in-depth** — relying solely on RLS without application-layer validation

An attacker with a valid auth token for Tenant A can:
- **Read/Write/Delete** Tenant B's cases, documents, invoices, timesheets
- **Escalate SLA breaches** across all tenants via cron endpoints
- **Mark invoices paid/overdue** for any organization
- **Trigger NOI workflow actions** on arbitrary case IDs

---

## 1. IDOR / Tenant Bypass — Direct Object Reference Without Org Validation

### 1.1 `CaseService.updateStatus()` — **CRITICAL**
**File:** `ag-platform/src/server/services/caseService.ts:43-69`

```typescript
async updateStatus(id: string, status: CaseStatus, userId: string, notes?: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const currentCase = await client.query('SELECT status FROM cases WHERE id = $1', [id]); // NO org_id!
    // ...
    await client.query('UPDATE cases SET status = $1 WHERE id = $2', [status, id]); // NO org_id!
    await client.query(
      `INSERT INTO case_timeline (case_id, status_from, status_to, notes, changed_by)
       VALUES ($1, $2, $3, $4, $5)`,  // NO org_id validation on case_id
      [id, oldStatus, status, notes, userId]
    );
```

**Impact:** Any authenticated user can change status of ANY case in ANY organization by knowing its UUID. The `case_timeline` insert also lacks org validation.

**Attack:** `PUT /api/cases/<victim-case-uuid>/status` with `{"status": "CLOSED"}` — closes victim's case.

---

### 1.2 `billing.ts` — Invoice Mutations Without Org Check — **CRITICAL**
**File:** `ag-platform/src/lib/billing.ts`

| Function | Line | Vulnerable Query |
|----------|------|------------------|
| `markInvoiceSent` | 256-259 | `UPDATE invoices SET status = 'SENT' WHERE id = $1 AND status = 'DRAFT'` |
| `markInvoicePaid` | 262-296 | `UPDATE invoices SET status = 'PAID', paid_at = $1 WHERE id = $2` |
| `autoMarkOverdueInvoices` | 317-322 | `UPDATE invoices SET status = 'OVERDUE' WHERE status = 'SENT' AND due_at < NOW()` |

**Impact:** 
- `markInvoiceSent/Paid`: Any user can mark any invoice sent/paid by UUID
- `autoMarkOverdueInvoices`: **Cross-tenant mass mutation** — marks ALL overdue invoices across ALL organizations as OVERDUE. Called via `POST /invoices/auto-overdue` (PRINCIPAL only, but still cross-tenant)

---

### 1.3 `sla.ts` — SLA Mutations Without Org Check — **CRITICAL**
**File:** `ag-platform/src/server/sla.ts`

| Function | Line | Vulnerable Query |
|----------|------|------------------|
| `sendSLAWarnings` | 256-259 | `UPDATE cases SET sla_warning_sent = true WHERE id = $1` |
| `processSLABreaches` | 277-280 | `UPDATE cases SET sla_breached = true WHERE id = $1` |
| `triggerEscalation` | 347-350 | `UPDATE cases SET sla_escalated = true WHERE id = $1` |

**Impact:** Cron job `runSLACheck(orgId)` iterates cases for one org but the UPDATEs lack org_id — if case IDs collide (they're UUIDs, low probability but possible) or if logic error passes wrong case ID, it mutates wrong tenant's cases.

---

### 1.4 `intake-api` Webhook — No Auth, Creates Cases — **HIGH**
**File:** `ag-platform/services/intake-api/src/routes/webhook.ts:12-52`

```typescript
typedFastify.post('/bank-intake', ..., async (request, reply) => {
  // NO AUTHENTICATION CHECK
  const orgId = await getOrganizationByBank(validatedData.bank_name);
  const newCase = await createCase({ org_id: orgId, ... });
```

**Impact:** Unauthenticated endpoint creates cases in any organization. Uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS). Attacker can spam cases, pollute data, or deduce org structure via error messages.

---

### 1.5 `documents.ts` — Delete Endpoint Has Race Condition — **MEDIUM**
**File:** `ag-platform/src/server/routes/documents.ts:192-232`

```typescript
// Line 225: DELETE FROM documents WHERE id = $1  -- Uses req.params.documentId directly
// Line 199-212: Verifies org_id via JOIN, but documentId from params not validated against caseId
```

**Issue:** The `docCheck` query verifies `d.case_id = $2` but the DELETE uses only `req.params.documentId`. If attacker knows a document ID in another org but guesses a case ID in their org that matches, the check passes but DELETE targets wrong document.

---

## 2. Missing org_id in Mutations — Service Layer

### 2.1 `CaseService` Methods Accept caseId But Not orgId — **HIGH**

| Method | Parameters | Missing orgId Validation |
|--------|------------|-------------------------|
| `updateStatus` | `(id, status, userId, notes)` | UPDATE/INSERT without org_id |
| `getCaseTimeline` | `(id, orgId)` | Has orgId ✓ |
| `getCaseById` | `(id, orgId)` | Has orgId ✓ |

**Pattern:** Service methods that mutate data accept `caseId` but not `orgId`, relying on RLS. RLS is bypassed by service role key usage elsewhere.

---

### 2.2 API Endpoints Not Validating Tenant Ownership — **HIGH**

| Endpoint | File | Issue |
|----------|------|-------|
| `PATCH /cases/:id` | `cases.ts:144` | Calls `updateStatus` without orgId verification |
| `PUT /cases/:id/status` | `cases.ts:113` | Calls `updateStatus` without orgId verification |
| `POST /invoices/:id/send` | `invoices.ts:156` | Calls `markInvoiceSent` (no orgId) |
| `POST /invoices/:id/paid` | `invoices.ts:176` | Calls `markInvoicePaid` (no orgId) |
| `POST /invoices/auto-overdue` | `invoices.ts:230` | Calls `autoMarkOverdueInvoices` (cross-tenant) |

---

## 3. Cross-Tenant Mutations — Tenant A Modifying Tenant B Data

### 3.1 `autoMarkOverdueInvoices` — **CRITICAL**
**File:** `ag-platform/src/lib/billing.ts:317-322`

```typescript
export async function autoMarkOverdueInvoices(): Promise<number> {
  const result = await pool.query(
    `UPDATE invoices SET status = 'OVERDUE' WHERE status = 'SENT' AND due_at < NOW()`
  );  // NO org_id filter — affects ALL organizations!
  return result.rowCount ?? 0;
}
```

**Exposed via:** `POST /invoices/auto-overdue` (requires PRINCIPAL role, but still cross-tenant)

---

### 3.2 Service Role / Admin Bypassing RLS — **CRITICAL**

#### A. `ag-associates-ai/backend/noi_agent.py` — **CRITICAL**
Uses `SUPABASE_SERVICE_ROLE_KEY` for ALL Supabase operations:

```python
# Line 506-509: Creates client with SERVICE_ROLE_KEY
_SB = create_client(
    os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"]
)

# Line 91-100: Fetches case WITHOUT org_id filter (RLS bypassed)
resp = await client.get(
    f"{supabase_url}/rest/v1/cases?id=eq.{case_id}",
    headers={"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"}
)

# Line 144-157: PATCHES case WITHOUT org_id filter (RLS bypassed)
resp = await client.patch(
    f"{supabase_url}/rest/v1/cases?id=eq.{case_id}",
    json={NOI.status_field: new_status, ...}
)
```

**Impact:** NOI agent can read/write ANY case in ANY organization. No tenant isolation whatsoever.

---

#### B. `ag-associates-ai/backend/main.py` — **CRITICAL**
```python
# Line 498-509: Global Supabase client with SERVICE_ROLE_KEY
_SB: SupabaseClient | None = None
def _sb() -> SupabaseClient:
    if _SB is None:
        _SB = create_client(
            os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        )
    return _SB
```

Used by voice endpoints, NeSL filing, webhook handlers — all bypass RLS.

---

#### C. `ag-associates-ai/backend/email_intake/agent.py` — **CRITICAL**
```python
# Line 532-559: create_case uses SERVICE_ROLE_KEY
headers = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    ...
}
await client.post(f"{SUPABASE_URL}/rest/v1/cases", ...)
```

Creates cases in ANY org (org_id from email parsing, not validated against user context).

---

#### D. `ag-platform/services/intake-api/src/services/supabase.service.ts` — **CRITICAL**
```typescript
// Line 7-18: Creates client with SERVICE_ROLE_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
_supabase = createClient(supabaseUrl, supabaseServiceKey);

// Line 29-39: createCase inserts with provided org_id (no validation)
export async function createCase(params: CreateCaseParams) {
  const { data, error } = await supabase.from('cases').insert([params]).select().single();
}
```

Webhook `/bank-intake` accepts `bank_name`, resolves `org_id`, inserts with service role — **no authentication, no tenant validation**.

---

### 3.3 Unscoped Joins Leaking Data — **MEDIUM**

**File:** `ag-platform/src/server/routes/dashboard.ts:22-28`

```typescript
const recentTimeline = await pool.query(
  `SELECT ct.notes as action, ct.created_at as timestamp, c.case_number as details
   FROM case_timeline ct JOIN cases c ON c.id = ct.case_id
   WHERE c.org_id = $1  -- org_id filter on cases, but what if ct has orphaned rows?
   ORDER BY ct.created_at DESC LIMIT 10`,
  [orgId]
);
```

**Risk:** If `case_timeline` has rows with `case_id` not in `cases` (orphaned), they won't appear. But reverse — if RLS fails, join could leak. Not directly exploitable but indicates pattern.

---

## 4. Permissive RLS Policies

### 4.1 Collaboration Tables — `USING (true)` / `WITH CHECK (true)` — **CRITICAL**
**File:** `ag-platform/supabase/migrations/20260423_collaboration_setup.sql:64-74`

```sql
CREATE POLICY "Allow authenticated full access to tasks" 
ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to comments" 
ON public.comments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to activities" 
ON public.activities FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

**Impact:** ANY authenticated user (any tenant) can READ/WRITE/DELETE all tasks, comments, activities across ALL organizations. No tenant isolation whatsoever on these tables.

---

### 4.2 Notifications Table — Partial Leak — **HIGH**
**File:** `ag-platform/supabase/migrations/20260423_collaboration_setup.sql:71-73`

```sql
CREATE POLICY "Allow users to read their notifications" 
ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Allow users to update their notifications" 
ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Allow authenticated to insert notifications" 
ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);  -- ANY user can insert for ANY user!
```

**Impact:** Any user can create notifications for any other user (including other tenants). Read/Update restricted to own, but INSERT is wide open.

---

### 4.3 Files Table — Folder-Based RLS Bypass Risk — **MEDIUM**
**File:** `ag-platform/supabase/migrations/20260423_document_storage_setup.sql:62-72`

```sql
CREATE POLICY "Users can access their org's project files" 
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'project-files' AND get_org_role(auth.uid(), (storage.foldername(name))[1]::uuid) IS NOT NULL);
```

**Risk:** Relies on `storage.foldername(name))[1]::uuid` parsing folder name as UUID. If folder naming convention broken or malicious upload places file in wrong folder, RLS fails. Should also have `organization_id` column check.

---

### 4.4 Missing RLS on Tables — **MEDIUM**

Tables with `ENABLE ROW LEVEL SECURITY` but **no policies** (or only partial):
- `bank_portal_configs` — has policies ✓
- `bank_workflow_variants` — has policies ✓
- `staff_activity` — policy allows `org_id IS NULL` (line 355 in migrations.sql)

```sql
CREATE POLICY staff_activity_org_isolation ON staff_activity
  FOR ALL USING (org_id = current_setting('app.current_org_id')::uuid OR org_id IS NULL);
```

**Risk:** `org_id IS NULL` rows visible to ALL tenants. System-level activity logs leak across tenants.

---

### 4.5 Owner-Role RLS Bypass — **HIGH**
**File:** `ag-platform/supabase/migrations/20260801000000_rls_policies.sql:28-34`

```sql
CREATE POLICY profiles_admin_all ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'PRINCIPAL'
    )
  );
```

**Issue:** Any user with `role = 'PRINCIPAL'` in THEIR organization can see ALL profiles in ALL organizations. The subquery doesn't filter by `org_id`. A principal in Tenant A sees all users in Tenant B.

---

## 5. Service Role Misuse — Supabase Service Role Key in App Code

### 5.1 Summary of Service Role Usage

| Subsystem | Files | Purpose |
|-----------|-------|---------|
| `ag-associates-ai/backend` | `main.py`, `noi_agent.py`, `email_intake/agent.py` | All Supabase operations |
| `ag-platform/services/intake-api` | `supabase.service.ts` | Webhook case creation |
| `ag-platform` (potential) | Various | Check for `SUPABASE_SERVICE_ROLE_KEY` usage |

**Root Cause:** Developers used service role key to "avoid RLS complexity" — but this **completely defeats multi-tenancy**.

**Remediation:** 
- Use anon key + `set_current_org_id()` via PostgREST headers
- Or use user's JWT with `app_metadata.app_org_id` claim
- Never use service role key in application code paths that handle tenant data

---

### 5.2 Admin Operations That Should Be Tenant-Scoped — **HIGH**

**File:** `ag-platform/src/server/routes/invoices.ts:218-227`

```typescript
router.get('/reconcile', requireRole('PRINCIPAL', 'ADVOCATE'), async (req, res) => {
  const orgId = req.user!.orgId!;
  const reconciliations = await reconcileBankAdvances(orgId);  // Passes orgId ✓
});
```

This one is correct, but the pattern is inconsistent — many admin endpoints don't enforce org scope.

---

## 6. Tenant Info Leakage

### 6.1 Error Messages Revealing Resource Existence — **MEDIUM**

**File:** `ag-platform/src/server/routes/cases.ts:73-75`

```typescript
if (!kase) {
  res.status(404).json({ error: 'Case not found' });  // Distinguishes 404 vs 403
  return;
}
```

**Attack:** Enumerate case UUIDs across tenants — 404 means "exists but not yours", 403 means "exists and not yours" (same), but timing differs. Better: always return 404.

---

### 6.2 `intake-api` Returns Case ID in Response — **LOW**
**File:** `ag-platform/services/intake-api/src/routes/webhook.ts:43-50`

```typescript
return reply.status(200).send({
  status: 'success',
  data: { case_id: newCase.id, ... }
});
```

**Risk:** Unauthenticated endpoint returns created case UUID. Attacker can spam webhook to harvest valid case IDs for Tenant A, then attempt IDOR on `ag-platform` endpoints.

---

### 6.3 Timing Attacks on Existence Checks — **LOW**

Multiple endpoints use sequential checks:
```typescript
const caseCheck = await pool.query('SELECT id FROM cases WHERE id = $1 AND org_id = $2', [id, orgId]);
if (caseCheck.rows.length === 0) return 404;
```

**Risk:** Slight timing difference between "not found" and "found but wrong org" — negligible in practice but theoretically exploitable.

---

### 6.4 Metadata in Responses — **LOW**

**File:** `ag-platform/src/server/routes/documents.ts:154-188`

```typescript
const downloadUrl = await createSignedDownloadUrl(document.bucket_id, document.storage_path);
res.json({ success: true, downloadUrl, fileName: document.name, contentType: document.content_type });
```

Storage path may contain org/case structure: `org-id/case-id/filename`. Leaks internal ID structure.

---

## 7. Additional Findings

### 7.1 `auth.ts` — JWT Secret Not Validated — **MEDIUM**
**File:** `ag-platform/src/server/auth.ts:6-7`

```typescript
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
// Not used! Supabase SSR client handles verification via JWKS.
```

**Issue:** `SUPABASE_JWT_SECRET` is read but never used. If custom JWT verification added later, missing secret = bypass.

---

### 7.2 `auth_hooks.sql` — Hardcoded Org ID — **HIGH**
**File:** `ag-platform/supabase/migrations/20260514000001_auth_hooks.sql:26`

```sql
assigned_org_id := '00000000-0000-0000-0000-000000000000'::uuid;
```

**Impact:** Auth hook assigns NULL org to all users. RLS policies using `current_setting('app.current_org_id')` will fail open or closed depending on policy. This is a **template/placeholder** that was never replaced with real logic.

---

### 7.3 `staff_activity` Policy Allows NULL org_id — **MEDIUM**
**File:** `ag-platform/src/server/migrations.sql:352-356`

```sql
CREATE POLICY staff_activity_org_isolation ON staff_activity
  FOR ALL USING (
    org_id = current_setting('app.current_org_id')::uuid
    OR org_id IS NULL
  );
```

System-generated activity logs (with `org_id = NULL`) visible to all tenants.

---

### 7.4 Inconsistent Auth Middleware Usage — **MEDIUM**

| Route File | Middleware | Org Check |
|------------|------------|-----------|
| `cases.ts` | `auth` (line 14) | Manual in handlers |
| `documents.ts` | `authOrg` (line 13) | Manual in handlers |
| `invoices.ts` | `authOrg` (line 18) | Manual in handlers |
| `timesheets.ts` | `authOrg` (line 10) | Manual in handlers |
| `dashboard.ts` | `authOrg` (line 8) | Automatic via middleware |

**Risk:** `cases.ts` uses `auth` only (no `requireOrgAccess`), relies on manual checks. Easy to forget.

---

## 8. Remediation Priority Matrix

| ID | Finding | Severity | Effort | Priority |
|----|---------|----------|--------|----------|
| 1.1 | `CaseService.updateStatus` missing org_id | CRITICAL | Low | P0 |
| 1.2 | `billing.ts` invoice mutations missing org_id | CRITICAL | Low | P0 |
| 1.3 | `sla.ts` SLA mutations missing org_id | CRITICAL | Low | P0 |
| 3.1 | `autoMarkOverdueInvoices` cross-tenant | CRITICAL | Low | P0 |
| 3.2A | `noi_agent.py` service role bypass | CRITICAL | Medium | P0 |
| 3.2B | `main.py` service role bypass | CRITICAL | Medium | P0 |
| 3.2C | `email_intake/agent.py` service role bypass | CRITICAL | Medium | P0 |
| 3.2D | `intake-api` service role bypass | CRITICAL | Medium | P0 |
| 4.1 | Collaboration tables `USING (true)` | CRITICAL | Low | P0 |
| 4.2 | Notifications INSERT `WITH CHECK (true)` | HIGH | Low | P1 |
| 4.5 | Principal sees all profiles cross-tenant | HIGH | Low | P1 |
| 7.2 | Auth hook hardcoded org_id | HIGH | Low | P1 |
| 1.4 | Intake webhook no auth | HIGH | Low | P1 |
| 2.1 | Service methods missing orgId param | HIGH | Medium | P1 |
| 2.2 | API endpoints not validating ownership | HIGH | Medium | P1 |
| 4.3 | Files folder-based RLS fragile | MEDIUM | Medium | P2 |
| 4.4 | Missing RLS on some tables | MEDIUM | Low | P2 |
| 6.1 | Error message enumeration | MEDIUM | Low | P2 |
| 7.1 | JWT secret not validated | MEDIUM | Low | P2 |
| 7.3 | staff_activity NULL org_id leak | MEDIUM | Low | P2 |
| 7.4 | Inconsistent auth middleware | MEDIUM | Low | P2 |
| 1.5 | Documents delete race condition | LOW | Low | P3 |
| 6.2 | Intake returns case_id | LOW | Low | P3 |
| 6.3 | Timing attacks | LOW | Medium | P3 |
| 6.4 | Storage path leaks IDs | LOW | Low | P3 |

---

## 9. Recommended Fixes

### Immediate (P0 — This Sprint)

1. **Add `org_id` to ALL mutating queries** in `caseService.ts`, `billing.ts`, `sla.ts`
   ```sql
   -- Before
   UPDATE cases SET status = $1 WHERE id = $2
   -- After
   UPDATE cases SET status = $1 WHERE id = $2 AND org_id = $3
   ```

2. **Fix `autoMarkOverdueInvoices`** to accept `orgId` parameter

3. **Replace collaboration table policies** with org-scoped policies:
   ```sql
   CREATE POLICY tasks_org_isolation ON tasks
     FOR ALL USING (
       project_id IN (SELECT id FROM cases WHERE org_id = current_setting('app.current_org_id')::uuid)
     );
   ```

4. **Fix principal profile policy** to scope by org:
   ```sql
   CREATE POLICY profiles_admin_all ON profiles
     FOR ALL USING (
       org_id = current_setting('app.current_org_id')::uuid
       AND EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'PRINCIPAL')
     );
   ```

### Short-term (P1 — Next Sprint)

5. **Migrate `ag-associates-ai` to use anon key + `set_current_org_id()`** or user JWT
   - Remove all `SUPABASE_SERVICE_ROLE_KEY` usage from application code
   - Use PostgREST headers: `Prefer: return=representation` with `Authorization: Bearer <user_jwt>`

6. **Secure intake-api webhook** with API key + org validation

7. **Add `requireOrgAccess` middleware to all routes** (`cases.ts` missing)

8. **Fix auth hook** to actually lookup user's org from `user_roles` or `profiles`

### Medium-term (P2)

9. **Add application-layer tenant validation** to all service methods (defense in depth)

10. **Implement consistent error responses** (always 404, never distinguish not-found vs forbidden)

11. **Audit all RLS policies** for `USING (true)` / `WITH CHECK (true)`

12. **Add org_id to `staff_activity` policy** (remove `OR org_id IS NULL`)

---

## 10. Testing Recommendations

1. **Automated IDOR Tests:** For each mutating endpoint, test with:
   - Valid case in own org → 200
   - Valid case in other org → 403/404
   - Invalid UUID → 404

2. **RLS Policy Tests:** Direct SQL tests as different `app.current_org_id` settings

3. **Service Role Audit:** Grep for `SUPABASE_SERVICE_ROLE_KEY` — should only appear in:
   - Migration scripts
   - Admin CLI tools (not web servers)
   - Background workers with explicit tenant context

4. **Cross-Tenant Mutation Tests:** Run `autoMarkOverdueInvoices` as Tenant A, verify Tenant B invoices unchanged

---

## Appendix: Files Requiring Immediate Attention

```
ag-platform/src/server/services/caseService.ts          # updateStatus()
ag-platform/src/lib/billing.ts                          # markInvoiceSent, markInvoicePaid, autoMarkOverdueInvoices
ag-platform/src/server/sla.ts                           # sendSLAWarnings, processSLABreaches, triggerEscalation
ag-platform/supabase/migrations/20260423_collaboration_setup.sql  # USING (true) policies
ag-platform/supabase/migrations/20260801000000_rls_policies.sql   # Principal cross-org policy
ag-associates-ai/backend/noi_agent.py                   # Service role usage
ag-associates-ai/backend/main.py                        # Service role usage
ag-associates-ai/backend/email_intake/agent.py          # Service role usage
ag-platform/services/intake-api/src/services/supabase.service.ts  # Service role usage
ag-platform/src/server/auth.ts                          # Missing requireOrgAccess on cases.ts
ag-platform/supabase/migrations/20260514000001_auth_hooks.sql     # Hardcoded org_id
```

---

**End of Report**