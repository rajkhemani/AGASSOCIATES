import express from 'express';
import { pool } from '../db.ts';

const router = express.Router();

router.get('/dashboard/status', async (_req, res) => {
  try {
    const totalTemplates = await pool.query('SELECT COUNT(*)::int FROM cases');
    const activeAgents = await pool.query(
      "SELECT COUNT(DISTINCT assigned_executive_id)::int FROM cases WHERE assigned_executive_id IS NOT NULL"
    );
    const recentTimeline = await pool.query(
      `SELECT ct.notes as action, ct.created_at as timestamp, c.case_number as details
       FROM case_timeline ct JOIN cases c ON c.id = ct.case_id
       ORDER BY ct.created_at DESC LIMIT 10`
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

export default router;
