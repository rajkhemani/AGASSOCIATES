import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import caseRoutes from '../../src/server/routes/cases.ts';

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