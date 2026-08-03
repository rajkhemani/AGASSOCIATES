# AG Associates — Full Automation Guide

This document describes the complete automated deployment and operations pipeline for AG Associates.

## 🎯 One-Command Deployment

```bash
# Full automated deployment (provision VPS + deploy + runner + DNS + smoke tests)
bash scripts/deploy-all.sh all

# Or using Make
make deploy-all
```

## 📋 Available Commands

### Master Automation Script (`scripts/deploy-all.sh`)

| Command | Description |
|---------|-------------|
| `provision` | Provision new VPS on Hetzner + configure Cloudflare DNS |
| `deploy` | Trigger GitHub Actions deploy to existing VPS |
| `runner` | Setup GitHub Actions self-hosted runner on VPS |
| `dns` | Update Cloudflare DNS records |
| `smoke` | Run smoke tests against production endpoints |
| `write-env` | Write production .env to VPS |
| `teardown` | **DANGEROUS** - Destroy VPS and cleanup |
| `all` | Full pipeline (default) |

### Makefile Targets

```bash
# Environment
make env              # Create local .env from .env.example
make prod-env         # Write production .env to VPS

# Development
make dev              # Start local Docker Compose stack
make dev-ai           # Start ag-associates-ai only
make dev-platform     # Start ag-platform only
make test             # Run tests
make lint             # Run linters
make build            # Build all Docker images

# Production
make provision        # Provision new VPS
make deploy           # Deploy to VPS
make runner           # Setup GitHub Actions runner
make dns              # Update DNS
make smoke            # Run smoke tests
make deploy-all       # Full automated deployment
make teardown         # Destroy VPS (DANGEROUS)

# Maintenance
make backup           # Run backup manually
make logs             # Stream production logs
make status           # Check service status
make ssh              # SSH into VPS
make clean            # Clean Docker images/volumes

# GitHub Actions
make gh-secrets       # Set all GitHub secrets from env
make gh-workflows     # Trigger deploy workflows
```

## 🔐 Required Secrets

Before running automation, populate `.env` with:

```bash
# Infrastructure
HETZNER_API_TOKEN=                # Hetzner Cloud API token
CLOUDFLARE_API_TOKEN=             # Cloudflare API token
CLOUDFLARE_ZONE_ID=               # Cloudflare zone ID
GH_PAT=                           # GitHub Personal Access Token (repo scope)

# AI Services
GROQ_API_KEY=                     # Groq LLM API key
GOOGLE_GENERATIVE_AI_API_KEY=     # Google Gemini API key

# Supabase
SUPABASE_URL=                     # Supabase project URL
SUPABASE_ANON_KEY=                # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=        # Supabase service role key
SUPABASE_JWT_SECRET=              # Supabase JWT secret

# Communications
RESEND_API_KEY=                   # Resend email API key
TELEGRAM_BOT_TOKEN=               # Telegram bot token
TELEGRAM_GROUP_ID=                # Telegram group ID

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_VERIFY_TOKEN=

# Government E-Filing
NESL_API_KEY=
NESL_CLIENT_ID=
NESL_CLIENT_SECRET=
IGR_PORTAL_USERNAME=
IGR_PORTAL_PASSWORD=
```

Generate a production `.env` with secure defaults:
```bash
make env
# Edit .env and replace all REPLACE_WITH_* values
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      GitHub Actions CI/CD                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Build     │  │   Test      │  │  Deploy     │             │
│  │  (GHCR)     │──│  (Vitest/   │──│  (SSH to    │             │
│  │             │  │   Pytest)   │  │   VPS)      │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Production VPS (Hetzner)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Docker Compose Stack (docker-compose.prod.yml)           │   │
│  │  ┌─────────┐ ┌────────┐ ┌─────────┐ ┌────────┐ ┌───────┐ │   │
│  │  │ Caddy   │ │Postgres│ │ Redis   │ │ n8n    │ │ AI    │ │   │
│  │  │ (SSL)   │ │(pgvector)    │        │       │ │Backend│ │   │
│  │  └─────────┘ └────────┘ └─────────┘ └────────┘ └───────┘ │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ ┌───────┐ │   │
│  │  │AI       │ │Ag       │ │Intake   │ │Telegram│ │Email  │ │   │
│  │  │Dashboard│ │Platform │ │API      │ │Bot     │ │Intake │ │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └────────┘ └───────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐   │
│  │ GitHub Runner   │  │ Nightly Backup  │  │ Health Monitor │   │
│  │ (self-hosted)   │  │ (Restic)        │  │ (5-min cron)   │   │
│  └─────────────────┘  └─────────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Initial Setup (One-time)

```bash
# Clone repo
git clone https://github.com/LUXORANOVA9/AGASSOCIATES.git
cd AGASSOCIATES

# Create and edit .env
make env
# → Edit .env with all your API keys

# Set GitHub secrets (requires gh CLI auth)
make gh-secrets
```

### 2. Deploy to Production

```bash
# Full automated deployment
make deploy-all

# Or step by step:
make provision   # Creates VPS, DNS, bootstraps, deploys
# ... wait for completion ...
make smoke       # Verify endpoints
```

### 3. Verify Deployment

```bash
make status      # Check container status
make logs        # Stream AI backend logs
make smoke       # Run health checks
```

## 🔧 Production Operations

### Health Monitoring

- **Automatic**: Runs every 5 minutes via cron (`/usr/local/sbin/ag-health-check`)
- **Logs**: `/var/log/ag-health.log`
- **Alerts**: Configure `HEALTH_ALERT_WEBHOOK` in `.env` for Slack/Discord/Telegram alerts

### Backups

- **Automatic**: Nightly at 2:30 AM via cron (`/usr/local/sbin/ag-backup`)
- **Storage**: Restic repository at `/srv/ag/backups/restic-repo`
- **Retention**: 30 daily, 8 weekly, 6 monthly
- **Manual**: `make backup` or `ssh deploy@VPS "sudo /usr/local/sbin/ag-backup"`

### Log Rotation

- Configured via `/etc/logrotate.d/ag-associates`
- Daily rotation, 30-day retention, compressed

### SSL Certificates

- **Automatic**: Caddy handles Let's Encrypt via ACME
- **Email**: `admin@advaiityagade.com` (from `ACME_EMAIL`)

## 🔄 Updating Production

### Code Changes

```bash
# Push to main triggers GitHub Actions deploy
git add .
git commit -m "feat: your changes"
git push origin main

# Monitor deploy
gh run watch
```

### Environment Changes

```bash
# Edit local .env
vim .env

# Push to VPS
make prod-env

# Restart affected services
ssh deploy@VPS "cd /srv/ag/repo && docker compose -p ag -f docker-compose.prod.yml --env-file /srv/ag/.env up -d"
```

### Image Updates

```bash
# Force rebuild and deploy
git commit --allow-empty -m "chore: force rebuild"
git push origin main
```

## 🆘 Troubleshooting

### Check Service Logs

```bash
make logs
# Or specific service:
ssh deploy@VPS "docker logs -f ag_ai_backend --tail 100"
```

### Check Container Status

```bash
make status
```

### Restart Services

```bash
ssh deploy@VPS "docker compose -p ag -f /srv/ag/repo/docker-compose.prod.yml --env-file /srv/ag/.env restart"
```

### Database Access

```bash
ssh deploy@VPS "docker exec -it ag_postgres psql -U agadmin -d agdb"
```

### Redis Access

```bash
ssh deploy@VPS "docker exec -it ag_redis redis-cli -a \$REDIS_PASSWORD"
```

### View Backup Status

```bash
ssh deploy@VPS "restic -r /srv/ag/backups/restic-repo snapshots --last 10"
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `.env` | Local development + production secrets (gitignored) |
| `.env.example` | Template with all required variables |
| `docker-compose.prod.yml` | Production Docker Compose stack |
| `Caddyfile` | Caddy reverse proxy + SSL config |
| `scripts/deploy-all.sh` | Master automation script |
| `scripts/provision.sh` | VPS provisioning (Hetzner + Cloudflare) |
| `scripts/bootstrap-vps.sh` | VPS bootstrap (Docker, user, repo) |
| `scripts/setup-runner.sh` | GitHub Actions runner setup |
| `scripts/backup.sh` | Nightly backup (Restic) |
| `scripts/health-check.sh` | Health monitoring (5-min cron) |
| `scripts/setup-cron.sh` | Install cron + logrotate |
| `scripts/auto-deploy.sh` | One-command deploy + smoke test |
| `Makefile` | Convenience targets |

## 🔒 Security Notes

- All secrets in `.env` (never commit!)
- VPS accessed via SSH key only (no passwords)
- GitHub Actions uses self-hosted runner on VPS
- Caddy enforces HTTPS, security headers
- UFW firewall: only 22, 80, 443 open
- fail2ban protects SSH
- Unattended security upgrades enabled

## 📞 Support

- **Logs**: `/var/log/ag-*.log` on VPS
- **GitHub Actions**: https://github.com/LUXORANOVA9/AGASSOCIATES/actions
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Hetzner Console**: https://console.hetzner.cloud
- **Cloudflare Dashboard**: https://dash.cloudflare.com
