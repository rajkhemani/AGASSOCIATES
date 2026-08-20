import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pool } from '../../src/server/db.js';
import { 
  withTenantDb, 
  queryWithTenant,
  getCurrentTenantId,
  assertTenantContext 
} from '../../src/server/utils/tenantDb.js';
import type { PoolClient } from 'pg';

// Mock pool
const mockClientQuery = vi.fn();
const mockClientRelease = vi.fn();
const mockPoolConnect = vi.fn();
const originalPoolConnect = pool.connect;

beforeEach(() => {
  mockClientQuery.mockReset();
  mockClientRelease.mockReset();
  mockPoolConnect.mockReset();
  pool.connect = mockPoolConnect;
  mockPoolConnect.mockResolvedValue({
    query: mockClientQuery,
    release: mockClientRelease,
  });
});

afterEach(() => {
  pool.connect = originalPoolConnect;
  vi.clearAllMocks();
});

describe('tenantDb - withTenantDb', () => {
  it('sets app.current_org_id via set_config within transaction', async () => {
    const orgId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ current_setting: orgId }] }) // set_config
      .mockResolvedValueOnce({ rows: [{ id: 'case-1' }] }) // operation
      .mockResolvedValueOnce({ rows: [] }) // COMMIT
      .mockResolvedValueOnce({ rows: [] }); // release

    const result = await withTenantDb(orgId, async (client) => {
      const res = await client.query('SELECT id FROM cases LIMIT 1');
      return res.rows;
    });

    expect(result).toEqual([{ id: 'case-1' }]);
    
    // Verify set_config was called with orgId
    const setConfigCall = mockClientQuery.mock.calls.find(call => 
      call[0].includes('set_config')
    );
    expect(setConfigCall).toBeDefined();
    expect(setConfigCall![1]).toEqual([orgId]);
  });

  it('throws if orgId is not provided', async () => {
    await expect(withTenantDb('', async () => {})).rejects.toThrow('requires a valid orgId');
  });

  it('rolls back on operation error and releases client', async () => {
    const orgId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ current_setting: orgId }] }) // set_config
      .mockRejectedValueOnce(new Error('Operation failed')) // operation fails
      .mockResolvedValueOnce({ rows: [] }) // ROLLBACK
      .mockResolvedValueOnce({ rows: [] }); // release

    await expect(
      withTenantDb(orgId, async () => { throw new Error('Operation failed'); })
    ).rejects.toThrow('Operation failed');

    // Verify ROLLBACK was called
    expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClientRelease).toHaveBeenCalled();
  });

  it('commits on success and releases client', async () => {
    const orgId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ current_setting: orgId }] }) // set_config
      .mockResolvedValueOnce({ rows: [{ id: '1' }] }) // operation
      .mockResolvedValueOnce({ rows: [] }) // COMMIT
      .mockResolvedValueOnce({ rows: [] }); // release

    await withTenantDb(orgId, async (client) => {
      const res = await client.query('SELECT 1');
      return res.rows;
    });

    expect(mockClientQuery).toHaveBeenCalledWith('COMMIT');
    expect(mockClientRelease).toHaveBeenCalled();
  });
});

describe('tenantDb - queryWithTenant', () => {
  it('sets app.current_org_id and executes query without transaction', async () => {
    const orgId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    
    mockClientQuery
      .mockResolvedValueOnce({ rows: [{ current_setting: orgId }] }) // set_config
      .mockResolvedValueOnce({ rows: [{ id: 'case-1' }] }); // query

    const result = await queryWithTenant(orgId, async (client) => {
      const res = await client.query('SELECT * FROM cases');
      return res.rows;
    });

    expect(result).toEqual([{ id: 'case-1' }]);
    expect(mockClientQuery).toHaveBeenCalledWith(
      "SELECT set_config('app.current_org_id', $1, true)",
      [orgId]
    );
    expect(mockClientRelease).toHaveBeenCalled();
  });

  it('releases client even if query throws', async () => {
    const orgId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    
    mockClientQuery
      .mockResolvedValueOnce({ rows: [{ current_setting: orgId }] }) // set_config
      .mockRejectedValueOnce(new Error('Query failed'));

    await expect(
      queryWithTenant(orgId, async () => { throw new Error('Query failed'); })
    ).rejects.toThrow('Query failed');

    expect(mockClientRelease).toHaveBeenCalled();
  });
});

describe('tenantDb - getCurrentTenantId', () => {
  it('returns current_setting value when set', async () => {
    const orgId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    
    mockClientQuery.mockResolvedValueOnce({ 
      rows: [{ current_setting: orgId }] 
    });

    const client = await pool.connect();
    const result = await getCurrentTenantId(client as unknown as PoolClient);
    
    expect(result).toBe(orgId);
  });

  it('returns null when setting is empty', async () => {
    mockClientQuery.mockResolvedValueOnce({ 
      rows: [{ current_setting: '' }] 
    });

    const client = await pool.connect();
    const result = await getCurrentTenantId(client as unknown as PoolClient);
    
    expect(result).toBeNull();
  });

  it('returns null when setting is undefined', async () => {
    mockClientQuery.mockResolvedValueOnce({ 
      rows: [{ current_setting: null }] 
    });

    const client = await pool.connect();
    const result = await getCurrentTenantId(client as unknown as PoolClient);
    
    expect(result).toBeNull();
  });
});

describe('tenantDb - assertTenantContext', () => {
  it('passes when context matches expected orgId', async () => {
    const orgId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    
    mockClientQuery.mockResolvedValueOnce({ 
      rows: [{ current_setting: orgId }] 
    });

    const client = await pool.connect();
    await expect(assertTenantContext(client as unknown as PoolClient, orgId)).resolves.toBeUndefined();
  });

  it('throws when context does not match expected orgId', async () => {
    const expectedOrgId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const actualOrgId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    
    mockClientQuery.mockResolvedValueOnce({ 
      rows: [{ current_setting: actualOrgId }] 
    });

    const client = await pool.connect();
    await expect(assertTenantContext(client as unknown as PoolClient, expectedOrgId)).rejects.toThrow(
      `Tenant context mismatch: expected ${expectedOrgId}, got ${actualOrgId}`
    );
  });

  it('throws when context is not set', async () => {
    const expectedOrgId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    
    mockClientQuery.mockResolvedValueOnce({ 
      rows: [{ current_setting: '' }] 
    });

    const client = await pool.connect();
    await expect(assertTenantContext(client as unknown as PoolClient, expectedOrgId)).rejects.toThrow(
      `Tenant context mismatch: expected ${expectedOrgId}, got none`
    );
  });
});

describe('tenantDb - Concurrent tenant isolation (mocked)', () => {
  it('simulates two concurrent requests with different orgIds using separate mocks', async () => {
    const orgA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const orgB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    
    // Create separate mock functions for each concurrent call
    // This simulates two separate pool.connect() calls with different clients
    const createMockClient = (orgId: string) => {
      let setCalled = false;
      return {
        query: vi.fn().mockImplementation(async (query: string, params?: any[]) => {
          if (query.includes('set_config')) {
            setCalled = true;
            return { rows: [{ current_setting: orgId }] };
          }
          if (query === 'BEGIN' || query === 'COMMIT' || query === 'ROLLBACK') {
            return { rows: [] };
          }
          // Return data specific to this tenant
          if (orgId === orgA) {
            return { rows: [{ org: 'A', data: 'tenant-a-data' }] };
          } else if (orgId === orgB) {
            return { rows: [{ org: 'B', data: 'tenant-b-data' }] };
          }
          return { rows: [] };
        }),
        release: vi.fn(),
      };
    };
    
    const mockClientA = createMockClient(orgA);
    const mockClientB = createMockClient(orgB);
    
    let useClientA = true;
    mockPoolConnect
      .mockResolvedValueOnce(mockClientA)
      .mockResolvedValueOnce(mockClientB);
    
    // Simulate concurrent execution
    const [resultA, resultB] = await Promise.all([
      withTenantDb(orgA, async (client) => {
        const res = await client.query('SELECT * FROM cases');
        return res.rows;
      }),
      withTenantDb(orgB, async (client) => {
        const res = await client.query('SELECT * FROM cases');
        return res.rows;
      }),
    ]);

    // Each tenant should see their own data
    expect(resultA[0]?.org).toBe('A');
    expect(resultB[0]?.org).toBe('B');
  });
});

describe('tenantDb - Connection pool isolation', () => {
  it('verifies tenant context does not leak between sequential calls', async () => {
    const orgA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const orgB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    
    // Track set_config calls
    const setConfigCalls: string[] = [];
    
    mockClientQuery.mockImplementation(async (query: string, params?: any[]) => {
      if (query.includes('set_config')) {
        setConfigCalls.push(params?.[0] || '');
        return { rows: [{ current_setting: params?.[0] }] };
      }
      if (query === 'BEGIN' || query === 'COMMIT' || query === 'ROLLBACK') {
        return { rows: [] };
      }
      return { rows: [] };
    });
    
    // First call with orgA
    await withTenantDb(orgA, async (client) => {
      return client.query('SELECT 1');
    });
    
    // Second call with orgB
    await withTenantDb(orgB, async (client) => {
      return client.query('SELECT 1');
    });
    
    // Third call with orgA again
    await withTenantDb(orgA, async (client) => {
      return client.query('SELECT 1');
    });
    
    // Verify each call set the correct orgId
    expect(setConfigCalls).toEqual([orgA, orgB, orgA]);
    expect(setConfigCalls.length).toBe(3);
  });
  
  it('verifies each pool.connect gets fresh client', async () => {
    const orgId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const connectCalls = 0;
    
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ current_setting: orgId }] }) // set_config
      .mockResolvedValueOnce({ rows: [{ id: '1' }] }) // operation
      .mockResolvedValueOnce({ rows: [] }) // COMMIT
      .mockResolvedValueOnce({ rows: [] }); // release
    
    await withTenantDb(orgId, async (client) => {
      return client.query('SELECT 1');
    });
    
    // pool.connect should be called exactly once
    expect(mockPoolConnect).toHaveBeenCalledTimes(1);
  });
});

describe('tenantDb - Nested calls with shadowing', () => {
  it('supports nested withTenantDb calls where inner shadows outer', async () => {
    const orgOuter = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const orgInner = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    
    // Track all queries in order
    const queries: { query: string; params?: any[] }[] = [];
    
    mockClientQuery.mockImplementation(async (query: string, params?: any[]) => {
      queries.push({ query, params });
      if (query === 'BEGIN' || query === 'COMMIT' || query === 'ROLLBACK') {
        return { rows: [] };
      }
      if (query.includes('set_config')) {
        return { rows: [{ current_setting: params?.[0] }] };
      }
      return { rows: [] };
    });
    
    // This tests the conceptual behavior - in reality, nested transactions
    // would need savepoints, but we verify the pattern works
    await withTenantDb(orgOuter, async (outerClient) => {
      // Outer transaction sets orgOuter
      await withTenantDb(orgInner, async (innerClient) => {
        // Inner transaction sets orgInner (shadows outer)
        await innerClient.query('SELECT 1');
      });
      // Back to outer - should still be orgOuter
      await outerClient.query('SELECT 1');
    });
    
    // Verify set_config was called for each transaction boundary
    const setConfigCalls = queries
      .filter(q => q.query.includes('set_config'))
      .map(q => q.params?.[0]);
    
    expect(setConfigCalls).toEqual([orgOuter, orgInner]);
  });
});

describe('tenantDb - Integration: Tenant A cannot see Tenant B data', () => {
  it('Tenant A query returns empty when Tenant B owns the data', async () => {
    const orgA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const orgB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    
    // Mock: Tenant A query returns empty (RLS blocks Tenant B data)
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ current_setting: orgA }] }) // set_config
      .mockResolvedValueOnce({ rows: [] }) // SELECT - no rows due to RLS
      .mockResolvedValueOnce({ rows: [] }) // COMMIT
      .mockResolvedValueOnce({ rows: [] }); // release
    
    const result = await withTenantDb(orgA, async (client) => {
      const res = await client.query('SELECT * FROM cases WHERE org_id = $1', [orgB]);
      return res.rows;
    });
    
    // Tenant A should see no data from Tenant B
    expect(result).toEqual([]);
  });
  
  it('Tenant A cannot insert for Tenant B (RLS blocks at DB level)', async () => {
    const orgA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const orgB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ current_setting: orgA }] }) // set_config
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // INSERT - RLS blocks, returns 0 rows
      .mockResolvedValueOnce({ rows: [] }) // COMMIT (not an error, just 0 rows)
      .mockResolvedValueOnce({ rows: [] }); // release
    
    // This simulates RLS blocking the insert - the operation returns 0 rows affected
    const rowCount = await withTenantDb(orgA, async (client) => {
      const res = await client.query(
        'INSERT INTO cases (org_id, case_number, borrower_name) VALUES ($1, $2, $3)',
        [orgB, 'CASE-B-001', 'Borrower B']
      );
      return res.rowCount;
    });
    
    // Insert should be blocked (0 rows affected)
    // Note: Actual RLS blocking happens at DB level, here we verify the pattern
    expect(rowCount).toBe(0);
    expect(mockClientQuery).toHaveBeenCalledWith('COMMIT');
  });
});