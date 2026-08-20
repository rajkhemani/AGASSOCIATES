# AG Associates Operations Runbook

**Scope:** production VPS running `docker-compose.prod.yml`  
**Classification:** Internal — do not place credentials, tokens, or backup
passwords in this document.

## Health and readiness

Run from the deployment checkout on the VPS:

```bash
docker compose -p ag -f docker-compose.prod.yml --env-file /srv/ag/.env ps
/usr/local/sbin/ag-health-check
curl -fsS "https://api.${DOMAIN}/health"
curl -fsS "https://intake.${DOMAIN}/health"
```

The health monitor checks public endpoints, all `ag_` containers, Docker
health status, and internal-only coordinator, email-intake, and Telegram
health ports. A failed check exits non-zero and is logged to
`/var/log/ag-health.log`. It may restart a stopped container; investigate
logs before repeated restarts.

## Backup readiness

The nightly cron job runs `/usr/local/sbin/ag-backup` at 02:30 server time.
It requires `RESTIC_REPOSITORY` and either `RESTIC_PASSWORD` or
`BACKUP_ENCRYPTION_KEY` in the protected `/srv/ag/.env`. The repository must
be encrypted and preferably off-site. The script:

1. Dumps the AG PostgreSQL database.
2. Creates Redis and configured Docker-volume archives.
3. Applies 30 daily, 8 weekly, and 6 monthly retention.
4. Runs a Restic integrity check over a 5% data subset.

Check recent snapshots without printing secrets:

```bash
/usr/local/sbin/ag-restore --list
/usr/local/sbin/ag-restore --verify latest
```

If a configured volume is not present, the backup logs a `SKIP` entry. This
is expected during initial provisioning, but every skipped critical volume
must be resolved before production sign-off.

## Non-destructive restore drill

Restore into an empty review directory, never directly into a live volume:

```bash
install -d -m 0700 /srv/ag/restore-review
/usr/local/sbin/ag-restore --restore latest /srv/ag/restore-review
find /srv/ag/restore-review -maxdepth 3 -type f -print
```

Review the PostgreSQL dump and volume archives. Apply database or volume data
only during an approved maintenance window with a current rollback snapshot.
The restore helper deliberately does not overwrite live containers or volumes.

## Deployment validation

Before deploying a compose change:

```bash
docker compose -f docker-compose.prod.yml config --quiet
```

After deployment, wait for dependencies to become healthy and run the health
checks above. Keep the previous image tag available for rollback.

## Recovery objectives and dependencies

- Target RPO is one nightly snapshot; actual RPO depends on the last successful
  cron run and the configured provider.
- Target RTO is approximately one hour for a replacement VPS, subject to DNS,
  image pulls, restore time, and provider availability.
- Human/provider dependencies: VPS access and firewall/DNS control, Restic
  storage credentials and availability, Docker/GHCR access, Supabase backup
  access, and external LLM, Telegram, email, NeSL/IGR/GRAS providers.
- Supabase-hosted data and provider-side credentials are not created or
  restored by the local scripts; verify their own retention and recovery
  procedures separately.

Record each restore drill date, snapshot ID, elapsed time, and verification
result in the internal operations log. Never paste secret values into logs,
issues, or this repository.
