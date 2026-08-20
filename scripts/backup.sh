#!/usr/bin/env bash
# AG Associates — Nightly Backup Script
# Backs up PostgreSQL, Redis, and application data to Restic repository
# Run via cron: 30 2 * * * deploy /usr/local/sbin/ag-backup

set -euo pipefail
umask 077

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

for command in docker restic; do
  command -v "$command" >/dev/null 2>&1 || die "Required command not found: $command"
done

# Configuration
BACKUP_DIR="/srv/ag/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=30

# Restic config
RESTIC_REPOSITORY="${RESTIC_REPOSITORY:-/srv/ag/backups/restic-repo}"
RESTIC_PASSWORD="${RESTIC_PASSWORD:-${BACKUP_ENCRYPTION_KEY:-}}"
[[ -n "$RESTIC_PASSWORD" ]] || die "RESTIC_PASSWORD or BACKUP_ENCRYPTION_KEY must be set"
export RESTIC_REPOSITORY RESTIC_PASSWORD

mkdir -p "$BACKUP_DIR"

# Initialize restic repo if needed
if [[ ! -d "$RESTIC_REPOSITORY" ]]; then
  log "Initializing restic repository at $RESTIC_REPOSITORY"
  restic init --repo "$RESTIC_REPOSITORY" || die "Failed to initialize restic repo"
fi

# Backup PostgreSQL
log "Backing up PostgreSQL..."
docker exec ag_postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  | restic backup --repo "$RESTIC_REPOSITORY" --tag "postgres" --tag "$TIMESTAMP" --stdin --stdin-filename "postgres-$TIMESTAMP.sql" || die "PostgreSQL backup failed"

# Backup Redis
log "Backing up Redis..."
REDIS_DUMP_PATH="/data/ag-backup-$TIMESTAMP.rdb"
docker exec ag_redis redis-cli --no-auth-warning -a "$REDIS_PASSWORD" --rdb "$REDIS_DUMP_PATH"
docker cp "ag_redis:$REDIS_DUMP_PATH" "$BACKUP_DIR/redis-$TIMESTAMP.rdb"
restic backup --repo "$RESTIC_REPOSITORY" --tag "redis" --tag "$TIMESTAMP" "$BACKUP_DIR/redis-$TIMESTAMP.rdb" || die "Redis backup failed"
rm -f "$BACKUP_DIR/redis-$TIMESTAMP.rdb"
docker exec ag_redis rm -f "$REDIS_DUMP_PATH" >/dev/null 2>&1 || true

# Backup Application Data (output, documents)
log "Backing up application volumes..."
VOLUME_ARCHIVE_DIR="$BACKUP_DIR/volumes-$TIMESTAMP"
mkdir -p "$VOLUME_ARCHIVE_DIR"
cleanup() { rm -rf "$VOLUME_ARCHIVE_DIR"; }
trap cleanup EXIT

IFS=' ' read -r -a BACKUP_VOLUMES <<< "${BACKUP_VOLUMES:-ag_ag_output ag_ag_documents ag_n8n_data ag_caddy_data ag_caddy_config}"
for volume in "${BACKUP_VOLUMES[@]}"; do
  if ! docker volume inspect "$volume" >/dev/null 2>&1; then
    log "SKIP volume $volume (not present)"
    continue
  fi
  log "Backing up Docker volume $volume..."
  docker run --rm -v "$volume:/source:ro" -v "$VOLUME_ARCHIVE_DIR:/backup" alpine \
    tar czf "/backup/$volume.tar.gz" -C /source . ||
    die "Docker volume backup failed: $volume"
done
if compgen -G "$VOLUME_ARCHIVE_DIR/*.tar.gz" >/dev/null; then
  restic backup --repo "$RESTIC_REPOSITORY" --tag "app-data" --tag "$TIMESTAMP" \
    "$VOLUME_ARCHIVE_DIR" || die "Application volume backup failed"
else
  log "No application volumes found; continuing with database backups"
fi

# Clean old backups
log "Applying retention policy (keep daily for $RETENTION_DAYS days)..."
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
