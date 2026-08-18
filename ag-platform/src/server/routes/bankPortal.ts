import express from 'express';
import { pool } from '../db.ts';
import { createSupabaseMiddleware, requireOrgAccess, requireRole } from '../auth.ts';
import { validate, validateParams } from '../validation.ts';
import { z } from 'zod';
import { getBankPortalConfig, getBankPortalConfigByOrg, getBankWorkflowVariants, createOrUpdateBankPortalConfig, createOrUpdateBankWorkflowVariant, initializeBankDefaults } from '../bankPortal.ts';

const router = express.Router();

const authOrg = [createSupabaseMiddleware(), requireOrgAccess()];

// All bank portal routes require authentication + org access
router.use(...authOrg);

const uuidParam = z.object({ bankId: z.string().uuid() });

// GET /api/v1/bank-portal - List all bank portal configs for organization
router.get('/bank-portal', async (req, res) => {
  try {
    const orgId = req.user!.orgId!;
    const configs = await getBankPortalConfigByOrg(orgId);
    res.json({ success: true, configs });
  } catch (error) {
    console.error('Bank portal list error:', error);
    res.status(500).json({ error: 'Failed to fetch bank portal configs' });
  }
});

// GET /api/v1/bank-portal/:bankId - Get specific bank portal config
router.get('/bank-portal/:bankId', validateParams(uuidParam), async (req, res) => {
  try {
    const orgId = req.user!.orgId!;
    const bankId = Array.isArray(req.params.bankId) ? req.params.bankId[0] : req.params.bankId;
    const config = await getBankPortalConfig(bankId);
    
    if (!config || config.orgId !== orgId) {
      return res.status(404).json({ error: 'Bank portal config not found' });
    }
    
    // Also fetch workflow variants
    const workflowVariants = await getBankWorkflowVariants(bankId);
    
    res.json({ success: true, config: { ...config, workflowVariants } });
  } catch (error) {
    console.error('Bank portal get error:', error);
    res.status(500).json({ error: 'Failed to fetch bank portal config' });
  }
});

// POST /api/v1/bank-portal - Create or update bank portal config
router.post('/bank-portal', requireRole('PRINCIPAL', 'ADVOCATE'), async (req, res) => {
  try {
    const orgId = req.user!.orgId!;
    const config = await createOrUpdateBankPortalConfig({ ...req.body, orgId });
    res.status(201).json({ success: true, config });
  } catch (error: any) {
    console.error('Bank portal create/update error:', error);
    res.status(500).json({ error: error.message || 'Failed to create/update bank portal config' });
  }
});

// GET /api/v1/bank-portal/:bankId/workflows - Get workflow variants for a bank
router.get('/bank-portal/:bankId/workflows', validateParams(uuidParam), async (req, res) => {
  try {
    const orgId = req.user!.orgId!;
    
    // Verify bank belongs to org
    const bankId = Array.isArray(req.params.bankId) ? req.params.bankId[0] : req.params.bankId;
    const bankCheck = await pool.query('SELECT id FROM banks WHERE id = $1', [bankId]);
    if (bankCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Bank not found' });
    }
    
    const workflows = await getBankWorkflowVariants(bankId);
    res.json({ success: true, workflows });
  } catch (error) {
    console.error('Bank workflows get error:', error);
    res.status(500).json({ error: 'Failed to fetch workflow variants' });
  }
});

// POST /api/v1/bank-portal/:bankId/workflows - Create or update workflow variant
router.post('/bank-portal/:bankId/workflows', validateParams(uuidParam), requireRole('PRINCIPAL'), async (req, res) => {
  try {
    const bankId = Array.isArray(req.params.bankId) ? req.params.bankId[0] : req.params.bankId;
    const variant = await createOrUpdateBankWorkflowVariant({
      ...req.body,
      bankId,
    });
    res.status(201).json({ success: true, variant });
  } catch (error: any) {
    console.error('Bank workflow create/update error:', error);
    res.status(500).json({ error: error.message || 'Failed to create/update workflow variant' });
  }
});

// POST /api/v1/bank-portal/:bankId/initialize - Initialize default workflows for a bank
router.post('/bank-portal/:bankId/initialize', validateParams(uuidParam), requireRole('PRINCIPAL'), async (req, res) => {
  try {
    const bankId = Array.isArray(req.params.bankId) ? req.params.bankId[0] : req.params.bankId;
    await initializeBankDefaults(bankId);
    res.json({ success: true, message: 'Default workflows initialized' });
  } catch (error: any) {
    console.error('Bank defaults init error:', error);
    res.status(500).json({ error: error.message || 'Failed to initialize defaults' });
  }
});

// Public endpoint for bank portal (no auth required - uses custom domain)
router.get('/bank-portal/public/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    
    // Find bank portal by custom domain
    const result = await pool.query(
      `SELECT bpc.*, b.short_code, b.name as bank_name
       FROM bank_portal_configs bpc
       JOIN banks b ON b.id = bpc.bank_id
       WHERE bpc.custom_domain = $1 AND bpc.is_active = true`,
      [domain]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bank portal not found' });
    }
    
    const config = result.rows[0];
    
    // Get workflow variants
    const workflowsResult = await pool.query(
      `SELECT * FROM bank_workflow_variants WHERE bank_id = $1`,
      [config.bank_id]
    );
    
    res.json({
      success: true,
      portal: {
        id: config.id,
        bankId: config.bank_id,
        bankName: config.bank_name,
        bankShortCode: config.short_code,
        portalName: config.portal_name,
        logoUrl: config.logo_url,
        primaryColor: config.primary_color,
        secondaryColor: config.secondary_color,
        faviconUrl: config.favicon_url,
        welcomeMessage: config.welcome_message,
        supportEmail: config.support_email,
        supportPhone: config.support_phone,
        features: config.features,
        customCss: config.custom_css,
        customJs: config.custom_js,
      },
      workflowVariants: workflowsResult.rows,
    });
  } catch (error) {
    console.error('Public bank portal error:', error);
    res.status(500).json({ error: 'Failed to fetch bank portal' });
  }
});

export default router;