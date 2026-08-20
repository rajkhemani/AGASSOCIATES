#!/usr/bin/env bash
# Production Health Monitor — Checks all services, logs failures, sends alerts

set -euo pipefail

ENV_FILE="/srv/ag/.env"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

DOMAIN="${DOMAIN:-advadiityagade.com}"
LOG_FILE="/var/log/ag-health.log"
ALERT_WEBHOOK="${HEALTH_ALERT_WEBHOOK:-}"

SERVICES=(
  "API Health|https://api.$DOMAIN/health|200"
  "Aisha Chat|https://api.$DOMAIN/api/aisha/chat|200"
  "Frontend App|https://app.$DOMAIN/|200"
  "Dashboard|https://dashboard.$DOMAIN/|200"
  "Intake API|https://intake.$DOMAIN/health|200"
  "n8n|https://n8n.$DOMAIN/healthz|200"
  "Clerk Docs|https://docs.$DOMAIN/|200"
)
EXPECTED_CONTAINERS=(
  ag_caddy ag_postgres ag_redis ag_ai_backend ag_ai_dashboard ag_platform
  ag_n8n ag_intake_api ag_telegram_bot ag_email_intake ag_coordinator
)

log() { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }
alert() {
  local msg="$1"
  log "ALERT: $msg"
  if [[ -n "$ALERT_WEBHOOK" ]]; then
    curl -sf -X POST "$ALERT_WEBHOOK" -H "Content-Type: application/json" -d "{\"text\":\"$msg\"}" >/dev/null 2>&1 || true
  fi
}

check_http() {
  local name="$1"
  local url="$2"
  local expected="$3"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
  if [[ "$status" == "$expected" ]]; then
    log "OK    $name ($url) — HTTP $status"
    return 0
  else
    log "FAIL  $name ($url) — HTTP $status (expected $expected)"
    echo "[$(date)] FAIL $name $url — HTTP $status" >> "$LOG_FILE"
    alert "🔴 $name DOWN: $url returned $status"
    return 1
  fi
}

check_docker() {
  local failed=0
  log "Checking Docker containers..."
  for name in "${EXPECTED_CONTAINERS[@]}"; do
    local status
    status=$(docker inspect --format='{{.State.Status}}' "$name" 2>/dev/null || echo "missing")
    if [[ "$status" != "running" ]]; then
      log "FAIL  Container $name — $status"
      echo "[$(date)] FAIL container $name — $status" >> "$LOG_FILE"
      alert "Container $name DOWN: $status"
      log "Attempting restart of $name..."
      docker restart "$name" >/dev/null 2>&1 && log "Restarted $name" || log "Failed to restart $name"
      failed=1
      continue
    fi
    health=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$name" 2>/dev/null || echo "missing")
    if [[ "$health" == "unhealthy" ]]; then
      log "FAIL  Container $name — Docker health is unhealthy"
      echo "[$(date)] FAIL container $name — Docker health is unhealthy" >> "$LOG_FILE"
      alert "Container $name health check is unhealthy"
      failed=1
    else
      log "OK    Container $name — running (health: $health)"
    fi
  done
  return $failed
}

# Check internal-only containers via Docker exec (no public endpoint)
check_container_health() {
  local name="$1"
  local port="$2"
  local path="/health"

  # Only check if container is running
  local status
  status=$(docker inspect --format='{{.State.Status}}' "$name" 2>/dev/null || echo "missing")
  if [[ "$status" != "running" ]]; then
    log "SKIP  $name — container not running ($status)"
    return 1
  fi

  local http_code
  http_code=$(docker exec "$name" wget -qO- --timeout=5 "http://127.0.0.1:${port}${path}" -S /dev/null 2>&1 | grep -oP 'HTTP/[\d.]+ \K\d+' || echo "000")
  # Fallback: try node fetch for Node containers
  if [[ "$http_code" == "000" ]]; then
    http_code=$(docker exec "$name" node -e "fetch('http://127.0.0.1:${port}${path}').then(r=>{console.log(r.status)}).catch(()=>{console.log('000')})" 2>/dev/null | tail -1 || echo "000")
  fi

  if [[ "$http_code" == "200" ]]; then
    log "OK    $name (internal :${port}${path}) — HTTP $http_code"
    return 0
  else
    log "FAIL  $name (internal :${port}${path}) — HTTP $http_code"
    echo "[$(date)] FAIL $name internal health — HTTP $http_code" >> "$LOG_FILE"
    alert "🔴 $name INTERNAL HEALTH FAIL: port ${port} returned $http_code"
    return 1
  fi
}

# Main check loop
log "=== Health Check Started ==="
FAILED=0

for entry in "${SERVICES[@]}"; do
  IFS='|' read -r name url expected <<< "$entry"
  check_http "$name" "$url" "$expected" || FAILED=1
done

check_docker || FAILED=1

# Internal-only container health checks (no Caddy/public endpoint)
check_container_health ag_coordinator 3005 || FAILED=1
check_container_health ag_email_intake 3004 || FAILED=1
check_container_health ag_telegram_bot 3004 || FAILED=1

if [[ $FAILED -eq 0 ]]; then
  log "=== All checks passed ==="
else
  log "=== Some checks FAILED ==="
  exit 1
fi
