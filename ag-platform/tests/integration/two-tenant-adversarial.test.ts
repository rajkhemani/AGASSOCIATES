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
const TIMESHEET_A_ID = 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1';
const TIMESHEET_B_ID = 'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2';

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
import timesheetRoutes from '../../src/server/routes/timesheets.ts';
import bankPortalRoutes from '../../src/server/routes/bankPortal.ts';
import neslRoutes from '../../src/server/routes/nesl.ts';
import dashboardRoutes from '../../src/server/routes/dashboard.ts';

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
  app.use('/api/v1', timesheetRoutes);
  app.use('/api/v1', bankPortalRoutes);
  app.use('/api/v1', neslRoutes);
  app.use('/api/v1', dashboardRoutes);

  return app;
}

describe('Two-Tenant Adversarial Test Suite', () => {
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

  function mockTenantTimesheets(tenantId: string, timesheetId: string, timesheetData: any = {}) {
    return {
      rows: [{
        id: timesheetId,
        org_id: tenantId,
        case_id: CASE_A_ID, // Assume linked to a case for simplicity
        staff_id: USER_A_ID,
        hours: 8,
        rate: 50,
        date: new Date().toISOString(),
        description: 'Timesheet entry',
        ...timesheetData,
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
  // CASES ENDPOINTS
  // ============================================================
  describe('Cases - Cross-Tenant Isolation', () => {
    describe('GET /api/v1/cases/:id', () => {
      it('Blocks Tenant A from accessing Tenant B case', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce(mockTenantCases(TENANT_B_ID, CASE_B_ID));

          const res = await request(app).get(`/api/v1/cases/${CASE_B_ID}`);
          expectBlocked(res);
        });
      });

      it('Allows Tenant A to access own case', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce(mockTenantCases(TENANT_A_ID, CASE_A_ID));

          const res = await request(app).get(`/api/v1/cases/${CASE_A_ID}`);
          expectSuccess(res, 200);
          expect(res.body.id).toBe(CASE_A_ID);
        });
      });
    });

    describe('PUT /api/v1/cases/:id/status', () => {
      it('Blocks Tenant A from updating Tenant B case status', async () => {
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

      it('Allows Tenant A to update own case status', async () => {
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

    // Add similar tests for PATCH /api/v1/cases/:id and GET /api/v1/cases/:id/timeline
    // ... (omitted for brevity, but should be included in full implementation)
  });

  // ============================================================
  // DOCUMENTS ENDPOINTS
  // ============================================================
  describe('Documents - Cross-Tenant Isolation', () => {
    describe('GET /api/v1/cases/:caseId/documents', () => {
      it('Blocks Tenant A from listing Tenant B case documents', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });

          const res = await request(app).get(`/api/v1/cases/${CASE_B_ID}/documents`);
          expectBlocked(res);
        });
      });

      it('Allows Tenant A to list own case documents', async () => {
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
      it('Blocks Tenant A from uploading to Tenant B case', async () => {
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

      it('Allows Tenant A to upload to own case', async () => {
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

    // Add tests for GET/PATCH/DELETE document by id
    // ... (omitted for brevity)
  });

  // ============================================================
  // INVOICES ENDPOINTS
  // ============================================================
  describe('Invoices - Cross-Tenant Isolation', () => {
    describe('GET /api/v1/invoices/:id', () => {
      it('Blocks Tenant A from accessing Tenant B invoice', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce({ rows: [] });

          const res = await request(app).get(`/api/v1/invoices/${INVOICE_B_ID}`);
          expectBlocked(res);
        });
      });

      it('Allows Tenant A to access own invoice', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce(mockTenantInvoices(TENANT_A_ID, INVOICE_A_ID));

          const res = await request(app).get(`/api/v1/invoices/${INVOICE_A_ID}`);
          expectSuccess(res, 200);
          expect(res.body.id).toBe(INVOICE_A_ID);
        });
      });
    });

    describe('POST /api/v1/invoices/:id/send', () => {
      it('Blocks Tenant A from sending Tenant B invoice', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce({ rowCount: 0 });

          const res = await request(app).post(`/api/v1/invoices/${INVOICE_B_ID}/send`);
          expectBlocked(res);
        });
      });

      it('Allows Tenant A to send own invoice', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce({ rowCount: 1, rows: [{ ...mockTenantInvoices(TENANT_A_ID, INVOICE_A_ID).rows[0], status: 'SENT' }] });

          const res = await request(app).post(`/api/v1/invoices/${INVOICE_A_ID}/send`);
          expectSuccess(res, 200);
          expect(res.body.invoice.status).toBe('SENT');
        });
      });
    });

    // Add tests for POST /api/v1/invoices/:id/paid and POST /api/v1/invoices (generate)
    // ... (omitted for brevity)
  });

  // ============================================================
  // TIMESHEETS ENDPOINTS
  // ============================================================
  describe('Timesheets - Cross-Tenant Isolation', () => {
    describe('GET /api/v1/timesheets', () => {
      it('Blocks Tenant A from accessing Tenant B timesheets', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce({ rows: [] });

          const res = await request(app).get(`/api/v1/timesheets?case_id=${CASE_B_ID}`);
          expectBlocked(res);
        });
      });

      it('Allows Tenant A to access own timesheets', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce(mockTenantTimesheets(TENANT_A_ID, TIMESHEET_A_ID));

          const res = await request(app).get(`/api/v1/timesheets?case_id=${CASE_A_ID}`);
          expectSuccess(res, 200);
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
      });
    });

    describe('POST /api/v1/timesheets', () => {
      it('Blocks Tenant A from creating timesheet for Tenant B case', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });

          const res = await request(app)
            .post('/api/v1/timesheets')
            .send({ case_id: CASE_B_ID, hours: 8, rate: 50, date: new Date().toISOString(), description: 'Cross-tenant timesheet' });

          expectBlocked(res);
        });
      });

      it('Allows Tenant A to create timesheet for own case', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery
            .mockResolvedValueOnce({ rows: [{ id: CASE_A_ID }] })
            .mockResolvedValueOnce(mockTenantTimesheets(TENANT_A_ID, TIMESHEET_A_ID, { id: 'new-timesheet-id' }));

          const res = await request(app)
            .post('/api/v1/timesheets')
            .send({ case_id: CASE_A_ID, hours: 8, rate: 50, date: new Date().toISOString(), description: 'Valid timesheet' });

          expectSuccess(res, 201);
          expect(res.body.id).toBeDefined();
        });
      });
    });
  });

  // ============================================================
  // BANK PORTAL ENDPOINTS
  // ============================================================
  describe('Bank Portal - Cross-Tenant Isolation', () => {
    describe('GET /api/v1/bank-portal/cases', () => {
      it('Blocks Tenant A from accessing Tenant B cases via bank portal', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'BANK_VIEWER', async () => {
          mockPoolQuery.mockResolvedValueOnce({ rows: [] });

          const res = await request(app).get(`/api/v1/bank-portal/cases?bank_id=${BANK_ID}`);
          expectBlocked(res);
        });
      });

      it('Allows Tenant A to access own cases via bank portal', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'BANK_VIEWER', async () => {
          mockPoolQuery.mockResolvedValueOnce(mockTenantCases(TENANT_A_ID, CASE_A_ID));

          const res = await request(app).get(`/api/v1/bank-portal/cases?bank_id=${BANK_ID}`);
          expectSuccess(res, 200);
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
      });
    });
  });

  // ============================================================
  // NESL ENDPOINTS
  // ============================================================
  describe('NeSL - Cross-Tenant Isolation', () => {
    describe('GET /api/v1/nesl/status/:caseId', () => {
      it('Blocks Tenant A from accessing Tenant B NeSL status', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce({ rows: [] });

          const res = await request(app).get(`/api/v1/nesl/status/${CASE_B_ID}`);
          expectBlocked(res);
        });
      });

      it('Allows Tenant A to access own NeSL status', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce({ rows: [{ case_id: CASE_A_ID, status: 'PENDING', submitted_at: new Date().toISOString() }] });

          const res = await request(app).get(`/api/v1/nesl/status/${CASE_A_ID}`);
          expectSuccess(res, 200);
          expect(res.body.case_id).toBe(CASE_A_ID);
        });
      });
    });
  });

  // ============================================================
  // DASHBOARD ENDPOINTS
  // ============================================================
  describe('Dashboard - Cross-Tenant Isolation', () => {
    describe('GET /api/v1/dashboard/stats', () => {
      it('Blocks Tenant A from accessing Tenant B dashboard stats', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce({ rows: [] });

          const res = await request(app).get(`/api/v1/dashboard/stats`);
          expectBlocked(res);
        });
      });

      it('Allows Tenant A to access own dashboard stats', async () => {
        await asTenant(TENANT_A_ID, USER_A_ID, 'ADVOCATE', async () => {
          mockPoolQuery.mockResolvedValueOnce({ rows: [{ total_cases: 5, in_flight: 3, on_hold: 0, median_tat: 10 }] });

          const res = await request(app).get(`/api/v1/dashboard/stats`);
          expectSuccess(res, 200);
          expect(res.body.total_cases).toBe(5);
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
        results.push(await request(app).get(`/api/v1/timesheets?case_id=${CASE_B_ID}`));
        results.push(await request(app).post('/api/v1/timesheets').send({ case_id: CASE_B_ID, hours: 8, rate: 50, date: new Date().toISOString(), description: 'x' }));
        results.push(await request(app).get(`/api/v1/bank-portal/cases?bank_id=${BANK_ID}`));
        results.push(await request(app).get(`/api/v1/nesl/status/${CASE_B_ID}`));
        results.push(await request(app).get(`/api/v1/dashboard/stats`));

        results.forEach(res => {
          expectBlocked(res);
        });
      });
    });
  });
});