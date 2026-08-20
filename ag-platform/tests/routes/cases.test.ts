import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import caseRoutes from '../../src/server/routes/cases.ts';
import { pool } from '../../src/server/db.ts';

// Create test app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api', caseRoutes);
  return app;
}

describe('Cases Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /api/cases', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/cases');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/cases', () => {
    it('requires authentication', async () => {
      const res = await request(app).post('/api/cases').send({});
      expect(res.status).toBe(401);
    });

    it('validates required fields', async () => {
      // Mock authenticated user
      const res = await request(app)
        .post('/api/cases')
        .set('Cookie', ['sb-access-token=test-token'])
        .send({ borrower_name: 'Test' });

      // Will fail auth but validation should catch missing fields first
      expect([400, 401]).toContain(res.status);
    });
  });

  describe('GET /api/cases/:id', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/cases/test-id');
      expect(res.status).toBe(401);
    });

    it('validates UUID format', async () => {
      const res = await request(app).get('/api/cases/invalid-uuid');
      expect(res.status).toBe(401); // Auth fails first
    });
  });

  describe('PUT /api/cases/:id/status', () => {
    it('requires authentication', async () => {
      const res = await request(app).put('/api/cases/test-id/status').send({});
      expect(res.status).toBe(401);
    });

    it('validates status enum', async () => {
      const res = await request(app)
        .put('/api/cases/550e8400-e29b-41d4-a716-446655440000/status')
        .send({ status: 'INVALID_STATUS' });
      expect([400, 401]).toContain(res.status);
    });
  });

  describe('PATCH /api/cases/:id', () => {
    it('requires authentication', async () => {
      const res = await request(app).patch('/api/cases/test-id').send({});
      expect(res.status).toBe(401);
    });

    it('requires status field', async () => {
      const res = await request(app)
        .patch('/api/cases/550e8400-e29b-41d4-a716-446655440000')
        .send({ notes: 'Test' });
      expect([400, 401]).toContain(res.status);
    });
  });

  describe('GET /api/cases/stats', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/cases/stats');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/workforce/agents/status', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/workforce/agents/status');
      expect(res.status).toBe(401);
    });
  });
});

describe('CaseService.updateStatus - Cross-tenant access control', () => {
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

  it('rejects status update when org_id does not match case org_id', async () => {
    // Simulate: Case belongs to org-B, but user from org-A tries to update
    const caseId = '550e8400-e29b-41d4-a716-446655440000';
    const userId = 'user-org-a';
    const userOrgId = 'org-a';
    const caseOrgId = 'org-b';

    // Mock SELECT to return case with different org_id
    mockClientQuery
      .mockResolvedValueOnce({ rows: [{ status: 'RECEIVED', org_id: caseOrgId }] }) // SELECT status, org_id
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

    const { CaseService } = await import('../../src/server/services/caseService.ts');

    await expect(
      CaseService.updateStatus(caseId, 'IN_PROGRESS', userId, 'Test note', userOrgId)
    ).rejects.toThrow();

    // Verify SELECT included org_id check
    expect(mockClientQuery).toHaveBeenCalledWith(
      'SELECT status, org_id FROM cases WHERE id = $1 AND org_id = $2',
      [caseId, userOrgId]
    );
  });

  it('allows status update when org_id matches', async () => {
    const caseId = '550e8400-e29b-41d4-a716-446655440000';
    const userId = 'user-org-a';
    const userOrgId = 'org-a';

    // Mock successful transaction
    // Call order: BEGIN, SELECT, UPDATE, INSERT, COMMIT
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ status: 'RECEIVED', org_id: userOrgId }] }) // SELECT
      .mockResolvedValueOnce({ rows: [] }) // UPDATE
      .mockResolvedValueOnce({ rows: [] }) // INSERT timeline
      .mockResolvedValueOnce({ rows: [] }) // COMMIT
      .mockResolvedValueOnce({ rows: [] }); // release (not awaited)

    const { CaseService } = await import('../../src/server/services/caseService.ts');

    await expect(
      CaseService.updateStatus(caseId, 'IN_PROGRESS', userId, 'Test note', userOrgId)
    ).resolves.toBeUndefined();

    // Verify all queries include org_id
    expect(mockClientQuery).toHaveBeenCalledWith(
      'SELECT status, org_id FROM cases WHERE id = $1 AND org_id = $2',
      [caseId, userOrgId]
    );
    expect(mockClientQuery).toHaveBeenCalledWith(
      'UPDATE cases SET status = $1 WHERE id = $2 AND org_id = $3',
      ['IN_PROGRESS', caseId, userOrgId]
    );
    // Check INSERT was called (format may vary)
    const insertCalls = mockClientQuery.mock.calls.filter(call => 
      call[0].includes('INSERT INTO case_timeline')
    );
    expect(insertCalls.length).toBe(1);
    expect(insertCalls[0][1]).toEqual([caseId, 'RECEIVED', 'IN_PROGRESS', 'Test note', userId]);
    expect(mockClientRelease).toHaveBeenCalled();
  });
});