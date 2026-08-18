import express from 'express';
import { CaseService } from '../services/caseService.ts';
import { pool } from '../db.ts';
import { createSupabaseMiddleware, requireRole, requireOrgAccess } from '../auth.ts';
import { validate, validateParams, CreateCaseSchema, UpdateCaseStatusSchema } from '../validation.ts';
import { z } from 'zod';

const router = express.Router();

const auth = createSupabaseMiddleware();
const authOrg = [createSupabaseMiddleware(), requireOrgAccess()];

// All routes require authentication
router.use(auth);

// UUID param validation
const uuidParam = z.object({ id: z.string().uuid() });

// GET /api/cases - List cases (org-scoped via RLS)
router.get('/cases', async (req, res) => {
  try {
    const cases = await CaseService.getActiveCases(req.user!.orgId!);
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

// GET /api/cases/stats - Dashboard stats (org-scoped)
router.get('/cases/stats', async (req, res) => {
  try {
    const orgId = req.user!.orgId!;
    const by = req.query.by;

    if (by === 'bank') {
      const result = await pool.query(`
        SELECT b.short_code, b.name, COUNT(c.id)::int as volume
        FROM cases c JOIN banks b ON b.id = c.bank_id
        WHERE c.org_id = $1
        GROUP BY b.short_code, b.name ORDER BY volume DESC
      `, [orgId]);
      res.json(result.rows);
      return;
    }

    const total = await pool.query("SELECT COUNT(*)::int FROM cases WHERE org_id = $1", [orgId]);
    const inFlight = await pool.query("SELECT COUNT(*)::int FROM cases WHERE org_id = $1 AND status NOT IN ('CLOSED','DELIVERED','REJECTED')", [orgId]);
    const held = await pool.query("SELECT COUNT(*)::int FROM cases WHERE org_id = $1 AND status = 'ON_HOLD'", [orgId]);
    const medianTat = await pool.query(`
      SELECT COALESCE(
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (updated_at - received_date))/3600),
        0
      )::numeric(10,1) as median_hours
      FROM cases WHERE org_id = $1 AND status IN ('DELIVERED','CLOSED')
    `, [orgId]);

    res.json({
      total: total.rows[0].count,
      inFlight: inFlight.rows[0].count,
      held: held.rows[0].count,
      medianTat: medianTat.rows[0].median_hours,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch case stats' });
  }
});

// GET /api/cases/:id - Get case by ID (org-scoped via RLS)
router.get('/cases/:id', validateParams(uuidParam), async (req, res) => {
  try {
    const caseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const kase = await CaseService.getCaseById(caseId, req.user!.orgId!);
    if (!kase) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }
    res.json(kase);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch case' });
  }
});

// GET /api/cases/:id/timeline - Get case timeline
router.get('/cases/:id/timeline', validateParams(uuidParam), async (req, res) => {
  try {
    const caseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const entries = await CaseService.getCaseTimeline(caseId, req.user!.orgId!);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

// POST /api/cases - Create case (requires org access)
router.post('/cases', validate(CreateCaseSchema), async (req, res) => {
  try {
    const { org_id } = req.body;

    // Verify user has access to this org
    if (req.user!.orgId !== org_id && req.user!.role !== 'PRINCIPAL') {
      res.status(403).json({ error: 'Cannot create case for another organization' });
      return;
    }

    const newCase = await CaseService.createCase(req.body);
    res.status(201).json(newCase);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create case' });
  }
});

// PUT /api/cases/:id/status - Update case status
router.put('/cases/:id/status', validateParams(uuidParam), validate(UpdateCaseStatusSchema), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const userId = req.user!.id;
    const caseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    await CaseService.updateStatus(caseId, status, userId, notes);

    // Trigger AI pipeline for IN_PROGRESS status
    if (status === 'IN_PROGRESS') {
      const caseDetails = await CaseService.getCaseById(caseId, req.user!.orgId!);
      if (caseDetails) {
        const aiBackend = process.env.AI_BACKEND_URL || 'http://127.0.0.1:8001';
        fetch(`${aiBackend}/api/generate-agreement`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            raw_input: `Case ${caseDetails.case_number} for ${caseDetails.borrower_name}. Type: ${caseDetails.case_type}. Loan Amount: ${caseDetails.loan_amount}. Please draft necessary legal documents.`,
            sender: userId,
          }),
        }).catch(err => console.error("Failed to trigger AI pipeline:", err));
      }
    }

    res.status(200).json({ message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// PATCH /api/cases/:id - Update case (Frontend AdvisorCockpit)
router.patch('/cases/:id', validateParams(uuidParam), validate(UpdateCaseStatusSchema), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const caseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    await CaseService.updateStatus(caseId, status, req.user!.id, notes || 'Status updated via pipeline');
    const updatedCase = await CaseService.getCaseById(caseId, req.user!.orgId!);
    res.json(updatedCase);
  } catch (error: any) {
    console.error('PATCH case error:', error);
    res.status(500).json({ error: error.message || 'Failed to update case' });
  }
});

// Workforce agents status (admin only)
router.get('/workforce/agents/status', requireRole('PRINCIPAL', 'ADVOCATE'), async (_req, res) => {
  res.json({
    agents: [
      { name: 'Aisha', role: 'Intake & OCR', load: 72, status: 'active' },
      { name: 'Kasun', role: 'Title Search', load: 85, status: 'active' },
      { name: 'Ravi', role: 'Document Collection', load: 45, status: 'active' },
      { name: 'Lakshmi', role: 'Legal Vetting', load: 63, status: 'active' },
      { name: 'Priya', role: 'Deed Drafting', load: 58, status: 'active' },
      { name: 'Arjun', role: 'Registrations & CERSAI', load: 91, status: 'active' },
    ],
    cluster: 'online',
    today: 23,
    avgTatHours: 3.2,
    cersaiFiled: 19,
  });
});

export default router;