import { pool } from './db.ts';
import { logger } from './logger.ts';

export interface BankPortalConfig {
  id: string;
  bankId: string;
  orgId: string;
  
  // Branding
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  faviconUrl: string | null;
  customDomain: string | null;
  
  // Portal settings
  portalName: string;
  welcomeMessage: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  
  // Feature flags
  features: {
    caseTracking: boolean;
    documentDownload: boolean;
    invoiceView: boolean;
    paymentStatus: boolean;
    slaDashboard: boolean;
    notifications: boolean;
    apiAccess: boolean;
  };
  
  // Workflow overrides
  workflowOverrides: {
    allowedCaseTypes: string[];
    requiredDocuments: Record<string, string[]>;
    slaConfigs: Record<string, { warningHours: number; breachHours: number }>;
    autoAssignment: boolean;
    approvalRequired: boolean;
  };
  
  // SSO settings
  sso: {
    enabled: boolean;
    provider: 'saml' | 'oidc' | 'azure' | 'google' | null;
    entityId: string | null;
    ssoUrl: string | null;
    certificate: string | null;
    attributeMapping: Record<string, string>;
  };
  
  // Custom CSS/JS
  customCss: string | null;
  customJs: string | null;
  
  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankWorkflowVariant {
  bankId: string;
  caseType: string;
  stages: string[];
  transitions: Record<string, string[]>;
  requiredDocuments: string[];
  slaWarningHours: number;
  slaBreachHours: number;
  autoAssignmentRules: {
    byAmount?: { min: number; max: number; assigneeRole: string }[];
    byRegion?: { region: string; assigneeRole: string }[];
    byPropertyType?: { propertyType: string; assigneeRole: string }[];
  };
}

// Default workflow variants per bank
const DEFAULT_BANK_WORKFLOWS: Record<string, BankWorkflowVariant[]> = {
  KOTAK: [
    {
      bankId: '',
      caseType: 'INTIMATION_MORTGAGE',
      stages: ['DOCUMENTS_RECEIVED', 'CHALLAN_GENERATED', 'CHALLAN_PAID', 'VERIFIED', 'NOI_DROP_RECEIVED', 'NOI_FILED', 'ACKNOWLEDGED', 'COMPLETED'],
      transitions: {
        'DOCUMENTS_RECEIVED': ['CHALLAN_GENERATED'],
        'CHALLAN_GENERATED': ['CHALLAN_PAID'],
        'CHALLAN_PAID': ['VERIFIED'],
        'VERIFIED': ['NOI_DROP_RECEIVED', 'RECTIFY'],
        'NOI_DROP_RECEIVED': ['NOI_FILED', 'RECTIFY'],
        'RECTIFY': ['NOI_FILED', 'VERIFIED'],
        'NOI_FILED': ['ACKNOWLEDGED'],
        'ACKNOWLEDGED': ['COMPLETED'],
      },
      requiredDocuments: ['sanction_letter', 'borrower_kyc', 'property_docs', 'stamp_duty_receipt'],
      slaWarningHours: 24,
      slaBreachHours: 0,
      autoAssignmentRules: {
        byAmount: [
          { min: 0, max: 5000000, assigneeRole: 'EXECUTIVE' },
          { min: 5000000, max: 20000000, assigneeRole: 'ADVOCATE' },
          { min: 20000000, max: Infinity, assigneeRole: 'PRINCIPAL' },
        ],
      },
    },
  ],
  HDFC: [
    {
      bankId: '',
      caseType: 'INTIMATION_MORTGAGE',
      stages: ['DOCUMENTS_RECEIVED', 'CHALLAN_GENERATED', 'CHALLAN_PAID', 'VERIFIED', 'NOI_DROP_RECEIVED', 'NOI_FILED', 'ACKNOWLEDGED', 'COMPLETED'],
      transitions: {
        'DOCUMENTS_RECEIVED': ['CHALLAN_GENERATED'],
        'CHALLAN_GENERATED': ['CHALLAN_PAID'],
        'CHALLAN_PAID': ['VERIFIED'],
        'VERIFIED': ['NOI_DROP_RECEIVED'],
        'NOI_DROP_RECEIVED': ['NOI_FILED'],
        'NOI_FILED': ['ACKNOWLEDGED'],
        'ACKNOWLEDGED': ['COMPLETED'],
      },
      requiredDocuments: ['sanction_letter', 'borrower_kyc', 'property_docs', 'stamp_duty_receipt', 'title_report'],
      slaWarningHours: 12,
      slaBreachHours: 0,
      autoAssignmentRules: {
        byAmount: [
          { min: 0, max: 10000000, assigneeRole: 'EXECUTIVE' },
          { min: 10000000, max: Infinity, assigneeRole: 'ADVOCATE' },
        ],
        byRegion: [
          { region: 'MUMBAI', assigneeRole: 'ADVOCATE' },
          { region: 'PUNE', assigneeRole: 'EXECUTIVE' },
        ],
      },
    },
  ],
  ICICI: [
    {
      bankId: '',
      caseType: 'INTIMATION_MORTGAGE',
      stages: ['DOCUMENTS_RECEIVED', 'CHALLAN_GENERATED', 'CHALLAN_PAID', 'VERIFIED', 'NOI_DROP_RECEIVED', 'NOI_FILED', 'ACKNOWLEDGED', 'COMPLETED'],
      transitions: {
        'DOCUMENTS_RECEIVED': ['CHALLAN_GENERATED'],
        'CHALLAN_GENERATED': ['CHALLAN_PAID'],
        'CHALLAN_PAID': ['VERIFIED'],
        'VERIFIED': ['NOI_DROP_RECEIVED'],
        'NOI_DROP_RECEIVED': ['NOI_FILED'],
        'NOI_FILED': ['ACKNOWLEDGED'],
        'ACKNOWLEDGED': ['COMPLETED'],
      },
      requiredDocuments: ['sanction_letter', 'borrower_kyc', 'property_docs', 'stamp_duty_receipt'],
      slaWarningHours: 24,
      slaBreachHours: 0,
      autoAssignmentRules: {
        byAmount: [
          { min: 0, max: 5000000, assigneeRole: 'EXECUTIVE' },
          { min: 5000000, max: Infinity, assigneeRole: 'ADVOCATE' },
        ],
      },
    },
  ],
};

function getDefaultWorkflows(bankShortCode: string): BankWorkflowVariant[] {
  const workflows = DEFAULT_BANK_WORKFLOWS[bankShortCode.toUpperCase()] || [];
  return workflows.map(w => ({ ...w, bankId: '' }));
}

export async function getBankPortalConfig(bankId: string): Promise<BankPortalConfig | null> {
  const result = await pool.query(
    `SELECT * FROM bank_portal_configs WHERE bank_id = $1`,
    [bankId]
  );
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id,
    bankId: row.bank_id,
    orgId: row.org_id,
    logoUrl: row.logo_url,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    faviconUrl: row.favicon_url,
    customDomain: row.custom_domain,
    portalName: row.portal_name,
    welcomeMessage: row.welcome_message,
    supportEmail: row.support_email,
    supportPhone: row.support_phone,
    features: row.features || {},
    workflowOverrides: row.workflow_overrides || {},
    sso: row.sso || { enabled: false, provider: null, entityId: null, ssoUrl: null, certificate: null, attributeMapping: {} },
    customCss: row.custom_css,
    customJs: row.custom_js,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getBankPortalConfigByOrg(orgId: string): Promise<BankPortalConfig[]> {
  const result = await pool.query(
    `SELECT * FROM bank_portal_configs WHERE org_id = $1 AND is_active = true`,
    [orgId]
  );
  
  return result.rows.map(row => ({
    id: row.id,
    bankId: row.bank_id,
    orgId: row.org_id,
    logoUrl: row.logo_url,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    faviconUrl: row.favicon_url,
    customDomain: row.custom_domain,
    portalName: row.portal_name,
    welcomeMessage: row.welcome_message,
    supportEmail: row.support_email,
    supportPhone: row.support_phone,
    features: row.features || {},
    workflowOverrides: row.workflow_overrides || {},
    sso: row.sso || { enabled: false, provider: null, entityId: null, ssoUrl: null, certificate: null, attributeMapping: {} },
    customCss: row.custom_css,
    customJs: row.custom_js,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getBankWorkflowVariants(bankId: string): Promise<BankWorkflowVariant[]> {
  const result = await pool.query(
    `SELECT * FROM bank_workflow_variants WHERE bank_id = $1 ORDER BY case_type`,
    [bankId]
  );
  
  if (result.rows.length === 0) {
    // Get bank short code for defaults
    const bankResult = await pool.query('SELECT short_code FROM banks WHERE id = $1', [bankId]);
    if (bankResult.rows.length > 0) {
      return getDefaultWorkflows(bankResult.rows[0].short_code);
    }
    return [];
  }
  
  return result.rows.map(row => ({
    bankId: row.bank_id,
    caseType: row.case_type,
    stages: row.stages,
    transitions: row.transitions,
    requiredDocuments: row.required_documents,
    slaWarningHours: row.sla_warning_hours,
    slaBreachHours: row.sla_breach_hours,
    autoAssignmentRules: row.auto_assignment_rules || {},
  }));
}

export async function createOrUpdateBankPortalConfig(config: Partial<BankPortalConfig> & { bankId: string; orgId: string }): Promise<BankPortalConfig> {
  const result = await pool.query(
    `INSERT INTO bank_portal_configs (
      bank_id, org_id, logo_url, primary_color, secondary_color, favicon_url, custom_domain,
      portal_name, welcome_message, support_email, support_phone,
      features, workflow_overrides, sso, custom_css, custom_js, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    ON CONFLICT (bank_id) DO UPDATE SET
      org_id = EXCLUDED.org_id,
      logo_url = EXCLUDED.logo_url,
      primary_color = EXCLUDED.primary_color,
      secondary_color = EXCLUDED.secondary_color,
      favicon_url = EXCLUDED.favicon_url,
      custom_domain = EXCLUDED.custom_domain,
      portal_name = EXCLUDED.portal_name,
      welcome_message = EXCLUDED.welcome_message,
      support_email = EXCLUDED.support_email,
      support_phone = EXCLUDED.support_phone,
      features = EXCLUDED.features,
      workflow_overrides = EXCLUDED.workflow_overrides,
      sso = EXCLUDED.sso,
      custom_css = EXCLUDED.custom_css,
      custom_js = EXCLUDED.custom_js,
      is_active = EXCLUDED.is_active,
      updated_at = NOW()
    RETURNING *`,
    [
      config.bankId, config.orgId, config.logoUrl, config.primaryColor, config.secondaryColor,
      config.faviconUrl, config.customDomain, config.portalName, config.welcomeMessage,
      config.supportEmail, config.supportPhone, JSON.stringify(config.features || {}),
      JSON.stringify(config.workflowOverrides || {}), JSON.stringify(config.sso || {}),
      config.customCss, config.customJs, config.isActive ?? true
    ]
  );
  
  return mapRowToConfig(result.rows[0]);
}

export async function createOrUpdateBankWorkflowVariant(variant: BankWorkflowVariant): Promise<BankWorkflowVariant> {
  const result = await pool.query(
    `INSERT INTO bank_workflow_variants (
      bank_id, case_type, stages, transitions, required_documents,
      sla_warning_hours, sla_breach_hours, auto_assignment_rules
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (bank_id, case_type) DO UPDATE SET
      stages = EXCLUDED.stages,
      transitions = EXCLUDED.transitions,
      required_documents = EXCLUDED.required_documents,
      sla_warning_hours = EXCLUDED.sla_warning_hours,
      sla_breach_hours = EXCLUDED.sla_breach_hours,
      auto_assignment_rules = EXCLUDED.auto_assignment_rules,
      updated_at = NOW()
    RETURNING *`,
    [
      variant.bankId, variant.caseType, variant.stages, JSON.stringify(variant.transitions),
      variant.requiredDocuments, variant.slaWarningHours, variant.slaBreachHours,
      JSON.stringify(variant.autoAssignmentRules || {})
    ]
  );
  
  return mapRowToWorkflowVariant(result.rows[0]);
}

function mapRowToConfig(row: any): BankPortalConfig {
  return {
    id: row.id,
    bankId: row.bank_id,
    orgId: row.org_id,
    logoUrl: row.logo_url,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    faviconUrl: row.favicon_url,
    customDomain: row.custom_domain,
    portalName: row.portal_name,
    welcomeMessage: row.welcome_message,
    supportEmail: row.support_email,
    supportPhone: row.support_phone,
    features: row.features || {},
    workflowOverrides: row.workflow_overrides || {},
    sso: row.sso || { enabled: false, provider: null, entityId: null, ssoUrl: null, certificate: null, attributeMapping: {} },
    customCss: row.custom_css,
    customJs: row.custom_js,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToWorkflowVariant(row: any): BankWorkflowVariant {
  return {
    bankId: row.bank_id,
    caseType: row.case_type,
    stages: row.stages,
    transitions: row.transitions,
    requiredDocuments: row.required_documents,
    slaWarningHours: row.sla_warning_hours,
    slaBreachHours: row.sla_breach_hours,
    autoAssignmentRules: row.auto_assignment_rules || {},
  };
}

// Initialize default workflows for a bank
export async function initializeBankDefaults(bankId: string): Promise<void> {
  const bankResult = await pool.query('SELECT short_code FROM banks WHERE id = $1', [bankId]);
  if (bankResult.rows.length === 0) return;
  
  const shortCode = bankResult.rows[0].short_code;
  const defaults = getDefaultWorkflows(shortCode);
  
  for (const variant of defaults) {
    await createOrUpdateBankWorkflowVariant({
      ...variant,
      bankId,
    });
  }
  
  logger.info({ bankId, shortCode, count: defaults.length }, 'Initialized default bank workflows');
}