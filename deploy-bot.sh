#!/bin/bash
# ============================================================
# AG Associates — Telegram Bot Deployment Script
# ============================================================
# Usage: ./deploy-bot.sh [--rebuild] [--env-file .env.prod]
#
# Prerequisites:
#   1. SSH key access to 46.225.185.91
#   2. Docker logged in to GHCR: `docker login ghcr.io`
#   3. Production .env file with real secrets
#
# ============================================================

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────
VPS_HOST="46.225.185.91"
VPS_USER="deploy"
VPS_SSH_KEY="$HOME/.ssh/id_rsa_ag_vps"
IMAGE_TAG="${IMAGE_TAG:-$(date +%Y%m%d-%H%M%S)}"
REGISTRY="ghcr.io/rajkhemani"
IMAGE_NAME="telegram-bot"
IMAGE_FULL="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
ENV_FILE="${1:-.env.prod}"
REBUILD="${REBUILD:-false}"

# ── Colors ────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; exit 1; }

# ── Checks ────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || error "Docker is required but not installed."
command -v ssh >/dev/null 2>&1 || error "SSH is required but not installed."
command -v rsync >/dev/null 2>&1 || warn "rsync not found. File sync will use scp."

# ── Banner ────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  AG Associates — Telegram Bot Deployment             ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  Image: ${IMAGE_FULL}"
echo "║  Env:   ${ENV_FILE}"
echo "║  VPS:   ${VPS_USER}@${VPS_HOST}"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Validate env file ────────────────────────────────────
if [[ ! -f "${ENV_FILE}" ]]; then
    error "Env file not found: ${ENV_FILE}"
fi

# Validate required secrets
source "${ENV_FILE}"
REQUIRED_VARS=(
    "TELEGRAM_BOT_TOKEN"
    "REDIS_PASSWORD"
    "N8N_WEBHOOK_KEY"
)
for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var}" || "${!var}" == *"change_me"* || "${!var}" == *"replace_with"* ]]; then
        error "Required variable ${var} is not set or contains placeholder value"
    fi
done
log "Env file validated"

# ── Step 2: Check SSH connectivity ────────────────────────────────
log "Checking SSH connectivity to ${VPS_HOST}..."
if [[ ! -f "${VPS_SSH_KEY}" ]]; then
    warn "SSH key not found at ${VPS_SSH_KEY}"
    warn "Trying to connect with default SSH key or password..."
    SSH_CMD="ssh"
else
    SSH_CMD="ssh -i ${VPS_SSH_KEY}"
fi

if ! ${SSH_CMD} -o ConnectTimeout=5 -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" "echo ok" 2>/dev/null; then
    error "Cannot connect to VPS. Verify:"
           error "  1. SSH key is set up at ${VPS_SSH_KEY}"
           error "  2. User '${VPS_USER}' exists on VPS"
           error "  3. Firewall allows SSH on port 22"
fi
log "SSH connectivity verified"

# ── Step 3: Build Docker image ─────────────────────────────────────
log "Building Docker image..."
cd "$(dirname "$0")/ag-associates-ai/backend/telegram_bot"

if [[ "${REBUILD}" == "true" || ! -f ".dockerignore" ]]; then
    docker build \
        --platform linux/amd64 \
        -t "${IMAGE_FULL}" \
        -t "${REGISTRY}/${IMAGE_NAME}:latest" \
        .
else
    docker build \
        --platform linux/amd64 \
        -t "${IMAGE_FULL}" \
        -t "${REGISTRY}/${IMAGE_NAME}:latest" \
        --pull \
        .
fi

log "Image built: ${IMAGE_FULL}"

# ── Step 4: Push to GHCR ───────────────────────────────────────────
log "Pushing image to GHCR..."
docker push "${IMAGE_FULL}"
docker push "${REGISTRY}/${IMAGE_NAME}:latest"
log "Image pushed to ${REGISTRY}"

# ── Step 5: Sync env file to VPS ───────────────────────────────────
log "Syncing env file to VPS..."
${SSH_CMD} "${VPS_USER}@${VPS_HOST}" "mkdir -p ~/ag-associates-ai"
rsync -az --rsync-path="rsync" \
    -e "ssh -i ${VPS_SSH_KEY}" \
    "${ENV_FILE}" \
    "${VPS_USER}@${VPS_HOST}:~/ag-associates-ai/.env"
log "Env file synced"

# ── Step 6: Deploy on VPS ──────────────────────────────────────────
log "Deploying on VPS..."
${SSH_CMD} "${VPS_USER}@${VPS_HOST}" bash << 'REMOTE_SCRIPT'
set -e
cd ~/ag-associates-ai

# Load env
set -a
source .env
set +a

# Ensure image tag is set
export IMAGE_TAG="${IMAGE_TAG:-latest}"

# Pull latest image
echo "[INFO] Pulling latest image..."
docker pull ghcr.io/rajkhemani/telegram-bot:${IMAGE_TAG}

# Pull latest image (latest tag)
docker pull ghcr.io/rajkhemani/telegram-bot:latest || true

# Recreate telegram-bot container
echo "[INFO] Recreating telegram-bot container..."
docker compose -f docker-compose.prod.yml up -d telegram-bot

# Wait for health check
echo "[INFO] Waiting for bot to be healthy..."
for i in {1..30}; do
    if docker inspect --format='{{.State.Health.Status}}' ag_telegram_bot 2>/dev/null | grep -q "healthy"; then
        echo "[OK] Bot is healthy!"
        docker logs ag_telegram_bot --tail=20
        exit 0
    fi
    echo "  Attempt $i/30..."
    sleep 2
done

# If we get here, show logs for debugging
echo "[WARN] Bot may not be healthy. Last logs:"
docker logs ag_telegram_bot --tail=50
exit 1
REMOTE_SCRIPT

log "Deployment complete!"
log ""
log "Verify with: ssh ${VPS_USER}@${VPS_HOST} 'docker logs ag_telegram_bot --tail=50'"
log "Or check bot commands: /auditor, /drafter, /vyasa, /bouncer, /accountant, /noi, /aisha"
