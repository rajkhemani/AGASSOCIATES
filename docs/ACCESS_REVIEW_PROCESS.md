# Quarterly Access Review Process

**Owner:** LUXORANOVA9
**Version:** 1.0.0
**Last Updated:** 2026-06-13
**Frequency:** Quarterly (calendar Q1/Q2/Q3/Q4)
**Scope:** AG Associates Platform — Supabase Auth + Profiles + RBAC

---

## 1. Scope

Each quarter the review covers:

| Category | What's Reviewed | Source |
|----------|----------------|--------|
| **Active users** | All non-deleted `auth.users` with a `profiles` row | `auth.users` + `public.profiles` |
| **Role assignments** | Current role per user against the 5-level RBAC hierarchy | `public.profiles.role` |
| **Dormant accounts** | Users with no login activity for >90 days | `auth.users.last_sign_in_at` |
| **Privileged access** | All PRINCIPAL + ADVOCATE role holders | `public.profiles WHERE role IN ('PRINCIPAL','ADVOCATE')` |
| **Orphan profiles** | `profiles` rows without a matching `auth.users` entry (or vice versa) | `FULL OUTER JOIN auth.users` |
| **External auth methods** | Users registered via Magic Link vs Google OAuth | `auth.users.raw_app_meta_provider` |
| **Justification coverage** | Whether each active user has a documented business need for their current role | Review against firm roster |

---

## 2. Procedure

### 2.1 Initiate

1. Reviewer (PRINCIPAL or designated Security Officer) opens a quarterly review ticket in `tasks/todo.md` with the label `access-review-QX-2026`.
2. Determine cut-off date: **last day of the quarter at 23:59:59 UTC**.
3. Gather the justification roster — the firm's current headcount spreadsheet or HR list with role assignments and termination dates.

### 2.2 Extract

Run the SQL queries from §4 against the Supabase production database:

| Step | Action | SQL Reference |
|------|--------|---------------|
| 2.2.1 | Export all active users with profile, role, org, bank, last login | Query §4.1 |
| 2.2.2 | Export privileged users (PRINCIPAL + ADVOCATE) | Query §4.2 |
| 2.2.3 | Export dormant accounts (>90 days no login) | Query §4.3 |
| 2.2.4 | Export orphan records (profiles without auth / auth without profile) | Query §4.4 |
| 2.2.5 | Export permission inventory per role for reference | Query §4.5 |

### 2.3 Review

For each row in the export, compare against the justification roster:

| Check | Criterion | Action if Violated |
|-------|-----------|-------------------|
| **Valid user** | User exists on current firm roster | Flag for deactivation |
| **Correct role** | Role matches job function and seniority | Flag for downgrade/escalation |
| **Active within 90 days** | `last_sign_in_at` within 90 days of cut-off | Flag as dormant |
| **Correct org** | `org_id` matches user's current firm/team assignment | Flag for reassignment |
| **Correct bank** | `bank_id` only populated for BANK_VIEWER roles | Flag for correction |
| **Justification on file** | Business reason for each privileged role documented | Flag for remediation |

### 2.4 Approve

1. Reviewer compiles the findings into a review document stored at `docs/access-reviews/YYYY-QX-review.md`.
2. PRINCIPAL reviews and signs off on all proposed changes.
3. Changes are batched and applied per §5 (Remediation Workflow).

### 2.5 Archive

1. Signed review document is committed to the repo under `docs/access-reviews/`.
2. A summary entry is added to `docs/access-reviews/INDEX.md` (create if not exists).
3. The review ticket in `tasks/todo.md` is closed.

---

## 3. Review Checklist

| # | Item | Reviewer | Date | Status |
|---|------|----------|------|--------|
| 1 | Export active users from `auth.users` + `profiles` | | | |
| 2 | Export privileged (PRINCIPAL + ADVOCATE) role holders | | | |
| 3 | Export dormant accounts (last_sign_in_at > 90 days) | | | |
| 4 | Export orphan profile/user records | | | |
| 5 | Cross-reference every user against current firm roster | | | |
| 6 | Verify every PRINCIPAL/ADVOCATE has a documented justification | | | |
| 7 | Verify BANK_VIEWER accounts have a valid `bank_id` | | | |
| 8 | Check no PRINCIPAL-level user lacks MFA | | | |
| 9 | Compile findings document | | | |
| 10 | PRINCIPAL review & sign-off on changes | | | |
| 11 | Apply remediation batch (§5) | | | |
| 12 | Commit review artifact to `docs/access-reviews/` | | | |
| 13 | Update `docs/access-reviews/INDEX.md` | | | |

---

## 4. Sample SQL Queries

### 4.1 Active Users with Profile, Role, Org, and Last Login

```sql
SELECT
    au.id AS auth_user_id,
    au.email,
    au.last_sign_in_at,
    au.created_at AS account_created_at,
    au.raw_app_meta_provider AS auth_provider,
    p.id AS profile_id,
    p.full_name,
    p.role,
    p.org_id,
    o.name AS org_name,
    p.bank_id,
    b.name AS bank_name,
    p.phone
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
LEFT JOIN public.organizations o ON o.id = p.org_id
LEFT JOIN public.banks b ON b.id = p.bank_id
WHERE au.deleted_at IS NULL
ORDER BY p.role DESC, au.last_sign_in_at DESC NULLS LAST;
```

### 4.2 Privileged Role Holders (PRINCIPAL + ADVOCATE)

```sql
SELECT
    au.email,
    p.full_name,
    p.role,
    o.name AS org_name,
    au.last_sign_in_at,
    au.created_at
FROM public.profiles p
JOIN auth.users au ON au.id = p.user_id
LEFT JOIN public.organizations o ON o.id = p.org_id
WHERE p.role IN ('PRINCIPAL', 'ADVOCATE')
  AND au.deleted_at IS NULL
ORDER BY p.role, p.full_name;
```

### 4.3 Dormant Accounts (No Login >90 Days)

```sql
SELECT
    au.id,
    au.email,
    p.full_name,
    p.role,
    o.name AS org_name,
    au.last_sign_in_at,
    au.created_at,
    AGE(NOW(), au.last_sign_in_at) AS days_since_login
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
LEFT JOIN public.organizations o ON o.id = p.org_id
WHERE au.deleted_at IS NULL
  AND (
      au.last_sign_in_at IS NULL
      OR au.last_sign_in_at < NOW() - INTERVAL '90 days'
  )
ORDER BY au.last_sign_in_at NULLS FIRST;
```

### 4.4 Orphan Records

```sql
-- Profiles without matching auth.users
SELECT 'orphan_profile' AS issue, p.id, p.full_name, p.role, p.user_id AS missing_auth_user
FROM public.profiles p
LEFT JOIN auth.users au ON au.id = p.user_id
WHERE au.id IS NULL;

-- auth.users without matching profile
SELECT 'orphan_auth_user' AS issue, au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE p.id IS NULL
  AND au.deleted_at IS NULL;
```

### 4.5 Permission Inventory Per Role

```sql
-- Reference: shows which permissions each role inherits.
-- Run against the codebase definition in auth/rbac.py, not SQL,
-- but this query maps the profiles table to role-level counts.
SELECT
    p.role,
    COUNT(DISTINCT p.id) AS user_count,
    COUNT(DISTINCT p.org_id) AS orgs_covered
FROM public.profiles p
JOIN auth.users au ON au.id = p.user_id
WHERE au.deleted_at IS NULL
GROUP BY p.role
ORDER BY
    CASE p.role
        WHEN 'BANK_VIEWER' THEN 1
        WHEN 'CLERK' THEN 2
        WHEN 'EXECUTIVE' THEN 3
        WHEN 'ADVOCATE' THEN 4
        WHEN 'PRINCIPAL' THEN 5
    END;
```

### 4.6 Users by Auth Provider

```sql
SELECT
    raw_app_meta_provider AS auth_provider,
    COUNT(*) AS user_count
FROM auth.users
WHERE deleted_at IS NULL
GROUP BY raw_app_meta_provider;
```

---

## 5. Remediation Workflow

### 5.1 Deactivation (Departing Users / Orphan Accounts)

1. **Disable login** — Supabase Dashboard > Authentication > Users > Disable user (sets `banned_until = now()` or `deleted_at`).
2. **Option A (soft):** Set `auth.users.deleted_at = NOW()` — preserves referential integrity for historical cases.
3. **Option B (hard):** Delete the `auth.users` row only after confirming no active case assignments in `public.cases.assigned_executive_id`.
4. **Cleanup:** Remove or nullify `profiles.user_id` to break the link (or delete the profile row).
5. **Rotate sessions:** All active JWT tokens for the user are immediately invalidated.

### 5.2 Role Downgrade (Over-privileged Users)

```sql
UPDATE public.profiles
SET role = '<NEW_ROLE>'  -- e.g., 'CLERK'
WHERE user_id = '<USER_UUID>'
  AND role != '<NEW_ROLE>';
```

The change takes effect on the user's next JWT refresh (Supabase Access Token hook re-reads the profile). To force immediate effect:

1. Revoke the user's active sessions via Supabase Dashboard > Authentication > User > Log out.
2. The user re-authenticates and receives a JWT reflecting the downgraded role.

### 5.3 Role Escalation (Approved Promotions)

Same `UPDATE` statement as §5.2. Escalation is effective immediately after JWT refresh.

### 5.4 Org / Bank Reassignment

```sql
UPDATE public.profiles
SET org_id = '<NEW_ORG_UUID>',
    bank_id = CASE WHEN '<NEW_ROLE>' = 'BANK_VIEWER' THEN '<NEW_BANK_UUID>' ELSE NULL END
WHERE user_id = '<USER_UUID>';
```

### 5.5 Dormant Account Handling

| Scenario | Action |
|----------|--------|
| Never logged in (Magic Link sent but not claimed) | Delete if >90 days since `created_at` |
| Active elsewhere but not on platform | Downgrade to BANK_VIEWER; contact user |
| Contractor who finished engagement | Deactivate per §5.1 |
| Left firm | Deactivate per §5.1 |

### 5.6 Batch Application

1. Assemble all approved changes into a single SQL script prefixed with the review ID.
2. Execute against production during low-traffic window (e.g., Sunday 02:00 IST).
3. Verify each change with a `SELECT` post-audit.
4. Commit the script alongside the review document.

---

## 6. Documentation

### Storage Location

All access review artifacts live under:

```
docs/access-reviews/
├── INDEX.md
├── 2026-Q1-review.md
├── 2026-Q1-remediation.sql
├── 2026-Q2-review.md
├── 2026-Q2-remediation.sql
└── ...
```

### INDEX.md Format

```markdown
# Access Review Index

| Quarter | Date | Reviewer | Sign-Off | Summary |
|---------|------|----------|----------|---------|
| 2026-Q1 | 2026-03-31 | — | — | Baseline review |
```

### Review Document Template

Each quarterly review document should contain:

- Cut-off date and scope
- Exported user counts (total, by role, dormant, orphan)
- Findings list with severity labels
- Proposed remediation actions
- PRINCIPAL sign-off (name + date + signature)
- Post-remediation verification results

---

## Appendix A: Role Hierarchy Reference

| Role | Level | Description |
|------|-------|-------------|
| BANK_VIEWER | 20 | Read-only case tracking for bank partners |
| CLERK | 40 | Data entry, office support, basic reporting |
| EXECUTIVE | 60 | Field work, document collection, case updates |
| ADVOCATE | 80 | Case management, filings, client communications |
| PRINCIPAL | 100 | Firm management, user administration, billing |

Permission inheritance: a role automatically includes all permissions of roles with a lower level value. See `ag-associates-ai/backend/auth/rbac.py` for the full permission matrix (40+ permissions across 11 domains).

## Appendix B: Supabase Schema Dependencies

```
auth.users
  └── public.profiles (user_id → auth.users.id)
        ├── public.organizations (org_id)
        └── public.banks (bank_id, only for BANK_VIEWER)
```

The JWT access token hook (`public.custom_access_token_hook`) injects `app_metadata.app_org_id` from the user's profile on each token refresh. RLS policies on `cases`, `documents`, and other tables use `public.get_app_org_id()` to enforce org-level isolation.
