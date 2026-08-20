import { Decimal } from 'decimal.js';
import { pool } from '../server/db.ts';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export interface BillableEntry {
  id: string;
  case_id: string;
  case_number: string;
  org_id: string;
  profile_id: string;
  advocate_name: string;
  task_description: string;
  start_time: Date;
  end_time: Date | null;
  duration_minutes: number | null;
  hourly_rate: number | null;
  is_billable: boolean;
  billable_amount: number;
  invoiced: boolean;
  invoice_id: string | null;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  org_id: string;
  bank_id: string | null;
  case_ids: string[];
  billable_entries: BillableEntry[];
  subtotal: Decimal;
  tax_rate: Decimal;
  tax_amount: Decimal;
  total: Decimal;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  issued_at: Date;
  due_at: Date;
  paid_at: Date | null;
  advance_adjusted: Decimal;
  net_receivable: Decimal;
}

export interface BankAdvance {
  bank_id: string;
  bank_name: string;
  bank_short_code: string;
  current_balance: Decimal;
  total_advanced: Decimal;
  total_recovered: Decimal;
  last_reconciled_at: Date | null;
}

export interface DisbursementReconciliation {
  case_id: string;
  case_number: string;
  disbursement_type: string;
  amount_paid: Decimal;
  is_reimbursed: boolean;
  reimbursed_at: Date | null;
  bank_advance_used: Decimal;
}

export function calculateBillableFee(durationMinutes: number, hourlyRate: number): number {
  const safeDuration = Math.max(1, durationMinutes);
  const rawFee = new Decimal(safeDuration).div(60).mul(hourlyRate);
  return rawFee.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

export async function generateInvoiceFromTimesheets(
  orgId: string,
  caseIds: string[],
  bankId: string | null = null,
  taxRate: number = 0.18, // 18% GST
  paymentTermsDays: number = 30
): Promise<Invoice> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch billable timesheet entries
    const entriesResult = await client.query(
      `SELECT t.*, p.full_name as advocate_name, c.case_number
       FROM timesheets t
       JOIN profiles p ON p.id = t.profile_id
       JOIN cases c ON c.id = t.case_id
       WHERE t.org_id = $1 AND t.case_id = ANY($2) AND t.is_billable = true
       AND t.invoiced = false
       ORDER BY t.start_time ASC`,
      [orgId, caseIds]
    );

    const entries: BillableEntry[] = entriesResult.rows.map((row: any) => ({
      id: row.id,
      case_id: row.case_id,
      case_number: row.case_number,
      org_id: row.org_id,
      profile_id: row.profile_id,
      advocate_name: row.advocate_name,
      task_description: row.task_description,
      start_time: row.start_time,
      end_time: row.end_time,
      duration_minutes: row.duration_minutes,
      hourly_rate: row.hourly_rate ? new Decimal(row.hourly_rate).toNumber() : null,
      is_billable: row.is_billable,
      billable_amount: row.duration_minutes && row.hourly_rate
        ? calculateBillableFee(row.duration_minutes, row.hourly_rate)
        : 0,
      invoiced: false,
      invoice_id: null,
    }));

    if (entries.length === 0) {
      throw new Error('No billable entries found for the given cases');
    }

    // Calculate totals
    const subtotal = entries.reduce((sum, e) => sum.plus(e.billable_amount), new Decimal(0));
    const taxRateDecimal = new Decimal(taxRate);
    const taxAmount = subtotal.mul(taxRateDecimal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const total = subtotal.plus(taxAmount);

    // Check bank advance balance
    let advanceAdjusted = new Decimal(0);
    let netReceivable = total;

    if (bankId) {
      const advanceResult = await client.query(
        `SELECT advance_balance FROM banks WHERE id = $1`,
        [bankId]
      );
      if (advanceResult.rows.length > 0) {
        const advanceBalance = new Decimal(advanceResult.rows[0].advance_balance);
        if (advanceBalance.greaterThan(0)) {
          advanceAdjusted = Decimal.min(advanceBalance, total);
          netReceivable = total.minus(advanceAdjusted);
        }
      }
    }

    // Generate invoice number
    const invoiceNumberResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '\d+') AS INTEGER)), 0) + 1 as next_num
       FROM invoices WHERE invoice_number LIKE $1`,
      [`INV-${new Date().getFullYear()}-%`]
    );
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceNumberResult.rows[0].next_num).padStart(5, '0')}`;

    const now = new Date();
    const dueDate = new Date(now.getTime() + paymentTermsDays * 24 * 60 * 60 * 1000);

    // Create invoice
    const invoiceResult = await client.query(
      `INSERT INTO invoices
       (invoice_number, org_id, bank_id, subtotal, tax_rate, tax_amount, total, advance_adjusted, net_receivable, status, issued_at, due_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'DRAFT', $10, $11)
       RETURNING *`,
      [
        invoiceNumber, orgId, bankId,
        subtotal.toFixed(2), taxRateDecimal.toFixed(4), taxAmount.toFixed(2), total.toFixed(2),
        advanceAdjusted.toFixed(2), netReceivable.toFixed(2),
        now, dueDate
      ]
    );

    const invoice = invoiceResult.rows[0];

    // Link timesheet entries to invoice
    const entryIds = entries.map(e => e.id);
    await client.query(
      `UPDATE timesheets SET invoiced = true, invoice_id = $1 WHERE id = ANY($2)`,
      [invoice.id, entryIds]
    );

    // If bank advance used, update bank balance
    if (advanceAdjusted.greaterThan(0) && bankId) {
      await client.query(
        `UPDATE banks SET advance_balance = advance_balance - $1, total_recovered = total_recovered + $1 WHERE id = $2`,
        [advanceAdjusted.toFixed(2), bankId]
      );
    }

    await client.query('COMMIT');

    return {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      org_id: invoice.org_id,
      bank_id: invoice.bank_id,
      case_ids: caseIds,
      billable_entries: entries,
      subtotal,
      tax_rate: taxRateDecimal,
      tax_amount: taxAmount,
      total,
      status: 'DRAFT',
      issued_at: invoice.issued_at,
      due_at: invoice.due_at,
      paid_at: null,
      advance_adjusted: advanceAdjusted,
      net_receivable: netReceivable,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getBankAdvanceStatus(bankId: string): Promise<BankAdvance> {
  const result = await pool.query(
    `SELECT id, name, short_code, advance_balance, total_recovered
     FROM banks WHERE id = $1`,
    [bankId]
  );

  if (result.rows.length === 0) {
    throw new Error(`Bank not found: ${bankId}`);
  }

  const row = result.rows[0];
  return {
    bank_id: row.id,
    bank_name: row.name,
    bank_short_code: row.short_code,
    current_balance: new Decimal(row.advance_balance),
    total_advanced: new Decimal('0'), // Would need separate tracking table
    total_recovered: new Decimal(row.total_recovered || '0'),
    last_reconciled_at: null, // Would need reconciliation table
  };
}

export async function reconcileBankAdvances(orgId: string): Promise<DisbursementReconciliation[]> {
  const result = await pool.query(
    `SELECT d.*, c.case_number, c.bank_id
     FROM disbursements d
     JOIN cases c ON c.id = d.case_id
     WHERE c.org_id = $1 AND d.is_reimbursed = false
     ORDER BY d.paid_date ASC`,
    [orgId]
  );

  return result.rows.map((row: any) => ({
    case_id: row.case_id,
    case_number: row.case_number,
    disbursement_type: row.type,
    amount_paid: new Decimal(row.amount),
    is_reimbursed: row.is_reimbursed,
    reimbursed_at: row.reimbursed_at,
    bank_advance_used: new Decimal('0'), // Would need linking
  }));
}

export async function markInvoiceSent(invoiceId: string, orgId: string): Promise<void> {
  await pool.query(
    `UPDATE invoices SET status = 'SENT' WHERE id = $1 AND org_id = $2 AND status = 'DRAFT'`,
    [invoiceId, orgId]
  );
}

export async function markInvoicePaid(invoiceId: string, paidAt: Date, orgId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const invoiceResult = await client.query(
      `SELECT * FROM invoices WHERE id = $1 AND org_id = $2 FOR UPDATE`,
      [invoiceId, orgId]
    );

    if (invoiceResult.rows.length === 0) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    const invoice = invoiceResult.rows[0];

    await client.query(
      `UPDATE invoices SET status = 'PAID', paid_at = $1 WHERE id = $2 AND org_id = $3`,
      [paidAt, invoiceId, orgId]
    );

    // If there was advance adjusted, it's now fully reconciled
    if (new Decimal(invoice.advance_adjusted).greaterThan(0)) {
      // Advance already deducted from bank balance at invoice creation
      // Nothing more to do here
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getOutstandingInvoices(orgId: string): Promise<Invoice[]> {
  const result = await pool.query(
    `SELECT * FROM invoices WHERE org_id = $1 AND status IN ('SENT', 'OVERDUE') ORDER BY due_at ASC`,
    [orgId]
  );

  const now = new Date();
  return result.rows.map((row: any) => ({
    ...row,
    subtotal: new Decimal(row.subtotal),
    tax_rate: new Decimal(row.tax_rate),
    tax_amount: new Decimal(row.tax_amount),
    total: new Decimal(row.total),
    advance_adjusted: new Decimal(row.advance_adjusted),
    net_receivable: new Decimal(row.net_receivable),
    status: now > new Date(row.due_at) && row.status === 'SENT' ? 'OVERDUE' : row.status,
  }));
}

export async function autoMarkOverdueInvoices(orgId: string): Promise<number> {
  const result = await pool.query(
    `UPDATE invoices SET status = 'OVERDUE' WHERE org_id = $1 AND status = 'SENT' AND due_at < NOW()`,
    [orgId]
  );
  return result.rowCount ?? 0;
}

// Invoice PDF generation would use a library like pdfkit or @react-pdf/renderer
export interface InvoicePDFData {
  invoice: Invoice;
  orgName: string;
  orgAddress: string;
  orgGSTIN: string | null;
  bankName: string | null;
  bankAddress: string | null;
  bankGSTIN: string | null;
  caseDetails: Array<{
    caseNumber: string;
    borrowerName: string;
    entries: BillableEntry[];
  }>;
}