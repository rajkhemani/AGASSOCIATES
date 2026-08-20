import { Pool, PoolClient } from 'pg';
import { createHash } from 'crypto';
import { readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

const MIGRATIONS_DIR = resolve(__dirname, '../../packages/db/migrations');

// Pool for migration runner (uses ag_owner credentials)
const getMigrationPool = (): Pool => {
  const connectionString =
    process.env.DATABASE_URL ||
    `postgres://${process.env.DB_MIGRATION_USER || 'ag_owner'}:${process.env.DB_MIGRATION_PASSWORD}@${process.env.DB_MIGRATION_HOST || 'localhost'}/${process.env.DB_MIGRATION_DATABASE || 'postgres'}`;

  const connect_ssl = process.env.DB_MIGRATION_SSL === "true" ? { rejectUnauthorized: false } : false;

  return new Pool({
    connectionString,
    ssl: connect_ssl,
  });
};

interface Migration {
  filename: string;
  checksum: string;
  content: string;
}

interface AppliedMigration {
  filename: string;
  checksum: string;
  applied_at: Date;
}

/**
 * Calculate SHA-256 checksum of migration content
 */
function calculateChecksum(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Discover and sort migration files from directory
 */
function discoverMigrations(): Migration[] {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql') && !f.startsWith('test_'))
    .sort(); // Lexicographic sort: 0001_*, 0002_*, etc.

  return files.map(filename => {
    const filepath = join(MIGRATIONS_DIR, filename);
    const content = readFileSync(filepath, 'utf-8');
    return {
      filename,
      checksum: calculateChecksum(content),
      content,
    };
  });
}

/**
 * Get already applied migrations from database
 */
async function getAppliedMigrations(client: PoolClient): Promise<Map<string, AppliedMigration>> {
  const result = await client.query<AppliedMigration>(
    'SELECT filename, checksum, applied_at FROM public.schema_migrations ORDER BY id'
  );
  const map = new Map<string, AppliedMigration>();
  for (const row of result.rows) {
    map.set(row.filename, row);
  }
  return map;
}

/**
 * Ensure schema_migrations table exists
 */
async function ensureSchemaMigrationsTable(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.schema_migrations (
      id BIGSERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_schema_migrations_filename ON public.schema_migrations(filename);
  `);
}

/**
 * Run a single migration transactionally where possible
 * Some statements (CREATE DATABASE, CREATE EXTENSION) cannot run in transactions
 * For those, we'll run them outside transaction but track separately
 */
async function runMigration(client: PoolClient, migration: Migration): Promise<void> {
  const statements = splitMigrationStatements(migration.content);
  
  for (const statement of statements) {
    const trimmed = statement.trim();
    if (!trimmed || trimmed.startsWith('--')) continue;
    
    try {
      await client.query(trimmed);
    } catch (error: any) {
      // Some statements can't run in transaction (CREATE EXTENSION, etc.)
      // Check if it's a "cannot run inside a transaction block" error
      if (error.code === '0A000' || error.message.includes('transaction block')) {
        // For these, we'd need a separate connection without transaction
        // For now, we'll throw - these should be handled specially
        throw new Error(`Migration ${migration.filename} contains non-transactional statement: ${trimmed.substring(0, 100)}...`);
      }
      throw error;
    }
  }
}

/**
 * Split migration content into individual statements
 * Handles dollar-quoted strings and semicolons properly
 */
function splitMigrationStatements(content: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1] || '';
    
    // Handle dollar quoting ($tag$ ... $tag$)
    if (!inSingleQuote && !inDoubleQuote && char === '$' && nextChar && /[a-zA-Z0-9_]/.test(nextChar)) {
      // Check if this is start or end of dollar quote
      let tag = '$';
      let j = i + 1;
      while (j < content.length && /[a-zA-Z0-9_]/.test(content[j])) {
        tag += content[j];
        j++;
      }
      if (j < content.length && content[j] === '$') {
        tag += '$';
        if (!inDollarQuote) {
          inDollarQuote = true;
          dollarTag = tag;
          current += tag;
          i = j;
          continue;
        } else if (tag === dollarTag) {
          inDollarQuote = false;
          dollarTag = '';
          current += tag;
          i = j;
          continue;
        }
      }
    }
    
    // Handle single quotes
    if (!inDollarQuote && !inDoubleQuote && char === "'" && nextChar !== "'") {
      inSingleQuote = !inSingleQuote;
    } else if (!inDollarQuote && !inDoubleQuote && char === "'" && nextChar === "'") {
      // Escaped single quote
      current += "''";
      i++;
      continue;
    }
    
    // Handle double quotes
    if (!inDollarQuote && !inSingleQuote && char === '"') {
      inDoubleQuote = !inDoubleQuote;
    }
    
    current += char;
    
    // Split on semicolon when not in any quote
    if (char === ';' && !inDollarQuote && !inSingleQuote && !inDoubleQuote) {
      statements.push(current);
      current = '';
    }
  }
  
  // Add remaining
  if (current.trim()) {
    statements.push(current);
  }
  
  return statements.filter(s => s.trim() && !s.trim().startsWith('--'));
}

/**
 * Record migration as applied
 */
async function recordMigration(client: PoolClient, migration: Migration): Promise<void> {
  await client.query(
    'INSERT INTO public.schema_migrations (filename, checksum) VALUES ($1, $2)',
    [migration.filename, migration.checksum]
  );
}

/**
 * Main migration runner
 */
export async function runMigrations(): Promise<void> {
  const pool = getMigrationPool();
  const client = await pool.connect();
  
  try {
    console.log('🔍 Discovering migrations...');
    const migrations = discoverMigrations();
    console.log(`Found ${migrations.length} migration(s)`);
    
    await client.query('BEGIN');
    await ensureSchemaMigrationsTable(client);
    
    const applied = await getAppliedMigrations(client);
    console.log(`Found ${applied.size} already-applied migration(s)`);
    
    let appliedCount = 0;
    let skippedCount = 0;
    
    for (const migration of migrations) {
      const existing = applied.get(migration.filename);
      
      if (existing) {
        if (existing.checksum === migration.checksum) {
          console.log(`⏭️  Skipping ${migration.filename} (already applied, checksum matches)`);
          skippedCount++;
          continue;
        } else {
          // HARD FAIL: checksum mismatch
          await client.query('ROLLBACK');
          console.error(`❌ CHECKSUM MISMATCH: ${migration.filename}`);
          console.error(`   Expected: ${existing.checksum}`);
          console.error(`   Got:      ${migration.checksum}`);
          console.error(`   Applied at: ${existing.applied_at.toISOString()}`);
          throw new Error(
            `Migration ${migration.filename} has been modified after being applied. ` +
            `This is not allowed. Restore the original file or create a new migration.`
          );
        }
      }
      
      // New migration - execute it
      console.log(`▶️  Applying ${migration.filename}...`);
      
      try {
        // Try to run transactionally
        await client.query('SAVEPOINT migration_start');
        await runMigration(client, migration);
        await client.query('RELEASE SAVEPOINT migration_start');
        await recordMigration(client, migration);
        console.log(`✅ Applied ${migration.filename}`);
        appliedCount++;
      } catch (error: any) {
        await client.query('ROLLBACK TO SAVEPOINT migration_start');
        
        // If it failed due to non-transactional statement, we could retry without transaction
        // For now, fail hard
        await client.query('ROLLBACK');
        throw new Error(`Failed to apply migration ${migration.filename}: ${error.message}`);
      }
    }
    
    await client.query('COMMIT');
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`   Applied: ${appliedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total:   ${migrations.length}`);
    
    if (appliedCount === 0 && skippedCount === migrations.length) {
      console.log('✨ Database is up to date!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

/**
 * Verify migration integrity (check all applied migrations match their files)
 */
export async function verifyMigrations(): Promise<void> {
  const pool = getMigrationPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    await ensureSchemaMigrationsTable(client);
    
    const migrations = discoverMigrations();
    const applied = await getAppliedMigrations(client);
    
    let ok = true;
    
    for (const migration of migrations) {
      const existing = applied.get(migration.filename);
      if (!existing) {
        console.log(`⚠️  Not applied: ${migration.filename}`);
        ok = false;
      } else if (existing.checksum !== migration.checksum) {
        console.log(`❌ MISMATCH: ${migration.filename}`);
        console.log(`   DB:    ${existing.checksum}`);
        console.log(`   File:  ${migration.checksum}`);
        ok = false;
      } else {
        console.log(`✅ OK: ${migration.filename}`);
      }
    }
    
    await client.query('COMMIT');
    
    if (!ok) {
      throw new Error('Migration verification failed');
    }
    console.log('✅ All migrations verified');
    
  } finally {
    client.release();
    await pool.end();
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<{ filename: string; status: 'pending' | 'applied' | 'mismatch'; applied_at?: Date }[]> {
  const pool = getMigrationPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    await ensureSchemaMigrationsTable(client);
    
    const migrations = discoverMigrations();
    const applied = await getAppliedMigrations(client);
    
    const status = migrations.map(m => {
      const existing = applied.get(m.filename);
      if (!existing) return { filename: m.filename, status: 'pending' as const };
      if (existing.checksum !== m.checksum) return { filename: m.filename, status: 'mismatch' as const, applied_at: existing.applied_at };
      return { filename: m.filename, status: 'applied' as const, applied_at: existing.applied_at };
    });
    
    await client.query('COMMIT');
    return status;
    
  } finally {
    client.release();
    await pool.end();
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('migrationRunner.ts')) {
  const command = process.argv[2] || 'run';
  
  switch (command) {
    case 'run':
      runMigrations().catch(e => { console.error(e); process.exit(1); });
      break;
    case 'verify':
      verifyMigrations().catch(e => { console.error(e); process.exit(1); });
      break;
    case 'status':
      getMigrationStatus().then(s => {
        console.table(s);
      }).catch(e => { console.error(e); process.exit(1); });
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Usage: migrationRunner.ts [run|verify|status]');
      process.exit(1);
  }
}

export { discoverMigrations, calculateChecksum, splitMigrationStatements, Migration, AppliedMigration };