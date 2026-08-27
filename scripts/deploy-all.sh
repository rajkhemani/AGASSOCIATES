#!/usr/bin/env bash
# =============================================================================
# AG Associates — Master Deployment Automation
# =============================================================================
# One-command full stack deployment from local machine to production VPS.
# Reads secrets from local .env file, provisions infrastructure via Hetzner/Cloudflare,
# builds/pushes Docker images via GitHub Actions, and deploys to VPS.
#
# Usage:
#   bash scripts/deploy-all.sh [command]
#
# Commands:
#   provision   - Provision new VPS (requires HETZNER_API_TOKEN, CLOUDFLARE_API_TOKEN)
#   deploy      - Build/push images and deploy to existing VPS
#   runner      - Setup GitHub Actions self-hosted runner on VPS
#   dns         - Update Cloudflare DNS records
#   smoke       - Run smoke tests against production endpoints
#   all         - Run provision, deploy, runner, dns, smoke (default)
#   teardown    - Destroy VPS and cleanup
#
# Prerequisites:
#   - Local .env file with all secrets (created by setup)
#   - Hetzner API token, Cloudflare API token, GitHub PAT
#   - gh CLI authenticated (for GitHub secrets)
#
# Environment variables (can be set in .env or exported):
#   HETZNER_API_TOKEN         - Hetzner API token (for provision)
#   CLOUDFLARE_API_TOKEN      - Cloudflare API token (for DNS)
#   CLOUDFLARE_ZONE_ID        - Cloudflare zone ID
#   GH_PAT                    - GitHub Personal Access Token (repo scope)
#   GROQ_API_KEY              - Groq LLM API key
#   SUPABASE_URL              - Supabase project URL
#   SUPABASE_ANON_KEY         - Supabase anon key
#   SUPABASE_SERVICE_ROLE_KEY - Supabase service role key
#   SUPABASE_JWT_SECRET       - Supabase JWT secret
#   RESEND_API_KEY            - Resend email API key
#   TELEGRAM_BOT_TOKEN        - Telegram bot token
#   TELEGRAM_GROUP_ID         - Telegram group ID
#   WHATSAPP_*                - WhatsApp Business API credentials
#   NESL_*                    - NeSL API credentials
#   IGR_*                     - IGR portal credentials
#   GOOGLE_GENERATIVE_AI_API_KEY - Google Gemini API key
# =============================================================================

set -euo pipefail

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { printf "${BLUE}[deploy-all]${NC} %s\n" "$*"; }
ok()   { printf "${GREEN}[OK]${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}[WARN]${NC} %s\n" "$*"; }
err()  { printf "${RED}[ERROR]${NC} %s\n" "$*"; }
die()  { err "$*"; exit 1; }

# ── Config ───────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${REPO_ROOT}/.env"
REPO_URL="https://github.com/LUXORANOVA9/AGASSOCIATES.git"
REPO_SLUG="LUXORANOVA9/AGASSOCIATES"

# Default config (overridable via env)
DOMAIN="${DOMAIN:-advadiityagade.com}"
SERVER_TYPE="${SERVER_TYPE:-ccx23}"
LOCATION="${LOCATION:-nbg1}"
ZONE_ID="${CLOUDFLARE_ZONE_ID:-ad78f4619af17346172199dc76082cab}"
PROD_DOMAIN="${PROD_DOMAIN:-$DOMAIN}"
VPS_HOST=""
VPS_IP=""

# ── Load local .env ──────────────────────────────────────────────────────────
load_env() {
  if [[ ! -f "$ENV_FILE" ]]; then
    die "Environment file not found: $ENV_FILE. Run 'make env' or copy from .env.example"
  fi
  set -a
  source "$ENV_FILE"
  set +a
  ok "Loaded environment from $ENV_FILE"
}

# ── Validation ───────────────────────────────────────────────────────────────
require_var() {
  local var_name="$1"
  local var_value="${!var_name:-}"
  if [[ -z "$var_value" ]] || [[ "$var_value" == REPLACE_WITH_* ]]; then
    die "Required variable $var_name is not set or is a placeholder. Check $ENV_FILE"
  fi
}

validate_provision() {
  require_var "HETZNER_API_TOKEN"
  require_var "CLOUDFLARE_API_TOKEN"
  require_var "GROQ_API_KEY"
  require_var "SUPABASE_URL"
  require_var "SUPABASE_SERVICE_ROLE_KEY"
  require_var "SUPABASE_ANON_KEY"
  require_var "GH_PAT"
}

validate_deploy() {
  require_var "GH_PAT"
  # VPS_HOST will be discovered or set
}

validate_runner() {
  require_var "GH_PAT"
}

# ── Hetzner API helpers ──────────────────────────────────────────────────────
hetzner_api() {
  local method="$1"
  local endpoint="$2"
  local data="${3:-}"
  curl -sf -X "$method" "https://api.hetzner.cloud/v1$endpoint" \
    -H "Authorization: Bearer $HETZNER_API_TOKEN" \
    -H "Content-Type: application/json" \
    ${data:+-d "$data"}
}

# ── Cloudflare API helpers ───────────────────────────────────────────────────
cloudflare_api() {
  local method="$1"
  local endpoint="$2"
  local data="${3:-}"
  curl -sf -X "$method" "https://api.cloudflare.com/client/v4$endpoint" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    ${data:+-d "$data"}
}

# ── GitHub API helpers ───────────────────────────────────────────────────────
github_api() {
  local method="$1"
  local endpoint="$2"
  local data="${3:-}"
  curl -sf -X "$method" "https://api.github.com$endpoint" \
    -H "Authorization: Bearer $GH_PAT" \
    -H "Accept: application/vnd.github.v3+json" \
    ${data:+-d "$data"}
}

# ── Check for existing VPS ───────────────────────────────────────────────────
find_existing_vps() {
  log "Checking for existing VPS..."
  local resp
  resp=$(hetzner_api GET "/servers" 2>/dev/null) || return 1
  VPS_IP=$(echo "$resp" | python3 -c "
import sys, json
try:
  data = json.load(sys.stdin)
  for s in data.get('servers', []):
    if s.get('name') == 'ag-prod' and s.get('status') == 'running':
      print(s['public_net']['ipv4']['ip'])
      break
except: pass
" 2>/dev/null || true)
  if [[ -n "$VPS_IP" ]]; then
    VPS_HOST="$VPS_IP"
    ok "Found existing VPS: $VPS_IP"
    return 0
  fi
  return 1
}

# ── Discover VPS IP ──
discover_vps() {
  if find_existing_vps; then
    return 0
  fi
  die "No running VPS found. Run 'bash scripts/deploy-all.sh provision' first."
}

# ── Command: Provision VPS ───────────────────────────────────────────────────
cmd_provision() {
  log "=== PROVISIONING NEW VPS ==="
  validate_provision
  
  # Check if VPS already exists
  if find_existing_vps; then
    warn "VPS 'ag-prod' already exists at $VPS_IP. Skipping creation."
    return 0
  fi
  
  # Generate bootstrap SSH key
  log "Generating bootstrap SSH key..."
  ssh-keygen -t ed25519 -f /tmp/vps-bootstrap-key -N "" -q
  PUBKEY=$(cat /tmp/vps-bootstrap-key.pub)
  trap 'rm -f /tmp/vps-bootstrap-key /tmp/vps-bootstrap-key.pub' EXIT
  
  # Upload SSH key
  log "Uploading SSH key to Hetzner..."
  SSH_KEY_ID=$(hetzner_api POST "/ssh_keys" "{\"name\":\"ag-provision-$(date +%s)\",\"public_key\":\"$PUBKEY\"}" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['ssh_key']['id'])") \
    || die "Failed to upload SSH key"
  
  # Cloud-init config
  log "Creating cloud-init config..."
  CLOUD_INIT=$(cat <<'CLOUDEOF'
#cloud-config
package_update: true
packages:
  - ca-certificates curl gnupg lsb-release git
  - ufw fail2ban unattended-upgrades
  - rsync restic age cron
runcmd:
  - install -m 0755 -d /etc/apt/keyrings
  - curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  - chmod a+r /etc/apt/keyrings/docker.gpg
  - echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
  - apt-get update -y
  - apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  - systemctl enable --now docker
  - adduser --disabled-password --gecos "" deploy
  - usermod -aG docker deploy
  - mkdir -p /home/deploy/.ssh
  - touch /home/deploy/.ssh/authorized_keys
  - chmod 700 /home/deploy/.ssh
  - chmod 600 /home/deploy/.ssh/authorized_keys
  - chown -R deploy:deploy /home/deploy/.ssh
CLOUDEOF
  )
  
  # Create server
  log "Creating Hetzner $SERVER_TYPE server in $LOCATION..."
  SERVER_RESP=$(hetzner_api POST "/servers" "{
    \"name\": \"ag-prod\",
    \"server_type\": \"$SERVER_TYPE\",
    \"image\": \"ubuntu-24.04\",
    \"location\": \"$LOCATION\",
    \"ssh_keys\": [$SSH_KEY_ID],
    \"user_data\": \"$(echo "$CLOUD_INIT" | base64 -w0)\"
  }") || die "Failed to create server"
  
  VPS_IP=$(echo "$SERVER_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['server']['public_net']['ipv4']['ip'])")
  log "Server IP: $VPS_IP"
  
  # Wait for SSH
  log "Waiting for SSH (this may take 60-120s)..."
  for i in {1..24}; do
    if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -i /tmp/vps-bootstrap-key root@"$VPS_IP" "echo READY" 2>/dev/null; then
      ok "SSH ready"
      break
    fi
    sleep 5
  done
  
  # Configure DNS
  cmd_dns
  
  # Bootstrap VPS
  log "Bootstrapping VPS..."
  scp -q -o StrictHostKeyChecking=no -i /tmp/vps-bootstrap-key \
    "$SCRIPT_DIR/bootstrap-vps.sh" "$SCRIPT_DIR/setup-runner.sh" root@"$VPS_IP":/root/
  
  ssh -o StrictHostKeyChecking=no -i /tmp/vps-bootstrap-key root@"$VPS_IP" \
    "bash /root/bootstrap-vps.sh" </dev/null || die "Bootstrap failed"
  
  # Copy SSH key to deploy user
  ssh -o StrictHostKeyChecking=no -i /tmp/vps-bootstrap-key root@"$VPS_IP" \
    "echo '$PUBKEY' >> /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys && chown -R deploy:deploy /home/deploy/.ssh"
  
  # Write .env to VPS
  cmd_write_env
  
  # Setup runner
  cmd_runner
  
  # Trigger first deploy
  cmd_deploy
  
  ok "Provisioning complete! VPS IP: $VPS_IP"
}

# ── Command: Write .env to VPS ───────────────────────────────────────────────
cmd_write_env() {
  discover_vps
  log "Writing production .env to VPS..."
  
  # Generate fresh secrets for VPS
  PW1=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
  PW2=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
  JWT=$(openssl rand -hex 64)
  SJWT=$(openssl rand -hex 64)
  NWK=$(openssl rand -hex 32)
  NAU="admin"
  NAH=$(python3 -c "import bcrypt; print(bcrypt.hashpw(b'AGAssociates2026!SecurePass', bcrypt.gensalt()).decode())")
  
  ssh -o StrictHostKeyChecking=no -i /tmp/vps-bootstrap-key deploy@"$VPS_IP" "cat > /srv/ag/.env << ENVEOF
DOMAIN=$DOMAIN
ACME_EMAIL=admin@$DOMAIN
POSTGRES_USER=agadmin
POSTGRES_PASSWORD=$PW1
POSTGRES_DB=agdb
REDIS_PASSWORD=$PW2
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL_NAME=llama-3.3-70b-versatile
LLM_API_KEY=$GROQ_API_KEY
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_JWT_SECRET=$SJWT
JWT_SECRET=$JWT
N8N_WEBHOOK_KEY=$NWK
N8N_BASIC_AUTH_USER=$NAU
N8N_BASIC_AUTH_PASSWORD_HASH=$NAH
TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN:-placeholder_replace_when_ready}
EMAIL_IMAP_HOST=${EMAIL_IMAP_HOST:-placeholder_replace_when_ready}
EMAIL_IMAP_PORT=993
EMAIL_IMAP_USER=${EMAIL_IMAP_USER:-placeholder_replace_when_ready}
EMAIL_IMAP_PASS=${EMAIL_IMAP_PASS:-placeholder_replace_when_ready}
EMAIL_POLL_INTERVAL=60
GOOGLE_GENERATIVE_AI_API_KEY=${GOOGLE_GENERATIVE_AI_API_KEY:-}
RESEND_API_KEY=${RESEND_API_KEY:-}
ENVIRONMENT=production
LLM_MOCK_MODE=false
IMAGE_TAG=latest
NESL_API_KEY=${NESL_API_KEY:-}
NESL_API_BASE_URL=https://api.nesl.co.in/v1
NESL_CLIENT_ID=${NESL_CLIENT_ID:-}
NESL_CLIENT_SECRET=${NESL_CLIENT_SECRET:-}
NESL_MOCK_DELAY_SEC=3
IGR_PORTAL_URL=https://igrmaharashtra.gov.in/efiling/
IGR_PORTAL_USERNAME=${IGR_PORTAL_USERNAME:-}
IGR_PORTAL_PASSWORD=${IGR_PORTAL_PASSWORD:-}
GRAS_PORTAL_URL=https://gras.mahakosh.gov.in/echallan/
ENVEOF
chmod 600 /srv/ag/.env" || die "Failed to write .env to VPS"
  
  ok "Production .env written to VPS"
}

# ── Command: Deploy ──────────────────────────────────────────────────────────
cmd_deploy() {
  log "=== DEPLOYING TO PRODUCTION ==="
  validate_deploy
  discover_vps
  
  # Push latest code to trigger GitHub Actions deploy
  log "Pushing to main to trigger GitHub Actions deploy..."
  git -C "$REPO_ROOT" push origin main || die "Git push failed"
  
  # Wait for workflow to start
  log "Waiting for GitHub Actions workflow to start..."
  sleep 10
  
  # Monitor deploy workflow
  local run_id=""
  for i in {1..30}; do
    run_id=$(github_api GET "/repos/$REPO_SLUG/actions/runs?event=push&branch=main&per_page=1" \
      | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['workflow_runs'][0]['id']) if d.get('workflow_runs') else print('')" 2>/dev/null || echo "")
    if [[ -n "$run_id" ]]; then
      break
    fi
    sleep 5
  done
  
  if [[ -z "$run_id" ]]; then
    warn "Could not detect workflow run. Check GitHub Actions manually."
    return 0
  fi
  
  log "Monitoring workflow run: $run_id"
  local status="in_progress"
  while [[ "$status" == "in_progress" || "$status" == "queued" || "$status" == "waiting" ]]; do
    sleep 30
    status=$(github_api GET "/repos/$REPO_SLUG/actions/runs/$run_id" \
      | python3 -c "import sys,json; print(json.load(sys.stdin).get('status', 'unknown'))" 2>/dev/null || echo "unknown")
    local conclusion=$(github_api GET "/repos/$REPO_SLUG/actions/runs/$run_id" \
      | python3 -c "import sys,json; print(json.load(sys.stdin).get('conclusion', 'unknown'))" 2>/dev/null || echo "unknown")
    log "Workflow status: $status / $conclusion"
    if [[ "$status" == "completed" ]]; then
      if [[ "$conclusion" == "success" ]]; then
        ok "Deploy workflow succeeded!"
      else
        err "Deploy workflow failed: $conclusion"
        return 1
      fi
      break
    fi
  done
}

# ── Command: Setup Runner ────────────────────────────────────────────────────
cmd_runner() {
  log "=== SETTING UP GITHUB ACTIONS RUNNER ==="
  validate_runner
  discover_vps
  
  ssh -o StrictHostKeyChecking=no -i /tmp/vps-bootstrap-key deploy@"$VPS_IP" \
    "bash /root/setup-runner.sh '$GH_PAT' deploy" || die "Runner setup failed"
  
  ok "GitHub Actions runner configured"
}

# ── Command: DNS ─────────────────────────────────────────────────────────────
cmd_dns() {
  log "=== CONFIGURING CLOUDFLARE DNS ==="
  [[ -z "$VPS_IP" ]] && discover_vps
  require_var "CLOUDFLARE_API_TOKEN"
  require_var "CLOUDFLARE_ZONE_ID"
  
  for sub in app dashboard api n8n docs intake; do
    NAME="${sub}.${DOMAIN}"
    log "  Configuring $NAME → $VPS_IP"
    EXISTING=$(cloudflare_api GET "/zones/$ZONE_ID/dns_records?name=$NAME&type=A")
    REC_ID=$(echo "$EXISTING" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result'][0]['id']) if d.get('result') else print('')")
    if [[ -n "$REC_ID" ]]; then
      cloudflare_api PATCH "/zones/$ZONE_ID/dns_records/$REC_ID" "{\"type\":\"A\",\"name\":\"$NAME\",\"content\":\"$VPS_IP\",\"ttl\":120,\"proxied\":false}" >/dev/null
    else
      cloudflare_api POST "/zones/$ZONE_ID/dns_records" "{\"type\":\"A\",\"name\":\"$NAME\",\"content\":\"$VPS_IP\",\"ttl\":120,\"proxied\":false}" >/dev/null
    fi
    ok "    $NAME configured"
  done
  
  # Also configure root domain
  log "  Configuring root $DOMAIN → $VPS_IP"
  EXISTING=$(cloudflare_api GET "/zones/$ZONE_ID/dns_records?name=$DOMAIN&type=A")
  REC_ID=$(echo "$EXISTING" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result'][0]['id']) if d.get('result') else print('')")
  if [[ -n "$REC_ID" ]]; then
    cloudflare_api PATCH "/zones/$ZONE_ID/dns_records/$REC_ID" "{\"type\":\"A\",\"name\":\"@\",\"content\":\"$VPS_IP\",\"ttl\":120,\"proxied\":false}" >/dev/null
  else
    cloudflare_api POST "/zones/$ZONE_ID/dns_records" "{\"type\":\"A\",\"name\":\"@\",\"content\":\"$VPS_IP\",\"ttl\":120,\"proxied\":false}" >/dev/null
  fi
  ok "DNS configuration complete"
}

# ── Command: Smoke Tests ─────────────────────────────────────────────────────
cmd_smoke() {
  log "=== RUNNING SMOKE TESTS ==="
  discover_vps
  
  local endpoints=(
    "https://api.$DOMAIN/health"
    "https://app.$DOMAIN/"
    "https://dashboard.$DOMAIN/"
    "https://intake.$DOMAIN/health"
    "https://n8n.$DOMAIN/healthz"
  )
  
  for url in "${endpoints[@]}"; do
    for i in {1..6}; do
      status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$url" 2>/dev/null || echo "000")
      if [[ "$status" == "200" ]]; then
        ok "  $url — HTTP $status"
        break
      fi
      warn "  $url — HTTP $status (retry $i/6)"
      sleep 15
    done
    if [[ "$status" != "200" ]]; then
      err "  $url — FAILED after 6 attempts (last: $status)"
    fi
  done
  
  # Aisha chat test
  log "  Testing Aisha chat endpoint..."
  AISHA=$(curl -s -X POST "https://api.$DOMAIN/api/aisha/chat" \
    -H "Content-Type: application/json" \
    -d '{"message":"hello","user_id":"smoke_test","chat_id":"smoke"}' 2>/dev/null || echo '{"response":"FAILED"}')
  ok "  Aisha response: $(echo "$AISHA" | python3 -c "import sys,json; print(json.load(sys.stdin).get('response','')[:80])" 2>/dev/null || echo "ERROR")"
}

# ── Command: Teardown ────────────────────────────────────────────────────────
cmd_teardown() {
  log "=== TEARING DOWN VPS ==="
  require_var "HETZNER_API_TOKEN"
  
  find_existing_vps || { warn "No VPS to tear down"; return 0; }
  
  read -p "This will DELETE the VPS at $VPS_IP. Type 'DELETE' to confirm: " confirm
  [[ "$confirm" == "DELETE" ]] || die "Aborted"
  
  # Get server ID
  local resp
  resp=$(hetzner_api GET "/servers")
  local server_id=$(echo "$resp" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for s in data.get('servers', []):
  if s.get('public_net',{}).get('ipv4',{}).get('ip') == '$VPS_IP':
    print(s['id'])
    break
")
  
  hetzner_api DELETE "/servers/$server_id" || die "Failed to delete server"
  ok "VPS deleted"
  
  # Remove DNS records
  for sub in app dashboard api n8n docs intake; do
    NAME="${sub}.${DOMAIN}"
    EXISTING=$(cloudflare_api GET "/zones/$ZONE_ID/dns_records?name=$NAME&type=A")
    REC_ID=$(echo "$EXISTING" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result'][0]['id']) if d.get('result') else print('')")
    if [[ -n "$REC_ID" ]]; then
      cloudflare_api DELETE "/zones/$ZONE_ID/dns_records/$REC_ID" >/dev/null
    fi
  done
  ok "DNS records cleaned up"
}

# ── Command: All (full pipeline) ─────────────────────────────────────────────
cmd_all() {
  log "=== FULL AUTOMATED DEPLOYMENT PIPELINE ==="
  load_env
  cmd_provision
  ok "=== DEPLOYMENT COMPLETE ==="
  echo ""
  echo "  Domain:       https://app.$DOMAIN"
  echo "  Dashboard:    https://dashboard.$DOMAIN"
  echo "  API:          https://api.$DOMAIN/health"
  echo "  n8n:          https://n8n.$DOMAIN"
  echo "  Intake API:   https://intake.$DOMAIN/health"
  echo "  VPS IP:       $VPS_IP"
  echo ""
  echo "  SSH:          ssh deploy@$VPS_IP"
  echo "  Logs:         docker logs -f ag_ai_backend (on VPS)"
  echo ""
}

# ── Main ─────────────────────────────────────────────────────────────────────
COMMAND="${1:-all}"

case "$COMMAND" in
  provision)  load_env; cmd_provision ;;
  deploy)     load_env; cmd_deploy ;;
  runner)     load_env; cmd_runner ;;
  dns)        load_env; cmd_dns ;;
  smoke)      load_env; cmd_smoke ;;
  write-env)  load_env; cmd_write_env ;;
  teardown)   load_env; cmd_teardown ;;
  all)        cmd_all ;;
  *)
    echo "Usage: $0 [provision|deploy|runner|dns|smoke|write-env|teardown|all]"
    exit 1
    ;;
esac
