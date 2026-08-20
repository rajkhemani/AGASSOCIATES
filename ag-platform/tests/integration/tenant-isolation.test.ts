import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { pool } from '../../src/server/db.ts';

// Test UUIDs for consistent IDs across tests
const TENANT_A_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const USER_A_ID = '11111111-1111-1111-1111-111111111111';
const USER_B_ID = '22222222-2222-2222-2222-222222222222';
const CASE_A_ID = '33333333-3333-3333-3333-333333333333';
const CASE_B_ID = '44444444-4444-4444-4444-444444444444';
const INVOICE_A_ID = '55555555-5555-5555-5555-555555555555';
const INVOICE_B_ID = '66666666-6666-6666-6666-666666666666';
const DOCUMENT_A_ID = '77777777-7777-7777-7777-777777777777';
const DOCUMENT_B_ID = '88888888-8888-8888-8888-888888888888';
const BANK_ID = '99999999-9999-9999-9999-999999999999';
const TASK_A_ID = 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1';
const TASK_B_ID = 'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2';
const COMMENT_A_ID = 'ccccccc3-cccc-cccc-cccc-ccccccccccc3';
const COMMENT_B_ID = 'ddddddd4-dddd-dddd-dddd-dddddddddd4';

// Mock pool for database operations
const mockPoolQuery = vi.fn();
const mockClientQuery = vi.fn();
const mockClientRelease = vi.fn();
const mockPoolConnect = vi.fn();
const originalPoolQuery = pool.query;
const originalPoolConnect = pool.connect;

// Helper to create mock user for a tenant
function createMockUser(tenantId: string, userId: string, role: string = 'ADVOCATE') {
  return {
    id: userId,
    email: `user-${tenantId.slice(0, 4)}@test.com`,
    role,
    orgId: tenantId,
  };
}

// Mock the auth middleware at module level
vi.mock('../../src/server/auth.ts', () => {
  let currentUser: any = null;

  return {
    createSupabaseMiddleware: vi.fn(() => async (req: any, res: any, next: any) => {
      if (currentUser) {
        req.user = currentUser;
        req.supabase = {
          auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: currentUser.id, email: currentUser.email } }, error: null }) },
          from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: currentUser.id, org_id: currentUser.orgId, role: currentUser.role }, error: null }),
          })),
        };
        next();
      } else {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      }
    }),
    requireRole: vi.fn((...roles: string[]) => (req: any, res: any, next: any) => {
      if (!req.user) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
        return;
      }
      if (!roles.includes(req.user.role)) {
        res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
        return;
      }
      next();
    }),
    requireOrgAccess: vi.fn(() => (req: any, res: any, next: any) => {
      if (!req.user?.orgId) {
        res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Organization access required' } });
        return;
      }
      next();
    }),
    optionalAuth: vi.fn(() => async (req: any, _res: any, next: any) => {
      if (currentUser) {
        req.user = currentUser;
      }
      next();
    }),
    __setCurrentUser: (user: any) => { currentUser = user; },
  };
});

import * as authModule from '../../src/server/auth.ts';

// Import routes AFTER mocking auth
import caseRoutes from '../../src/server/routes/cases.ts';
import documentRoutes from '../../src/server/routes/documents.ts';
import invoiceRoutes from '../../src/server/routes/invoices.ts';

// Create test app with all routes
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.use((req, res, next) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] || crypto.randomUUID();
    res.setHeader('X-Request-ID', req.headers['x-request-id']);
    next();
  });

  app.use('/api/v1', caseRoutes);
  app.use('/api/v1', documentRoutes);
  app.use('/api/v1', invoiceRoutes);

  return app;
}

describe('Tenant Isolation - Cross-Tenant Access Control', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();

    mockPoolQuery.mockReset();
    mockClientQuery.mockReset();
    mockClientRelease.mockReset();
    mockPoolConnect.mockReset();

    mockPoolConnect.mockResolvedValue({
      query: mockClientQuery,
      release: mockClientRelease,
    });
    pool.query = mockPoolQuery;
    pool.connect = mockPoolConnect;

    (authModule as any).__setCurrentUser(null);
  });

  afterEach(() => {
    pool.query = originalPoolQuery;
    pool.connect = originalPoolConnect;
    vi.clearAllMocks();
  });

  // Test setup helpers for mocking database responses
  function mockTenantCases(tenantId: string, caseId: string, caseData: any = {}) {
    return {
      rows: [{
        id: caseId,
        org_id: tenantId,
        case_number: `AGA-2025-${caseId.slice(0, 5)}`,
        borrower_name: `Borrower ${tenantId.slice(0, 4)}`,
        status: 'RECEIVED',
        bank_id: BANK_ID,
        case_type: 'TITLE_SEARCH',
        loan_amount: 100000,
        professional_fee: 5000,
        received_date: new Date().toISOString(),
        sla_deadline: new Date(Date.now() + 86400000).toISOString(),
        assigned_executive_id: USER_A_ID,
        ...caseData,
      }],
    };
  }

  function mockTenantInvoices(tenantId: string, invoiceId: string, invoiceData: any = {}) {
    return {
      rows: [{
        id: invoiceId,
        org_id: tenantId,
        invoice_number: `INV-2025-${invoiceId.slice(0, 5)}`,
        status: 'DRAFT',
        subtotal: 10000,
        tax_rate: 0.18,
        tax_amount: 1800,
        total: 11800,
        advance_adjusted: 0,
        net_receivable: 11800,
        issued_at: new Date().toISOString(),
        due_at: new Date(Date.now() + 2592000000).toISOString(),
        ...invoiceData,
      }],
    };
  }

  function mockTenantDocuments(tenantId: string, caseId: string, documentId: string, docData: any = {}) {
    return {
      rows: [{
        id: documentId,
        case_id: caseId,
        org_id: tenantId,
        uploader_id: USER_A_ID,
        name: `Document ${documentId.slice(0, 4)}`,
        storage_path: `cases/${caseId}/${documentId}.pdf`,
        bucket_id: 'case-documents',
        content_type: 'application/pdf',
        size_bytes: 1024,
        category: 'evidence',
        uploaded_at: new Date().toISOString(),
        ...docData,
      }],
    };
  }

  // Helper to run a test as a specific tenant
  async function asTenant(tenantId: string, userId: string, role: string, fn: () => Promise<any>) {
    (authModule as any).__setCurrentUser(createMockUser(tenantId, userId, role));
    try {
      return await fn();
    } finally {
      (authModule as any).__setCurrentUser(null);
    }
  }

  // Helper: assert response is blocked (not 2xx success)
  function expectBlocked(res: any, message?: string) {
    expect([403, 404]).toContain(res.status);
  }

  // Helper: assert response is successful (2xx)
  function expectSuccess(res: any, expectedStatus: number = 200) {
    expect(res.status).toBe(expectedStatus);
  }

  // ============================================================
  // CASES ENDPOINTS - Cross-Tenant Tests
  // ============================================================
  describe('Cases - Cross-Tenant Isolation', () => {
    describe('GET /api/v1/cases/:id', () => {
      it('FAIL: Tenant A cannot access Tenant B case (expects 404/403)', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce(mockTenantCases(TENANT_B_ID, CASE_B_ID));

          const res = await request(app).get(`/api/v1/cases/${CASE_B_ID}`);
          // RED: Currently returns 200 (vulnerability) - should be 403/404 after P0-A fixes
          expectBlocked(res);
        });
      });

      it('PASS: Tenant A can access own case', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce(mockTenantCases(TENANT_A_ID, CASE_A_ID));

          const res = await request(app).get(`/api/v1/cases/${CASE_A_ID}`);
          expectSuccess(res, 200);
          expect(res.body.id).toBe(CASE_A_ID);
        });
      });
    });

    describe('PUT /api/v1/cases/:id/status', () => {
      it('FAIL: Tenant A cannot update Tenant B case status (expects 404/403)', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockClientQuery
            .mockResolvedValueOnce({ rows: [] }) // BEGIN
            .mockResolvedValueOnce({ rows: [] }) // SELECT - org_id mismatch
            .mockResolvedValueOnce({ rows: [] }) // ROLLBACK
            .mockResolvedValueOnce({ rows: [] }); // release

          const res = await request(app)
            .put(`/api/v1/cases/${CASE_B_ID}/status`)
            .send({ status: 'IN_PROGRESS', notes: 'Cross-tenant attempt' });

          expectBlocked(res);
        });
      });

      it('PASS: Tenant A can update own case status', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockClientQuery
            .mockResolvedValueOnce({ rows: [] }) // BEGIN
            .mockResolvedValueOnce({ rows: [{ status: 'RECEIVED', org_id: TENANT_A_ID }] }) // SELECT
            .mockResolvedValueOnce({ rows: [] }) // UPDATE
            .mockResolvedValueOnce({ rows: [] }) // INSERT timeline
            .mockResolvedValueOnce({ rows: [] }) // COMMIT
            .mockResolvedValueOnce({ rows: [] }); // release

          const res = await request(app)
            .put(`/api/v1/cases/${CASE_A_ID}/status`)
            .send({ status: 'IN_PROGRESS', notes: 'Valid update' });

          expectSuccess(res, 200);
        });
      });
    });

    describe('PATCH /api/v1/cases/:id', () => {
      it('FAIL: Tenant A cannot patch Tenant B case (expects 404/403)', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockClientQuery
            .mockResolvedValueOnce({ rows: [] }) // BEGIN
            .mockResolvedValueOnce({ rows: [] }) // SELECT - org_id mismatch
            .mockResolvedValueOnce({ rows: [] }) // ROLLBACK
            .mockResolvedValueOnce({ rows: [] }); // release

          const res = await request(app)
            .patch(`/api/v1/cases/${CASE_B_ID}`)
            .send({ status: 'ASSIGNED', notes: 'Cross-tenant attempt' });

          expectBlocked(res);
        });
      });

      it('PASS: Tenant A can patch own case', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockClientQuery
            .mockResolvedValueOnce({ rows: [] }) // BEGIN
            .mockResolvedValueOnce({ rows: [{ status: 'RECEIVED', org_id: TENANT_A_ID }] }) // SELECT
            .mockResolvedValueOnce({ rows: [] }) // UPDATE
            .mockResolvedValueOnce({ rows: [] }) // INSERT timeline
            .mockResolvedValueOnce({ rows: [] }) // COMMIT
            .mockResolvedValueOnce({ rows: [] }); // release

          const res = await request(app)
            .patch(`/api/v1/cases/${CASE_A_ID}`)
            .send({ status: 'ASSIGNED', notes: 'Valid update' });

          expectSuccess(res, 200);
        });
      });
    });

    describe('GET /api/v1/cases/:id/timeline', () => {
      it('FAIL: Tenant A cannot access Tenant B case timeline (expects 404/403)', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce({ rows: [] });

          const res = await request(app).get(`/api/v1/cases/${CASE_B_ID}/timeline`);
          expectBlocked(res);
        });
      });

      it('PASS: Tenant A can access own case timeline', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce({
            rows: [{
              id: 'timeline-1',
              case_id: CASE_A_ID,
              status_from: 'RECEIVED',
              status_to: 'ASSIGNED',
              notes: 'Assigned to advocate',
              changed_by: USER_A_ID,
              created_at: new Date().toISOString(),
            }],
          });

          const res = await request(app).get(`/api/v1/cases/${CASE_A_ID}/timeline`);
          expectSuccess(res, 200);
          expect(Array.isArray(res.body)).toBe(true);
        });
      });
    });
  });

  // ============================================================
  // DOCUMENTS ENDPOINTS - Cross-Tenant Tests
  // ============================================================
  describe('Documents - Cross-Tenant Isolation', () => {
    describe('GET /api/v1/cases/:caseId/documents', () => {
      it('FAIL: Tenant A cannot list Tenant B case documents (expects 404/403)', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });

          const res = await request(app).get(`/api/v1/cases/${CASE_B_ID}/documents`);
          expectBlocked(res);
        });
      });

      it('PASS: Tenant A can list own case documents', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery
            .mockResolvedValueOnce({ rows: [{ id: CASE_A_ID, org_id: TENANT_A_ID }] })
            .mockResolvedValueOnce(mockTenantDocuments(TENANT_A_ID, CASE_A_ID, DOCUMENT_A_ID));

          const res = await request(app).get(`/api/v1/cases/${CASE_A_ID}/documents`);
          expectSuccess(res, 200);
        });
      });
    });

    describe('POST /api/v1/cases/:caseId/documents', () => {
      it('FAIL: Tenant A cannot upload to Tenant B case (expects 403/404)', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery
            .mockResolvedValueOnce({ rows: [{ id: CASE_B_ID, org_id: TENANT_B_ID }] })
            .mockResolvedValueOnce({ rows: [] });

          const res = await request(app)
            .post(`/api/v1/cases/${CASE_B_ID}/documents`)
            .send({
              name: 'malicious.pdf',
              storage_path: `cases/${CASE_B_ID}/malicious.pdf`,
              bucket_id: 'case-documents',
              content_type: 'application/pdf',
              size_bytes: 1024,
              category: 'evidence',
            });

          expectBlocked(res);
        });
      });

      it('PASS: Tenant A can upload to own case', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery
            .mockResolvedValueOnce({ rows: [{ id: CASE_A_ID, org_id: TENANT_A_ID }] })
            .mockResolvedValueOnce(mockTenantDocuments(TENANT_A_ID, CASE_A_ID, DOCUMENT_A_ID, {
              uploader_id: USER_A_ID,
            }));

          const res = await request(app)
            .post(`/api/v1/cases/${CASE_A_ID}/documents`)
            .send({
              name: 'evidence.pdf',
              storage_path: `cases/${CASE_A_ID}/evidence.pdf`,
              bucket_id: 'case-documents',
              content_type: 'application/pdf',
              size_bytes: 1024,
              category: 'evidence',
            });

          expectSuccess(res, 201);
        });
      });
    });

    describe('GET /api/v1/cases/:caseId/documents/:documentId/download', () => {
      it('FAIL: Tenant A cannot download Tenant B document (expects 404/403)', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce({
            rows: [{ ...mockTenantDocuments(TENANT_B_ID, CASE_B_ID, DOCUMENT_B_ID).rows[0], org_id: TENANT_B_ID }],
          });

          const res = await request(app)
            .get(`/api/v1/cases/${CASE_B_ID}/documents/${DOCUMENT_B_ID}/download`);

          expectBlocked(res);
        });
      });

      it('PASS: Tenant A can download own document', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce({
            rows: [{ ...mockTenantDocuments(TENANT_A_ID, CASE_A_ID, DOCUMENT_A_ID).rows[0], org_id: TENANT_A_ID }],
          });

          const res = await request(app)
            .get(`/api/v1/cases/${CASE_A_ID}/documents/${DOCUMENT_A_ID}/download`);

          expectSuccess(res, 200);
        });
      });
    });

    describe('DELETE /api/v1/cases/:caseId/documents/:documentId', () => {
      it('FAIL: Tenant A cannot delete Tenant B document (expects 404/403)', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce({
            rows: [{ ...mockTenantDocuments(TENANT_B_ID, CASE_B_ID, DOCUMENT_B_ID).rows[0], org_id: TENANT_B_ID }],
          });

          const res = await request(app)
            .delete(`/api/v1/cases/${CASE_B_ID}/documents/${DOCUMENT_B_ID}`);

          expectBlocked(res);
        });
      });

      it('PASS: Tenant A can delete own document', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery
            .mockResolvedValueOnce({
              rows: [{ ...mockTenantDocuments(TENANT_A_ID, CASE_A_ID, DOCUMENT_A_ID).rows[0], org_id: TENANT_A_ID }],
            })
            .mockResolvedValueOnce({ rows: [] });

          const res = await request(app)
            .delete(`/api/v1/cases/${CASE_A_ID}/documents/${DOCUMENT_A_ID}`);

          expectSuccess(res, 200);
        });
      });
    });
  });

  // ============================================================
  // INVOICES ENDPOINTS - Cross-Tenant Tests
  // ============================================================
  describe('Invoices - Cross-Tenant Isolation', () => {
    describe('GET /api/v1/invoices/:id', () => {
      it('FAIL: Tenant A cannot access Tenant B invoice (expects 404/403)', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce({ rows: [] });

          const res = await request(app).get(`/api/v1/invoices/${INVOICE_B_ID}`);
          expectBlocked(res);
        });
      });

      it('PASS: Tenant A can access own invoice', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce(mockTenantInvoices(TENANT_A_ID, INVOICE_A_ID));

          const res = await request(app).get(`/api/v1/invoices/${INVOICE_A_ID}`);
          expectSuccess(res, 200);
          expect(res.body.id).toBe(INVOICE_A_ID);
        });
      });
    });

    describe('POST /api/v1/invoices/:id/send', () => {
      it('FAIL: Tenant A cannot send Tenant B invoice (expects 404/403)', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce({ rowCount: 0 });

          const res = await request(app).post(`/api/v1/invoices/${INVOICE_B_ID}/send`);
          expectBlocked(res);
        });
      });

      it('PASS: Tenant A can send own invoice', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce({ rowCount: 1, rows: [{ ...mockTenantInvoices(TENANT_A_ID, INVOICE_A_ID).rows[0], status: 'SENT' }] });

          const res = await request(app).post(`/api/v1/invoices/${INVOICE_A_ID}/send`);
          expectSuccess(res, 200);
          expect(res.body.invoice.status).toBe('SENT');
        });
      });
    });

    describe('POST /api/v1/invoices/:id/paid', () => {
      it('FAIL: Tenant A cannot mark Tenant B invoice as paid (expects 404/403)', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockClientQuery
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });

          const res = await request(app)
            .post(`/api/v1/invoices/${INVOICE_B_ID}/paid`)
            .send({ paid_at: new Date().toISOString() });

          expectBlocked(res);
        });
      });

      it('PASS: Tenant A can mark own invoice as paid', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockClientQuery
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ id: INVOICE_A_ID, org_id: TENANT_A_ID, advance_adjusted: '0' }] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce(mockTenantInvoices(TENANT_A_ID, INVOICE_A_ID, { status: 'PAID' }));

          const res = await request(app)
            .post(`/api/v1/invoices/${INVOICE_A_ID}/paid`)
            .send({ paid_at: new Date().toISOString() });

          expectSuccess(res, 200);
        });
      });
    });

    describe('POST /api/v1/invoices (generate)', () => {
      it('FAIL: Tenant A cannot generate invoice using Tenant B cases (expects 403/404)', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });

          const res = await request(app)
            .post('/api/v1/invoices')
            .send({ case_ids: [CASE_B_ID], tax_rate: 0.18, payment_terms_days: 30 });

          expectBlocked(res);
        });
      });

      it('PASS: Tenant A can generate invoice using own cases', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery
            .mockResolvedValueOnce({ rows: [{ id: CASE_A_ID }] })
            .mockResolvedValueOnce({ rows: [{
              id: INVOICE_A_ID,
              org_id: TENANT_A_ID,
              invoice_number: 'INV-2025-00001',
              status: 'DRAFT',
              subtotal: 10000,
              tax_rate: 0.18,
              tax_amount: 1800,
              total: 11800,
              advance_adjusted: 0,
              net_receivable: 11800,
              issued_at: new Date().toISOString(),
              due_at: new Date(Date.now() + 2592000000).toISOString(),
            }] });

          const res = await request(app)
            .post('/api/v1/invoices')
            .send({ case_ids: [CASE_A_ID], tax_rate: 0.18, payment_terms_days: 30 });

          expectSuccess(res, 201);
        });
      });
    });
  });

  // ============================================================
  // COLLABORATION (Tasks, Comments, Activities) - Cross-Tenant Tests
  // ============================================================
  describe('Collaboration - Cross-Tenant Isolation', () => {
    describe('Tasks - GET/POST/PATCH/DELETE /api/v1/tasks', () => {
      it('FAIL: Tenant A cannot access Tenant B tasks (expects 404/403)', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce({ rows: [] });

          const res = await request(app).get(`/api/v1/tasks?case_id=${CASE_B_ID}`);
          expectBlocked(res);
        });
      });

      it('FAIL: Tenant A cannot create task for Tenant B case (expects 403/404)', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });

          const res = await request(app)
            .post('/api/v1/tasks')
            .send({ case_id: CASE_B_ID, title: 'Cross-tenant task', description: 'Should fail', assignee_id: USER_B_ID });

          expectBlocked(res);
        });
      });

      it('FAIL: Tenant A cannot update Tenant B task (expects 403/404)', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce({ rows: [] });

          const res = await request(app)
            .patch(`/api/v1/tasks/${TASK_B_ID}`)
            .send({ status: 'completed' });

          expectBlocked(res);
        });
      });

      it('FAIL: Tenant A cannot delete Tenant B task (expects 403/404)', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce({ rows: [] });

          const res = await request(app).delete(`/api/v1/tasks/${TASK_B_ID}`);
          expectBlocked(res);
        });
      });
    });

    describe('Comments - GET/POST/DELETE /api/v1/comments', () => {
      it('FAIL: Tenant A cannot access Tenant B comments (expects 404/403)', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce({ rows: [] });

          const res = await request(app).get(`/api/v1/comments?task_id=${TASK_B_ID}`);
          expectBlocked(res);
        });
      });

      it('FAIL: Tenant A cannot create comment on Tenant B task (expects 403/404)', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });

          const res = await request(app)
            .post('/api/v1/comments')
            .send({ task_id: TASK_B_ID, content: 'Cross-tenant comment attempt' });

          expectBlocked(res);
        });
      });

      it('FAIL: Tenant A cannot delete Tenant B comment (expects 403/404)', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce({ rows: [] });

          const res = await request(app).delete(`/api/v1/comments/${COMMENT_B_ID}`);
          expectBlocked(res);
        });
      });
    });

    describe('Activities - GET /api/v1/activities', () => {
      it('FAIL: Tenant A cannot access Tenant B activities (expects 404/403)', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce({ rows: [] });

          const res = await request(app).get(`/api/v1/activities?case_id=${CASE_B_ID}`);
          expectBlocked(res);
        });
      });
    });
  });

  // ============================================================
  // EDGE CASES & SECURITY
  // ============================================================
  describe('Edge Cases - Security Verification', () => {
    it('Rejects requests without authentication', async () => {
      const res = await request(app).get(`/api/v1/cases/${CASE_A_ID}`);
      expect(res.status).toBe(401);
    });

    it('Rejects requests with invalid UUID format', async () => {
      await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
        const res = await request(app).get('/api/v1/cases/not-a-uuid');
        expect([400, 401, 404]).toContain(res.status);
      });
    });

    it('Ensures Tenant B data unchanged after Tenant A cross-tenant attempts', async () => {
      await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
        mockPoolQuery.mockResolvedValueOnce({ rows: [] });

        await request(app)
          .put(`/api/v1/cases/${CASE_B_ID}/status`)
          .send({ status: 'IN_PROGRESS' });

        const updateCalls = mockPoolQuery.mock.calls.filter(call =>
          call[0]?.includes('UPDATE cases SET status')
        );
        expect(updateCalls.length).toBe(0);
      });
    });

    it('PRINCIPAL role cannot bypass org isolation', async () => {
      await asTenant(TENANT_A_ID, USER_A_ID, 'PRINCIPAL', async () => {
        mockPoolQuery.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).get(`/api/v1/cases/${CASE_B_ID}`);
        expectBlocked(res);
      });
    });
  });

  // ============================================================
  // INTEGRATION: Full Cross-Tenant Scenario
  // ============================================================
  describe('Full Cross-Tenant Attack Scenario', () => {
    it('Tenant A attempts full CRUD on Tenant B resources - all blocked', async () => {
      await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
        mockPoolQuery.mockResolvedValue({ rows: [] });
        mockClientQuery.mockResolvedValue({ rows: [] });

        const results = [];

        results.push(await request(app).get(`/api/v1/cases/${CASE_B_ID}`));
        results.push(await request(app).put(`/api/v1/cases/${CASE_B_ID}/status`).send({ status: 'IN_PROGRESS' }));
        results.push(await request(app).patch(`/api/v1/cases/${CASE_B_ID}`).send({ status: 'ASSIGNED' }));
        results.push(await request(app).get(`/api/v1/cases/${CASE_B_ID}/timeline`));
        results.push(await request(app).get(`/api/v1/cases/${CASE_B_ID}/documents`));
        results.push(await request(app).post(`/api/v1/cases/${CASE_B_ID}/documents`).send({ name: 'x.pdf', storage_path: 'x.pdf', bucket_id: 'case-documents', content_type: 'application/pdf', size_bytes: 1 }));
        results.push(await request(app).get(`/api/v1/invoices/${INVOICE_B_ID}`));
        results.push(await request(app).post(`/api/v1/invoices/${INVOICE_B_ID}/send`));
        results.push(await request(app).post(`/api/v1/invoices/${INVOICE_B_ID}/paid`).send({ paid_at: new Date().toISOString() }));
        results.push(await request(app).get(`/api/v1/tasks?case_id=${CASE_B_ID}`));
        results.push(await request(app).post('/api/v1/tasks').send({ case_id: CASE_B_ID, title: 'x', assignee_id: USER_B_ID }));
        results.push(await request(app).get(`/api/v1/comments?task_id=${TASK_B_ID}`));
        results.push(await request(app).post('/api/v1/comments').send({ task_id: TASK_B_ID, content: 'x' }));
        results.push(await request(app).get(`/api/v1/activities?case_id=${CASE_B_ID}`));

        results.forEach(res => {
          expectBlocked(res);
        });
      });
    });
  });
});

// ============================================================
// DIRECT SERVICE TESTS (Unit-level tenant isolation)
// ============================================================
describe('CaseService - Cross-Tenant Access Control (Unit Tests)', () => {
  beforeEach(() => {
    mockPoolQuery.mockReset();
    mockClientQuery.mockReset();
    mockClientRelease.mockReset();
    mockPoolConnect.mockReset();

    mockPoolConnect.mockResolvedValue({
      query: mockClientQuery,
      release: mockClientRelease,
    });
    pool.query = mockPoolQuery;
    pool.connect = mockPoolConnect;
  });

  afterEach(() => {
    pool.query = originalPoolQuery;
    pool.connect = originalPoolConnect;
    vi.clearAllMocks();
  });

  it('updateStatus rejects cross-tenant access', async () => {
    const { CaseService } = await import('../../src/server/services/caseService.ts');

    mockClientQuery
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT - org_id mismatch
      .mockResolvedValueOnce({ rows: [] }) // ROLLBACK
      .mockResolvedValueOnce({ rows: [] }); // release

    await expect(
      CaseService.updateStatus(CASE_B_ID, 'IN_PROGRESS', USER_A_ID, 'Attack attempt', TENANT_A_ID)
    ).rejects.toThrow();

    expect(mockClientQuery).toHaveBeenCalledWith(
      'SELECT status, org_id FROM cases WHERE id = $1 AND org_id = $2',
      [CASE_B_ID, TENANT_A_ID]
    );
  });

  it('getCaseById rejects cross-tenant access', async () => {
    const { CaseService } = await import('../../src/server/services/caseService.ts');

    mockPoolQuery.mockResolvedValueOnce({ rows: [] });

    const result = await CaseService.getCaseById(CASE_B_ID, TENANT_A_ID);
    expect(result).toBeNull();
  });

  it('getCaseTimeline rejects cross-tenant access', async () => {
    const { CaseService } = await import('../../src/server/services/caseService.ts');

    mockPoolQuery.mockResolvedValueOnce({ rows: [] });

    const result = await CaseService.getCaseTimeline(CASE_B_ID, TENANT_A_ID);
    expect(result).toEqual([]);
  });

  it('createCase uses provided org_id', async () => {
    const { CaseService } = await import('../../src/server/services/caseService.ts');

    mockPoolQuery.mockResolvedValueOnce({ rows: [{ id: 'new-case-id', org_id: TENANT_B_ID }] });

    const result = await CaseService.createCase({
      org_id: TENANT_B_ID,
      bank_id: BANK_ID,
      case_type: 'TITLE_SEARCH',
      borrower_name: 'Test',
      loan_amount: 100000,
    });

    expect(result).toBeDefined();
    expect(mockPoolQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO cases'),
      expect.arrayContaining([TENANT_B_ID])
    );
  });
});

describe('Billing Functions - Cross-Tenant Access Control (Unit Tests)', () => {
  beforeEach(() => {
    mockPoolQuery.mockReset();
    mockClientQuery.mockReset();
    mockClientRelease.mockReset();
    mockPoolConnect.mockReset();

    mockPoolConnect.mockResolvedValue({
      query: mockClientQuery,
      release: mockClientRelease,
    });
    pool.query = mockPoolQuery;
    pool.connect = mockPoolConnect;
  });

  afterEach(() => {
    pool.query = originalPoolQuery;
    pool.connect = originalPoolConnect;
    vi.clearAllMocks();
  });

  it('markInvoiceSent rejects cross-tenant (0 rows affected)', async () => {
    const { markInvoiceSent } = await import('../../src/lib/billing.ts');

    mockPoolQuery.mockResolvedValueOnce({ rowCount: 0 });

    await markInvoiceSent(INVOICE_B_ID, TENANT_A_ID);

    expect(mockPoolQuery).toHaveBeenCalledWith(
      "UPDATE invoices SET status = 'SENT' WHERE id = $1 AND org_id = $2 AND status = 'DRAFT'",
      [INVOICE_B_ID, TENANT_A_ID]
    );
  });

  it('markInvoicePaid rejects cross-tenant (SELECT returns empty)', async () => {
    const { markInvoicePaid } = await import('../../src/lib/billing.ts');

    mockClientQuery
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT FOR UPDATE - no rows
      .mockResolvedValueOnce({ rows: [] }) // ROLLBACK
      .mockResolvedValueOnce({ rows: [] }); // release

    await expect(markInvoicePaid(INVOICE_B_ID, new Date(), TENANT_A_ID))
      .rejects.toThrow('Invoice not found');

    expect(mockClientQuery).toHaveBeenCalledWith(
      'SELECT * FROM invoices WHERE id = $1 AND org_id = $2 FOR UPDATE',
      [INVOICE_B_ID, TENANT_A_ID]
    );
  });

  it('autoMarkOverdueInvoices only affects specified org', async () => {
    const { autoMarkOverdueInvoices } = await import('../../src/lib/billing.ts');

    mockPoolQuery.mockResolvedValueOnce({ rowCount: 2 });

    const count = await autoMarkOverdueInvoices(TENANT_A_ID);

    expect(count).toBe(2);
    expect(mockPoolQuery).toHaveBeenCalledWith(
      "UPDATE invoices SET status = 'OVERDUE' WHERE org_id = $1 AND status = 'SENT' AND due_at < NOW()",
      [TENANT_A_ID]
    );
  });
});

describe('SLA Functions - Cross-Tenant Access Control (Unit Tests)', () => {
  beforeEach(() => {
    mockPoolQuery.mockReset();
    mockClientQuery.mockReset();
    mockClientRelease.mockReset();
    mockPoolConnect.mockReset();

    mockPoolConnect.mockResolvedValue({
      query: mockClientQuery,
      release: mockClientRelease,
    });
    pool.query = mockPoolQuery;
    pool.connect = mockPoolConnect;
  });

  afterEach(() => {
    pool.query = originalPoolQuery;
    pool.connect = originalPoolConnect;
    vi.clearAllMocks();
  });

  it('sendSLAWarnings UPDATE includes org_id', async () => {
    const { sendSLAWarnings } = await import('../../src/server/sla.ts');

    const warnings = [{
      caseId: CASE_B_ID,
      caseNumber: 'AGA-2025-00001',
      hoursRemaining: 12,
      deadline: new Date(),
    }];

    mockPoolQuery
      .mockResolvedValueOnce({ rows: [{ id: 'exec-1', full_name: 'John', email: 'john@test.com' }] })
      .mockResolvedValueOnce({ rows: [{ audit_id: 'audit-1' }] })
      .mockResolvedValueOnce({ rowCount: 0 });

    await sendSLAWarnings(warnings, TENANT_A_ID);

    expect(mockPoolQuery).toHaveBeenCalledWith(
      'UPDATE cases SET sla_warning_sent = true WHERE id = $1 AND org_id = $2',
      [CASE_B_ID, TENANT_A_ID]
    );
  });

  it('processSLABreaches UPDATE includes org_id', async () => {
    const { processSLABreaches } = await import('../../src/server/sla.ts');

    const breaches = [{
      caseId: CASE_B_ID,
      caseNumber: 'AGA-2025-00001',
      hoursOverdue: 5,
      deadline: new Date(),
    }];

    mockPoolQuery
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ audit_id: 'audit-1' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ audit_id: 'audit-2' }] })
      .mockResolvedValueOnce({ rowCount: 0 });

    await processSLABreaches(breaches, TENANT_A_ID);

    const updateCalls = mockPoolQuery.mock.calls.filter(call =>
      call[0].includes('UPDATE cases SET')
    );
    updateCalls.forEach(call => {
      expect(call[1]).toContain(TENANT_A_ID);
    });
  });

  it('triggerEscalation includes org_id in queries', async () => {
    const { triggerEscalation } = await import('../../src/server/sla.ts');

    const breach = {
      caseId: CASE_B_ID,
      caseNumber: 'AGA-2025-00001',
      hoursOverdue: 5,
      deadline: new Date(),
    };

    mockPoolQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'principal-1', full_name: 'Principal', email: 'principal@test.com', role: 'PRINCIPAL' }] })
      .mockResolvedValueOnce({ rows: [{ audit_id: 'audit-1' }] })
      .mockResolvedValueOnce({ rowCount: 0 });

    await triggerEscalation(breach, TENANT_A_ID);

    // Verify all queries that touch cases table include org_id
    const caseQueries = mockPoolQuery.mock.calls.filter(call =>
      call[0].includes('cases') && call[1]?.includes(TENANT_A_ID)
    );
    expect(caseQueries.length).toBeGreaterThan(0);
  });
});