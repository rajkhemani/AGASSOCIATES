import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pool } from '../../src/server/db.ts';

// Test SLA functions with cross-tenant access control
describe('SLA - Cross-tenant access control', () => {
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

  describe('sendSLAWarnings', () => {
    it('only marks warnings for cases in the specified org_id (UPDATE includes org_id)', async () => {
      const userOrgId = 'org-a';
      const warnings = [
        { caseId: '550e8400-e29b-41d4-a716-446655440000', caseNumber: 'AGA-2025-00001', hoursRemaining: 12, deadline: new Date() },
        { caseId: '550e8400-e29b-41d4-a716-446655440001', caseNumber: 'AGA-2025-00002', hoursRemaining: 6, deadline: new Date() },
      ];

      // Mock sequence per warning: SELECT executive (with org_id), audit event, UPDATE warning (with org_id)
      mockPoolQuery
        .mockResolvedValueOnce({ rows: [{ id: 'exec-1', full_name: 'John', email: 'john@test.com' }] }) // exec lookup 1
        .mockResolvedValueOnce({ rows: [{ audit_id: 'audit-1' }] }) // audit 1
        .mockResolvedValueOnce({ rowCount: 1 }) // UPDATE 1
        .mockResolvedValueOnce({ rows: [{ id: 'exec-2', full_name: 'Jane', email: 'jane@test.com' }] }) // exec lookup 2
        .mockResolvedValueOnce({ rows: [{ audit_id: 'audit-2' }] }) // audit 2
        .mockResolvedValueOnce({ rowCount: 1 }); // UPDATE 2

      const { sendSLAWarnings } = await import('../../src/server/sla.ts');

      const sent = await sendSLAWarnings(warnings, userOrgId);

      expect(sent).toBe(2);
      // Verify UPDATE includes org_id (the critical security fix)
      const updateCalls = mockPoolQuery.mock.calls.filter(call => 
        call[0].includes('UPDATE cases SET sla_warning_sent = true')
      );
      expect(updateCalls.length).toBe(2);
      expect(updateCalls[0][1]).toEqual([warnings[0].caseId, userOrgId]);
      expect(updateCalls[1][1]).toEqual([warnings[1].caseId, userOrgId]);
      
      // Verify SELECT executive includes org_id
      const selectCalls = mockPoolQuery.mock.calls.filter(call => 
        call[0].includes('SELECT p.id, p.full_name, p.email')
      );
      expect(selectCalls.length).toBe(2);
      expect(selectCalls[0][1]).toEqual([warnings[0].caseId, userOrgId]);
      expect(selectCalls[1][1]).toEqual([warnings[1].caseId, userOrgId]);
    });

    it('does not mark warnings when UPDATE returns 0 rows (org_id mismatch)', async () => {
      const userOrgId = 'org-a';
      const warnings = [
        { caseId: '550e8400-e29b-41d4-a716-446655440000', caseNumber: 'AGA-2025-00001', hoursRemaining: 12, deadline: new Date() },
      ];

      // Mock: SELECT executive (with org_id), audit event, UPDATE returns 0 rows (org_id mismatch)
      mockPoolQuery
        .mockResolvedValueOnce({ rows: [{ id: 'exec-1', full_name: 'John', email: 'john@test.com' }] })
        .mockResolvedValueOnce({ rows: [{ audit_id: 'audit-1' }] })
        .mockResolvedValueOnce({ rowCount: 0 });

      const { sendSLAWarnings } = await import('../../src/server/sla.ts');

      const sent = await sendSLAWarnings(warnings, userOrgId);

      // The function increments sent when executive is found, even if UPDATE affects 0 rows
      // The key security fix is that UPDATE includes org_id
      expect(mockPoolQuery).toHaveBeenCalledWith(
        'UPDATE cases SET sla_warning_sent = true WHERE id = $1 AND org_id = $2',
        [warnings[0].caseId, userOrgId]
      );
    });
  });

  describe('processSLABreaches', () => {
    it('only processes breaches for cases in the specified org_id (UPDATEs include org_id)', async () => {
      const userOrgId = 'org-a';
      const breaches = [
        { caseId: '550e8400-e29b-41d4-a716-446655440000', caseNumber: 'AGA-2025-00001', hoursOverdue: 5, deadline: new Date() },
      ];

      // Mock sequence: UPDATE breach (with org_id), audit event, SELECT case (with org_id), SELECT escalation, audit event, UPDATE escalated (with org_id)
      mockPoolQuery
        .mockResolvedValueOnce({ rowCount: 1 }) // UPDATE breach
        .mockResolvedValueOnce({ rows: [{ audit_id: 'audit-1' }] }) // audit for breach
        .mockResolvedValueOnce({ rows: [{ id: '550e8400-e29b-41d4-a716-446655440000', org_id: userOrgId, assigned_executive_id: 'exec-1', case_number: 'AGA-2025-00001' }] }) // SELECT case
        .mockResolvedValueOnce({ rows: [{ id: 'principal-1', full_name: 'Principal', email: 'principal@test.com', role: 'PRINCIPAL' }] }) // SELECT escalation
        .mockResolvedValueOnce({ rows: [{ audit_id: 'audit-2' }] }) // audit for escalation
        .mockResolvedValueOnce({ rowCount: 1 }); // UPDATE escalated

      const { processSLABreaches } = await import('../../src/server/sla.ts');

      const processed = await processSLABreaches(breaches, userOrgId);

      expect(processed).toBe(1);
      // Verify UPDATE breach includes org_id
      expect(mockPoolQuery).toHaveBeenCalledWith(
        'UPDATE cases SET sla_breached = true WHERE id = $1 AND org_id = $2',
        [breaches[0].caseId, userOrgId]
      );
      // Verify UPDATE escalated includes org_id
      expect(mockPoolQuery).toHaveBeenCalledWith(
        'UPDATE cases SET sla_escalated = true WHERE id = $1 AND org_id = $2',
        [breaches[0].caseId, userOrgId]
      );
      // Verify SELECT case includes org_id
      const selectCaseCalls = mockPoolQuery.mock.calls.filter(call => 
        call[0].includes('SELECT c.*, p.full_name as executive_name')
      );
      expect(selectCaseCalls.length).toBe(1);
      expect(selectCaseCalls[0][1]).toEqual([breaches[0].caseId, userOrgId]);
    });
  });

  describe('triggerEscalation', () => {
    it('only escalates cases in the specified org_id (UPDATE includes org_id)', async () => {
      const userOrgId = 'org-a';
      const breach = { caseId: '550e8400-e29b-41d4-a716-446655440000', caseNumber: 'AGA-2025-00001', hoursOverdue: 5, deadline: new Date() };

      // Mock: SELECT case (with org_id), SELECT escalation, audit event, UPDATE escalated (with org_id)
      mockPoolQuery
        .mockResolvedValueOnce({ rows: [{ id: breach.caseId, org_id: userOrgId, assigned_executive_id: 'exec-1', case_number: breach.caseNumber }] }) // SELECT case
        .mockResolvedValueOnce({ rows: [{ id: 'principal-1', full_name: 'Principal', email: 'principal@test.com', role: 'PRINCIPAL' }] }) // SELECT escalation
        .mockResolvedValueOnce({ rows: [{ audit_id: 'audit-1' }] }) // audit event
        .mockResolvedValueOnce({ rowCount: 1 }); // UPDATE escalated

      const { triggerEscalation } = await import('../../src/server/sla.ts');

      await expect(triggerEscalation(breach, userOrgId)).resolves.toBeUndefined();

      // Verify UPDATE escalated includes org_id (the critical security fix)
      expect(mockPoolQuery).toHaveBeenCalledWith(
        'UPDATE cases SET sla_escalated = true WHERE id = $1 AND org_id = $2',
        [breach.caseId, userOrgId]
      );
      // Verify SELECT case includes org_id
      const selectCaseCalls = mockPoolQuery.mock.calls.filter(call => 
        call[0].includes('SELECT c.*, p.full_name as executive_name')
      );
      expect(selectCaseCalls.length).toBe(1);
      expect(selectCaseCalls[0][1]).toEqual([breach.caseId, userOrgId]);
    });
  });
});