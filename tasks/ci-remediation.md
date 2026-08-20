# CI Remediation Tracking

This file tracks known pre-existing CI failures and their remediation status.
**Policy**: A change is CLEAN if it does not INCREASE the failure count from the documented baselines.
All jobs in ci.yml FAIL THE PIPELINE on error (fail-closed).

---

## 1. lint-python (ruff 0.16.1, working-dir=ag-associates-ai/backend)

**Baseline**: 874 errors
**Root Cause**: Ruff 0.16 widened default rule set to include UP, RUF, I, B, SIM, BLE, S, DTZ
**Status**: ❌ Not started
**Remediation Options**:
- [ ] Fix ruff errors incrementally (preferred)
- [ ] Pin rule set in pyproject.toml to match 0.15 behavior
- [ ] Add per-file ignores for legacy code with justification

**Target**: Reduce to 0 new errors on changed files

---

## 2. lint-js-web (pre-commit/action)

**Baseline**: 1 failure (whitespace in `session-ses_19a4.md`)
**Root Cause**: Committed session transcript with trailing whitespace
**Status**: ❌ Not started
**Remediation Options**:
- [ ] Delete `session-ses_19a4.md` (it's a session transcript, not source code)
- [ ] Fix trailing whitespace in the file

**Target**: 0 failures

---

## 3. unit-tests-js-platform (vitest on Node 22)

**Baseline**: vitest needs 'ws' transport on Node < 22
**Root Cause**: vitest WebSocket transport missing on older Node versions
**Status**: ❌ Not started
**Remediation Options**:
- [ ] Upgrade CI to Node 22+ (already using 22 in ci.yml)
- [ ] Add `ws` package as devDependency if needed
- [ ] Configure vitest to use alternative transport

**Target**: Tests pass without transport errors

---

## 4. security-scan-fs (Trivy filesystem scan)

**Baseline**: TBD (to be established on first clean run)
**Root Cause**: May have pre-existing CRITICAL/HIGH vulnerabilities in dependencies
**Status**: ❌ Not started
**Remediation Options**:
- [ ] Run first scan to establish baseline
- [ ] Fix vulnerabilities in direct dependencies
- [ ] Add `.trivyignore` with justification for transitive/unfixable vulns

**Target**: 0 new CRITICAL/HIGH on changed dependencies

---

## 5. CodeQL Analysis (main.yml, separate workflow)

**Baseline**: Pre-existing findings
**Root Cause**: Legacy code patterns flagged by CodeQL
**Status**: ❌ Not started
**Remediation Options**:
- [ ] Review and triage findings
- [ ] Fix actionable issues
- [ ] Add suppressions with justification for false positives

**Target**: No new findings on changed code

---

## Remediation Workflow

1. **Pick one item** from above
2. **Create a branch** with fix
3. **Run CI** - should not increase failure count
4. **Update baseline** in this file when baseline improves
5. **Merge** when clean

## Baseline Update Protocol

When a baseline legitimately improves (not by disabling checks):
1. Update the baseline number in this file
2. Note the commit/PR that achieved it
3. Update status to ✅ if fully resolved

---

*Last updated: 2025 (task t8 - Make CI Fail-Closed)*