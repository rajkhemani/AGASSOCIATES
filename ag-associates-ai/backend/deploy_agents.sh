#!/usr/bin/env bash
set -euo pipefail

# ─── AG Multi-Agent System Deploy ─────────────────────────────────────────
# Usage: SSH_KEY=/path/to/key ./deploy_agents.sh
#   or:  ./deploy_agents.sh /path/to/key
#
# Defaults:
#   SSH_KEY=${1:-${SSH_KEY:-/tmp/vps-key}}
#   VPS_HOST=deploy@46.225.185.91
#   REMOTE_DIR=~/ag-associates-ai/backend

SSH_KEY="${1:-${SSH_KEY:-/tmp/vps-key}}"
VPS_HOST="${VPS_HOST:-deploy@46.225.185.91}"
REMOTE_DIR="${REMOTE_DIR:-~/ag-associates-ai/backend}"
LOCAL_DIR="$(dirname "$0")"

if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH key not found at $SSH_KEY"
    echo "Usage: SSH_KEY=/path/to/key $0"
    exit 1
fi

echo "🚀 Deploying multi-agent system to $VPS_HOST ..."

# ─── Step 1: Create remote dirs ──────────────────────────────────────────

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$VPS_HOST" "
mkdir -p $REMOTE_DIR/agents/auditor
mkdir -p $REMOTE_DIR/agents/vyasa
mkdir -p $REMOTE_DIR/agents/bouncer
mkdir -p $REMOTE_DIR/agents/accountant
mkdir -p $REMOTE_DIR/agents/noi
mkdir -p $REMOTE_DIR/agents/executor
mkdir -p $REMOTE_DIR/agents/drafter
mkdir -p $REMOTE_DIR/media
mkdir -p $REMOTE_DIR/database
"

# ─── Step 2: Rsync new agent files ───────────────────────────────────────

rsync -avz --no-owner --no-group -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    "$LOCAL_DIR/agents/agent_bus.py" \
    "$LOCAL_DIR/agents/base_agent.py" \
    "$LOCAL_DIR/agents/agent_registry.py" \
    "$LOCAL_DIR/agents/agent_memory.py" \
    "$LOCAL_DIR/agents/agent_init.py" \
    "$VPS_HOST:$REMOTE_DIR/agents/"

rsync -avz --no-owner --no-group -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    "$LOCAL_DIR/agents/auditor/" "$VPS_HOST:$REMOTE_DIR/agents/auditor/"

rsync -avz --no-owner --no-group -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    "$LOCAL_DIR/agents/vyasa/" "$VPS_HOST:$REMOTE_DIR/agents/vyasa/"

rsync -avz --no-owner --no-group -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    "$LOCAL_DIR/agents/bouncer/" "$VPS_HOST:$REMOTE_DIR/agents/bouncer/"

rsync -avz --no-owner --no-group -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    "$LOCAL_DIR/agents/accountant/" "$VPS_HOST:$REMOTE_DIR/agents/accountant/"

rsync -avz --no-owner --no-group -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    "$LOCAL_DIR/agents/noi/" "$VPS_HOST:$REMOTE_DIR/agents/noi/"

rsync -avz --no-owner --no-group -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    "$LOCAL_DIR/agents/executor/" "$VPS_HOST:$REMOTE_DIR/agents/executor/"

rsync -avz --no-owner --no-group -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    "$LOCAL_DIR/agents/drafter/" "$VPS_HOST:$REMOTE_DIR/agents/drafter/"

rsync -avz --no-owner --no-group -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    "$LOCAL_DIR/media/" "$VPS_HOST:$REMOTE_DIR/media/"

rsync -avz --no-owner --no-group -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    "$LOCAL_DIR/database/agent_migrations.sql" \
    "$LOCAL_DIR/telegram_bot/bot.py" \
    "$LOCAL_DIR/telegram_bot/private_messenger.py" \
    "$LOCAL_DIR/aisha_core.py" \
    "$LOCAL_DIR/auth/rbac.py" \
    "$VPS_HOST:$REMOTE_DIR/"

echo "✅ Files copied"

# ─── Step 3: DB migration ────────────────────────────────────────────────

echo "🗄️ Running DB migrations..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$VPS_HOST" "
    docker exec ag_postgres psql -U agadmin -d agdb -f /backend/database/agent_migrations.sql 2>&1 || \
    docker exec \$(docker ps -q -f name=postgres) psql -U agadmin -d agdb -f /backend/database/agent_migrations.sql 2>&1
"
echo "✅ DB migrations done"

# ─── Step 4: Rebuild and restart the Telegram bot ────────────────────────

echo "🔄 Rebuilding and restarting bot..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$VPS_HOST" "
    cd ~
    if [ -f docker-compose.yml ]; then
        docker compose build ag_telegram_bot && docker compose up -d ag_telegram_bot
    elif [ -f docker-compose.prod.yml ]; then
        docker compose -f docker-compose.prod.yml build ag_telegram_bot && \
        docker compose -f docker-compose.prod.yml up -d ag_telegram_bot
    else
        echo '⚠️ No compose file found, restarting container manually...'
        docker restart ag_telegram_bot
    fi
"

echo ""
echo "✅ Deploy complete!"
echo "   Test: /agents — should show all 7 agents"
echo "   Test: /agent auditor mere transactions check karo"
echo "   Test: Send an Excel file — should route through Auditor"
echo "   Test: Send a photo — should OCR through multi-modal pipeline"
