import crypto from 'crypto';
import { pool } from '../db.ts';
import { Case, CaseStatus } from '../../types/domain.ts';

export const CaseService = {
  async getActiveCases(orgId: string): Promise<Case[]> {
    const res = await pool.query('SELECT * FROM cases WHERE org_id = $1 ORDER BY sla_deadline ASC', [orgId]);
    return res.rows;
  },

  async getCaseById(id: string, orgId: string): Promise<Case | null> {
    const res = await pool.query('SELECT * FROM cases WHERE id = $1 AND org_id = $2', [id, orgId]);
    return res.rows[0] || null;
  },

  async createCase(data: Partial<Case>): Promise<Case> {
    const {
      org_id, bank_id, case_type, borrower_name, loan_amount,
      professional_fee, sla_deadline
    } = data;

    // Simple case number generator for now
    const randomValue = crypto.randomInt(100000);
    const caseNumber = `AGA-${new Date().getFullYear()}-${randomValue.toString().padStart(5, '0')}`;

    const res = await pool.query(
      `INSERT INTO cases (case_number, org_id, bank_id, case_type, borrower_name, loan_amount, professional_fee, sla_deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [caseNumber, org_id, bank_id, case_type, borrower_name, loan_amount, professional_fee, sla_deadline]
    );
    return res.rows[0];
  },

  async getCaseTimeline(id: string, orgId: string): Promise<any[]> {
    const res = await pool.query(
      'SELECT ct.* FROM case_timeline ct JOIN cases c ON c.id = ct.case_id WHERE ct.case_id = $1 AND c.org_id = $2 ORDER BY ct.created_at DESC',
      [id, orgId]
    );
    return res.rows;
  },

  async updateStatus(id: string, status: CaseStatus, userId: string, notes?: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const currentCase = await client.query('SELECT status FROM cases WHERE id = $1', [id]);
      if (!currentCase.rows[0]) {
        throw new Error('Case not found');
      }
      const oldStatus = currentCase.rows[0].status;

      await client.query('UPDATE cases SET status = $1 WHERE id = $2', [status, id]);

      await client.query(
        `INSERT INTO case_timeline (case_id, status_from, status_to, notes, changed_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, oldStatus, status, notes, userId]
      );

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
};