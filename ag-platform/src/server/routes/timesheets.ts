import express from 'express';
import { pool } from '../db.ts';
import { createSupabaseMiddleware, requireOrgAccess, requireRole } from '../auth.ts';
import { validate, validateParams, CreateTimesheetSchema } from '../validation.ts';
import { z } from 'zod';
import { calculateBillableFee } from '../../lib/billing.ts';

const router = express.Router();

const authOrg = [createSupabaseMiddleware(), requireOrgAccess()];

// All timesheet routes require authentication + org access
router.use(...authOrg);

router.get('/timesheets', async (req, res) => {
  try {
    const { case_id, org_id } = req.query;
    const userOrgId = req.user!.orgId!;

    // Verify org access
    if (org_id && org_id !== userOrgId && req.user!.role !== 'PRINCIPAL') {
      return res.status(403).json({ error: 'Cannot access timesheets for another organization' });
    }

    let query = 'SELECT t.*, p.full_name as advocate_name FROM timesheets t JOIN profiles p ON t.profile_id = p.id WHERE t.org_id = $1';
    const params: any[] = [userOrgId];

    if (case_id) {
      params.push(case_id);
      query += ` AND t.case_id = $${params.length}`;
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch timesheets' });
  }
});

// Log a new timesheet entry
router.post('/timesheets', validate(CreateTimesheetSchema), async (req, res) => {
  try {
    const {
      org_id, case_id, profile_id, task_description,
      start_time, end_time, duration_minutes, is_billable, hourly_rate
    } = req.body;

    const userOrgId = req.user!.orgId!;

    // Verify org access
    if (org_id && org_id !== userOrgId && req.user!.role !== 'PRINCIPAL') {
      return res.status(403).json({ error: 'Cannot log timesheet for another organization' });
    }

    // Calculate billable amount if applicable
    let billableAmount = 0;
    if (is_billable && hourly_rate && duration_minutes !== undefined) {
      billableAmount = calculateBillableFee(duration_minutes, hourly_rate);
    }

    const result = await pool.query(
      `INSERT INTO timesheets
       (org_id, case_id, profile_id, task_description, start_time, end_time, duration_minutes, is_billable, hourly_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [org_id || userOrgId, case_id, profile_id, task_description, start_time, end_time, duration_minutes, is_billable, hourly_rate]
    );

    // Also update professional fee on the case if billable
    if (is_billable && hourly_rate && duration_minutes !== undefined) {
      await pool.query(
        `UPDATE cases SET professional_fee = professional_fee + $1 WHERE id = $2`,
        [billableAmount, case_id]
      );
    }

    res.status(201).json({ ...result.rows[0], billable_amount: billableAmount });
  } catch (error) {
    console.error("Timesheet error:", error);
    res.status(500).json({ error: 'Failed to log timesheet' });
  }
});

// Get billable timesheets for a case (not yet invoiced)
router.get('/cases/:caseId/billable', validateParams(z.object({ caseId: z.string().uuid() })), async (req, res) => {
  try {
    const userOrgId = req.user!.orgId!;

    // Verify case belongs to user's org
    const caseCheck = await pool.query('SELECT id FROM cases WHERE id = $1 AND org_id = $2', [req.params.caseId, userOrgId]);
    if (caseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const result = await pool.query(
      `SELECT t.*, p.full_name as advocate_name,
       CASE WHEN t.hourly_rate IS NOT NULL AND t.duration_minutes IS NOT NULL
         THEN ((t.duration_minutes::numeric / 60) * t.hourly_rate)::numeric(15,2)
         ELSE 0 END as billable_amount
       FROM timesheets t
       JOIN profiles p ON p.id = t.profile_id
       WHERE t.case_id = $1 AND t.is_billable = true AND t.invoiced = false
       ORDER BY t.start_time ASC`,
      [req.params.caseId]
    );

    const subtotal = result.rows.reduce((sum, row) => sum + Number(row.billable_amount || 0), 0);

    res.json({
      entries: result.rows,
      subtotal: subtotal.toFixed(2),
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Billable timesheets error:", error);
    res.status(500).json({ error: 'Failed to fetch billable timesheets' });
  }
});

// Get timesheet summary for organization (for invoice generation preview)
router.get('/summary', async (req, res) => {
  try {
    const userOrgId = req.user!.orgId!;
    const { case_ids } = req.query;

    if (!case_ids) {
      return res.status(400).json({ error: 'case_ids query parameter required' });
    }

    const caseIds = (case_ids as string).split(',');

    // Verify all cases belong to user's org
    const casesCheck = await pool.query(
      `SELECT id FROM cases WHERE id = ANY($1) AND org_id = $2`,
      [caseIds, userOrgId]
    );
    if (casesCheck.rows.length !== caseIds.length) {
      return res.status(403).json({ error: 'One or more cases not accessible' });
    }

    const result = await pool.query(
      `SELECT t.*, p.full_name as advocate_name, c.case_number,
       CASE WHEN t.hourly_rate IS NOT NULL AND t.duration_minutes IS NOT NULL
         THEN ((t.duration_minutes::numeric / 60) * t.hourly_rate)::numeric(15,2)
         ELSE 0 END as billable_amount
       FROM timesheets t
       JOIN profiles p ON p.id = t.profile_id
       JOIN cases c ON c.id = t.case_id
       WHERE t.org_id = $1 AND t.case_id = ANY($2) AND t.is_billable = true AND t.invoiced = false
       ORDER BY t.start_time ASC`,
      [userOrgId, caseIds]
    );

    const entries = result.rows;
    const subtotal = entries.reduce((sum, row) => sum + Number(row.billable_amount || 0), 0);

    res.json({
      entries,
      subtotal: subtotal.toFixed(2),
      total_billable_hours: entries.reduce((sum, row) => sum + Number(row.duration_minutes || 0), 0) / 60,
      count: entries.length,
    });
  } catch (error) {
    console.error("Timesheet summary error:", error);
    res.status(500).json({ error: 'Failed to fetch timesheet summary' });
  }
});

export default router;