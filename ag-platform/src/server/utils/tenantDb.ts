import { Pool, PoolClient } from 'pg';
import { pool } from '../db.js';

/**
 * Transaction-local tenant context helper.
 * 
 * Ensures pooled connections never retain previous tenant's session state by using
 * SET LOCAL (transaction-scoped) instead of SET (session-scoped).
 * 
 * Usage:
 *   await withTenantDb(orgId, async (client) => {
 *     const result = await client.query('SELECT * FROM cases');
 *     return result.rows;
 *   });
 */
export async function withTenantDb<T>(
  orgId: string,
  operation: (client: PoolClient) => Promise<T>
): Promise<T> {
  if (!orgId) {
    throw new Error('withTenantDb requires a valid orgId');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Set transaction-local tenant context
    // SET LOCAL (not SET) ensures setting only lives within this transaction
    await client.query(
      "SELECT set_config('app.current_org_id', $1, true)",
      [orgId]
    );
    
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Alternative helper for read-only operations that don't need a full transaction.
 * Uses a simple query wrapper that sets the GUC for the duration of the query.
 * 
 * Note: This is less safe than withTenantDb because it doesn't wrap in a transaction.
 * Prefer withTenantDb for all operations, especially writes.
 */
export async function queryWithTenant<T>(
  orgId: string,
  query: (client: PoolClient) => Promise<T>
): Promise<T> {
  if (!orgId) {
    throw new Error('queryWithTenant requires a valid orgId');
  }

  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.current_org_id', $1, true)", [orgId]);
    return await query(client);
  } finally {
    client.release();
  }
}

/**
 * Middleware helper to extract orgId from authenticated request and provide
 * a tenant-scoped query function.
 */
export function createTenantQuery(orgId: string) {
  return {
    query: async <T>(text: string, params?: any[]): Promise<T> => {
      const client = await pool.connect();
      try {
        await client.query("SELECT set_config('app.current_org_id', $1, true)", [orgId]);
        const result = await client.query(text, params);
        return result as T;
      } finally {
        client.release();
      }
    },
    queryOne: async <T>(text: string, params?: any[]): Promise<T | null> => {
      const client = await pool.connect();
      try {
        await client.query("SELECT set_config('app.current_org_id', $1, true)", [orgId]);
        const result = await client.query(text, params);
        return (result.rows[0] as T) || null;
      } finally {
        client.release();
      }
    }
  };
}

/**
 * Express middleware that sets transaction-local tenant context for the request.
 * Attaches a `tenant` object with `withTenantDb` and `query` methods to the request.
 */
export function tenantContextMiddleware() {
  return async (req: any, res: any, next: any) => {
    if (!req.user?.orgId) {
      return next(); // Skip if no orgId (will be caught by requireOrgAccess)
    }

    const orgId = req.user.orgId;

    // Attach tenant-scoped query helpers
    req.tenant = createTenantQuery(orgId);
    req.tenant.withTenantDb = withTenantDb;

    next();
  };
}

/**
 * Get current tenant ID from database session (for debugging/monitoring).
 * Only works within a transaction where withTenantDb was called.
 */
export async function getCurrentTenantId(client: PoolClient): Promise<string | null> {
  const result = await client.query(
    "SELECT current_setting('app.current_org_id', true)"
  );
  const value = result.rows[0]?.current_setting;
  return value && value !== '' ? value : null;
}

/**
 * Verify tenant context is properly set.
 * Throws if context doesn't match expected orgId.
 */
export async function assertTenantContext(
  client: PoolClient,
  expectedOrgId: string
): Promise<void> {
  const current = await getCurrentTenantId(client);
  if (current !== expectedOrgId) {
    throw new Error(
      `Tenant context mismatch: expected ${expectedOrgId}, got ${current || 'none'}`
    );
  }
}

export default {
  withTenantDb,
  queryWithTenant,
  createTenantQuery,
  tenantContextMiddleware,
  getCurrentTenantId,
  assertTenantContext,
};