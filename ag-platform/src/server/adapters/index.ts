// Action Gateway Adapters
// Provides adapter interface and implementations for external actions

import { Pool } from 'pg';

// ============================================================
// Types
// ============================================================

export type AdapterMode = 'LIVE' | 'SANDBOX' | 'MOCK' | 'NOT_CONFIGURED';

export interface ExternalAction {
  id: string;
  org_id: string;
  case_id: string | null;
  action_type: string;
  payload_json: Record<string, unknown>;
  idempotency_key: string;
}

export interface AdapterResult {
  success: boolean;
  externalRefId: string | null;
  error: string | null;
  mode: AdapterMode;
  metadata?: Record<string, unknown>;
}

export interface AdapterConfig {
  mode: AdapterMode;
  // Email/SMTP config
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  // SendGrid config
  sendgridApiKey?: string;
  sendgridFrom?: string;
  // Webhook config
  webhookUrl?: string;
  webhookSecret?: string;
  webhookTimeoutMs?: number;
  // Mock config
  mockDelayMs?: number;
  mockFailRate?: number;
}

export interface IAdapter {
  readonly name: string;
  readonly supportedActionTypes: string[];
  readonly mode: AdapterMode;
  execute(action: ExternalAction): Promise<AdapterResult>;
  validateConfig(): { valid: boolean; errors: string[] };
}

// ============================================================
// Base Adapter
// ============================================================

abstract class BaseAdapter implements IAdapter {
  abstract readonly name: string;
  abstract readonly supportedActionTypes: string[];
  abstract readonly mode: AdapterMode;
  protected config: AdapterConfig;

  constructor(config: AdapterConfig) {
    this.config = config;
  }

  abstract execute(action: ExternalAction): Promise<AdapterResult>;

  validateConfig(): { valid: boolean; errors: string[] } {
    return { valid: true, errors: [] };
  }

  protected generateExternalRefId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  protected logExecution(action: ExternalAction, result: AdapterResult): void {
    console.log(`[${this.name}] Action ${action.id} (${action.action_type}) -> ${result.success ? 'SUCCESS' : 'FAILED'} | Ref: ${result.externalRefId} | Mode: ${result.mode}`);
  }
}

// ============================================================
// Email Adapter
// ============================================================

export class EmailAdapter extends BaseAdapter {
  readonly name = 'EmailAdapter';
  readonly supportedActionTypes = ['SEND_EMAIL', 'SEND_RECOVERY_NOTICE', 'SEND_NOTIFICATION'];
  readonly mode: AdapterMode;

  constructor(config: AdapterConfig) {
    super(config);
    this.mode = this.determineMode();
  }

  private determineMode(): AdapterMode {
    if (this.config.sendgridApiKey) return 'LIVE';
    if (this.config.smtpHost && this.config.smtpUser && this.config.smtpPass) return 'LIVE';
    if (this.config.smtpHost && !this.config.smtpPass) return 'SANDBOX';
    return 'NOT_CONFIGURED';
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (this.mode === 'LIVE') {
      if (this.config.sendgridApiKey) {
        // SendGrid configured - valid
      } else if (this.config.smtpHost && this.config.smtpUser && this.config.smtpPass) {
        // SMTP configured - valid
      } else {
        errors.push('LIVE mode requires either SendGrid API key or SMTP credentials');
      }
    } else if (this.mode === 'SANDBOX') {
      if (!this.config.smtpHost) {
        errors.push('SANDBOX mode requires SMTP host');
      }
    }
    return { valid: errors.length === 0, errors };
  }

  async execute(action: ExternalAction): Promise<AdapterResult> {
    const validation = this.validateConfig();
    if (!validation.valid) {
      return {
        success: false,
        externalRefId: null,
        error: `EmailAdapter not configured: ${validation.errors.join(', ')}`,
        mode: this.mode,
      };
    }

    const payload = action.payload_json as {
      to: string | string[];
      subject: string;
      html?: string;
      text?: string;
      template?: string;
      templateData?: Record<string, unknown>;
    };

    const to = Array.isArray(payload.to) ? payload.to : [payload.to];
    const subject = payload.subject;
    const html = payload.html;
    const text = payload.text;

    if (this.mode === 'MOCK') {
      return this.executeMock(action, to, subject);
    }

    if (this.mode === 'SANDBOX') {
      return this.executeSandbox(action, to, subject, html, text);
    }

    // LIVE mode
    if (this.config.sendgridApiKey) {
      return this.executeSendGrid(action, to, subject, html, text);
    }

    return this.executeSMTP(action, to, subject, html, text);
  }

  private async executeMock(action: ExternalAction, to: string[], subject: string): Promise<AdapterResult> {
    const delay = this.config.mockDelayMs || 100;
    const failRate = this.config.mockFailRate || 0;

    await new Promise(resolve => setTimeout(resolve, delay));

    if (Math.random() < failRate) {
      return {
        success: false,
        externalRefId: null,
        error: 'MOCK: Simulated email failure',
        mode: 'MOCK',
      };
    }

    const messageId = this.generateExternalRefId('msg');
    this.logExecution(action, { success: true, externalRefId: messageId, error: null, mode: 'MOCK' });

    return {
      success: true,
      externalRefId: messageId,
      error: null,
      mode: 'MOCK',
      metadata: { to, subject, mock: true },
    };
  }

  private async executeSandbox(action: ExternalAction, to: string[], subject: string, html?: string, text?: string): Promise<AdapterResult> {
    // In sandbox mode, we log but don't actually send
    const messageId = this.generateExternalRefId('sandbox_msg');
    console.log(`[EmailAdapter:SANDBOX] Would send email to ${to.join(', ')} | Subject: ${subject}`);
    console.log(`[EmailAdapter:SANDBOX] HTML: ${html?.substring(0, 200)}...`);
    console.log(`[EmailAdapter:SANDBOX] Text: ${text?.substring(0, 200)}...`);

    this.logExecution(action, { success: true, externalRefId: messageId, error: null, mode: 'SANDBOX' });

    return {
      success: true,
      externalRefId: messageId,
      error: null,
      mode: 'SANDBOX',
      metadata: { to, subject, sandbox: true },
    };
  }

  private async executeSendGrid(action: ExternalAction, to: string[], subject: string, html?: string, text?: string): Promise<AdapterResult> {
    try {
      // Dynamic import to avoid requiring @sendgrid/mail as mandatory dependency
      const sgMail = await import('@sendgrid/mail').catch(() => null);
      if (!sgMail) {
        throw new Error('@sendgrid/mail not installed');
      }

      sgMail.default.setApiKey(this.config.sendgridApiKey!);

      const msg = {
        to,
        from: this.config.sendgridFrom || this.config.smtpFrom || 'noreply@agassociates.in',
        subject,
        text,
        html,
      };

      const response = await sgMail.default.send(msg);
      const messageId = response[0]?.headers?.['x-message-id'] || this.generateExternalRefId('sg');

      this.logExecution(action, { success: true, externalRefId: messageId, error: null, mode: 'LIVE' });

      return {
        success: true,
        externalRefId: messageId,
        error: null,
        mode: 'LIVE',
        metadata: { to, subject, provider: 'sendgrid' },
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown SendGrid error';
      return {
        success: false,
        externalRefId: null,
        error,
        mode: 'LIVE',
      };
    }
  }

  private async executeSMTP(action: ExternalAction, to: string[], subject: string, html?: string, text?: string): Promise<AdapterResult> {
    try {
      // Dynamic import to avoid requiring nodemailer as mandatory dependency
      const nodemailer = await import('nodemailer').catch(() => null);
      if (!nodemailer) {
        throw new Error('nodemailer not installed');
      }

      const transporter = nodemailer.default.createTransport({
        host: this.config.smtpHost,
        port: this.config.smtpPort || 587,
        secure: this.config.smtpPort === 465,
        auth: {
          user: this.config.smtpUser,
          pass: this.config.smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: this.config.smtpFrom || 'noreply@agassociates.in',
        to: to.join(', '),
        subject,
        text,
        html,
      });

      const messageId = info.messageId || this.generateExternalRefId('smtp');

      this.logExecution(action, { success: true, externalRefId: messageId, error: null, mode: 'LIVE' });

      return {
        success: true,
        externalRefId: messageId,
        error: null,
        mode: 'LIVE',
        metadata: { to, subject, provider: 'smtp' },
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown SMTP error';
      return {
        success: false,
        externalRefId: null,
        error,
        mode: 'LIVE',
      };
    }
  }
}

// ============================================================
// Webhook Adapter
// ============================================================

export class WebhookAdapter extends BaseAdapter {
  readonly name = 'WebhookAdapter';
  readonly supportedActionTypes = ['WEBHOOK_CALL', 'IGR_FILING', 'GRAS_PAYMENT', 'NESL_REGISTRATION', 'BANK_CALLBACK'];
  readonly mode: AdapterMode;

  constructor(config: AdapterConfig) {
    super(config);
    this.mode = this.determineMode();
  }

  private determineMode(): AdapterMode {
    if (this.config.webhookUrl) {
      return this.config.webhookSecret ? 'LIVE' : 'SANDBOX';
    }
    return 'NOT_CONFIGURED';
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (this.mode !== 'NOT_CONFIGURED' && !this.config.webhookUrl) {
      errors.push('Webhook URL is required');
    }
    if (this.mode === 'LIVE' && !this.config.webhookSecret) {
      errors.push('LIVE mode requires webhook secret for signature verification');
    }
    return { valid: errors.length === 0, errors };
  }

  async execute(action: ExternalAction): Promise<AdapterResult> {
    const validation = this.validateConfig();
    if (!validation.valid) {
      return {
        success: false,
        externalRefId: null,
        error: `WebhookAdapter not configured: ${validation.errors.join(', ')}`,
        mode: this.mode,
      };
    }

    const payload = action.payload_json as {
      url?: string; // Override default webhook URL
      method?: 'POST' | 'PUT' | 'PATCH';
      headers?: Record<string, string>;
      body: Record<string, unknown>;
      timeoutMs?: number;
    };

    const url = payload.url || this.config.webhookUrl!;
    const method = payload.method || 'POST';
    const headers = {
      'Content-Type': 'application/json',
      'X-Action-ID': action.id,
      'X-Action-Type': action.action_type,
      'X-Idempotency-Key': action.idempotency_key,
      ...payload.headers,
    };
    const timeout = payload.timeoutMs || this.config.webhookTimeoutMs || 30000;

    // Add signature if secret configured
    if (this.config.webhookSecret) {
      const crypto = await import('crypto');
      const signature = crypto.createHmac('sha256', this.config.webhookSecret)
        .update(JSON.stringify(payload.body))
        .digest('hex');
      headers['X-Signature'] = `sha256=${signature}`;
    }

    if (this.mode === 'MOCK') {
      return this.executeMock(action);
    }

    if (this.mode === 'SANDBOX') {
      return this.executeSandbox(action, url, method, headers, payload.body);
    }

    return this.executeLive(action, url, method, headers, payload.body, timeout);
  }

  private async executeMock(action: ExternalAction): Promise<AdapterResult> {
    const delay = this.config.mockDelayMs || 200;
    const failRate = this.config.mockFailRate || 0;

    await new Promise(resolve => setTimeout(resolve, delay));

    if (Math.random() < failRate) {
      return {
        success: false,
        externalRefId: null,
        error: 'MOCK: Simulated webhook failure',
        mode: 'MOCK',
      };
    }

    const refId = this.generateExternalRefId('webhook');
    this.logExecution(action, { success: true, externalRefId: refId, error: null, mode: 'MOCK' });

    return {
      success: true,
      externalRefId: refId,
      error: null,
      mode: 'MOCK',
      metadata: { mock: true },
    };
  }

  private async executeSandbox(action: ExternalAction, url: string, method: string, headers: Record<string, string>, body: Record<string, unknown>): Promise<AdapterResult> {
    console.log(`[WebhookAdapter:SANDBOX] Would call ${method} ${url}`);
    console.log(`[WebhookAdapter:SANDBOX] Headers:`, JSON.stringify(headers, null, 2));
    console.log(`[WebhookAdapter:SANDBOX] Body:`, JSON.stringify(body, null, 2));

    const refId = this.generateExternalRefId('sandbox_webhook');
    this.logExecution(action, { success: true, externalRefId: refId, error: null, mode: 'SANDBOX' });

    return {
      success: true,
      externalRefId: refId,
      error: null,
      mode: 'SANDBOX',
      metadata: { sandbox: true, url, method },
    };
  }

  private async executeLive(action: ExternalAction, url: string, method: string, headers: Record<string, string>, body: Record<string, unknown>, timeout: number): Promise<AdapterResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseBody = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(responseBody)}`);
      }

      const refId = response.headers.get('x-ref-id') || response.headers.get('x-transaction-id') || this.generateExternalRefId('webhook');

      this.logExecution(action, { success: true, externalRefId: refId, error: null, mode: 'LIVE' });

      return {
        success: true,
        externalRefId: refId,
        error: null,
        mode: 'LIVE',
        metadata: { status: response.status, response: responseBody },
      };
    } catch (err) {
      clearTimeout(timeoutId);
      const error = err instanceof Error ? err.message : 'Unknown webhook error';
      return {
        success: false,
        externalRefId: null,
        error,
        mode: 'LIVE',
      };
    }
  }
}

// ============================================================
// Mock Adapter
// ============================================================

export class MockAdapter extends BaseAdapter {
  readonly name = 'MockAdapter';
  readonly supportedActionTypes = ['*']; // Supports all action types for testing
  readonly mode: AdapterMode = 'MOCK';

  constructor(config: AdapterConfig = { mode: 'MOCK' }) {
    super(config);
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    return { valid: true, errors: [] };
  }

  async execute(action: ExternalAction): Promise<AdapterResult> {
    const delay = this.config.mockDelayMs || 50;
    const failRate = this.config.mockFailRate || 0;

    await new Promise(resolve => setTimeout(resolve, delay));

    if (Math.random() < failRate) {
      return {
        success: false,
        externalRefId: null,
        error: 'MOCK: Simulated failure',
        mode: 'MOCK',
        metadata: { actionType: action.action_type },
      };
    }

    const refId = this.generateExternalRefId('mock');
    this.logExecution(action, { success: true, externalRefId: refId, error: null, mode: 'MOCK' });

    return {
      success: true,
      externalRefId: refId,
      error: null,
      mode: 'MOCK',
      metadata: { actionType: action.action_type, mock: true },
    };
  }
}

// ============================================================
// Adapter Factory
// ============================================================

export class AdapterFactory {
  private static adapters: Map<string, IAdapter> = new Map();
  private static defaultConfig: AdapterConfig = { mode: 'NOT_CONFIGURED' };

  static configure(config: AdapterConfig): void {
    this.defaultConfig = config;
    this.adapters.clear(); // Reset on config change
  }

  static getAdapter(actionType: string): IAdapter {
    // Check for cached adapter
    const cacheKey = `${actionType}:${this.defaultConfig.mode}`;
    const cached = this.adapters.get(cacheKey);
    if (cached) return cached;

    let adapter: IAdapter;

    // Select adapter based on action type
    if (['SEND_EMAIL', 'SEND_RECOVERY_NOTICE', 'SEND_NOTIFICATION'].includes(actionType)) {
      adapter = new EmailAdapter(this.defaultConfig);
    } else if (['WEBHOOK_CALL', 'IGR_FILING', 'GRAS_PAYMENT', 'NESL_REGISTRATION', 'BANK_CALLBACK'].includes(actionType)) {
      adapter = new WebhookAdapter(this.defaultConfig);
    } else {
      // Default to mock for unsupported types
      adapter = new MockAdapter(this.defaultConfig);
    }

    this.adapters.set(cacheKey, adapter);
    return adapter;
  }

  static getAllAdapters(): IAdapter[] {
    return [
      new EmailAdapter(this.defaultConfig),
      new WebhookAdapter(this.defaultConfig),
      new MockAdapter(this.defaultConfig),
    ];
  }

  static getAdapterStatus(): Array<{ name: string; mode: AdapterMode; supportedActions: string[]; valid: boolean; errors: string[] }> {
    return this.getAllAdapters().map(adapter => {
      const validation = adapter.validateConfig();
      return {
        name: adapter.name,
        mode: adapter.mode,
        supportedActions: adapter.supportedActionTypes,
        valid: validation.valid,
        errors: validation.errors,
      };
    });
  }

  static clearCache(): void {
    this.adapters.clear();
  }
}

// ============================================================
// Idempotency Checker
// ============================================================

export interface IdempotencyCheckResult {
  canExecute: boolean;
  existingResult: AdapterResult | null;
  reason: string;
}

export class IdempotencyChecker {
  constructor(private pool: Pool) {}

  async checkIdempotency(idempotencyKey: string): Promise<IdempotencyCheckResult> {
    const result = await this.pool.query(
      `SELECT ea.id, ea.status, aa.response_json, aa.external_ref_id
       FROM external_actions ea
       LEFT JOIN action_attempts aa ON aa.external_action_id = ea.id AND aa.status = 'SUCCEEDED'
       WHERE ea.idempotency_key = $1
       ORDER BY aa.attempt_number DESC
       LIMIT 1`,
      [idempotencyKey]
    );

    if (result.rows.length === 0) {
      return { canExecute: true, existingResult: null, reason: 'No existing action with this idempotency key' };
    }

    const action = result.rows[0];

    if (action.status === 'SUCCEEDED' && action.response_json) {
      const existingResult: AdapterResult = {
        success: true,
        externalRefId: action.external_ref_id,
        error: null,
        mode: 'LIVE', // We don't know the original mode, assume LIVE
        metadata: action.response_json,
      };
      return {
        canExecute: false,
        existingResult,
        reason: `Action already succeeded with idempotency key ${idempotencyKey}`,
      };
    }

    // Action exists but didn't succeed - can retry
    return { canExecute: true, existingResult: null, reason: 'Previous attempt failed or in progress' };
  }
}

// ============================================================
// Default export
// ============================================================

export default {
  EmailAdapter,
  WebhookAdapter,
  MockAdapter,
  AdapterFactory,
  IdempotencyChecker,
  AdapterMode,
  type: {
    ExternalAction,
    AdapterResult,
    AdapterConfig,
    IAdapter,
    IdempotencyCheckResult,
  },
};