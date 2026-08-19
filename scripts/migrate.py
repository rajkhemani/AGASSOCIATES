#!/usr/bin/env python3
"""
Unified migration runner for AGASSOCIATES.
Runs all database migrations in order with tracking.
"""

import asyncio
import asyncpg
import os
import sys
from pathlib import Path
from typing import List, Tuple
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

# Migration files in order
MIGRATION_FILES = [
    # ag-associates-ai migrations
    ("ag-associates-ai", "ag-associates-ai/database/init.sql"),
    ("ag-associates-ai", "ag-associates-ai/database/agent_migrations.sql"),
    
    # ag-platform migrations
    ("ag-platform", "ag-platform/src/server/migrations.sql"),
]

MIGRATION_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    service VARCHAR(100) NOT NULL,
    filename VARCHAR(255) NOT NULL UNIQUE,
    checksum VARCHAR(64) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
"""

async def get_db_connection() -> asyncpg.Connection:
    """Create database connection."""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL environment variable not set")
    
    # Convert SQLAlchemy URL to asyncpg format if needed
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql://", 1)
    
    return await asyncpg.connect(db_url)

async def ensure_migration_table(conn: asyncpg.Connection):
    """Create migration tracking table if not exists."""
    await conn.execute(MIGRATION_TABLE_SQL)

async def get_applied_migrations(conn: asyncpg.Connection) -> set:
    """Get set of already applied migration filenames."""
    rows = await conn.fetch("SELECT filename FROM schema_migrations")
    return {row["filename"] for row in rows}

def compute_checksum(filepath: Path) -> str:
    """Compute SHA256 checksum of file."""
    import hashlib
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hasher.update(chunk)
    return hasher.hexdigest()

async def apply_migration(conn: asyncpg.Connection, service: str, filepath: Path) -> bool:
    """Apply a single migration file."""
    filename = f"{service}/{filepath.name}"
    checksum = compute_checksum(filepath)
    
    logger.info(f"Applying migration: {filename}")
    
    try:
        # Read SQL file
        sql = filepath.read_text(encoding="utf-8")
        
        # Execute in transaction
        async with conn.transaction():
            await conn.execute(sql)
            
            # Record migration
            await conn.execute(
                """
                INSERT INTO schema_migrations (service, filename, checksum)
                VALUES ($1, $2, $3)
                ON CONFLICT (filename) DO UPDATE SET
                    checksum = EXCLUDED.checksum,
                    applied_at = NOW()
                """,
                service, filename, checksum
            )
        
        logger.info(f"✓ Applied: {filename}")
        return True
        
    except Exception as e:
        logger.error(f"✗ Failed to apply {filename}: {e}")
        return False

async def run_migrations():
    """Run all pending migrations."""
    logger.info("Starting migration process...")
    
    conn = await get_db_connection()
    
    try:
        await ensure_migration_table(conn)
        applied = await get_applied_migrations(conn)
        
        logger.info(f"Already applied migrations: {len(applied)}")
        
        success_count = 0
        failed_count = 0
        
        for service, rel_path in MIGRATION_FILES:
            filepath = Path(rel_path)
            
            if not filepath.exists():
                logger.warning(f"Migration file not found: {filepath}")
                continue
            
            filename = f"{service}/{filepath.name}"
            
            if filename in applied:
                logger.info(f"⊘ Skipping (already applied): {filename}")
                continue
            
            success = await apply_migration(conn, service, filepath)
            if success:
                success_count += 1
            else:
                failed_count += 1
        
        logger.info(f"\nMigration complete: {success_count} applied, {failed_count} failed")
        
        if failed_count > 0:
            sys.exit(1)
            
    finally:
        await conn.close()

async def rollback_migration(service: str, filename: str):
    """Rollback a specific migration (manual intervention required)."""
    logger.warning(f"Rollback requested for {service}/{filename}")
    logger.warning("Manual rollback required - implement down migration in SQL")
    # This would require down migrations to be defined
    # For now, just mark as rolled back in tracking table
    
    conn = await get_db_connection()
    try:
        await conn.execute(
            "DELETE FROM schema_migrations WHERE service = $1 AND filename = $2",
            service, filename
        )
        logger.info(f"Removed migration record: {service}/{filename}")
    finally:
        await conn.close()

async def status():
    """Show migration status."""
    conn = await get_db_connection()
    try:
        await ensure_migration_table(conn)
        rows = await conn.fetch("""
            SELECT service, filename, checksum, applied_at 
            FROM schema_migrations 
            ORDER BY applied_at
        """)
        
        print("\n=== Migration Status ===")
        for row in rows:
            print(f"  ✓ {row['service']}/{row['filename']} (applied: {row['applied_at']})")
        
        # Show pending
        applied = {f"{r['service']}/{r['filename']}" for r in rows}
        all_migrations = {f"{s}/{Path(p).name}" for s, p in MIGRATION_FILES}
        pending = all_migrations - applied
        
        if pending:
            print("\n  Pending:")
            for p in sorted(pending):
                print(f"  ○ {p}")
        else:
            print("\n  All migrations applied!")
            
    finally:
        await conn.close()

def main():
    if len(sys.argv) < 2:
        print("Usage: python migrate.py [run|status|rollback <service/filename>]")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "run":
        asyncio.run(run_migrations())
    elif command == "status":
        asyncio.run(status())
    elif command == "rollback" and len(sys.argv) == 3:
        service, filename = sys.argv[2].split("/", 1)
        asyncio.run(rollback_migration(service, filename))
    else:
        print("Unknown command")
        sys.exit(1)

if __name__ == "__main__":
    main()