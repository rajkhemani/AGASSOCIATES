# 🚀 AGASSOCIATES — AUTOMATION PLAN & STACK IMPROVEMENT ROADMAP

> **Goal**: End-to-end workflow automation on open-source cloud (self-hosted, vendor-neutral)
> **Current State**: 11-container Docker Compose on Hetzner VPS, manual migrations, fragmented CI
> **Target**: Fully automated GitOps pipeline with managed services, observability, and zero-downtime deployments

---

## 📊 CURRENT STACK ANALYSIS

### **Architecture Overview**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CURRENT PRODUCTION STACK                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  Hetzner VPS (Single Node)                                                  │
│  ├── Caddy (Reverse Proxy + Auto-HTTPS)                                    │
│  ├── PostgreSQL + pgvector (Self-managed)                                  │
│  ├── Redis (Self-managed)                                                  │
│  ├── ai-backend (FastAPI + Groq + pgvector)                                │
│  ├── ai-dashboard (Next.js)                                                │
│  ├── ag-platform (Vite + Express + Supabase)                               │
│  ├── intake-api (Fastify + Redis + Supabase)                               │
│  ├── telegram-bot (Telegraf + Groq)                                        │
│  ├── email-intake (IMAP poller + Groq)                                     │
│  ├── coordinator (Hierarchical agent orchestrator)                         │
│  ├── n8n (Workflow orchestration)                                          │
│  └── Caddy (Static landing + docs)                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **Critical Gaps Identified**

| Area | Current State | Risk Level | Impact |
|------|---------------|------------|--------|
| **Database Migrations** | Manual SQL execution | 🔴 Critical | Schema drift, deployment failures |
| **Service Discovery** | Hardcoded internal URLs | 🟠 High | Scaling/relocation impossible |
| **Secrets Management** | Plain `.env` on VPS | 🔴 Critical | Credential leakage |
| **Observability** | None (logs only) | 🟠 High | No alerting, debugging blind |
| **CI/CD** | Build → SSH → docker compose | 🟠 High | No rollback, no staging |
| **Testing** | Pytest/CI only, no integration | 🟡 Medium | Regressions in production |
| **Backup/DR** | None | 🔴 Critical | Data loss risk |
| **Multi-tenancy** | RLS only, no isolation | 🟡 Medium | Compliance risk |
| **Scheduler** | None (except email poller) | 🟡 Medium | No automated workflows |

---

## 🎯 TARGET ARCHITECTURE: OPEN-SOURCE CLOUD (COOLIFY ON HETZNER)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TARGET: COOLIFY ON HETZNER VPS                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  Hetzner CPX31 (4 vCPU, 8GB RAM, 160GB NVMe)  €16.90/mo                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Coolify (Open-Source PaaS)                                                 │
│  ├── GitOps: Push to main → Auto-deploy                                     │
│  ├── Auto HTTPS (Let's Encrypt)                                             │
│  ├── Managed PostgreSQL (pgvector enabled)                                  │
│  ├── Managed Redis                                                          │
│  ├── Managed MinIO (S3-compatible)                                          │
│  ├── Prometheus + Grafana + Loki (Built-in)                                 │
│  ├── Automated Backups (S3/MinIO)                                           │
│  ├── Resource Monitoring & Alerting                                         │
│  └── Zero-downtime Deployments                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  Services (Auto-deployed via Coolify)                                       │
│  ├── ag-ai-backend (FastAPI)                                                │
│  ├── ai-dashboard (Next.js)                                                 │
│  ├── ag-platform (Vite + Express)                                           │
│  ├── intake-api (Fastify)                                                   │
│  ├── telegram-bot (Worker)                                                  │
│  ├── email-intake (Worker)                                                  │
│  ├── coordinator (Worker)                                                   │
│  ├── n8n (Optional)                                                         │
│  └── Caddy (Static sites via Coolify)                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **Why Coolify?**
- ✅ **Open-source** (AGPL) — No vendor lock-in
- ✅ **Runs on YOUR VPS** — Full data sovereignty
- ✅ **GitOps native** — Push to deploy
- ✅ **Managed services** — Postgres, Redis, MinIO, Monitoring
- ✅ **Auto HTTPS** — Let's Encrypt automatic
- ✅ **Resource monitoring** — Prometheus/Grafana/Loki built-in
- ✅ **Backups** — Automated to S3/MinIO
- ✅ **Rollback** — One-click
- ✅ **Cost** — €16.90/mo (vs $112/mo Render, $200+ AWS)

---

## 📋 PHASED AUTOMATION PLAN

### **PHASE 1: FOUNDATION (Week 1) — CRITICAL FIXES**

#### **1.1 Fix Broken Workflows** ✅ *Partially Done*
- [x] Fix `executor_agent.generate_noi_challan()` — Added mock implementation
- [x] Fix `auto_comms._send_email()` — Added recipient resolution from Supabase
- [ ] Fix `executor_agent.wait_for_otp()` — `r.setEx` → `r.setex` (Python)
- [ ] Fix NeSL client shadowing — Remove inline client in `main.py`
- [ ] Add scheduler (APScheduler) for periodic tasks

#### **1.2 Database Migration Automation**
- [ ] Create `scripts/migrate.py` — Unified migration runner
- [ ] Add migration tracking table (`schema_migrations`)
- [ ] Integrate into CI/CD (run before deploy)
- [ ] Add rollback capability
- [ ] Separate migrations per service (ai-backend, ag-platform, intake-api)

#### **1.3 Secrets Management**
- [ ] Remove all secrets from `.env.example` and repo history
- [ ] Set up **Coolify Secrets** or **HashiCorp Vault** (self-hosted)
- [ ] Rotate all compromised secrets (check `session-ses_19a4.md`)
- [ ] Add secret scanning to CI (GitLeaks/TruffleHog)

#### **1.3.1 Required Secrets Inventory**
```bash
# Core Infrastructure
POSTGRES_PASSWORD, REDIS_PASSWORD, REDIS_URL, DATABASE_URL

# AI/ML
LLM_API_KEY (Groq), GOOGLE_GENERATIVE_AI_API_KEY, OPENAI_API_KEY

# Auth/Identity
SUPABASE_JWT_SECRET, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, AG_SESSION_SECRET

# External Services
TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_WEBHOOK_SECRET
N8N_WEBHOOK_KEY, N8N_BASIC_AUTH_PASSWORD
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# Email/Communication
EMAIL_IMAP_HOST, EMAIL_IMAP_USER, EMAIL_IMAP_PASS
RESEND_API_KEY, EMAIL_FROM

# Government Portals
IGR_PORTAL_USERNAME, IGR_PORTAL_PASSWORD
NESL_API_KEY, NESL_CLIENT_ID, NESL_CLIENT_SECRET
GRAS_PORTAL_URL

# Payments/Storage
STRIPE_SECRET_KEY, MINIO_ACCESS_KEY, MINIO_SECRET_KEY

# Observability
SENTRY_DSN

# Encryption
PII_ENCRYPTION_KEY, AG_SESSION_SECRET
```

---

### **PHASE 2: COOLIFY DEPLOYMENT (Week 2) — OPEN-SOURCE PAAS**

#### **2.1 VPS Provisioning & Coolify Install**
- [ ] Provision Hetzner CPX31 (4 vCPU, 8GB RAM, 160GB NVMe) in Nuremberg
- [ ] Install Coolify: `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash`
- [ ] Configure Coolify domain: `coolify.advadiityagade.com`
- [ ] Enable auto-updates for Coolify

#### **2.2 Coolify Resource Provisioning**
- [ ] **PostgreSQL** (with pgvector extension)
  - Enable `vector` extension
  - Create databases: `agdb`, `n8n`
  - Configure backups to MinIO (daily, 30-day retention)
- [ ] **Redis** (with persistence)
  - AOF + RDB
  - Maxmemory policy: `allkeys-lru`
- [ ] **MinIO** (S3-compatible storage)
  - Buckets: `case-documents`, `backups`, `models`
  - Versioning enabled
  - Lifecycle policies for old backups

#### **2.3 Service Migration to Coolify**
| Service | Type | Coolify Config |
|---------|------|----------------|
| `ag-ai-backend` | Docker Compose | Port 8000, Health: `/health` |
| `ai-dashboard` | Docker Compose | Port 3000, Build args: `NEXT_PUBLIC_API_URL` |
| `ag-platform` | Docker Compose | Port 3001, Build args: `VITE_SUPABASE_URL` |
| `intake-api` | Docker Compose | Port 3002, Health: `/health` |
| `telegram-bot` | Worker | No port, env: `TELEGRAM_BOT_TOKEN` |
| `email-intake` | Worker | No port, env: `EMAIL_IMAP_*` |
| `coordinator` | Worker | Port 3005 |
| `n8n` | Docker Compose | Port 5678, DB: Postgres |
| `caddy` | Static | Auto-HTTPS via Coolify |

#### **2.4 Service Networking (Coolify Internal DNS)**
```
Internal Service URLs (Coolify provides):
- postgresql://postgresql:5432/agdb
- redis://redis:6379
- minio://minio:9000
- http://ag-ai-backend:8000
- http://ag-platform:3001
- http://intake-api:3002
- http://coordinator:3005
- http://n8n:5678
```

#### **2.5 Domain & SSL Configuration**
```bash
# Coolify → Each Service → Domains:
ag-platform:        app.advadiityagade.com
ai-dashboard:       dashboard.advadiityagade.com
ai-backend:         api.advadiityagade.com
intake-api:         intake.advadiityagade.com
n8n:                n8n.advadiityagade.com
coordinator:        coordinator.advadiityagade.com

# Coolify auto-provisions Let's Encrypt certs ✅
```

---

### **PHASE 3: GITOPS CI/CD PIPELINE (Week 3)**

#### **3.1 GitHub Actions → Coolify Deploy**
```yaml
# .github/workflows/coolify-deploy.yml
name: Coolify Deploy
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Trigger Coolify deploy via API
      - name: Trigger Coolify Deploy
        run: |
          curl -X POST "${{ secrets.COOLIFY_API_URL }}/api/v1/applications/${{ secrets.COOLIFY_APP_UUID }}/deploy" \
            -H "Authorization: Bearer ${{ secrets.COOLIFY_API_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{"force": true, "commit": "${{ github.sha }}"}'
      
      # Wait for deployment
      - name: Wait for Deployment
        run: |
          for i in {1..30}; do
            STATUS=$(curl -s -H "Authorization: Bearer ${{ secrets.COOLIFY_API_TOKEN }}" \
              "${{ secrets.COOLIFY_API_URL }}/api/v1/applications/${{ secrets.COOLIFY_APP_UUID }}/deployments/latest" \
              | jq -r '.status')
            echo "Status: $STATUS"
            if [ "$STATUS" = "finished" ]; then exit 0; fi
            if [ "$STATUS" = "error" ]; then exit 1; fi
            sleep 10
          done
          exit 1
```

#### **3.2 Staging Environment**
- [ ] Create `staging` branch protection
- [ ] Deploy staging to `staging.advadiityagade.com`
- [ ] Run integration tests against staging
- [ ] Manual approval gate for production

#### **3.3 Automated Testing Pipeline**
```yaml
# .github/workflows/test.yml
jobs:
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports: ["5432:5432"]
      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]
    steps:
      - uses: actions/checkout@v4
      - name: Run integration tests
        run: |
          cd ag-associates-ai/backend && pytest tests/integration -v
          cd ag-platform && npm run test:integration
      - name: Run E2E tests against staging
        run: |
          npx playwright test --project=chromium
```

---

### **PHASE 4: OBSERVABILITY & RELIABILITY (Week 4)**

#### **4.1 Monitoring Stack (Coolify Built-in + Custom)**
| Component | Tool | Purpose |
|-----------|------|---------|
| **Metrics** | Prometheus (Coolify) | System + App metrics |
| **Logs** | Loki (Coolify) | Centralized logging |
| **Traces** | Jaeger/Tempo | Distributed tracing |
| **Dashboards** | Grafana (Coolify) | Service health, business metrics |
| **Alerts** | Alertmanager + PagerDuty/Telegram | On-call notifications |

#### **4.2 Key Metrics to Monitor**
```promql
# Service Health
up{job=~"ag-.*"} == 1

# Latency (p95)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) < 2

# Error Rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) < 0.01

# Business Metrics
increase(cases_created_total[1h]) > 0
increase(noi_challans_generated_total[1h]) > 0

# Resource Usage
container_memory_usage_bytes / container_spec_memory_limit_bytes < 0.8
container_cpu_usage_seconds_total / container_spec_cpu_quota < 0.7
```

#### **4.3 Alerting Rules**
```yaml
# alerts.yml
groups:
  - name: critical
    rules:
      - alert: ServiceDown
        expr: up{job=~"ag-.*"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "{{ $labels.job }} is down"
      
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 2m
        labels:
          severity: warning
      
      - alert: DatabaseConnectionsHigh
        expr: pg_stat_database_numbackends / pg_settings_max_connections > 0.8
        for: 5m
        labels:
          severity: warning
      
      - alert: RedisMemoryHigh
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.85
        for: 5m
        labels:
          severity: warning
```

#### **4.4 Distributed Tracing**
- [ ] Add OpenTelemetry SDK to all services
- [ ] Configure trace propagation (W3C TraceContext)
- [ ] Export to Tempo/Jaeger
- [ ] Correlate traces with logs (Loki) and metrics (Prometheus)

---

### **PHASE 5: DATA & BACKUP STRATEGY (Week 5)**

#### **5.1 Automated Backups**
```yaml
# Coolify → PostgreSQL → Backup Settings
# Schedule: Daily 02:00 UTC
# Retention: 30 daily, 12 weekly, 12 monthly
# Destination: MinIO (s3://backups/postgres/)
# Encryption: AES-256 (Coolify managed)

# Redis → RDB + AOF snapshots
# Schedule: Every 6 hours
# Destination: MinIO (s3://backups/redis/)

# MinIO → Versioned buckets
# Lifecycle: Delete incomplete multipart after 7 days
# Transition to Glacier after 90 days (if using S3)
```

#### **5.2 Disaster Recovery Plan**
```bash
# RTO: 30 minutes, RPO: 1 hour

# Recovery Steps:
# 1. Provision new VPS (Hetzner API)
# 2. Install Coolify (automated)
# 3. Restore PostgreSQL from latest backup
# 4. Restore Redis from latest snapshot
# 5. Restore MinIO from versioned bucket
# 6. Coolify auto-redeploys services
# 7. Update DNS (5 min TTL)
```

#### **5.3 Data Archival**
- [ ] Implement case archival policy (closed cases > 2 years → cold storage)
- [ ] Add PII encryption at rest (already have `PII_ENCRYPTION_KEY`)
- [ ] GDPR/PDPA compliance: Right to deletion workflow

---

### **PHASE 6: WORKFLOW AUTOMATION (Week 6)**

#### **6.1 NOI Workflow End-to-End Automation**
```python
# Current: Manual steps at CHALLAN_GENERATED, VERIFIED, NOI_FILED
# Target: Fully automated with human-in-the-loop only for exceptions

# Automated Steps:
1. Bank webhook → intake-api → Create case (DOCUMENTS_RECEIVED)
2. noi_agent.generate_challan() → Mock GRN → CHALLAN_GENERATED
3. Auto-comms → WhatsApp/Email to bank with challan
4. Bank pays → SMS webhook → OTP → CHALLAN_PAID
5. noi_agent.verify_documents() → Supabase document check → VERIFIED
6. noi_agent.file_noi() → IGR Playwright → NOI_FILED
7. IGR webhook → ACKNOWLEDGED → COMPLETED
8. Auto-comms → Final notification to bank + internal team
```

#### **6.2 Scheduler Implementation**
- [ ] Add **APScheduler** to `ai-backend` for periodic tasks:
  - Daily: SLA checks, overdue notifications
  - Hourly: Document status sync, OTP cleanup
  - Weekly: Report generation, backup verification
- [ ] Migrate `jobQueue.ts` cron jobs to APScheduler
- [ ] Add job persistence (PostgreSQL) for survival across restarts

#### **6.3 Multi-Agent Orchestration**
- [ ] Implement **Agent Registry** with health checks
- [ ] Add **Circuit Breakers** for external dependencies (IGR, NeSL, GRAS)
- [ ] Add **Dead Letter Queue** for failed agent messages
- [ ] Implement **Saga Pattern** for distributed transactions

---

### **PHASE 7: SECURITY & COMPLIANCE (Week 7)**

#### **7.1 Security Hardening**
- [ ] **Network Policies**: Coolify firewall + Caddy rate limiting
- [ ] **mTLS**: Service-to-service encryption (Coolify supports)
- [ ] **API Gateway**: Caddy as API gateway with auth
- [ ] **WAF**: ModSecurity on Caddy (OWASP CRS)
- [ ] **Secrets Rotation**: Automated 90-day rotation via Coolify/Vault

#### **7.2 Compliance**
- [ ] **Data Residency**: All data in EU (Hetzner Nuremberg)
- [ ] **Audit Logging**: Immutable audit trail (already in `audit_trail` table)
- [ ] **Access Control**: RBAC with Coolify teams + service accounts
- [ ] **Vulnerability Scanning**: Trivy in CI + Coolify image scanning

---

## 🛠️ IMMEDIATE ACTION ITEMS (THIS WEEK)

### **Day 1-2: Critical Fixes & Migration Prep**
```bash
# 1. Fix remaining broken workflows
cd E:\DSH\AGASSOCIATES
# Fix executor_agent.setEx → setex
# Fix NeSL client shadowing
# Add APScheduler to ai-backend

# 2. Create migration runner
cat > scripts/migrate.py << 'EOF'
#!/usr/bin/env python3
import asyncio, asyncpg, os, sys
from pathlib import Path

async def run_migrations():
    db_url = os.getenv("DATABASE_URL")
    migrations_dir = Path("migrations")
    # ... implementation
    pass

if __name__ == "__main__":
    asyncio.run(run_migrations())
EOF

# 3. Set up secret scanning
pip install gitguardian && ggshield install
```

### **Day 3-4: Coolify Deployment**
```bash
# 1. Provision Hetzner VPS (CPX31)
# 2. Install Coolify
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# 3. Configure Coolify resources
# - PostgreSQL (pgvector)
# - Redis
# - MinIO

# 4. Deploy services via Coolify UI
# 4. Configure domains & SSL
```

### **Day 5-7: CI/CD & Observability**
```bash
# 1. Update GitHub Actions for Coolify deploy
# 2. Add integration tests
# 3. Configure Prometheus/Grafana/Loki
# 4. Set up alerts (Telegram/PagerDuty)
# 4. Test disaster recovery
```

---

## 📦 DELIVERABLES CHECKLIST

### **Code Changes**
- [ ] `scripts/migrate.py` — Unified migration runner
- [ ] `scripts/backup.sh` — Backup verification script
- [ ] `scripts/health_check.py` — Comprehensive health checks
- [ ] `.github/workflows/coolify-deploy.yml` — New deploy pipeline
- [ ] `.github/workflows/integration-test.yml` — Integration tests
- [ ] `monitoring/alerts.yml` — Alerting rules
- [ ] `monitoring/dashboards/*.json` — Grafana dashboards

### **Documentation**
- [ ] `DEPLOYMENT.md` — Coolify deployment guide
- [ ] `RUNBOOK.md` — Incident response procedures
- [ ] `ARCHITECTURE.md` — Updated architecture diagram
- [ ] `SECRETS.md` — Secrets management guide
- [ ] `DISASTER_RECOVERY.md` — DR procedures

### **Infrastructure**
- [ ] Hetzner VPS provisioned
- [ ] Coolify installed & configured
- [ ] PostgreSQL + pgvector + Redis + MinIO provisioned
- [ ] All 9 services deployed via Coolify
- [ ] Domains configured with auto-HTTPS
- [ ] Monitoring + Alerting active
- [ ] Backups verified
- [ ] DR tested

---

## 💰 COST COMPARISON

| Component | Current (Hetzner Manual) | Target (Coolify) | Savings |
|-----------|--------------------------|------------------|---------|
| VPS | €16.90 | €16.90 | — |
| Managed Postgres | Self (time) | Included | High |
| Managed Redis | Self (time) | Included | High |
| Managed MinIO | Self (time) | Included | High |
| Monitoring | None | Included | High |
| Backups | None | Included | Critical |
| SSL/Certificates | Manual (Caddy) | Auto | Medium |
| **Total Ops Time** | ~20 hrs/mo | ~2 hrs/mo | **90%** |

---

## 🎯 SUCCESS METRICS

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **Deployment Time** | 15-20 min | < 5 min | GitHub Actions duration |
| **Rollback Time** | Manual (30+ min) | < 2 min | Coolify one-click |
| **MTTR** | Hours | < 15 min | Alert → Resolution |
| **Deployment Frequency** | Weekly | Daily | GitHub Actions runs |
| **Change Failure Rate** | Unknown | < 5% | Failed deployments / total |
| **Availability** | Unknown | 99.9% | Uptime monitor |
| **Backup Success Rate** | 0% (none) | 100% | Coolify backup logs |
| **Secret Rotation** | Never | 90 days | Vault/Coolify audit |

---

## 🚀 NEXT STEPS (IMMEDIATE)

1. **TODAY**: Complete critical fixes (Phase 1.1)
2. **TOMORROW**: Provision Hetzner VPS + Install Coolify
3. **DAY 3**: Migrate all services to Coolify
4. **DAY 4**: Configure GitOps CI/CD
5. **DAY 5**: Enable monitoring + alerts
6. **DAY 6**: Test DR + backup restore
7. **DAY 7**: Document runbooks + handoff

---

## 💡 ARCHITECTURAL DECISIONS NEEDED

| Decision | Options | Recommendation |
|----------|---------|----------------|
| **Scheduler** | APScheduler vs Celery vs Coolify Cron | **APScheduler** (embedded, no extra infra) |
| **Service Mesh** | None vs Istio vs Linkerd | **None** (Coolify internal DNS sufficient) |
| **API Gateway** | Caddy vs Kong vs Traefik | **Caddy** (already in stack, auto-HTTPS) |
| **Secrets** | Coolify Secrets vs Vault | **Coolify Secrets** (simpler, sufficient) |
| **Tracing** | Jaeger vs Tempo | **Tempo** (lighter, Loki integration) |
| **Multi-region** | No vs Hetzner Falkenstein + Nuremberg | **Single region** (start), add DR region later |

---

*Generated: 2025-08-20 | Based on analysis of `https://github.com/rajkhemani/AGASSOCIATES.git`*