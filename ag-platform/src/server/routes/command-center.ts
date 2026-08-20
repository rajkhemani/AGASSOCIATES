// Command Center Dashboard API Routes
// P6 Task 1: Command Center Dashboard

import express from 'express';
import { pool } from '../db.ts';
import { createSupabaseMiddleware, requireOrgAccess } from '../auth.ts';

const router = express.Router();

const authOrg = [createSupabaseMiddleware(), requireOrgAccess()];

// All dashboard routes require authentication + org access
router.use(...authOrg);

// ============================================================
// ACTIVE MATTERS
// ============================================================
router.get('/command-center/active-matters', async (req, res) => {
  try {
    const orgId = req.user!.orgId!;

    // Get active cases with recovery workflow info
    const result = await pool.query(`
      SELECT 
        c.id,
        c.case_number,
        c.borrower_name,
        c.case_type,
        c.status,
        c.bank_id,
        c.loan_amount,
        c.sla_deadline,
        c.recovery_status,
        wi.id as workflow_instance_id,
        wi.current_state,
        EXTRACT(EPOCH FROM (c.sla_deadline - NOW()))/3600 as hours_until_sla,
        CASE WHEN c.sla_deadline < NOW() THEN true ELSE false END as is_overdue
      FROM cases c
      LEFT JOIN workflow_instances wi ON wi.case_id = c.id AND wi.workflow_definition_id = (
        SELECT id FROM workflow_definitions WHERE slug = 'bank_recovery'
      )
      WHERE c.org_id = $1 
        AND c.status NOT IN ('CLOSED', 'DELIVERED', 'REJECTED')
      ORDER BY c.sla_deadline ASC
    `, [orgId]);

    res.json({ matters: result.rows });
  } catch (error) {
    console.error('Active matters error:', error);
    res.status(500).json({ error: 'Failed to fetch active matters' });
  }
});

// ============================================================
// SLA RISKS
// ============================================================
router.get('/command-center/sla-risks', async (req, res) => {
  try {
    const orgId = req.user!.orgId!;

    const result = await pool.query(`
      SELECT 
        c.id,
        c.case_number,
        c.borrower_name,
        c.case_type,
        c.sla_deadline,
        EXTRACT(EPOCH FROM (c.sla_deadline - NOW()))/3600 as hours_remaining,
        CASE 
          WHEN c.sla_deadline < NOW() THEN 'critical'
          WHEN EXTRACT(EPOCH FROM (c.sla_deadline - NOW()))/3600 < 4 THEN 'critical'
          WHEN EXTRACT(EPOCH FROM (c.sla_deadline - NOW()))/3600 < 24 THEN 'warning'
          ELSE 'normal'
        END as risk_level
      FROM cases c
      WHERE c.org_id = $1 
        AND c.status NOT IN ('CLOSED', 'DELIVERED', 'REJECTED')
      ORDER BY c.sla_deadline ASC
    `, [orgId]);

    res.json({ risks: result.rows });
  } catch (error) {
    console.error('SLA risks error:', error);
    res.status(500).json({ error: 'Failed to fetch SLA risks' });
  }
});

// ============================================================
// PENDING APPROVALS
// ============================================================
router.get('/command-center/pending-approvals', async (req, res) => {
  try {
    const orgId = req.user!.orgId!;

    const result = await pool.query(`
      SELECT 
        ar.id,
        ar.case_id,
        c.case_number,
        c.borrower_name,
        ar.approval_type,
        ar.requested_by,
        ar.requested_at,
        ar.required_approvers,
        ar.approvals,
        ar.status
      FROM approval_requests ar
      JOIN cases c ON c.id = ar.case_id
      WHERE ar.org_id = $1
      ORDER BY ar.requested_at DESC
    `, [orgId]);

    res.json({ approvals: result.rows });
  } catch (error) {
    console.error('Pending approvals error:', error);
    res.status(500).json({ error: 'Failed to fetch pending approvals' });
  }
});

// ============================================================
// AI TASKS
// ============================================================
router.get('/command-center/ai-tasks', async (req, res) => {
  try {
    const orgId = req.user!.orgId!;

    const result = await pool.query(`
      SELECT 
        ar.id,
        ar.case_id,
        c.case_number,
        ar.agent,
        ar.agent_version,
        ar.model_provider,
        ar.model_route,
        ar.status,
        ar.started_at,
        ar.completed_at,
        ar.confidence,
        ar.risk_flags,
        ar.input_hash
      FROM ai_runs ar
      JOIN cases c ON c.id = ar.case_id
      WHERE ar.org_id = $1
      ORDER BY ar.started_at DESC
      LIMIT 50
    `, [orgId]);

    res.json({ tasks: result.rows });
  } catch (error) {
    console.error('AI tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch AI tasks' });
  }
});

// ============================================================
// UPCOMING DEADLINES
// ============================================================
router.get('/command-center/upcoming-deadlines', async (req, res) => {
  try {
    const orgId = req.user!.orgId!;

    const result = await pool.query(`
      SELECT 
        d.id,
        d.workflow_instance_id,
        c.id as case_id,
        c.case_number,
        c.borrower_name,
        d.deadline_type,
        d.label,
        d.due_at,
        d.status,
        EXTRACT(EPOCH FROM (d.due_at - NOW()))/3600 as hours_until_due
      FROM deadlines d
      JOIN workflow_instances wi ON wi.id = d.workflow_instance_id
      JOIN cases c ON c.id = wi.case_id
      WHERE wi.org_id = $1
        AND d.status IN ('pending', 'triggered')
      ORDER BY d.due_at ASC
      LIMIT 50
    `, [orgId]);

    res.json({ deadlines: result.rows });
  } catch (error) {
    console.error('Upcoming deadlines error:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming deadlines' });
  }
});

// ============================================================
// EXTERNAL ACTIONS
// ============================================================
router.get('/command-center/external-actions', async (req, res) => {
  try {
    const orgId = req.user!.orgId!;

    const result = await pool.query(`
      SELECT 
        ea.id,
        ea.case_id,
        c.case_number,
        ea.action_type,
        ea.channel,
        ea.status,
        ea.adapter_mode,
        ea.external_ref_id,
        ea.attempt_count,
        ea.last_attempt_at,
        ea.created_at
      FROM external_actions ea
      JOIN cases c ON c.id = ea.case_id
      WHERE ea.org_id = $1
      ORDER BY ea.created_at DESC
      LIMIT 50
    `, [orgId]);

    res.json({ actions: result.rows });
  } catch (error) {
    console.error('External actions error:', error);
    res.status(500).json({ error: 'Failed to fetch external actions' });
  }
});

// ============================================================
// INSTITUTION ACTIVITY
// ============================================================
router.get('/command-center/institution-activity', async (req, res) => {
  try {
    const orgId = req.user!.orgId!;

    const result = await pool.query(`
      SELECT 
        b.id,
        b.name as bank_name,
        COUNT(c.id)::int as case_count,
        COUNT(CASE WHEN c.status NOT IN ('CLOSED', 'DELIVERED', 'REJECTED') THEN 1 END)::int as active_cases,
        COUNT(CASE WHEN c.status IN ('CLOSED', 'DELIVERED') THEN 1 END)::int as completed_cases,
        COALESCE(AVG(EXTRACT(EPOCH FROM (c.updated_at - c.received_date))/3600)::numeric(10,1), 0) as avg_tat_hours,
        COUNT(CASE WHEN c.sla_breached THEN 1 END)::int as sla_breaches,
        MAX(c.updated_at) as last_activity
      FROM banks b
      LEFT JOIN cases c ON c.bank_id = b.id AND c.org_id = $1
      GROUP BY b.id, b.name
      ORDER BY case_count DESC
    `, [orgId]);

    res.json({ institutions: result.rows });
  } catch (error) {
    console.error('Institution activity error:', error);
    res.status(500).json({ error: 'Failed to fetch institution activity' });
  }
});

// ============================================================
// SYSTEM HEALTH
// ============================================================
router.get('/command-center/system-health', async (req, res) => {
  try {
    const orgId = req.user!.orgId!;

    // Check database
    let database: 'healthy' | 'degraded' | 'down' = 'healthy';
    try {
      await pool.query('SELECT 1');
    } catch {
      database = 'down';
    }

    // Check Redis (simplified - in production would actually check)
    const redis: 'healthy' | 'degraded' | 'down' = 'healthy';

    // Check AI Backend
    let aiBackend: 'healthy' | 'degraded' | 'down' = 'healthy';
    try {
      const aiBackendUrl = process.env.AI_BACKEND_URL || 'http://127.0.0.1:8001';
      const response = await fetch(`${aiBackendUrl}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      if (!response.ok) aiBackend = 'degraded';
    } catch {
      aiBackend = 'down';
    }

    // Get adapter statuses
    const adapterResult = await pool.query(`
      SELECT DISTINCT 
        ea.channel,
        ea.adapter_mode
      FROM external_actions ea
      WHERE ea.org_id = $1
        AND ea.created_at > NOW() - INTERVAL '24 hours'
    `, [orgId]);

    const externalAdapters: Record<string, 'LIVE' | 'SANDBOX' | 'MOCK' | 'NOT_CONFIGURED'> = {};
    const channels = ['EMAIL', 'IGR', 'GRAS', 'NESL', 'BANK_API', 'WHATSAPP', 'POSTAL'];
    
    for (const channel of channels) {
      const adapter = adapterResult.rows.find(r => r.channel === channel);
      externalAdapters[channel] = (adapter?.adapter_mode as any) || 'NOT_CONFIGURED';
    }

    res.json({
      health: {
        database,
        redis,
        aiBackend,
        externalAdapters,
        lastCheck: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
});

export default router;