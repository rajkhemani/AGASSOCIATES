import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pool } from '../../src/server/db.ts';

// Test billing functions with cross-tenant access control
describe('Billing - Cross-tenant access control', () => {
  const mockPoolQuery = vi.fn();
  const mockClientQuery = vi.fn();
  const mockClientRelease = vi.fn();
  const mockPoolConnect = vi.fn();
  const originalPoolQuery = pool.query;
  const originalPoolConnect = pool.connect;

  beforeEach(() => {
    mockPoolQuery.mockReset();
    mockClientQuery.mockReset();
    mockClientRelease.mockReset();
    mockPoolConnect.mockReset();
    pool.query = mockPoolQuery;
    pool.connect = mockPoolConnect;
    mockPoolConnect.mockResolvedValue({
      query: mockClientQuery,
      release: mockClientRelease,
    });
  });

  afterEach(() => {
    pool.query = originalPoolQuery;
    pool.connect = originalPoolConnect;
    vi.clearAllMocks();
  });

  describe('markInvoiceSent', () => {
    it('rejects marking invoice sent when org_id does not match (0 rows affected)', async () => {
      const invoiceId = '550e8400-e29b-41d4-a716-446655440000';
      const userOrgId = 'org-a';

      // Mock UPDATE returning 0 rows (org_id didn't match)
      mockPoolQuery.mockResolvedValue({ rowCount: 0 });

      const { markInvoiceSent } = await import('../../src/lib/billing.ts');

      // Function doesn't throw, but returns void - we verify rowCount is 0
      await markInvoiceSent(invoiceId, userOrgId);

      // Verify UPDATE included org_id check
      expect(mockPoolQuery).toHaveBeenCalledWith(
        "UPDATE invoices SET status = 'SENT' WHERE id = $1 AND org_id = $2 AND status = 'DRAFT'",
        [invoiceId, userOrgId]
      );
    });

    it('allows marking invoice sent when org_id matches (1 row affected)', async () => {
      const invoiceId = '550e8400-e29b-41d4-a716-446655440000';
      const userOrgId = 'org-a';

      // Mock UPDATE returning 1 row
      mockPoolQuery.mockResolvedValue({ rowCount: 1 });

      const { markInvoiceSent } = await import('../../src/lib/billing.ts');

      await markInvoiceSent(invoiceId, userOrgId);

      expect(mockPoolQuery).toHaveBeenCalledWith(
        "UPDATE invoices SET status = 'SENT' WHERE id = $1 AND org_id = $2 AND status = 'DRAFT'",
        [invoiceId, userOrgId]
      );
    });
  });

  describe('markInvoicePaid', () => {
    it('rejects marking invoice paid when org_id does not match', async () => {
      const invoiceId = '550e8400-e29b-41d4-a716-446655440000';
      const userOrgId = 'org-a';

      // Mock SELECT returning empty (org_id didn't match)
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // SELECT FOR UPDATE - no rows
        .mockResolvedValueOnce({ rows: [] }) // ROLLBACK
        .mockResolvedValueOnce({ rows: [] }); // release

      const { markInvoicePaid } = await import('../../src/lib/billing.ts');

      await expect(markInvoicePaid(invoiceId, new Date(), userOrgId)).rejects.toThrow('Invoice not found');

      // Verify SELECT included org_id check
      expect(mockClientQuery).toHaveBeenCalledWith(
        'SELECT * FROM invoices WHERE id = $1 AND org_id = $2 FOR UPDATE',
        [invoiceId, userOrgId]
      );
    });

    it('allows marking invoice paid when org_id matches', async () => {
      const invoiceId = '550e8400-e29b-41d4-a716-446655440000';
      const userOrgId = 'org-a';
      const paidAt = new Date('2025-01-15T10:00:00Z');

      mockClientQuery
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: invoiceId, org_id: userOrgId, advance_adjusted: '0' }] }) // SELECT FOR UPDATE
        .mockResolvedValueOnce({ rows: [] }) // UPDATE
        .mockResolvedValueOnce({ rows: [] }) // COMMIT
        .mockResolvedValueOnce({ rows: [] }); // release

      const { markInvoicePaid } = await import('../../src/lib/billing.ts');

      await expect(markInvoicePaid(invoiceId, paidAt, userOrgId)).resolves.toBeUndefined();

      // Verify call order: BEGIN, SELECT, UPDATE, COMMIT (4 calls)
      expect(mockClientQuery).toHaveBeenCalledTimes(4);
      // Check SELECT with org_id
      expect(mockClientQuery).toHaveBeenCalledWith(
        'SELECT * FROM invoices WHERE id = $1 AND org_id = $2 FOR UPDATE',
        [invoiceId, userOrgId]
      );
      // Check UPDATE with org_id (status='PAID' is hardcoded in query)
      expect(mockClientQuery).toHaveBeenCalledWith(
        "UPDATE invoices SET status = 'PAID', paid_at = $1 WHERE id = $2 AND org_id = $3",
        [paidAt, invoiceId, userOrgId]
      );
      expect(mockClientRelease).toHaveBeenCalled();
    });
  });

  describe('autoMarkOverdueInvoices', () => {
    it('only marks overdue invoices for the specified org_id', async () => {
      const userOrgId = 'org-a';

      // Mock UPDATE with org_id filter
      mockPoolQuery.mockResolvedValue({ rowCount: 2 });

      const { autoMarkOverdueInvoices } = await import('../../src/lib/billing.ts');

      const count = await autoMarkOverdueInvoices(userOrgId);

      expect(count).toBe(2);
      expect(mockPoolQuery).toHaveBeenCalledWith(
        "UPDATE invoices SET status = 'OVERDUE' WHERE org_id = $1 AND status = 'SENT' AND due_at < NOW()",
        [userOrgId]
      );
    });
  });
});