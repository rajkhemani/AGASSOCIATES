#!/usr/bin/env bash
# AG Associates — Nightly Backup Script
# Backs up PostgreSQL, Redis, and application data to Restic repository
# Run via cron: 30 2 * * * deploy /usr/local/sbin/ag-backup

set -euo pipefail

log() { printf '[ag-backup] %s\n' "$*"; }
die() { echo "FATAL: $*" >&2; exit 1; }

# Load environment
ENV_FILE="/srv/ag/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  die "Environment file $ENV_FILE not found"
fi
set -a
source "$ENV_FILE"
set +a

# Configuration
BACKUP_DIR="/srv/ag/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=30

# Restic config
RESTIC_REPOSITORY="${RESTIC_REPOSITORY:-/srv/ag/backups/restic-repo}"
RESTIC_PASSWORD="${RESTIC_PASSWORD:-$(grep -E '^BACKUP_ENCRYPTION_KEY=' "$ENV_FILE" | cut -d= -f2)}"

mkdir -p "$BACKUP_DIR"

# Initialize restic repo if needed
if [[ ! -d "$RESTIC_REPOSITORY" ]]; then
  log "Initializing restic repository at $RESTIC_REPOSITORY"
  export RESTIC_PASSWORD
  restic init --repo "$RESTIC_REPOSITORY" || die "Failed to initialize restic repo"
fi

# Backup PostgreSQL
log "Backing up PostgreSQL..."
docker exec ag_postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  | restic backup --repo "$RESTIC_REPOSITORY" --tag "postgres" --tag "$TIMESTAMP" --stdin --stdin-filename "postgres-$TIMESTAMP.sql" || die "PostgreSQL backup failed"

# Backup Redis
log "Backing up Redis..."
docker exec ag_redis redis-cli -a "$REDIS_PASSWORD" --rdb /tmp/dump.rdb
docker cp ag_redis:/tmp/dump.rdb "$BACKUP_DIR/redis-$TIMESTAMP.rdb"
restic backup --repo "$RESTIC_REPOSITORY" --tag "redis" --tag "$TIMESTAMP" "$BACKUP_DIR/redis-$TIMESTAMP.rdb" || die "Redis backup failed"
rm -f "$BACKUP_DIR/redis-$TIMESTAMP.rdb"

# Backup Application Data (output, documents)
log "Backing up application volumes..."
restic backup --repo "$RESTIC_REPOSITORY" --tag "app-data" --tag "$TIMESTAMP" \
  /srv/ag/ag_output /srv/ag/ag_documents /srv/ag/repo/output 2>/dev/null || true

# Clean old backups
log "Applying retention policy (keep daily for $RETENTION_DAYS days)..."
export RESTIC_PASSWORD
restic forget --repo "$RESTIC_REPOSITORY" \
  --keep-daily "$RETENTION_DAYS" \
  --keep-weekly 8 \
  --keep-monthly 6 \
  --prune || die "Retention cleanup failed"

# Verify backup
log "Verifying last backup..."
restic check --repo "$RESTIC_REPOSITORY" --read-data-subset=5% || die "Backup verification failed"

log "Backup completed successfully"

# Log summary
echo "=== Backup Summary $TIMESTAMP ===" >> /var/log/ag-backup.log
restic snapshots --repo "$RESTIC_REPOSITORY" --last 5 --compact >> /var/log/ag-backup.log 2>&1
echo "" >> /var/log/ag-backup.log
