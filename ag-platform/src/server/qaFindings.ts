import { pool } from './db.ts';

export type QAFindingSeverity = 'low' | 'medium' | 'high' | 'critical';
export type QAFindingStatus = 'open' | 'acknowledged' | 'resolved' | 'dismissed';

export interface QAFindingInput {
  orgId: string;
  caseId: string;
  code: string;
  title: string;
  description?: string;
  severity: QAFindingSeverity;
  source?: string;
  evidence?: Record<string, unknown>;
  createdBy?: string;
}

export interface QAFinding extends QAFindingInput {
  id: string;
  status: QAFindingStatus;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
}

export function normalizeQAFinding(input: QAFindingInput): QAFindingInput {
  const code = input.code.trim();
  const title = input.title.trim();
  if (!code || !title) throw new Error('QA finding code and title are required');

  return {
    ...input,
    code,
    title,
    description: input.description?.trim() || undefined,
    source: input.source?.trim() || 'rule',
    evidence: input.evidence ?? {},
  };
}

export async function createQAFinding(input: QAFindingInput): Promise<QAFinding> {
  const finding = normalizeQAFinding(input);
  const result = await pool.query(
    `INSERT INTO qa_findings
      (org_id, case_id, finding_code, title, description, severity, source, evidence, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, org_id, case_id, finding_code AS code, title, description, severity,
       source, evidence, status, created_at AS "createdAt", updated_at AS "updatedAt",
       resolved_at AS "resolvedAt", resolved_by AS "resolvedBy"`,
    [
      finding.orgId,
      finding.caseId,
      finding.code,
      finding.title,
      finding.description ?? null,
      finding.severity,
      finding.source,
      finding.evidence,
      finding.createdBy ?? null,
    ],
  );
  return result.rows[0] as QAFinding;
}

export async function listQAFindings(orgId: string, caseId: string): Promise<QAFinding[]> {
  const result = await pool.query(
    `SELECT id, org_id, case_id, finding_code AS code, title, description, severity,
      source, evidence, status, created_at AS "createdAt", updated_at AS "updatedAt",
      resolved_at AS "resolvedAt", resolved_by AS "resolvedBy"
     FROM qa_findings WHERE org_id = $1 AND case_id = $2
     ORDER BY created_at DESC`,
    [orgId, caseId],
  );
  return result.rows as QAFinding[];
}
