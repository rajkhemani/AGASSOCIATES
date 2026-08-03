#!/usr/bin/env bash
# Production Health Monitor — Checks all services, logs failures, sends alerts

set -euo pipefail

ENV_FILE="/srv/ag/.env"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

DOMAIN="${DOMAIN:-advaiityagade.com}"
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
  docker ps --filter name=ag_ --format '{{.Names}} {{.Status}}' | while read -r name status; do
    if [[ ! "$status" =~ ^Up ]]; then
      log "FAIL  Container $name — $status"
      echo "[$(date)] FAIL container $name — $status" >> "$LOG_FILE"
      alert "🔴 Container $name DOWN: $status"
      failed=1
    else
      log "OK    Container $name — $status"
    fi
  done
  return $failed
}

# Main check loop
log "=== Health Check Started ==="
FAILED=0

for entry in "${SERVICES[@]}"; do
  IFS='|' read -r name url expected <<< "$entry"
  check_http "$name" "$url" "$expected" || FAILED=1
done

check_docker || FAILED=1

if [[ $FAILED -eq 0 ]]; then
  log "=== All checks passed ==="
else
  log "=== Some checks FAILED ==="
  exit 1
fi
