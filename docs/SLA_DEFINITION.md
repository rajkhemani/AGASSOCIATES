# Service Level Agreement

**Platform:** AG Associates — AI-Driven Legal Operations SaaS
**Version:** 1.0.0
**Owner:** LUXORANOVA9
**Last Updated:** 2026-06-13
**Applies To:** Production environment (`docker-compose.prod.yml` on Hetzner VPS)

---

## 1. Service Commitment

AG Associates guarantees **99.5% monthly uptime** for the platform's production services, excluding scheduled maintenance windows as defined in Section 5.

Uptime is measured across the following service components collectively (a single metric):

| Component | Technology | Covered |
|-----------|-----------|---------|
| API Gateway | FastAPI (`ag-associates-ai`) | ✅ |
| Dashboard | Next.js (`ag-associates-ai/frontend`) | ✅ |
| Platform UI + Server | Vite + Express (`ag-platform`) | ✅ |
| Intake API | Fastify (`services/intake-api`) | ✅ |
| Telegram Bot (Coordinator) | Telegraf (`services/coordinator`) | ✅ |
| Database | PostgreSQL / Supabase | ✅ |
| LLM Inference | vLLM (Qwen2.5) | ✅ |

Client-side network connectivity, third-party API availability (Gemini, Twilio, n8n), and end-user device issues are excluded.

---

## 2. Severity Taxonomy

Aligned with [`INCIDENT_RESPONSE_PLAN.md`](./INCIDENT_RESPONSE_PLAN.md).

| Level | Label | Definition | Example |
|-------|-------|------------|---------|
| **SEV1** | Critical | Platform unavailable or data breach | All services down, customer data exposed, banks cannot submit intake |
| **SEV2** | High | Core feature degraded, no workaround | Auth broken, case processing failing, advocate dashboard inaccessible |
| **SEV3** | Medium | Non-critical feature degraded | Agent chat slow, dashboard not updating, report export failing |
| **SEV4** | Low | Cosmetic, minor bug | Typo in UI, minor styling issue, non-blocking UI inconsistency |

---

## 3. Support Response & Resolution Times

Response time is measured from incident declaration (automated alert or user report) to first-responder acknowledgment in `#incident` Telegram channel. Resolution time is measured to service restoration or deployment of a verified fix.

| Severity | Initial Response | Resolution Target | Communication Cadence |
|----------|-----------------|-------------------|----------------------|
| **SEV1** | 15 minutes | 2 hours | Every 30 min |
| **SEV2** | 1 hour | 8 hours | Every 2 hours |
| **SEV3** | 4 hours | 48 hours | Daily |
| **SEV4** | 1 business day | Next sprint | Per sprint |

**Coverage:** 24×7 for SEV1 and SEV2. Business hours (IST 09:00–18:00, Mon–Sat) for SEV3 and SEV4.

> **Note:** The platform is currently operated by a single-person engineering team. SEV1 resolution targets assume immediate availability. See Section 8 for on-call rotation plans as the team scales.

---

## 4. Service Credits

If monthly uptime falls below the 99.5% threshold, the customer (bank client) is eligible for service credits applied to the following month's invoice.

| Monthly Uptime | Credit |
|----------------|--------|
| 99.0% – 99.49% | 5% of monthly fee |
| 98.5% – 98.99% | 10% of monthly fee |
| 98.0% – 98.49% | 15% of monthly fee |
| 97.5% – 97.99% | 20% of monthly fee |
| < 97.5% | 25% of monthly fee (maximum) |

**Request Procedure:**
1. Customer submits a credit request within 7 calendar days of month-end.
2. AG Associates validates against the monthly SLA report within 5 business days.
3. Credit is applied to the next billing cycle.

**Maximum cumulative credit per contract year:** 25% of annual fees.

---

## 5. Exclusions

The SLA does not apply to downtime caused by:

1. **Scheduled Maintenance** — Planned maintenance windows announced at least 48 hours in advance via email and Telegram. Maintenance is scheduled during low-usage hours (IST 02:00–05:00) and limited to 4 hours per calendar month total. Excluded time is not counted against uptime calculation.
2. **Emergency Maintenance** — Unplanned but necessary security patches or critical infrastructure fixes. AG Associates will notify affected parties as soon as practicable.
3. **Force Majeure** — Events outside AG Associates' reasonable control including but not limited to: natural disasters, war, terrorism, civil unrest, government action, pandemic, or acts of God.
4. **Customer-Caused Downtime** — Issues resulting from customer-side misconfiguration, unauthorized API usage, abuse, or failure to follow documented integration guidelines.
5. **Third-Party Dependencies** — Outages of upstream services including Google Gemini API, Twilio/SMS gateways, n8n, GitHub, Docker Hub, or Hetzner infrastructure-level failures (power, network, cooling).
6. **Beta or Preview Features** — Features tagged as `beta`, `preview`, or `experimental` are not covered by this SLA.
7. **Self-Inflicted Downtime** — Downtime resulting from customer-initiated deployments, configuration changes, or data operations on the production environment.

---

## 6. Uptime Measurement

### 6.1 Calculation

Monthly uptime is calculated as:

```
Uptime % = ((Total Minutes in Month - Downtime Minutes) / Total Minutes in Month) × 100
```

**Downtime** is any period during which the platform's public health endpoint (`GET https://api.advadiityagade.com/health`) returns a non-200 status code for consecutive probe intervals exceeding 60 seconds.

**Scheduled maintenance** and **excluded events** (Section 5) are subtracted from both numerator and denominator.

### 6.2 Monitoring & Detection

| Tool | Purpose | Probe Interval |
|------|---------|---------------|
| Sentry (optional DSN) | Application error alerts, crash reporting | Real-time |
| Docker health checks | Container liveness via `HEALTHCHECK` directives | 30 seconds |
| Deploy smoke tests | Post-deployment `curl -f` health verification | On deploy |
| Hetzner Cloud Console | Infrastructure-level monitoring | Manual |
| Telegram `#incident` | User-reported issues | Ad hoc |

### 6.3 Health Endpoint

The health endpoint (`GET /health`) must return HTTP 200 with:

```json
{
  "status": "ok",
  "timestamp": "2026-06-13T10:00:00Z",
  "services": {
    "api": "healthy",
    "database": "connected",
    "llm": "available"
  }
}
```

A component is considered healthy if it responds within 5 seconds.

---

## 7. Reporting

AG Associates publishes a monthly SLA report within 5 business days of month-end. The report includes:

| Metric | Description |
|--------|-------------|
| **Uptime %** | Calculated per Section 6.1 |
| **Total Incident Count** | Number of incidents by severity |
| **MTTR (Mean Time to Resolve)** | Average resolution time across all incidents |
| **MTBF (Mean Time Between Failures)** | Average interval between incidents |
| **SLA Compliance** | Whether 99.5% target was met |
| **Credit Eligibility** | Credits due (if any) |
| **Maintenance Log** | Scheduled maintenance windows used |
| **Top 3 Root Causes** | Summary of post-mortem findings |

Reports are distributed via email to bank clients and internal stakeholders, and archived in `docs/sla-reports/`.

---

## 8. On-Call & Escalation

| Role | Responsibility | Contact |
|------|---------------|---------|
| Primary On-Call | SEV1/SEV2 triage & mitigation | Telegram @rajkhemani |
| Engineering Lead | Escalation for unresolved incidents | Telegram @rajkhemani |
| Founder | Business escalation, customer communication | Telegram @rajkhemani |

> **Current state:** Single-person on-call. As the team grows, a rotating on-call schedule will be maintained with a minimum of two engineers covering primary and secondary roles.

### Escalation Path

```
SEV1/SEV2 Declared → Primary On-Call (15 min response)
    → If unresolved in 1 hr: Escalate to Engineering Lead
        → If business impact: Escalate to Founder for customer communication
```

---

## 9. SLA Review & Changes

This SLA is reviewed quarterly with the following inputs:
- Monthly SLA reports from the preceding quarter
- Post-mortem learnings from `tasks/lessons.md`
- Customer feedback on support quality
- Platform architecture changes

Material changes are communicated at least 30 days in advance.

---

## 10. Definitions

| Term | Definition |
|------|-----------|
| **Business Day** | Monday through Saturday, excluding Indian public holidays |
| **Business Hours** | 09:00–18:00 IST |
| **Downtime** | Period during which the health endpoint returns non-200 |
| **Incident** | An event that causes or may cause service degradation, classified by severity |
| **MTTR** | Mean Time to Resolve — average clock time from incident declaration to resolution |
| **MTBF** | Mean Time Between Failures — average time between consecutive incidents |
| **Resolution** | Service restored or verified fix deployed to production |
| **Response** | First-responder acknowledgment in Telegram `#incident` channel |
| **Scheduled Maintenance** | Planned downtime announced ≥ 48 hours in advance |
| **Service Credit** | Percentage discount applied to the customer's next monthly invoice |
