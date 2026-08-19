import express from 'express';
import { pool } from '../db.ts';
import { createSupabaseMiddleware, requireOrgAccess } from '../auth.ts';
import { getSLADashboard, ensureSLAColumns, checkSLAWarnings, checkSLABreaches, sendSLAWarnings, processSLABreaches } from '../sla.ts';

const router = express.Router();

const authOrg = [createSupabaseMiddleware(), requireOrgAccess()];

// All dashboard routes require authentication + org access
router.use(...authOrg);

router.get('/dashboard/status', async (req, res) => {
  try {
    const orgId = req.user!.orgId!;

    const totalTemplates = await pool.query('SELECT COUNT(*)::int FROM cases WHERE org_id = $1', [orgId]);
    const activeAgents = await pool.query(
      "SELECT COUNT(DISTINCT assigned_executive_id)::int FROM cases WHERE org_id = $1 AND assigned_executive_id IS NOT NULL",
      [orgId]
    );
    const recentTimeline = await pool.query(
      `SELECT ct.notes as action, ct.created_at as timestamp, c.case_number as details
       FROM case_timeline ct JOIN cases c ON c.id = ct.case_id
       WHERE c.org_id = $1
       ORDER BY ct.created_at DESC LIMIT 10`,
      [orgId]
    );

    res.json({
      totalTemplates: totalTemplates.rows[0].count,
      activeAgents: activeAgents.rows[0].count,
      systemStatus: 'operational',
      recentActivities: recentTimeline.rows.map(r => ({
        action: r.action || 'Status update',
        timestamp: r.timestamp,
        details: r.details,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard status' });
  }
});

// SLA Dashboard endpoint
router.get('/dashboard/sla', async (req, res) => {
  try {
    const orgId = req.user!.orgId!;

    // Ensure SLA columns exist
    await ensureSLAColumns();

    const dashboard = await getSLADashboard(orgId);
    res.json({ success: true, dashboard });
  } catch (error) {
    console.error('SLA dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch SLA dashboard' });
  }
});

// SLA check endpoint (for cron job)
router.post('/dashboard/sla/check', async (req, res) => {
  try {
    const orgId = req.user!.orgId!;

    await ensureSLAColumns();
    
    const warnings = await checkSLAWarnings(orgId);
    const warningsSent = await sendSLAWarnings(warnings);
    
    const breaches = await checkSLABreaches(orgId);
    const breachesProcessed = await processSLABreaches(breaches);

    res.json({
      success: true,
      warnings: { total: warnings.length, sent: warningsSent },
      breaches: { total: breaches.length, processed: breachesProcessed },
    });
  } catch (error) {
    console.error('SLA check error:', error);
    res.status(500).json({ error: 'Failed to run SLA check' });
  }
});

export default router;