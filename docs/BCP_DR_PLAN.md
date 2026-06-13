# BCP / DR Plan — Business Continuity & Disaster Recovery

**Owner:** LUXORANOVA9 (Raj Khemani)
**Version:** 1.0.0
**Last Updated:** 2026-06-13
**Classification:** Internal — Operations

---

## 1. Scope & Platform Overview

### 1.1 Platform Architecture

| Component | Type | Location | Criticality |
|-----------|------|----------|-------------|
| **VPS** | Hetzner CCX23 (4 vCPU, 32 GB RAM, Ubuntu 22.04) | NBG1 (Nuremberg) | Critical |
| **Self-hosted PostgreSQL** | pgvector/pgvector:pg16 (Docker) | VPS — `pg_data` volume | Critical |
| **Supabase Cloud** | PostgreSQL + Auth + Storage | Supabase managed | Critical |
| **Redis** | redis:7-alpine (Docker) | VPS — `redis_data` volume | High |
| **Caddy** | caddy:2-alpine (Docker) | VPS — TLS termination | Critical |
| **ai-backend** | FastAPI + LangGraph | VPS — GHCR image | High |
| **ai-dashboard** | Next.js | VPS — GHCR image | Medium |
| **ag-platform** | Vite + Express + Turborepo | VPS — GHCR image | High |
| **n8n** | n8nio/n8n | VPS — `n8n_data` volume | Medium |
| **intake-api** | Fastify gateway | VPS — GHCR image | High |
| **telegram-bot** | Telegraf bot | VPS — GHCR image | Medium |
| **email-intake** | IMAP poller | VPS — GHCR image | Medium |
| **GitHub / GHCR** | CI/CD pipeline, container registry | GitHub managed | Critical |
| **DNS** | Cloudflare / domain registrar | External | Critical |

### 1.2 Subdomain Mapping

| Subdomain | Target | Backend Service |
|-----------|--------|-----------------|
| `app.advadiityagade.com` | Vite SPA + Express API | `ag-platform:3001` |
| `api.advadiityagade.com` | FastAPI + webhook proxy | `ai-backend:8000`, `telegram-bot:3003`, `intake-api:3002` |
| `dashboard.advadiityagade.com` | Redirect → `app/ admin/dashboard` | — |
| `intake.advadiityagade.com` | SMS/OTP webhook gateway | `intake-api:3002` |
| `n8n.advadiityagade.com` | n8n orchestration (basic auth) | `n8n:5678` |
| `docs.advadiityagade.com` | Static docs site | Caddy file server |
| `advadiityagade.com` (root) | Premium landing page | Caddy file server |

---

## 2. Recovery Objectives

### 2.1 RTO & RPO Targets

| Tier | Systems | RTO (Recovery Time) | RPO (Recovery Point) |
|------|---------|---------------------|----------------------|
| **Tier 0** | Caddy, DNS, Supabase Auth | < 15 min | Near-zero |
| **Tier 1** | ag-platform, ai-backend, intake-api | < 1 hr | < 5 min |
| **Tier 2** | Self-hosted PostgreSQL, Redis | < 2 hr | < 1 hr |
| **Tier 3** | n8n, telegram-bot, email-intake, ai-dashboard | < 4 hr | < 1 hr |
| **Tier 4** | Docs site, landing page | < 24 hr | N/A (static) |

**Overall target:** Full platform recovery within **4 hours** (RTO), maximum data loss of **1 hour** (RPO).

### 2.2 Assumptions & Dependencies

- Hetzner Cloud API is available for VPS reprovisioning
- GitHub / GHCR are available for image pulls
- Supabase Cloud is operational (separate SLA — see §9.6)
- `.env` backup is less than 7 days old (for full VPS failure scenario)
- Single-person team — no 24/7 rotation; response is best-effort outside business hours

---

## 3. Backup Procedures

### 3.1 Backup Inventory

| Data | Location | Method | Frequency | Retention |
|------|----------|--------|-----------|-----------|
| Supabase PostgreSQL | Supabase Cloud | Automatic daily backups (Supabase managed) | Daily | 7 days (Pro plan) |
| Self-hosted PostgreSQL | VPS — `pg_data` volume | `pg_dump` → encrypted S3/SCP | Every 6 hr | 14 days |
| Redis | VPS — `redis_data` volume | `SAVE` + `redis-cli --rdb` | Every 6 hr | 7 days |
| Docker volumes (n8n, Caddy, ag_output, ag_documents) | VPS | `tar` + SCP to backup host | Daily | 30 days |
| Environment variables | GitHub Secrets + VPS `/srv/ag/.env` | Manual export after changes | Per-change | Latest + 1 version |
| Docker Compose config | GitHub repo (`main` branch) | Git history | On push | Full git history |
| Caddyfile | GitHub repo (`main` branch) | Git history | On push | Full git history |
| TLS certificates | VPS — `caddy_data` volume | Auto-renewed by Caddy | Every 60 days | Auto |
| Application code | GitHub repo | Git | On push | Full git history |

### 3.2 Automated Backup Script

The following script should be deployed on the VPS as a cron job:

```bash
#!/usr/bin/env bash
# /usr/local/bin/ag-backup.sh
# Run via cron: 0 */6 * * * /usr/local/bin/ag-backup.sh

set -euo pipefail

BACKUP_DIR="/srv/backups"
DATE=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS_DB=14
RETENTION_DAYS_VOLUME=30

mkdir -p "$BACKUP_DIR"/{db,redis,volumes}

# Source environment
source /srv/ag/.env

# 1. PostgreSQL dump (self-hosted)
docker exec ag_postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  --format=custom --compress=9 \
  --file="/tmp/ag-pg-$DATE.dump"
docker cp "ag_postgres:/tmp/ag-pg-$DATE.dump" "$BACKUP_DIR/db/"
docker exec ag_postgres rm -f "/tmp/ag-pg-$DATE.dump"

# 2. Redis RDB snapshot
docker exec ag_redis redis-cli -a "$REDIS_PASSWORD" SAVE
docker cp "ag_redis:/data/dump.rdb" "$BACKUP_DIR/redis/dump-$DATE.rdb"

# 3. Docker volumes (excluding ephemeral caddy_config)
for vol in ag_output ag_documents; do
  docker run --rm -v "$vol":/source -v "$BACKUP_DIR/volumes":/backup alpine \
    tar czf "/backup/$vol-$DATE.tar.gz" -C /source .
done

# n8n data
docker run --rm -v n8n_data:/source -v "$BACKUP_DIR/volumes":/backup alpine \
  tar czf "/backup/n8n-data-$DATE.tar.gz" -C /source .

# 4. Environment file backup
cp /srv/ag/.env "$BACKUP_DIR/.env-$DATE"

# 5. Cleanup old backups
find "$BACKUP_DIR/db" -name "ag-pg-*.dump" -mtime +$RETENTION_DAYS_DB -delete
find "$BACKUP_DIR/redis" -name "dump-*.rdb" -mtime +$RETENTION_DAYS_DB -delete
find "$BACKUP_DIR/volumes" -name "*.tar.gz" -mtime +$RETENTION_DAYS_VOLUME -delete
find "$BACKUP_DIR" -name ".env-*" -mtime +$RETENTION_DAYS_VOLUME -delete

# 6. Rsync to off-site (if backup host configured)
# rsync -az --delete "$BACKUP_DIR/" backup@backup-host:/srv/ag-backups/

echo "[$DATE] Backup complete. DB: $(ls -lh $BACKUP_DIR/db/ag-pg-$DATE.dump | awk '{print $5}')"
```

**Cron:** `0 0,6,12,18 * * * /usr/local/bin/ag-backup.sh`

### 3.3 Supabase Backup (Managed)

Supabase Pro plan includes:
- **Daily automatic backups** at ~00:00 UTC, retained 7 days
- **Point-in-Time Recovery (PITR)** available via Supabase Dashboard (extra cost)
- **Manual backup** via Supabase Dashboard → Database → Backups → Trigger manual backup

To restore a Supabase backup: Supabase Dashboard → Database → Backups → Restore.

> **Warning:** Supabase backups cover only the Supabase-hosted PostgreSQL. The self-hosted PostgreSQL (`pg_data` volume on the VPS) stores AI embeddings (pgvector) and multi-agent conversational memory — these must be backed up separately via §3.2.

### 3.4 Environment Variables

Two sources — both must remain in sync:

| Source | Location | Update Procedure |
|--------|----------|-----------------|
| **Primary** | GitHub Secrets (`gh secret list`) | `gh secret set VAR_NAME --body "value"` |
| **Runtime** | `/srv/ag/.env` on VPS | `scp -i ~/.ssh/vps-deploy-key .env deploy@46.225.185.91:/srv/ag/.env` |

After changing `/srv/ag/.env`:
```bash
docker compose -p ag -f docker-compose.prod.yml --env-file /srv/ag/.env up -d
```

### 3.5 Config & Code Backup

All configuration files are in Git at the repo root:
- `docker-compose.prod.yml`
- `Caddyfile`
- `.env.example`
- `.github/workflows/deploy.yml`

Committing to `main` is the backup. Always commit config changes before deploying them.

---

## 4. Recovery Scenarios

### 4.1 Severity Classification

This plan uses the same severity classification as the Incident Response Plan:

| Level | Label | Definition | Response Time | BCP/DR Example |
|-------|-------|------------|---------------|----------------|
| **SEV1** | Critical | Platform unavailable or data loss | < 15 min | VPS down, database corrupted, data breach |
| **SEV2** | High | Core feature degraded | < 1 hr | Single critical container (ai-backend, ag-platform) down |
| **SEV3** | Medium | Non-critical feature degraded | < 4 hr | n8n down, email-intake failing, docs unreachable |
| **SEV4** | Low | Minor issue | < 1 week | Stale TLS cert, static asset missing |

### 4.2 Scenario A — Single Container Failure (SEV2–SEV3)

**Symptoms:** `docker ps` shows container as `Exited` or restart looping. Health check alerts fire.

**Steps:**

1. Check status and logs:
   ```bash
   docker ps -a --filter name=ag_ --format "table {{.Names}}\t{{.Status}}"
   docker logs <container_name> --tail 50
   ```

2. Restart the container:
   ```bash
   docker compose -p ag -f docker-compose.prod.yml --env-file /srv/ag/.env restart <service>
   ```

3. If restart doesn't fix it, recreate without full stack restart:
   ```bash
   docker compose -p ag -f docker-compose.prod.yml --env-file /srv/ag/.env up -d --force-recreate <service>
   ```

4. If container is stuck in crash loop, inspect for config/volume issues:
   ```bash
   docker inspect <container_name> --format '{{json .State}}'
   ```

5. Verify health:
   ```bash
   # API health
   curl -f https://api.advadiityagade.com/health
   curl -f https://intake.advadiityagade.com/health
   
   # Container health
   docker ps --filter name=ag_ --format "table {{.Names}}\t{{.Status}}"
   ```

**Escalation:** If 3 consecutive restarts fail within 10 min → escalate to SEV1 and proceed to Scenario B.

### 4.3 Scenario B — Full VPS Failure (SEV1)

**Symptoms:** VPS unreachable via SSH, all services down, Hetzner Cloud Console shows offline or error state.

**Steps:**

#### Phase 1: Triage & Declare (0–15 min)

1. Confirm via Hetzner Cloud Console: `https://console.hetzner.cloud`
2. Attempt emergency SSH via Hetzner Web Console (VNC)
3. If confirmed down → declare SEV1 in Telegram `#incident`
4. Notify known users (see §8)

#### Phase 2: Provision Replacement (15–45 min)

1. Create new CCX23 VPS in **same region** (NBG1) via Hetzner Cloud Console or CLI:
   ```bash
   hcloud server create \
     --name ag-prod-recovery \
     --type ccx23 \
     --image ubuntu-22.04 \
     --location nbg1 \
     --ssh-key ~/.ssh/vps-deploy-key.pub
   ```

2. Point DNS to new IP (or use same IP if floating):
   ```bash
   hcloud server create-ssh-key
   ```

3. Wait for provisioning. Log in:
   ```bash
   ssh -i ~/.ssh/vps-deploy-key deploy@<new-ip>
   ```

#### Phase 3: Install Dependencies (45–90 min)

```bash
# Install Docker + Compose
apt-get update && apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin git
```

#### Phase 4: Restore Data (90–150 min)

```bash
# Create app directory
mkdir -p /srv/ag && cd /srv/ag

# Clone repo (contains compose, Caddyfile, landing pages)
git clone https://github.com/rajkhemani/ag-associates.git /srv/ag/deploy
# Keep compose and Caddyfile at repo root level
cp /srv/ag/deploy/docker-compose.prod.yml /srv/ag/
cp /srv/ag/deploy/Caddyfile /srv/ag/
# Landing pages (mounted as volumes in compose)
cp -r /srv/ag/deploy/landing /srv/ag/
cp -r /srv/ag/deploy/clerk-docs/dist /srv/ag/docs-site 2>/dev/null || mkdir -p /srv/ag/docs-site

# Restore .env from backup or re-create from GitHub Secrets
scp backup@<backup-host>:/srv/ag-backups/.env-latest /srv/ag/.env
# OR manually re-key from GitHub Secrets:
gh secret list --json name,value | jq -r '.[] | "\(.name)=\(.value)"' > /srv/ag/.env

# Restore PostgreSQL dump
scp backup@<backup-host>:/srv/ag-backups/db/ag-pg-*.dump /srv/backups/db/
# Volume will be restored after first launch...

# Create Docker volumes
docker volume create pg_data
docker volume create n8n_data
docker volume create caddy_data
docker volume create caddy_config
docker volume create ag_output
docker volume create redis_data
docker volume create ag_documents
```

#### Phase 5: Launch Stack (150–180 min)

```bash
# Login to GHCR
echo "$GITHUB_TOKEN" | docker login ghcr.io -u rajkhemani --password-stdin

# Pull all images
docker compose -p ag -f docker-compose.prod.yml --env-file /srv/ag/.env pull

# Start postgres first (restore dump after)
docker compose -p ag -f docker-compose.prod.yml --env-file /srv/ag/.env up -d postgres

# Wait for postgres to be healthy, then restore data
sleep 15
docker exec -i ag_postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  --clean --if-exists < /srv/backups/db/ag-pg-<latest>.dump

# Restore other volumes from backup
docker run --rm -v n8n_data:/target -v /srv/backups/volumes:/backup alpine \
  tar xzf "/backup/n8n-data-<latest>.tar.gz" -C /target
# Repeat for ag_output, ag_documents, redis_data

# Start all services
docker compose -p ag -f docker-compose.prod.yml --env-file /srv/ag/.env up -d
```

#### Phase 6: Verify (180–240 min)

```bash
# Container check
docker ps --filter name=ag_ --format "table {{.Names}}\t{{.Status}}"

# Health endpoints
for ep in app api intake; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://$ep.advadiityagade.com/health" 2>/dev/null)
  echo "$ep → $code"
done

# Caddy check
curl -f https://advadiityagade.com > /dev/null && echo "Root domain OK"

# Log review
docker logs ag_ai_backend --tail 30
docker logs ag_platform --tail 30
```

#### Phase 7: Post-Recovery (after service restored)

1. Smoke test core workflows (login, create case, send Telegram message)
2. Configure monitoring alerts for the new VPS
3. Update DNS TTL back to normal (if lowered during failover)
4. Post-mortem (see §10)

### 4.4 Scenario C — Data Corruption (SEV1)

**Symptoms:** Application errors referencing missing/incorrect data, rollback needed after bad migration, `pg_dump`/restore corruption detected.

#### 4.4.1 Self-Hosted PostgreSQL (pgvector)

**Point-in-Time Recovery** (if WAL archiving configured):

```bash
# Stop the stack (keep postgres running)
docker compose -p ag -f docker-compose.prod.yml --env-file /srv/ag/.env stop ai-backend ag-platform n8n

# Enter postgres container
docker exec -it ag_postgres bash

# Restore from backup dump
pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  --clean --if-exists \
  /tmp/ag-pg-<pre-corruption-date>.dump
exit

# Restart services
docker compose -p ag -f docker-compose.prod.yml --env-file /srv/ag/.env start
```

**Fast rollback via backup:**

```bash
# Drop and recreate DB
docker exec ag_postgres dropdb -U "$POSTGRES_USER" "$POSTGRES_DB"
docker exec ag_postgres createdb -U "$POSTGRES_USER" "$POSTGRES_DB"

# Restore
docker exec -i ag_postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  --clean --if-exists < /srv/backups/db/ag-pg-<latest>.dump
```

#### 4.4.2 Supabase PostgreSQL

1. Log in to Supabase Dashboard → Database → Backups
2. Select the backup from before corruption occurred
3. Click **Restore** (creates a new database; you may need to update `SUPABASE_URL` in `.env`)
4. If PITR is enabled, select a timestamp before the corruption event

> **Note:** Supabase restores create a new database instance. Update `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` if the connection string changes.

#### 4.4.3 Redis Data Corruption

```bash
# Stop redis
docker compose -p ag -f docker-compose.prod.yml --env-file /srv/ag/.env stop redis

# Replace dump.rdb from backup
docker run --rm -v redis_data:/data -v /srv/backups/redis:/backup alpine \
  cp "/backup/dump-<latest>.rdb" /data/dump.rdb

# Restart redis
docker compose -p ag -f docker-compose.prod.yml --env-file /srv/ag/.env up -d redis
```

### 4.5 Scenario D — Region Failure (SEV1)

**Symptoms:** Hetzner NBG1 datacenter experiencing outage. Cannot create VPS in NBG1.

**Steps:**

1. Provision new CCX23 VPS in **FSN1 (Falkenstein)** or **HEL1 (Helsinki)**:
   ```bash
   hcloud server create \
     --name ag-prod-fsn1 \
     --type ccx23 \
     --image ubuntu-22.04 \
     --location fsn1 \
     --ssh-key ~/.ssh/vps-deploy-key.pub
   ```

2. Follow Phase 3–7 from Scenario B (full VPS recovery)

3. Update DNS A records to point to the new VPS IP

4. After NBG1 is restored, back-up the FSN1 PostgreSQL dump and migrate back:
   - Schedule a maintenance window
   - Dump PostgreSQL on FSN1
   - Restore on NBG1 after reprovisioning
   - Switch DNS back

### 4.6 Scenario E — Bad Deployment (SEV2)

**Symptoms:** After CI/CD deploy, health checks fail, or users report broken functionality.

**Steps:**

1. **Immediate rollback via Git:**
   ```bash
   git revert HEAD --no-edit
   git push origin main
   ```

   This triggers `deploy.yml` which rebuilds and deploys the previous commit's images.

2. **Fast rollback without Git** (use previous GHCR image tag):
   ```bash
   export IMAGE_TAG=<previous-commit-sha>
   docker compose -p ag -f docker-compose.prod.yml --env-file /srv/ag/.env pull
   docker compose -p ag -f docker-compose.prod.yml --env-file /srv/ag/.env up -d
   ```

3. Verify recovery:
   ```bash
   docker compose -p ag -f docker-compose.prod.yml ps
   curl -f https://api.advadiityagade.com/health
   ```

---

## 5. Recovery Runbook (Cheat Sheet)

### 5.1 Quick-Reference Commands

```bash
# ─── STATUS ───────────────────────────────────────────

# All containers
docker ps -a --filter name=ag_ --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Compose status
docker compose -p ag -f /srv/ag/docker-compose.prod.yml ps

# Logs for specific service
docker logs <container_name> --tail 100

# Health endpoint
curl -f https://api.advadiityagade.com/health
curl -f https://intake.advadiityagade.com/health

# ─── RESTART ──────────────────────────────────────────

# Single service
docker compose -p ag -f /srv/ag/docker-compose.prod.yml \
  --env-file /srv/ag/.env restart <service>

# Recreate single service (pull latest)
docker compose -p ag -f /srv/ag/docker-compose.prod.yml \
  --env-file /srv/ag/.env up -d --force-recreate <service>

# Full stack restart
docker compose -p ag -f /srv/ag/docker-compose.prod.yml \
  --env-file /srv/ag/.env restart

# ─── DEPLOY ───────────────────────────────────────────

# Pull latest images and restart all
docker compose -p ag -f /srv/ag/docker-compose.prod.yml \
  --env-file /srv/ag/.env pull
docker compose -p ag -f /srv/ag/docker-compose.prod.yml \
  --env-file /srv/ag/.env up -d

# Rollback to specific image tag
export IMAGE_TAG=<previous-sha>
docker compose -p ag -f /srv/ag/docker-compose.prod.yml \
  --env-file /srv/ag/.env pull
docker compose -p ag -f /srv/ag/docker-compose.prod.yml \
  --env-file /srv/ag/.env up -d

# ─── BACKUP ───────────────────────────────────────────

# Manual PostgreSQL dump
docker exec ag_postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  --format=custom --compress=9 \
  -f /tmp/ag-pg-manual-$(date +%Y%m%d-%H%M%S).dump
docker cp ag_postgres:/tmp/ag-pg-*.dump /srv/backups/db/

# Manual Redis save + dump
docker exec ag_redis redis-cli -a "$REDIS_PASSWORD" SAVE
docker cp ag_redis:/data/dump.rdb /srv/backups/redis/dump-manual-$(date +%Y%m%d-%H%M%S).rdb

# ─── RESTORE ──────────────────────────────────────────

# Restore PostgreSQL from backup dump
docker exec ag_postgres dropdb -U "$POSTGRES_USER" "$POSTGRES_DB"
docker exec ag_postgres createdb -U "$POSTGRES_USER" "$POSTGRES_DB"
docker exec -i ag_postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  --clean --if-exists < /srv/backups/db/ag-pg-<dump-file>.dump

# Restore Docker volume from backup
docker run --rm -v n8n_data:/target -v /srv/backups/volumes:/backup alpine \
  tar xzf "/backup/<volume>-<date>.tar.gz" -C /target

# ─── FULL RECOVERY ────────────────────────────────────

# See §4.3 — Full VPS Failure runbook
```

### 5.2 Service Dependency Graph

```
caddy (TLS/ingress)
  ├── ag-platform (Express + Vite)
  │   └── postgres (self-hosted, relational)
  ├── ai-backend (FastAPI + LangGraph)
  │   └── postgres (self-hosted, pgvector)
  │   └── redis (agent bus, streams)
  ├── ai-dashboard (Next.js)
  │   └── ai-backend
  ├── intake-api (Fastify gateway)
  │   └── redis (OTP bridge)
  ├── telegram-bot (Telegraf)
  │   └── redis
  │   └── ai-backend
  ├── email-intake (IMAP poller)
  │   └── redis
  │   └── ai-backend
  └── n8n (workflow engine)
      └── postgres (shared instance)

Supabase Cloud (external):
  └── ag-platform (auth, user data, cases)
  └── ai-backend (auth verification)
  └── intake-api (case persistence)
```

### 5.3 Startup Order

1. `postgres` — database must be healthy first
2. `redis` — cache/messaging must be healthy next
3. `ai-backend` — depends on postgres + redis
4. `ag-platform` — depends on postgres
5. `intake-api` — depends on redis
6. `n8n` — depends on postgres
7. `telegram-bot` — depends on redis + ai-backend
8. `email-intake` — depends on redis + ai-backend
9. `ai-dashboard` — depends on ai-backend
10. `caddy` — depends on all upstream services

Compose `depends_on` with `condition: service_healthy` enforces this automatically.

---

## 6. Testing Schedule

### 6.1 Quarterly Tabletop Exercise

Every 3 months, run a 30-minute walkthrough of one scenario:

| Quarter | Scenario | Focus |
|---------|----------|-------|
| Q1 (Mar) | Single container failure (§4.2) | Mental checklist, command recall |
| Q2 (Jun) | Bad deployment rollback (§4.6) | Git revert + image tag rollback |
| Q3 (Sep) | Data corruption — PostgreSQL (§4.4) | pg_restore procedure |
| Q4 (Dec) | Full VPS failure (§4.3) | Provisioning + restore timeline |

**Tabletop checklist:**
- [ ] Open the BCP/DR plan
- [ ] Walk through each step aloud
- [ ] Verify all commands are still correct (versions, paths)
- [ ] Verify backup files exist and are recent
- [ ] Check that SSH keys, tokens, and credentials are accessible
- [ ] Log any gaps or improvements to `tasks/lessons.md`

### 6.2 Annual Full DR Test

**Frequency:** Once per year (Q4 recommended)
**Duration:** 4-hour slot

**Procedure:**

| Phase | Time | Activity |
|-------|------|----------|
| Pre-test | T-7d | Create a temporary Hetzner VPS (CX22 minimum) to test against |
| Pre-test | T-1d | Take a fresh backup; announce maintenance window |
| Test start | T+0h | Simulate total failure — destroy the test VPS or shut down Docker |
| Recovery | T+0–2h | Reproduce full recovery from backup per §4.3 Phase 3–5 |
| Validation | T+2–3h | Smoke test all endpoints and critical workflows |
| Teardown | T+3–4h | Delete test VPS; document results and timeline |
| Review | T+1w | Post-mortem with action items |

**Success criteria:**
- Full platform operational within 4 hours
- All 10 services healthy and passing health checks
- Core workflows functional (login via Supabase, case CRUD, Telegram bot, webhook intake)
- Data loss ≤ 1 hour from last backup
- No credentials leaked or left on test VPS

### 6.3 Backup Restoration Test

**Frequency:** Monthly
**Procedure:**
1. Copy latest PostgreSQL dump to a local Docker instance
2. Run `pg_restore` and verify data integrity
3. Check that non-empty tables exist for critical data
4. If using a test VPS, spin up a temporary compose stack and verify health checks pass

---

## 7. Communication Plan

### 7.1 Notification Matrix

| Audience | SEV1 | SEV2 | SEV3 | SEV4 | Channel |
|----------|------|------|------|------|---------|
| Internal (self) | Immediate | < 15 min | < 1 hr | Next day | Telegram DM |
| Key clients / stakeholders | < 30 min | < 2 hr | Next day | Optional | Telegram / Email |
| Public status page | < 30 min | < 4 hr | Optional | No | Status page / social |
| Team (future hires) | < 15 min | < 1 hr | < 4 hr | Daily standup | Telegram `#incident` |

### 7.2 Communication Templates

**SEV1 — Incident declaration:**
```
🚨 SEV1 INCIDENT DECLARED
Platform: AG Associates
Timestamp: YYYY-MM-DD HH:MM IST
Impact: [All services down / Data corruption / Security breach]
Action: Investigating / Mitigating / Resolved
ETA: [estimated recovery time]
Updates: Will post at HH:MM
```

**SEV1 — Status update (every 30 min):**
```
🔄 SEV1 UPDATE — AG Associates
Timestamp: YYYY-MM-DD HH:MM IST
Status: [Investigating / Mitigating / Resolved]
What happened: [brief root cause]
Next update: HH:MM IST
```

**SEV1 — Resolution:**
```
✅ SEV1 RESOLVED — AG Associates
Timestamp: YYYY-MM-DD HH:MM IST
Duration: Xh Ym
Root cause: [summary]
Action items: [link to post-mortem]
```

### 7.3 Escalation Tree

```
Level 1: Raj Khemani (LUXORANOVA9)
         Telegram: @rajkhemani
         Phone: (personal mobile — known to operator)

Level 2: Hetzner Support (infrastructure)
         https://console.hetzner.cloud → Support Ticket
         Emergency: +49 911 696 66 222 (24/7)

Level 3: Supabase Support (database)
         https://supabase.com/dashboard → Support
         Plan: Pro — standard support SLA

Level 4: GitHub Support (CI/CD, GHCR)
         https://support.github.com

> Single-person team. Level 2+ escalation is for vendor infrastructure issues
> only. All recovery execution is Level 1.
```

### 7.4 Key Contacts Reference

| Contact | For | Method |
|---------|-----|--------|
| Hetzner Cloud Console | VPS management, reprovisioning | https://console.hetzner.cloud |
| Supabase Dashboard | Database backup/restore, auth | https://supabase.com/dashboard |
| GitHub / GHCR | Container registry, CI/CD | https://github.com/rajkhemani |
| Cloudflare / DNS provider | DNS record updates | (per provider dashboard) |
| Domain registrar | Domain transfer if needed | (per registrar) |
| Telegram bot (@ag_associates_bot) | Internal incident channel | Telegram app |

---

## 8. Preventive Measures

### 8.1 Monitoring & Alerting

| Check | Tool | Frequency | Action on Failure |
|-------|------|-----------|-------------------|
| Container health | Docker health checks (in compose) | Every 30s | Auto-restart (`restart: unless-stopped`) |
| HTTP health endpoints | GitHub Actions smoke test | On deploy | Rollback |
| Disk usage | Manual / cron | Weekly | Clean Docker images, prune volumes |
| TLS certificate expiry | Caddy auto-renewal | Every 60 days | Auto-renewed; manual check if port 80 blocked |
| PostgreSQL integrity | `pg_isready` (compose health check) | Every 10s | Auto-restart |

### 8.2 Future Improvements (Roadmap)

- [ ] **Off-site backup target** — Rsync backups to a second Hetzner VPS or S3-compatible storage (Backblaze B2, Hetzner Object Storage)
- [ ] **Monitoring dashboard** — Add Uptime Kuma or Grafana for service-level visibility
- [ ] **Automated DR test** — GitHub Actions workflow that spins up a test VPS, restores from backup, runs smoke tests, and tears down
- [ ] **Failover DNS** — Configure secondary region VPS with automated DNS failover via Cloudflare
- [ ] **Pager/alerting** — Integrate with PagerDuty or similar for after-hours escalation (once team grows)
- [ ] **WAL archiving** — Enable continuous WAL archiving for self-hosted PostgreSQL to support point-in-time recovery
- [ ] **Immutable .env** — Store encrypted .env in a secure vault (Bitwarden, 1Password CLI, or sops) rather than relying on manual SCP

---

## 9. Assumptions & Exclusions

### 9.1 In-Scope
- AG Associates Docker Compose stack on Hetzner VPS
- Supabase Cloud (backup/restore procedures only — not Supabase's own infrastructure)
- GitHub / GHCR (availability assumed; contingency via local image cache if needed)
- DNS configuration

### 9.2 Out-of-Scope
- Physical disaster at Hetzner datacenter (handled by Hetzner's own BCP)
- Supabase infrastructure failure (covered by Supabase's SLA)
- GitHub infrastructure failure (covered by GitHub's SLA)
- Client-side failures (user's browser, network)
- Security incidents (see Incident Response Plan)

### 9.3 Assumptions
- Hetzner Cloud API is operational during recovery
- GitHub / GHCR are accessible during recovery
- DNS propagation completes within 5–10 min (TTL dependent)
- Backup files are restorable and not themselves corrupted
- The operator has SSH key access and GitHub credentials available

### 9.4 Data Classification

| Sensitivity | Data | Backup Handling |
|-------------|------|-----------------|
| Critical | Database contents (cases, clients, documents, embeddings) | Encrypted at rest; backup on VPS + off-site |
| High | Environment variables, API keys, tokens | GitHub Secrets + encrypted .env backup |
| Medium | Application code, config files | Git history (public repo) |
| Low | Static assets, documentation | Git history or rebuildable from source |

### 9.5 Recovery Time Budget

```
Phase                 Target    Cumulative
──────────────────────────────────────────
Triage + declare       15 min     15 min
VPS provisioning       30 min     45 min
Dependencies setup     45 min     90 min
Data restore           60 min    150 min
Stack launch           30 min    180 min
Verification           30 min    210 min
Post-recovery          30 min    240 min (4 hr)
```

### 9.6 Supabase SLA & Backup

Supabase Pro plan:
- **Uptime SLA:** 99.95% (monthly)
- **Automatic backups:** Daily, retained 7 days
- **PITR:** Available as add-on (extra cost)
- **Restore procedure:** Supabase Dashboard → Database → Backups → Restore

In the event of Supabase Cloud failure:
1. AG Associates app will fail at auth and any Supabase-dependent queries
2. Self-hosted services (ai-backend, n8n) continue running but cannot authenticate users
3. Recovery depends entirely on Supabase restoring service
4. Mitigation: maintain a local dump of critical Supabase tables for emergency rebuild
