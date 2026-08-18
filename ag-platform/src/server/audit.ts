import { pool } from './db.ts';
import { Request } from 'express';
import { logger } from './logger.ts';

export interface AuditEventData {
  orgId: string;
  eventType: string;
  eventCategory: string;
  actorId?: string;
  actorType?: string;
  actorName?: string;
  actorRole?: string;
  subjectType?: string;
  subjectId?: string;
  subjectReference?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changedFields?: string[];
  correlationId?: string;
  causationId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

export async function logAuditEvent(data: AuditEventData): Promise<string | null> {
  try {
    const result = await pool.query(
      `SELECT log_audit_event(
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20
      ) as audit_id`,
      [
        data.orgId,
        data.eventType,
        data.eventCategory,
        data.actorId || null,
        data.actorType || 'user',
        data.actorName || null,
        data.actorRole || null,
        data.subjectType || null,
        data.subjectId || null,
        data.subjectReference || null,
        JSON.stringify(data.oldValues || {}),
        JSON.stringify(data.newValues || {}),
        data.changedFields || [],
        data.correlationId || null,
        data.causationId || null,
        data.ipAddress || null,
        data.userAgent || null,
        data.requestId || null,
        JSON.stringify(data.metadata || {}),
        data.severity || 'info',
      ]
    );
    return result.rows[0]?.audit_id || null;
  } catch (error) {
    logger.error({ err: error, data }, 'Failed to log audit event');
    return null;
  }
}

// Helper functions for common audit events
export const AuditEvents = {
  case: {
    created: (data: { orgId: string; caseId: string; caseNumber: string; actorId?: string; actorName?: string; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'CASE_CREATED',
        eventCategory: 'case',
        actorId: data.actorId,
        actorName: data.actorName,
        actorType: 'user',
        subjectType: 'case',
        subjectId: data.caseId,
        subjectReference: data.caseNumber,
        newValues: { caseId: data.caseId, caseNumber: data.caseNumber },
        requestId: data.requestId,
      }),

    statusChanged: (data: { orgId: string; caseId: string; caseNumber: string; oldStatus: string; newStatus: string; actorId?: string; actorName?: string; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'CASE_STATUS_CHANGED',
        eventCategory: 'case',
        actorId: data.actorId,
        actorName: data.actorName,
        actorType: 'user',
        subjectType: 'case',
        subjectId: data.caseId,
        subjectReference: data.caseNumber,
        oldValues: { status: data.oldStatus },
        newValues: { status: data.newStatus },
        changedFields: ['status'],
        requestId: data.requestId,
      }),

    assigned: (data: { orgId: string; caseId: string; caseNumber: string; assigneeId: string; assigneeName: string; actorId?: string; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'CASE_ASSIGNED',
        eventCategory: 'case',
        actorId: data.actorId,
        actorName: data.actorName,
        actorType: 'user',
        subjectType: 'case',
        subjectId: data.caseId,
        subjectReference: data.caseNumber,
        newValues: { assigneeId: data.assigneeId, assigneeName: data.assigneeName },
        changedFields: ['assigned_executive_id'],
        requestId: data.requestId,
      }),
  },

  document: {
    uploaded: (data: { orgId: string; documentId: string; documentName: string; caseId: string; caseNumber: string; actorId?: string; actorName?: string; sizeBytes?: number; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'DOCUMENT_UPLOADED',
        eventCategory: 'document',
        actorId: data.actorId,
        actorName: data.actorName,
        actorType: 'user',
        subjectType: 'document',
        subjectId: data.documentId,
        subjectReference: data.documentName,
        newValues: { documentId: data.documentId, name: data.documentName, caseId: data.caseId, sizeBytes: data.sizeBytes },
        metadata: { caseNumber: data.caseNumber },
        requestId: data.requestId,
      }),

    downloaded: (data: { orgId: string; documentId: string; documentName: string; caseId: string; caseNumber: string; actorId?: string; actorName?: string; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'DOCUMENT_DOWNLOADED',
        eventCategory: 'document',
        actorId: data.actorId,
        actorName: data.actorName,
        actorType: 'user',
        subjectType: 'document',
        subjectId: data.documentId,
        subjectReference: data.documentName,
        metadata: { caseNumber: data.caseNumber },
        requestId: data.requestId,
      }),

    deleted: (data: { orgId: string; documentId: string; documentName: string; caseId: string; caseNumber: string; actorId?: string; actorName?: string; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'DOCUMENT_DELETED',
        eventCategory: 'document',
        actorId: data.actorId,
        actorName: data.actorName,
        actorType: 'user',
        subjectType: 'document',
        subjectId: data.documentId,
        subjectReference: data.documentName,
        oldValues: { documentId: data.documentId, name: data.documentName },
        metadata: { caseNumber: data.caseNumber },
        severity: 'warning',
        requestId: data.requestId,
      }),

    versioned: (data: { orgId: string; documentId: string; documentName: string; caseId: string; caseNumber: string; actorId?: string; actorName?: string; changes: Record<string, any>; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'DOCUMENT_VERSIONED',
        eventCategory: 'document',
        actorId: data.actorId,
        actorName: data.actorName,
        actorType: 'user',
        subjectType: 'document',
        subjectId: data.documentId,
        subjectReference: data.documentName,
        newValues: data.changes,
        changedFields: Object.keys(data.changes),
        metadata: { caseNumber: data.caseNumber },
        requestId: data.requestId,
      }),
  },

  disbursement: {
    created: (data: { orgId: string; disbursementId: string; caseId: string; caseNumber: string; amount: number; type: string; actorId?: string; actorName?: string; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'DISBURSEMENT_CREATED',
        eventCategory: 'disbursement',
        actorId: data.actorId,
        actorName: data.actorName,
        actorType: 'user',
        subjectType: 'disbursement',
        subjectId: data.disbursementId,
        subjectReference: data.caseNumber,
        newValues: { disbursementId: data.disbursementId, amount: data.amount, type: data.type },
        metadata: { caseNumber: data.caseNumber },
        requestId: data.requestId,
      }),

    reimbursed: (data: { orgId: string; disbursementId: string; caseId: string; caseNumber: string; amount: number; actorId?: string; actorName?: string; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'DISBURSEMENT_REIMBURSED',
        eventCategory: 'disbursement',
        actorId: data.actorId,
        actorName: data.actorName,
        actorType: 'user',
        subjectType: 'disbursement',
        subjectId: data.disbursementId,
        subjectReference: data.caseNumber,
        newValues: { is_reimbursed: true, reimbursed_at: new Date().toISOString() },
        changedFields: ['is_reimbursed', 'reimbursed_at'],
        metadata: { caseNumber: data.caseNumber, amount: data.amount },
        requestId: data.requestId,
      }),

    reconciled: (data: { orgId: string; disbursementId: string; caseId: string; caseNumber: string; amount: number; bankAdvanceUsed: number; actorId?: string; actorName?: string; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'DISBURSEMENT_RECONCILED',
        eventCategory: 'disbursement',
        actorId: data.actorId,
        actorName: data.actorName,
        actorType: 'user',
        subjectType: 'disbursement',
        subjectId: data.disbursementId,
        subjectReference: data.caseNumber,
        newValues: { bank_advance_used: data.bankAdvanceUsed, reconciled_at: new Date().toISOString() },
        changedFields: ['bank_advance_used'],
        metadata: { caseNumber: data.caseNumber, amount: data.amount },
        requestId: data.requestId,
      }),
  },

  invoice: {
    generated: (data: { orgId: string; invoiceId: string; invoiceNumber: string; caseIds: string[]; total: number; actorId?: string; actorName?: string; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'INVOICE_GENERATED',
        eventCategory: 'invoice',
        actorId: data.actorId,
        actorName: data.actorName,
        actorType: 'user',
        subjectType: 'invoice',
        subjectId: data.invoiceId,
        subjectReference: data.invoiceNumber,
        newValues: { invoiceId: data.invoiceId, invoiceNumber: data.invoiceNumber, total: data.total, caseIds: data.caseIds },
        metadata: { caseCount: data.caseIds.length },
        requestId: data.requestId,
      }),

    sent: (data: { orgId: string; invoiceId: string; invoiceNumber: string; actorId?: string; actorName?: string; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'INVOICE_SENT',
        eventCategory: 'invoice',
        actorId: data.actorId,
        actorName: data.actorName,
        actorType: 'user',
        subjectType: 'invoice',
        subjectId: data.invoiceId,
        subjectReference: data.invoiceNumber,
        oldValues: { status: 'DRAFT' },
        newValues: { status: 'SENT' },
        changedFields: ['status'],
        requestId: data.requestId,
      }),

    paid: (data: { orgId: string; invoiceId: string; invoiceNumber: string; amount: number; actorId?: string; actorName?: string; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'INVOICE_PAID',
        eventCategory: 'invoice',
        actorId: data.actorId,
        actorName: data.actorName,
        actorType: 'user',
        subjectType: 'invoice',
        subjectId: data.invoiceId,
        subjectReference: data.invoiceNumber,
        oldValues: { status: 'SENT' },
        newValues: { status: 'PAID', paid_at: new Date().toISOString() },
        changedFields: ['status', 'paid_at'],
        metadata: { amount: data.amount },
        requestId: data.requestId,
      }),

    overdue: (data: { orgId: string; invoiceId: string; invoiceNumber: string; daysOverdue: number; actorId?: string; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'INVOICE_OVERDUE',
        eventCategory: 'invoice',
        actorId: data.actorId,
        actorType: 'system',
        subjectType: 'invoice',
        subjectId: data.invoiceId,
        subjectReference: data.invoiceNumber,
        newValues: { status: 'OVERDUE', days_overdue: data.daysOverdue },
        changedFields: ['status'],
        severity: 'warning',
        metadata: { daysOverdue: data.daysOverdue },
        requestId: data.requestId,
      }),
  },

  timesheet: {
    logged: (data: { orgId: string; timesheetId: string; caseId: string; caseNumber: string; advocateName: string; durationMinutes: number; billableAmount: number; actorId?: string; actorName?: string; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'TIMESHEET_LOGGED',
        eventCategory: 'timesheet',
        actorId: data.actorId,
        actorName: data.actorName,
        actorType: 'user',
        subjectType: 'timesheet',
        subjectId: data.timesheetId,
        subjectReference: `${data.advocateName} - ${data.durationMinutes}min`,
        newValues: { durationMinutes: data.durationMinutes, billableAmount: data.billableAmount, caseId: data.caseId },
        metadata: { caseNumber: data.caseNumber, advocateName: data.advocateName },
        requestId: data.requestId,
      }),

    invoiced: (data: { orgId: string; timesheetId: string; invoiceId: string; invoiceNumber: string; actorId?: string; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'TIMESHEET_INVOICED',
        eventCategory: 'timesheet',
        actorId: data.actorId,
        actorType: 'system',
        subjectType: 'timesheet',
        subjectId: data.timesheetId,
        newValues: { invoiced: true, invoiceId: data.invoiceId },
        changedFields: ['invoiced', 'invoice_id'],
        metadata: { invoiceNumber: data.invoiceNumber },
        requestId: data.requestId,
      }),
  },

  bank: {
    advanceAdjusted: (data: { orgId: string; bankId: string; bankName: string; amount: number; invoiceId?: string; actorId?: string; actorName?: string; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'BANK_ADVANCE_ADJUSTED',
        eventCategory: 'bank',
        actorId: data.actorId,
        actorName: data.actorName,
        actorType: 'user',
        subjectType: 'bank',
        subjectId: data.bankId,
        subjectReference: data.bankName,
        newValues: { amount: data.amount, invoiceId: data.invoiceId },
        metadata: { bankName: data.bankName },
        requestId: data.requestId,
      }),

    synced: (data: { orgId: string; bankId: string; bankName: string; advanceBalance: number; actorId?: string; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'BANK_ADVANCE_SYNCED',
        eventCategory: 'bank',
        actorId: data.actorId,
        actorType: 'system',
        subjectType: 'bank',
        subjectId: data.bankId,
        subjectReference: data.bankName,
        newValues: { advance_balance: data.advanceBalance },
        metadata: { bankName: data.bankName },
        requestId: data.requestId,
      }),
  },

  rpa: {
    taskStarted: (data: { orgId: string; taskId: string; portal: string; caseId: string; caseNumber: string; actorId?: string; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'RPA_TASK_STARTED',
        eventCategory: 'rpa',
        actorId: data.actorId,
        actorType: 'rpa',
        subjectType: 'rpa_task',
        subjectId: data.taskId,
        subjectReference: `${data.portal} - ${data.caseNumber}`,
        newValues: { portal: data.portal, caseId: data.caseId },
        metadata: { caseNumber: data.caseNumber },
        requestId: data.requestId,
      }),

    taskCompleted: (data: { orgId: string; taskId: string; portal: string; caseId: string; caseNumber: string; result: any; actorId?: string; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'RPA_TASK_COMPLETED',
        eventCategory: 'rpa',
        actorId: data.actorId,
        actorType: 'rpa',
        subjectType: 'rpa_task',
        subjectId: data.taskId,
        subjectReference: `${data.portal} - ${data.caseNumber}`,
        newValues: { portal: data.portal, caseId: data.caseId, result: data.result },
        metadata: { caseNumber: data.caseNumber },
        requestId: data.requestId,
      }),

    taskFailed: (data: { orgId: string; taskId: string; portal: string; caseId: string; caseNumber: string; error: string; actorId?: string; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'RPA_TASK_FAILED',
        eventCategory: 'rpa',
        actorId: data.actorId,
        actorType: 'rpa',
        subjectType: 'rpa_task',
        subjectId: data.taskId,
        subjectReference: `${data.portal} - ${data.caseNumber}`,
        newValues: { portal: data.portal, caseId: data.caseId, error: data.error },
        metadata: { caseNumber: data.caseNumber },
        severity: 'error',
        requestId: data.requestId,
      }),
  },

  ai: {
    requestMade: (data: { orgId: string; endpoint: string; model: string; tokensIn: number; tokensOut: number; durationMs: number; actorId?: string; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'AI_REQUEST_MADE',
        eventCategory: 'ai',
        actorId: data.actorId,
        actorType: 'ai',
        subjectType: 'ai_request',
        newValues: { endpoint: data.endpoint, model: data.model, tokensIn: data.tokensIn, tokensOut: data.tokensOut, durationMs: data.durationMs },
        metadata: { model: data.model },
        requestId: data.requestId,
      }),
  },

  webhook: {
    received: (data: { orgId: string; webhookType: string; payload: any; sourceIp?: string; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'WEBHOOK_RECEIVED',
        eventCategory: 'webhook',
        actorType: 'webhook',
        subjectType: 'webhook',
        newValues: { type: data.webhookType, payload: data.payload },
        metadata: { sourceIp: data.sourceIp },
        requestId: data.requestId,
      }),

    processed: (data: { orgId: string; webhookType: string; result: any; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'WEBHOOK_PROCESSED',
        eventCategory: 'webhook',
        actorType: 'system',
        subjectType: 'webhook',
        newValues: { type: data.webhookType, result: data.result },
        requestId: data.requestId,
      }),
  },

  notification: {
    sent: (data: { orgId: string; notificationType: string; recipient: string; channel: string; subject?: string; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'NOTIFICATION_SENT',
        eventCategory: 'notification',
        actorType: 'system',
        subjectType: 'notification',
        newValues: { type: data.notificationType, recipient: data.recipient, channel: data.channel, subject: data.subject },
        metadata: { channel: data.channel },
        requestId: data.requestId,
      }),
  },

  sla: {
    warning: (data: { orgId: string; caseId: string; caseNumber: string; hoursRemaining: number; deadline: Date; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'SLA_WARNING',
        eventCategory: 'sla',
        actorType: 'system',
        subjectType: 'case',
        subjectId: data.caseId,
        subjectReference: data.caseNumber,
        newValues: { hoursRemaining: data.hoursRemaining, deadline: data.deadline.toISOString() },
        metadata: { caseNumber: data.caseNumber },
        severity: 'warning',
        requestId: data.requestId,
      }),

    breached: (data: { orgId: string; caseId: string; caseNumber: string; hoursOverdue: number; deadline: Date; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'SLA_BREACHED',
        eventCategory: 'sla',
        actorType: 'system',
        subjectType: 'case',
        subjectId: data.caseId,
        subjectReference: data.caseNumber,
        newValues: { hoursOverdue: data.hoursOverdue, deadline: data.deadline.toISOString() },
        metadata: { caseNumber: data.caseNumber },
        severity: 'critical',
        requestId: data.requestId,
      }),
  },

  escalation: {
    triggered: (data: { orgId: string; caseId: string; caseNumber: string; reason: string; escalatedTo: string; requestId?: string }) =>
      logAuditEvent({
        orgId: data.orgId,
        eventType: 'ESCALATION_TRIGGERED',
        eventCategory: 'escalation',
        actorType: 'system',
        subjectType: 'case',
        subjectId: data.caseId,
        subjectReference: data.caseNumber,
        newValues: { reason: data.reason, escalatedTo: data.escalatedTo },
        metadata: { caseNumber: data.caseNumber },
        severity: 'critical',
        requestId: data.requestId,
      }),
  },
};

// Middleware to extract request context for audit logging
export function auditContextMiddleware() {
  return (req: Request, res: any, next: any) => {
    // Set request context variables that trigger functions can access
    const userId = req.user?.id;
    if (userId) {
      // Store in a way that PL/pgSQL functions can access via current_setting
      // This would require setting a local GUC in PostgreSQL
      // For now, we'll rely on the audit service being called explicitly
    }
    next();
  }
};

// Extract client info for audit
export function getClientInfo(req: Request) {
  return {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    requestId: req.headers['x-request-id'] as string,
  };
}