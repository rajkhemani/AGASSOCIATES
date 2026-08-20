#!/usr/bin/env node
/**
 * Migration Job Script
 * 
 * This script runs database migrations using the ag_owner role.
 * It is designed to be run as a separate CI/CD step BEFORE application deployment.
 * 
 * Usage:
 *   npx tsx scripts/run-migrations.ts
 *   # or compiled:
 *   node dist/scripts/run-migrations.js
 * 
 * Environment Variables Required:
 *   DB_MIGRATION_USER=ag_owner
 *   DB_MIGRATION_PASSWORD=<from secrets manager>
 *   DB_MIGRATION_HOST=<database-host>
 *   DB_MIGRATION_DATABASE=<database-name>
 *   DB_MIGRATION_SSL=true
 * 
 * Exit Codes:
 *   0 - Success (all migrations applied or already up to date)
 *   1 - Migration failed (checksum mismatch, execution error, etc.)
 *   2 - Configuration error (missing env vars)
 */

import { runMigrations, verifyMigrations, getMigrationStatus } from '../src/server/migrationRunner.js';
import { Pool } from 'pg';

// Validate required environment variables
const requiredEnvVars = [
  'DB_MIGRATION_USER',
  'DB_MIGRATION_PASSWORD',
  'DB_MIGRATION_HOST',
  'DB_MIGRATION_DATABASE',
];

function validateConfig(): void {
  const missing = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    for (const v of missing) {
      console.error(`   ${v}`);
    }
    console.error('\nSet these in your CI/CD secrets or .env file');
    process.exit(2);
  }
  
  // Verify we're using ag_owner (not ag_app)
  if (process.env.DB_MIGRATION_USER !== 'ag_owner') {
    console.warn('⚠️  Warning: DB_MIGRATION_USER is not "ag_owner"');
    console.warn('   Migration job should use ag_owner role for schema changes');
  }
}

async function main(): Promise<void> {
  const command = process.argv[2] || 'run';
  
  console.log('🔧 Luxor9 Legal OS - Migration Job');
  console.log('=====================================');
  console.log(`Command: ${command}`);
  console.log(`User: ${process.env.DB_MIGRATION_USER}`);
  console.log(`Host: ${process.env.DB_MIGRATION_HOST}`);
  console.log(`Database: ${process.env.DB_MIGRATION_DATABASE}`);
  console.log('');
  
  validateConfig();
  
  try {
    switch (command) {
      case 'run': {
        console.log('▶️  Running migrations...\n');
        await runMigrations();
        console.log('\n✅ Migration job completed successfully');
        process.exit(0);
        break;
      }
      
      case 'verify': {
        console.log('🔍 Verifying migrations...\n');
        await verifyMigrations();
        console.log('\n✅ All migrations verified');
        process.exit(0);
        break;
      }
      
      case 'status': {
        console.log('📋 Checking migration status...\n');
        const status = await getMigrationStatus();
        
        console.table(status.map(s => ({
          Filename: s.filename,
          Status: s.status.toUpperCase(),
          'Applied At': s.applied_at?.toISOString() || 'N/A',
        })));
        
        const pending = status.filter(s => s.status === 'pending').length;
        const mismatch = status.filter(s => s.status === 'mismatch').length;
        
        if (mismatch > 0) {
          console.error(`\n❌ ${mismatch} migration(s) have checksum mismatch!`);
          process.exit(1);
        }
        
        if (pending > 0) {
          console.log(`\n⏳ ${pending} migration(s) pending`);
        } else {
          console.log('\n✨ All migrations applied');
        }
        
        process.exit(0);
        break;
      }
      
      default: {
        console.error(`Unknown command: ${command}`);
        console.error('Usage: run-migrations.ts [run|verify|status]');
        process.exit(2);
      }
    }
  } catch (error: any) {
    console.error('\n❌ Migration job failed:', error.message);
    process.exit(1);
  }
}

main();