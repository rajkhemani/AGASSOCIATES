#!/usr/bin/env bash
# AG Associates — Restic restore helper
# Non-destructive by default: restores files into a separate target directory.

set -euo pipefail
umask 077

log() { printf '[ag-restore] %s\n' "$*"; }
die() { echo "FATAL: $*" >&2; exit 1; }
usage() {
  cat >&2 <<'EOF'
Usage:
  ag-restore --list
  ag-restore --verify SNAPSHOT
  ag-restore --restore SNAPSHOT TARGET_DIR

The restore mode writes only to TARGET_DIR. Review SQL and archives before
applying them to a live container or Docker volume.
EOF
  exit 2
}

ENV_FILE="${ENV_FILE:-/srv/ag/.env}"
[[ -f "$ENV_FILE" ]] || die "Environment file $ENV_FILE not found"
set -a
source "$ENV_FILE"
set +a

command -v restic >/dev/null 2>&1 || die "Required command not found: restic"
RESTIC_REPOSITORY="${RESTIC_REPOSITORY:-/srv/ag/backups/restic-repo}"
RESTIC_PASSWORD="${RESTIC_PASSWORD:-${BACKUP_ENCRYPTION_KEY:-}}"
[[ -n "$RESTIC_PASSWORD" ]] || die "RESTIC_PASSWORD or BACKUP_ENCRYPTION_KEY must be set"
export RESTIC_REPOSITORY RESTIC_PASSWORD

case "${1:-}" in
  --list)
    restic snapshots --repo "$RESTIC_REPOSITORY" --compact
    ;;
  --verify)
    [[ $# -eq 2 ]] || usage
    log "Listing snapshot $2 contents (no files changed)"
    restic ls --repo "$RESTIC_REPOSITORY" "$2" |
      grep -E 'postgres-|redis-|volumes-' >/dev/null ||
      die "Snapshot $2 does not contain expected AG backup artifacts"
    log "Snapshot $2 contains expected AG backup artifacts"
    ;;
  --restore)
    [[ $# -eq 3 ]] || usage
    snapshot="$2"
    target="$3"
    [[ "$target" != "/" ]] || die "Refusing to restore into /"
    mkdir -p "$target"
    [[ -z "$(find "$target" -mindepth 1 -maxdepth 1 -print -quit)" ]] ||
      die "Restore target must be empty: $target"
    log "Restoring snapshot $snapshot to $target"
    restic restore --repo "$RESTIC_REPOSITORY" "$snapshot" --target "$target"
    log "Review restored files under $target before applying any database or volume data"
    ;;
  *)
    usage
    ;;
esac
