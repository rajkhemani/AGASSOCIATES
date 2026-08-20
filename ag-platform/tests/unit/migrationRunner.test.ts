import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Pool, PoolClient } from 'pg';
import { 
  calculateChecksum, 
  discoverMigrations, 
  splitMigrationStatements,
  runMigrations,
  verifyMigrations,
  getMigrationStatus,
  Migration 
} from '../../src/server/migrationRunner.js';

// Re-export for testing
export { splitMigrationStatements };

// Mock pool
const mockClientQuery = vi.fn();
const mockClientRelease = vi.fn();
const mockPoolConnect = vi.fn();
const mockPoolEnd = vi.fn();
let mockPool: any;

vi.mock('pg', () => ({
  Pool: vi.fn().mockImplementation(() => mockPool),
}));

describe('migrationRunner', () => {
  beforeEach(() => {
    mockClientQuery.mockReset();
    mockClientRelease.mockReset();
    mockPoolConnect.mockReset();
    mockPoolEnd.mockReset();
    
    mockPool = {
      connect: mockPoolConnect,
      end: mockPoolEnd,
    };
    
    mockPoolConnect.mockResolvedValue({
      query: mockClientQuery,
      release: mockClientRelease,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateChecksum', () => {
    it('calculates SHA-256 checksum consistently', () => {
      const content = 'CREATE TABLE test (id INT);';
      const checksum1 = calculateChecksum(content);
      const checksum2 = calculateChecksum(content);
      
      expect(checksum1).toBe(checksum2);
      expect(checksum1).toHaveLength(64); // SHA-256 hex length
    });

    it('produces different checksums for different content', () => {
      const checksum1 = calculateChecksum('CREATE TABLE a (id INT);');
      const checksum2 = calculateChecksum('CREATE TABLE b (id INT);');
      
      expect(checksum1).not.toBe(checksum2);
    });

    it('handles empty content', () => {
      const checksum = calculateChecksum('');
      expect(checksum).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });
  });

  describe('splitMigrationStatements', () => {
    it('splits simple statements', () => {
      const content = 'CREATE TABLE a (id INT); CREATE TABLE b (id INT);';
      const statements = splitMigrationStatements(content);
      
      expect(statements).toHaveLength(2);
      expect(statements[0]).toContain('CREATE TABLE a');
      expect(statements[1]).toContain('CREATE TABLE b');
    });

    it('handles dollar-quoted strings', () => {
      const content = `
        CREATE FUNCTION test() RETURNS void AS $$
        BEGIN
          RAISE NOTICE 'Hello; world'; -- semicolon inside dollar quote
        END;
        $$ LANGUAGE plpgsql;
      `;
      const statements = splitMigrationStatements(content);
      
      expect(statements).toHaveLength(1);
      expect(statements[0]).toContain('Hello; world');
    });

    it('handles tagged dollar quotes', () => {
      const content = `
        DO $$tag$$
        BEGIN
          INSERT INTO test VALUES ('semicolon; inside');
        END;
        $$tag$$;
      `;
      const statements = splitMigrationStatements(content);
      
      expect(statements).toHaveLength(1);
      expect(statements[0]).toContain('semicolon; inside');
    });

    it('ignores comments', () => {
      const content = '-- This is a comment\nCREATE TABLE test (id INT);';
      const statements = splitMigrationStatements(content);
      
      expect(statements).toHaveLength(1);
      expect(statements[0]).toContain('CREATE TABLE test');
    });

    it('handles single quotes with semicolons', () => {
      const content = `INSERT INTO test VALUES ('a;b'); CREATE TABLE b (id INT);`;
      const statements = splitMigrationStatements(content);
      
      expect(statements).toHaveLength(2);
    });
  });

  describe('discoverMigrations', () => {
    it('discovers .sql files in order', () => {
      // This test uses the actual filesystem
      // We'll test the sorting logic separately
      const migrations = discoverMigrations();
      
      // Should find at least our test migrations
      expect(migrations.length).toBeGreaterThan(0);
      
      // Should be sorted lexicographically
      for (let i = 1; i < migrations.length; i++) {
        expect(migrations[i].filename.localeCompare(migrations[i-1].filename)).toBeGreaterThanOrEqual(0);
      }
    });

    it('excludes test_ files', () => {
      const migrations = discoverMigrations();
      const testFiles = migrations.filter(m => m.filename.startsWith('test_'));
      expect(testFiles).toHaveLength(0);
    });

    it('includes checksums for all migrations', () => {
      const migrations = discoverMigrations();
      
      for (const m of migrations) {
        expect(m.checksum).toBeDefined();
        expect(m.checksum).toHaveLength(64);
        expect(m.content).toBeDefined();
      }
    });
  });

  describe('runMigrations', () => {
    it('skips already-applied migrations with matching checksum', async () => {
      const migrations = discoverMigrations();
      const firstMigration = migrations[0];
      
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // ensure schema_migrations table
        .mockResolvedValueOnce({ 
          rows: [{ filename: firstMigration.filename, checksum: firstMigration.checksum, applied_at: new Date() }] 
        }) // get applied migrations
        .mockResolvedValueOnce({ rows: [] }); // COMMIT
      
      await runMigrations();
      
      // Should not try to execute the migration (no SAVEPOINT)
      // Note: SAVEPOINT might be called for schema_migrations table creation
      const savepointCalls = mockClientQuery.mock.calls.filter(c => c[0].includes('SAVEPOINT migration_start'));
      expect(savepointCalls).toHaveLength(0);
    });

    it('applies new migrations', async () => {
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // ensure schema_migrations table
        .mockResolvedValueOnce({ rows: [] }) // get applied migrations (empty)
        .mockResolvedValueOnce({ rows: [] }) // SAVEPOINT
        .mockResolvedValueOnce({ rows: [] }) // migration statement
        .mockResolvedValueOnce({ rows: [] }) // RELEASE SAVEPOINT
        .mockResolvedValueOnce({ rows: [] }) // record migration
        .mockResolvedValueOnce({ rows: [] }); // COMMIT
      
      await runMigrations();
      
      expect(mockClientQuery).toHaveBeenCalledWith(
        'INSERT INTO public.schema_migrations (filename, checksum) VALUES ($1, $2)',
        expect.any(Array)
      );
    });

    it('fails on checksum mismatch', async () => {
      const migrations = discoverMigrations();
      const firstMigration = migrations[0];
      
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // ensure schema_migrations table
        .mockResolvedValueOnce({ 
          rows: [{ 
            filename: firstMigration.filename, 
            checksum: 'different-checksum', 
            applied_at: new Date() 
          }] 
        }) // get applied migrations - checksum mismatch
        .mockResolvedValueOnce({ rows: [] }); // ROLLBACK
      
      await expect(runMigrations()).rejects.toThrow('has been modified after being applied');
    });
  });

  describe('verifyMigrations', () => {
    it('passes when all migrations match', async () => {
      const migrations = discoverMigrations();
      
      // Mock applied migrations matching all discovered
      const appliedRows = migrations.map(m => ({ 
        filename: m.filename, 
        checksum: m.checksum, 
        applied_at: new Date() 
      }));
      
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // ensure schema_migrations table
        .mockResolvedValueOnce({ rows: appliedRows }) // get applied migrations
        .mockResolvedValueOnce({ rows: [] }); // COMMIT
      
      await expect(verifyMigrations()).resolves.toBeUndefined();
    });

    it('fails when migration has mismatch', async () => {
      const migrations = discoverMigrations();
      const firstMigration = migrations[0];
      
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // ensure schema_migrations table
        .mockResolvedValueOnce({ 
          rows: [{ filename: firstMigration.filename, checksum: 'wrong', applied_at: new Date() }] 
        })
        .mockResolvedValueOnce({ rows: [] }); // COMMIT
      
      await expect(verifyMigrations()).rejects.toThrow('Migration verification failed');
    });
  });

  describe('getMigrationStatus', () => {
    it('returns correct status for each migration', async () => {
      const migrations = discoverMigrations();
      const firstMigration = migrations[0];
      
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // ensure schema_migrations table
        .mockResolvedValueOnce({ 
          rows: [
            { filename: firstMigration.filename, checksum: firstMigration.checksum, applied_at: new Date() }
          ] 
        })
        .mockResolvedValueOnce({ rows: [] }); // COMMIT
      
      const status = await getMigrationStatus();
      
      expect(status[0].status).toBe('applied');
      expect(status[0].applied_at).toBeDefined();
      
      // Remaining should be pending
      for (let i = 1; i < status.length; i++) {
        expect(status[i].status).toBe('pending');
      }
    });

    it('detects mismatched migrations', async () => {
      const migrations = discoverMigrations();
      const firstMigration = migrations[0];
      
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // ensure schema_migrations table
        .mockResolvedValueOnce({ 
          rows: [
            { filename: firstMigration.filename, checksum: 'wrong', applied_at: new Date() }
          ] 
        })
        .mockResolvedValueOnce({ rows: [] }); // COMMIT
      
      const status = await getMigrationStatus();
      
      expect(status[0].status).toBe('mismatch');
    });
  });
});

// Integration test (requires actual database)
describe.skip('migrationRunner - Integration', () => {
  // These tests require a real database connection
  // Run manually with: npx vitest run tests/unit/migrationRunner.test.ts --no-skip
  
  it('clean DB bootstrap applies all migrations', async () => {
    // Would need test database
  });
  
  it('migration rerun is idempotent', async () => {
    // Run migrations twice, verify zero new applied
  });
  
  it('modified applied migration is rejected', async () => {
    // Apply migration, modify file, run again -> should HARD FAIL
  });
});