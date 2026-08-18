import { pool } from './db.ts';
import { logger } from './logger.ts';
import { AuditEvents } from './audit.ts';

export interface SLAConfig {
  caseType: string;
  warningHours: number; // Hours before deadline to warn
  breachHours: number; // Hours after deadline to mark breached
  businessHoursOnly: boolean;
  businessHoursStart: number; // 0-23
  businessHoursEnd: number; // 0-23
  workingDaysOnly: boolean; // Mon-Fri only
}

export interface SLACase {
  id: string;
  caseNumber: string;
  caseType: string;
  orgId: string;
  status: string;
  slaDeadline: Date | null;
  receivedDate: Date;
  assignedExecutiveId: string | null;
  slaWarningSent: boolean;
  slaBreached: boolean;
  slaEscalated: boolean;
}

export interface SLAWarning {
  caseId: string;
  caseNumber: string;
  hoursRemaining: number;
  deadline: Date;
}

export interface SLABreach {
  caseId: string;
  caseNumber: string;
  hoursOverdue: number;
  deadline: Date;
}

// Default SLA configs per case type
const DEFAULT_SLA_CONFIGS: Record<string, SLAConfig> = {
  INTIMATION_MORTGAGE: {
    caseType: 'INTIMATION_MORTGAGE',
    warningHours: 24,
    breachHours: 0,
    businessHoursOnly: true,
    businessHoursStart: 10,
    businessHoursEnd: 18,
    workingDaysOnly: true,
  },
  MORTGAGE_REGISTRATION: {
    caseType: 'MORTGAGE_REGISTRATION',
    warningHours: 48,
    breachHours: 24,
    businessHoursOnly: true,
    businessHoursStart: 10,
    businessHoursEnd: 18,
    workingDaysOnly: true,
  },
  PROPERTY_REGISTRATION: {
    caseType: 'PROPERTY_REGISTRATION',
    warningHours: 48,
    breachHours: 24,
    businessHoursOnly: true,
    businessHoursStart: 10,
    businessHoursEnd: 18,
    workingDaysOnly: true,
  },
  TITLE_SEARCH: {
    caseType: 'TITLE_SEARCH',
    warningHours: 72,
    breachHours: 48,
    businessHoursOnly: true,
    businessHoursStart: 10,
    businessHoursEnd: 18,
    workingDaysOnly: true,
  },
  LEGAL_VETTING: {
    caseType: 'LEGAL_VETTING',
    warningHours: 72,
    breachHours: 48,
    businessHoursOnly: true,
    businessHoursStart: 10,
    businessHoursEnd: 18,
    workingDaysOnly: true,
  },
  DEFAULT: {
    caseType: 'DEFAULT',
    warningHours: 48,
    breachHours: 24,
    businessHoursOnly: true,
    businessHoursStart: 10,
    businessHoursEnd: 18,
    workingDaysOnly: true,
  },
};

function getSLAConfig(caseType: string): SLAConfig {
  return DEFAULT_SLA_CONFIGS[caseType] || DEFAULT_SLA_CONFIGS.DEFAULT;
}

function isBusinessHours(date: Date, config: SLAConfig): boolean {
  if (!config.businessHoursOnly) return true;
  
  const hour = date.getHours();
  if (hour < config.businessHoursStart || hour >= config.businessHoursEnd) {
    return false;
  }
  
  if (config.workingDaysOnly) {
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) return false;
  }
  
  return true;
}

function addBusinessHours(date: Date, hours: number, config: SLAConfig): Date {
  const result = new Date(date);
  let remainingHours = hours;
  
  while (remainingHours > 0) {
    result.setHours(result.getHours() + 1);
    if (isBusinessHours(result, config)) {
      remainingHours--;
    }
  }
  
  return result;
}

function calculateSLADeadline(receivedDate: Date, caseType: string): Date | null {
  const config = getSLAConfig(caseType);
  
  // For NOI, the deadline is 30 days from mortgage creation (received_date)
  // For others, use config
  if (caseType === 'INTIMATION_MORTGAGE') {
    const deadline = new Date(receivedDate);
    deadline.setDate(deadline.getDate() + 30);
    return deadline;
  }
  
  // Default: use business hours calculation
  return addBusinessHours(receivedDate, config.warningHours + config.breachHours, config);
}

export async function computeSLACases(orgId: string): Promise<SLACase[]> {
  const result = await pool.query(
    `SELECT 
      id, case_number, case_type, org_id, status, sla_deadline, 
      received_date, assigned_executive_id,
      sla_warning_sent, sla_breached, sla_escalated
     FROM cases
     WHERE org_id = $1
     AND status NOT IN ('CLOSED', 'DELIVERED', 'REJECTED', 'CANCELLED')
     AND sla_deadline IS NOT NULL
     ORDER BY sla_deadline ASC`,
    [orgId]
  );
  
  return result.rows.map(row => ({
    id: row.id,
    caseNumber: row.case_number,
    caseType: row.case_type,
    orgId: row.org_id,
    status: row.status,
    slaDeadline: row.sla_deadline,
    receivedDate: row.received_date,
    assignedExecutiveId: row.assigned_executive_id,
    slaWarningSent: row.sla_warning_sent,
    slaBreached: row.sla_breached,
    slaEscalated: row.sla_escalated,
  }));
}

export async function checkSLAWarnings(orgId: string): Promise<SLAWarning[]> {
  const cases = await computeSLACases(orgId);
  const warnings: SLAWarning[] = [];
  const now = new Date();
  
  for (const case_ of cases) {
    if (!case_.slaDeadline || case_.slaWarningSent || case_.slaBreached) continue;
    
    const config = getSLAConfig(case_.caseType);
    const warningTime = new Date(case_.slaDeadline.getTime() - config.warningHours * 60 * 60 * 1000);
    
    if (now >= warningTime) {
      const hoursRemaining = Math.max(0, (case_.slaDeadline.getTime() - now.getTime()) / (1000 * 60 * 60));
      warnings.push({
        caseId: case_.id,
        caseNumber: case_.caseNumber,
        hoursRemaining,
        deadline: case_.slaDeadline,
      });
    }
  }
  
  return warnings;
}

export async function checkSLABreaches(orgId: string): Promise<SLABreach[]> {
  const cases = await computeSLACases(orgId);
  const breaches: SLABreach[] = [];
  const now = new Date();
  
  for (const case_ of cases) {
    if (!case_.slaDeadline || case_.slaBreached) continue;
    
    if (now > case_.slaDeadline) {
      const hoursOverdue = (now.getTime() - case_.slaDeadline.getTime()) / (1000 * 60 * 60);
      breaches.push({
        caseId: case_.id,
        caseNumber: case_.caseNumber,
        hoursOverdue,
        deadline: case_.slaDeadline,
      });
    }
  }
  
  return breaches;
}

export async function sendSLAWarnings(warnings: SLAWarning[]): Promise<number> {
  let sent = 0;
  
  for (const warning of warnings) {
    try {
      // Send notification to assigned executive
      const execResult = await pool.query(
        `SELECT p.id, p.full_name, p.email 
         FROM profiles p 
         JOIN cases c ON c.assigned_executive_id = p.id 
         WHERE c.id = $1`,
        [warning.caseId]
      );
      
      if (execResult.rows.length > 0) {
        const executive = execResult.rows[0];
        
        // Log audit event
        await AuditEvents.sla.warning({
          orgId: '', // Will be filled by caller
          caseId: warning.caseId,
          caseNumber: warning.caseNumber,
          hoursRemaining: warning.hoursRemaining,
          deadline: warning.deadline,
        });
        
        // Send notification (email/Slack/etc.)
        // await sendNotification(executive, warning);
        
        // Mark warning as sent
        await pool.query(
          `UPDATE cases SET sla_warning_sent = true WHERE id = $1`,
          [warning.caseId]
        );
        
        sent++;
      }
    } catch (error) {
      logger.error({ err: error, caseId: warning.caseId }, 'Failed to send SLA warning');
    }
  }
  
  return sent;
}

export async function processSLABreaches(breaches: SLABreach[]): Promise<number> {
  let processed = 0;
  
  for (const breach of breaches) {
    try {
      // Mark as breached
      await pool.query(
        `UPDATE cases SET sla_breached = true WHERE id = $1`,
        [breach.caseId]
      );
      
      // Log audit event
      await AuditEvents.sla.breached({
        orgId: '', // Will be filled
        caseId: breach.caseId,
        caseNumber: breach.caseNumber,
        hoursOverdue: breach.hoursOverdue,
        deadline: breach.deadline,
      });
      
      // Trigger escalation
      await triggerEscalation(breach);
      
      processed++;
    } catch (error) {
      logger.error({ err: error, caseId: breach.caseId }, 'Failed to process SLA breach');
    }
  }
  
  return processed;
}

async function triggerEscalation(breach: SLABreach): Promise<void> {
  try {
    // Get case details and escalation contacts
    const caseResult = await pool.query(
      `SELECT c.*, p.full_name as executive_name, p.email as executive_email,
              o.name as org_name
       FROM cases c
       LEFT JOIN profiles p ON p.id = c.assigned_executive_id
       LEFT JOIN organizations o ON o.id = c.org_id
       WHERE c.id = $1`,
      [breach.caseId]
    );
    
    if (caseResult.rows.length === 0) return;
    
    const case_ = caseResult.rows[0];
    
    // Determine escalation target (senior advocate, principal, etc.)
    const escalationResult = await pool.query(
      `SELECT p.id, p.full_name, p.email, p.role
       FROM profiles p
       JOIN organizations o ON o.id = p.org_id
       WHERE p.org_id = $1 AND p.role IN ('PRINCIPAL', 'ADVOCATE')
       AND p.id != $2
       ORDER BY CASE p.role WHEN 'PRINCIPAL' THEN 1 WHEN 'ADVOCATE' THEN 2 ELSE 3 END
       LIMIT 1`,
      [case_.org_id, case_.assigned_executive_id]
    );
    
    let escalatedTo = 'System';
    if (escalationResult.rows.length > 0) {
      escalatedTo = escalationResult.rows[0].full_name;
    }
    
    // Log escalation
    await AuditEvents.escalation.triggered({
      orgId: case_.org_id,
      caseId: breach.caseId,
      caseNumber: breach.caseNumber,
      reason: `SLA breached - ${breach.hoursOverdue.toFixed(1)} hours overdue`,
      escalatedTo,
    });
    
    // Mark as escalated
    await pool.query(
      `UPDATE cases SET sla_escalated = true WHERE id = $1`,
      [breach.caseId]
    );
    
    // Send escalation notification
    // await sendEscalationNotification(breach, case_, escalatedTo);
    
  } catch (error) {
    logger.error({ err: error, caseId: breach.caseId }, 'Failed to trigger escalation');
  }
}

export async function runSLACheck(orgId: string): Promise<{ warnings: number; breaches: number; escalations: number }> {
  logger.info({ orgId }, 'Running SLA check');
  
  const warnings = await checkSLAWarnings(orgId);
  const warningsSent = await sendSLAWarnings(warnings);
  
  const breaches = await checkSLABreaches(orgId);
  const breachesProcessed = await processSLABreaches(breaches);
  
  logger.info({ orgId, warnings: warnings.length, warningsSent, breaches: breaches.length, breachesProcessed }, 'SLA check completed');
  
  return {
    warnings: warningsSent,
    breaches: breachesProcessed,
    escalations: 0, // Would track separately
  };
}

export async function getSLADashboard(orgId: string) {
  const cases = await computeSLACases(orgId);
  const now = new Date();
  
  const dashboard = {
    total: cases.length,
    onTrack: 0,
    warning: 0,
    breached: 0,
    escalated: 0,
    byType: {} as Record<string, { total: number; warning: number; breached: number }>,
    upcomingDeadlines: [] as Array<{ caseId: string; caseNumber: string; caseType: string; deadline: Date; hoursRemaining: number }>,
  };
  
  for (const case_ of cases) {
    const config = getSLAConfig(case_.caseType);
    
    if (!case_.slaDeadline) continue;
    
    const timeToDeadline = case_.slaDeadline.getTime() - Date.now();
    const hoursRemaining = timeToDeadline / (1000 * 60 * 60);
    
    const typeStats = dashboard.byType[case_.caseType] || { total: 0, warning: 0, breached: 0 };
    typeStats.total++;
    
    if (case_.slaBreached) {
      dashboard.breached++;
      typeStats.breached++;
      if (case_.slaEscalated) dashboard.escalated++;
    } else if (hoursRemaining <= config.warningHours && hoursRemaining > 0) {
      dashboard.warning++;
      typeStats.warning++;
    } else {
      dashboard.onTrack++;
    }
    
    dashboard.byType[case_.caseType] = typeStats;
    
    if (hoursRemaining > 0 && hoursRemaining <= 48) {
      dashboard.upcomingDeadlines.push({
        caseId: case_.id,
        caseNumber: case_.caseNumber,
        caseType: case_.caseType,
        deadline: case_.slaDeadline,
        hoursRemaining,
      });
    }
  }
  
  // Sort upcoming deadlines
  dashboard.upcomingDeadlines.sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  dashboard.upcomingDeadlines = dashboard.upcomingDeadlines.slice(0, 10);
  
  return dashboard;
}

// Add SLA columns to cases table if not exist
export async function ensureSLAColumns(): Promise<void> {
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE cases ADD COLUMN IF NOT EXISTS sla_warning_sent BOOLEAN DEFAULT FALSE;
      ALTER TABLE cases ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT FALSE;
      ALTER TABLE cases ADD COLUMN IF NOT EXISTS sla_escalated BOOLEAN DEFAULT FALSE;
    EXCEPTION WHEN duplicate_column THEN null;
    END $$;
  `);
}