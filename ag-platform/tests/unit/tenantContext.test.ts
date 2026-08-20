import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pool } from '../../src/server/db.js';
import { 
  withTenantDb, 
  queryWithTenant, 
  getCurrentTenantId,
  assertTenantContext 
} from '../../src/server/tenantContext.js';
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

describe('tenantContext - withTenantDb', () => {
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

describe('tenantContext - queryWithTenant', () => {
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

describe('tenantContext - getCurrentTenantId', () => {
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

describe('tenantContext - assertTenantContext', () => {
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

describe('tenantContext - Concurrent tenant isolation', () => {
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