
import express from 'express';
import jwt from 'jsonwebtoken';
import { CaseService } from '../services/caseService.ts';
import { pool } from '../db.ts';

const router = express.Router();
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || '';

const DEV_USER_ID = '28a4eb7d-162c-4161-817d-20c30ffa5f46';

function setUser(req: express.Request) {
  if (!SUPABASE_JWT_SECRET) {
    (req as any).user = { sub: DEV_USER_ID, role: 'admin', email: 'dev@local' };
    return;
  }
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), SUPABASE_JWT_SECRET, { algorithms: ['HS256'] }) as any;
      (req as any).user = { sub: decoded.sub || DEV_USER_ID, role: decoded.app_metadata?.role || 'applicant', email: decoded.email };
    } catch { /* ignore */ }
  }
}

router.use('/cases', (req, _res, next) => { setUser(req); next(); });

router.get('/cases', async (_req, res) => {
  try {
    const cases = await CaseService.getActiveCases();
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

router.get('/cases/stats', async (req, res) => {
  try {
    const by = req.query.by;
    if (by === 'bank') {
      const result = await pool.query(`
        SELECT b.short_code, b.name, COUNT(c.id)::int as volume
        FROM cases c JOIN banks b ON b.id = c.bank_id
        GROUP BY b.short_code, b.name ORDER BY volume DESC
      `);
      res.json(result.rows);
      return;
    }
    const total = await pool.query("SELECT COUNT(*)::int FROM cases");
    const inFlight = await pool.query("SELECT COUNT(*)::int FROM cases WHERE status NOT IN ('CLOSED','DELIVERED','REJECTED')");
    const held = await pool.query("SELECT COUNT(*)::int FROM cases WHERE status = 'ON_HOLD'");
    const medianTat = await pool.query(`
      SELECT COALESCE(
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (updated_at - received_date))/3600),
        0
      )::numeric(10,1) as median_hours
      FROM cases WHERE status IN ('DELIVERED','CLOSED')
    `);
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

router.get('/cases/:id', async (req, res) => {
  try {
    const kase = await CaseService.getCaseById(req.params.id);
    if (!kase) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }
    res.json(kase);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch case' });
  }
});

router.get('/cases/:id/timeline', async (req, res) => {
  try {
    const entries = await CaseService.getCaseTimeline(req.params.id);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

router.post('/cases', async (req, res) => {
  try {
    const { borrower_name, org_id, bank_id, case_type } = req.body;
    if (!borrower_name || !org_id || !bank_id || !case_type) {
      res.status(400).json({ error: 'Missing required fields: borrower_name, org_id, bank_id, case_type' });
      return;
    }
    const newCase = await CaseService.createCase(req.body);
    res.status(201).json(newCase);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create case' });
  }
});

router.put('/cases/:id/status', async (req, res) => {
  let userId = DEV_USER_ID;
  try {
    const { status, notes } = req.body;
    userId = req.body.userId || (req as any).user?.sub || DEV_USER_ID;
    await CaseService.updateStatus(req.params.id, status, userId, notes);

    if (status === 'IN_PROGRESS') {
      const caseDetails = await CaseService.getCaseById(req.params.id);
      if (caseDetails) {
        const authHeader = req.headers.authorization || '';
        const aiBackend = process.env.AI_BACKEND_URL || 'http://127.0.0.1:8001';
        fetch(`${aiBackend}/api/generate-agreement`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({
            raw_input: `Case ${caseDetails.case_number} for ${caseDetails.borrower_name}. Type: ${caseDetails.case_type}. Loan Amount: ${caseDetails.loan_amount}. Please draft necessary legal documents.`,
            sender: userId || 'system'
          })
        }).catch(err => console.error("Failed to trigger AI pipeline:", err));
      }
    }

    res.status(200).json({ message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Frontend AdvisorCockpit calls PATCH /api/cases/:id with { status }
router.patch('/cases/:id', async (req, res) => {
  let userId = DEV_USER_ID;
  try {
    const { status, notes } = req.body;
    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }
    userId = req.headers['x-user-id'] as string || (req as any).user?.sub || DEV_USER_ID;
    await CaseService.updateStatus(req.params.id, status, userId, notes || 'Status updated via pipeline');
    const updatedCase = await CaseService.getCaseById(req.params.id);
    res.json(updatedCase);
  } catch (error: any) {
    console.error('PATCH case error:', error);
    console.error('PATCH req.user:', (req as any).user);
    console.error('PATCH userId used:', userId);
    res.status(500).json({ error: error.message || 'Failed to update case' });
  }
});

router.get('/workforce/agents/status', async (_req, res) => {
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
