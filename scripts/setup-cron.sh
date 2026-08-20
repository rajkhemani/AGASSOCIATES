#!/usr/bin/env bash
# Setup cron jobs for production VPS
# Run as deploy user on VPS after deployment

set -euo pipefail

log() { printf '[setup-cron] %s\n' "$*"; }

CRON_FILE="/etc/cron.d/ag-associates"

log "Installing cron jobs to $CRON_FILE"

cat > "$CRON_FILE" << CRONEOF
# AG Associates — Production Cron Jobs
# Runs as deploy user

SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# Nightly backup at 2:30 AM
30 2 * * * deploy /usr/local/sbin/ag-backup >> /var/log/ag-backup.log 2>&1

# Health check every 5 minutes
*/5 * * * * deploy /usr/local/sbin/ag-health-check >> /var/log/ag-health.log 2>&1

# Weekly Docker image cleanup (Sunday 3 AM)
0 3 * * 0 deploy docker image prune -af --filter "until=168h" >> /var/log/ag-docker-cleanup.log 2>&1

# Daily log rotation (handled by logrotate, but ensure it runs)
0 4 * * * deploy /usr/sbin/logrotate -f /etc/logrotate.d/ag-associates >> /var/log/ag-logrotate.log 2>&1

# Certificate renewal check (Caddy handles this automatically, but monitor)
0 6 * * * deploy curl -sf https://api.advadiityagade.com/health >/dev/null || echo "Health check failed at \$(date)" >> /var/log/ag-cert-check.log 2>&1

CRONEOF

chmod 644 "$CRON_FILE"
log "Cron jobs installed"

# Install logrotate config
LOGROTATE_FILE="/etc/logrotate.d/ag-associates"
cat > "$LOGROTATE_FILE" << 'LOGEOF'
/var/log/ag-*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 deploy deploy
    sharedscripts
    postrotate
        systemctl reload cron >/dev/null 2>&1 || true
    endscript
}

/var/log/ag-backup.log {
    daily
    missingok
    rotate 90
    compress
    delaycompress
    notifempty
    create 644 deploy deploy
}

/var/log/ag-health.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 deploy deploy
}
LOGEOF

log "Logrotate config installed at $LOGROTATE_FILE"

# Copy scripts to system paths
install -m 0755 /srv/ag/repo/scripts/backup.sh /usr/local/sbin/ag-backup
install -m 0755 /srv/ag/repo/scripts/health-check.sh /usr/local/sbin/ag-health-check
install -m 0755 /srv/ag/repo/scripts/restore.sh /usr/local/sbin/ag-restore

log "Scripts installed to /usr/local/sbin/"
log "Done. Verify with: crontab -l (as deploy) or cat /etc/cron.d/ag-associates"
