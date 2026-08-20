import express from 'express';
import { pool } from '../db.ts';
import { createSupabaseMiddleware, requireOrgAccess, requireRole } from '../auth.ts';
import { validate, validateParams } from '../validation.ts';
import { z } from 'zod';
import {
  generateInvoiceFromTimesheets,
  getBankAdvanceStatus,
  reconcileBankAdvances,
  markInvoiceSent,
  markInvoicePaid,
  getOutstandingInvoices,
  autoMarkOverdueInvoices,
} from '../../lib/billing.ts';

const router = express.Router();

const authOrg = [createSupabaseMiddleware(), requireOrgAccess()];

// All invoice routes require authentication + org access
router.use(...authOrg);

// Validation schemas
const invoiceCreateSchema = z.object({
  case_ids: z.array(z.string().uuid()).min(1, 'At least one case ID required'),
  bank_id: z.string().uuid().optional(),
  tax_rate: z.number().min(0).max(1).default(0.18),
  payment_terms_days: z.number().int().positive().default(30),
});

const invoiceParamsSchema = z.object({ id: z.string().uuid() });

const markPaidSchema = z.object({
  paid_at: z.string().datetime().optional(),
});

// POST /api/v1/invoices - Generate invoice from timesheets
router.post('/invoices', validate(invoiceCreateSchema), async (req, res) => {
  try {
    const { case_ids, bank_id, tax_rate, payment_terms_days } = req.body;
    const orgId = req.user!.orgId!;

    // Verify all cases belong to user's org
    const casesCheck = await pool.query(
      `SELECT id FROM cases WHERE id = ANY($1) AND org_id = $2`,
      [case_ids, orgId]
    );
    if (casesCheck.rows.length !== case_ids.length) {
      return res.status(403).json({ error: 'One or more cases not accessible' });
    }

    const invoice = await generateInvoiceFromTimesheets(
      orgId,
      case_ids,
      bank_id || null,
      tax_rate,
      payment_terms_days
    );

    res.status(201).json({ success: true, invoice });
  } catch (error: any) {
    console.error('Invoice generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate invoice' });
  }
});

// GET /api/v1/invoices - List invoices for organization
router.get('/invoices', async (req, res) => {
  try {
    const orgId = req.user!.orgId!;
    const { status } = req.query;

    let query = 'SELECT * FROM invoices WHERE org_id = $1';
    const params: any[] = [orgId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY issued_at DESC';

    const result = await pool.query(query, params);

    const invoices = result.rows.map(row => ({
      ...row,
      subtotal: row.subtotal,
      tax_rate: row.tax_rate,
      tax_amount: row.tax_amount,
      total: row.total,
      advance_adjusted: row.advance_adjusted,
      net_receivable: row.net_receivable,
    }));

    res.json({ invoices });
  } catch (error) {
    console.error('List invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// GET /api/v1/invoices/outstanding - Get outstanding invoices
router.get('/invoices/outstanding', async (req, res) => {
  try {
    const orgId = req.user!.orgId!;
    const invoices = await getOutstandingInvoices(orgId);
    res.json({ invoices });
  } catch (error) {
    console.error('Outstanding invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch outstanding invoices' });
  }
});

// GET /api/v1/invoices/:id - Get invoice by ID
router.get('/invoices/:id', validateParams(invoiceParamsSchema), async (req, res) => {
  try {
    const orgId = req.user!.orgId!;
    const result = await pool.query(
      `SELECT i.*, 
        json_agg(json_build_object(
          'id', ili.id,
          'description', ili.description,
          'quantity', ili.quantity,
          'rate', ili.rate,
          'amount', ili.amount
        )) as line_items
       FROM invoices i
       LEFT JOIN invoice_line_items ili ON ili.invoice_id = i.id
       WHERE i.id = $1 AND i.org_id = $2
       GROUP BY i.id`,
      [req.params.id, orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const row = result.rows[0];
    res.json({
      ...row,
      subtotal: row.subtotal,
      tax_rate: row.tax_rate,
      tax_amount: row.tax_amount,
      total: row.total,
      advance_adjusted: row.advance_adjusted,
      net_receivable: row.net_receivable,
      line_items: row.line_items || [],
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// POST /api/v1/invoices/:id/send - Mark invoice as sent
router.post('/invoices/:id/send', validateParams(invoiceParamsSchema), async (req, res) => {
  try {
    const orgId = req.user!.orgId!;
    const result = await pool.query(
      `UPDATE invoices SET status = 'SENT' WHERE id = $1 AND org_id = $2 AND status = 'DRAFT' RETURNING *`,
      [req.params.id, orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found or not in DRAFT status' });
    }

    res.json({ success: true, invoice: result.rows[0] });
  } catch (error) {
    console.error('Send invoice error:', error);
    res.status(500).json({ error: 'Failed to send invoice' });
  }
});

// POST /api/v1/invoices/:id/paid - Mark invoice as paid
router.post('/invoices/:id/paid', validateParams(invoiceParamsSchema), validate(markPaidSchema), async (req, res) => {
  try {
    const orgId = req.user!.orgId!;
    const paidAt = req.body.paid_at ? new Date(req.body.paid_at) : new Date();

    // Verify ownership
    const invoiceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const check = await pool.query(
      `SELECT id FROM invoices WHERE id = $1 AND org_id = $2`,
      [invoiceId, orgId]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    await markInvoicePaid(invoiceId, paidAt, orgId);

    const result = await pool.query(
      `SELECT * FROM invoices WHERE id = $1`,
      [invoiceId]
    );

    res.json({ success: true, invoice: result.rows[0] });
  } catch (error) {
    console.error('Mark invoice paid error:', error);
    res.status(500).json({ error: 'Failed to mark invoice as paid' });
  }
});

// GET /api/v1/banks/:id/advance-status - Get bank advance status
router.get('/banks/:id/advance-status', validateParams(z.object({ id: z.string().uuid() })), async (req, res) => {
  try {
    const bankId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const advance = await getBankAdvanceStatus(bankId);
    res.json({ advance });
  } catch (error) {
    console.error('Bank advance status error:', error);
    res.status(500).json({ error: 'Failed to fetch bank advance status' });
  }
});

// GET /api/v1/reconcile - Reconcile bank advances for organization
router.get('/reconcile', requireRole('PRINCIPAL', 'ADVOCATE'), async (req, res) => {
  try {
    const orgId = req.user!.orgId!;
    const reconciliations = await reconcileBankAdvances(orgId);
    res.json({ reconciliations });
  } catch (error) {
    console.error('Reconciliation error:', error);
    res.status(500).json({ error: 'Failed to reconcile bank advances' });
  }
});

// POST /api/v1/invoices/auto-overdue - Auto-mark overdue invoices (cron job)
router.post('/invoices/auto-overdue', requireRole('PRINCIPAL'), async (req, res) => {
  try {
    const count = await autoMarkOverdueInvoices(orgId);
    res.json({ success: true, marked_overdue: count });
  } catch (error) {
    console.error('Auto overdue error:', error);
    res.status(500).json({ error: 'Failed to mark overdue invoices' });
  }
});

export default router;