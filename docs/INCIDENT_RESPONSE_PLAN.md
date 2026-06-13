# Incident Response Plan

**Owner:** LUXORANOVA9
**Version:** 1.0.0
**Last Updated:** 2026-06-13

---

## Severity Classification

| Level | Label | Definition | Response Time | Example |
|-------|-------|------------|---------------|---------|
| **SEV1** | Critical | Platform unavailable or data breach | < 15 min | All services down, customer data exposed |
| **SEV2** | High | Core feature degraded, no workaround | < 1 hr | Auth broken, case processing failing |
| **SEV3** | Medium | Non-critical feature degraded | < 4 hr | Agent chat slow, dashboard not updating |
| **SEV4** | Low | Cosmetic, minor bug | < 1 week | Typo in UI, minor styling issue |

---

## Detection Channels

| Channel | Tool | Automatic? |
|---------|------|------------|
| Sentry error alerts | Sentry (optional DSN) | ✅ |
| Health check failures | deploy.yml smoke tests | ✅ |
| Container restarts | Docker health checks | ✅ |
| User report | Telegram / WhatsApp / Email | Manual |
| Monitoring dashboard | Hetzner Cloud console | Manual |

---

## Response Process

### 1. Triage (within severity SLA)

1. Acknowledge the alert
2. Classify severity
3. Declare in Telegram group `#incident`
4. Assess blast radius (service, data, customer)

### 2. Mitigation

1. Stop the bleeding — rollback, feature flag, isolate
2. If SEV1: restore from backup or scale up
3. Log all actions with timestamps
4. Communicate status to stakeholders

### 3. Resolution

1. Apply fix via standard deploy pipeline
2. Verify with health check + smoke test
3. Close incident in Telegram `#incident-resolved`

### 4. Post-Mortem

1. Root cause analysis (5 Whys)
2. Timeline reconstruction
3. Action items with owners
4. Append lessons to `tasks/lessons.md`

---

## Escalation Contacts

| Role | Name | Contact |
|------|------|---------|
| Engineering Lead | Raj Khemani | Telegram @rajkhemani |
| Backup | N/A (single-person team) | — |

> **Note:** Currently a single-person team. Escalation is to the founder directly. Document `tasks/lessons.md` after every incident to build institutional knowledge.

---

## Key Commands

```bash
# Check service status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs --tail=100 <service>

# Restart service
docker compose -f docker-compose.prod.yml restart <service>

# Health check
curl -f https://api.advadiityagade.com/health

# Deploy rollback
git revert HEAD && git push origin main
```

---

## Post-Mortem Template

```markdown
# Post-Mortem: <title>

**Date:** YYYY-MM-DD
**Severity:** SEV1/2/3/4
**Duration:** Xh Ym

## Timeline
- HH:MM — Alert triggered
- HH:MM — Investigation started
- HH:MM — Root cause identified
- HH:MM — Mitigation applied
- HH:MM — Service restored

## Root Cause
<5 Whys analysis>

## Impact
- Services affected:
- Users affected:
- Data loss: Yes/No

## Action Items
- [ ] <item> (owner, target date)

## Lessons
<appended to tasks/lessons.md>
```
