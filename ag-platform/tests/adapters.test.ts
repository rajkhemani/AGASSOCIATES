// Tests for Action Gateway Adapters

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  EmailAdapter,
  WebhookAdapter,
  MockAdapter,
  AdapterFactory,
  AdapterMode,
  type ExternalAction,
  type AdapterConfig,
  type AdapterResult,
} from '../adapters';

describe('Action Gateway Adapters', () => {
  const mockAction: ExternalAction = {
    id: 'test-action-1',
    org_id: 'test-org-1',
    case_id: 'test-case-1',
    action_type: 'SEND_EMAIL',
    payload_json: {
      to: 'test@example.com',
      subject: 'Test Subject',
      text: 'Test body',
    },
    idempotency_key: 'test-key-1',
  };

  const mockWebhookAction: ExternalAction = {
    id: 'test-webhook-1',
    org_id: 'test-org-1',
    case_id: 'test-case-1',
    action_type: 'WEBHOOK_CALL',
    payload_json: {
      url: 'https://example.com/webhook',
      method: 'POST',
      body: { key: 'value' },
    },
    idempotency_key: 'test-key-2',
  };

  describe('MockAdapter', () => {
    let adapter: MockAdapter;

    beforeEach(() => {
      adapter = new MockAdapter({ mode: 'MOCK', mockDelayMs: 10, mockFailRate: 0 });
    });

    it('should return success with externalRefId', async () => {
      const result = await adapter.execute(mockAction);
      expect(result.success).toBe(true);
      expect(result.externalRefId).toMatch(/^mock_\d+_[a-z0-9]+$/);
      expect(result.mode).toBe('MOCK');
      expect(result.error).toBeNull();
    });

    it('should simulate failures when mockFailRate > 0', async () => {
      const failAdapter = new MockAdapter({ mode: 'MOCK', mockDelayMs: 10, mockFailRate: 1 });
      const result = await failAdapter.execute(mockAction);
      expect(result.success).toBe(false);
      expect(result.error).toBe('MOCK: Simulated failure');
      expect(result.mode).toBe('MOCK');
    });

    it('should support all action types', () => {
      expect(adapter.supportedActionTypes).toEqual(['*']);
    });

    it('should always be in MOCK mode', () => {
      expect(adapter.mode).toBe('MOCK');
    });
  });

  describe('EmailAdapter', () => {
    it('should be NOT_CONFIGURED without config', () => {
      const adapter = new EmailAdapter({ mode: 'NOT_CONFIGURED' });
      expect(adapter.mode).toBe('NOT_CONFIGURED');
    });

    it('should be SANDBOX with SMTP host but no password', () => {
      const adapter = new EmailAdapter({
        mode: 'SANDBOX',
        smtpHost: 'smtp.example.com',
      });
      expect(adapter.mode).toBe('SANDBOX');
    });

    it('should validate config correctly', () => {
      const adapter = new EmailAdapter({ mode: 'LIVE' });
      const validation = adapter.validateConfig();
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should execute in sandbox mode', async () => {
      const adapter = new EmailAdapter({
        mode: 'SANDBOX',
        smtpHost: 'smtp.example.com',
        smtpFrom: 'test@example.com',
      });

      const result = await adapter.execute(mockAction);
      expect(result.success).toBe(true);
      expect(result.mode).toBe('SANDBOX');
      expect(result.externalRefId).toMatch(/^sandbox_msg_\d+_[a-z0-9]+$/);
    });

    it('should execute in mock mode', async () => {
      const adapter = new EmailAdapter({
        mode: 'MOCK',
        mockDelayMs: 5,
      });

      const result = await adapter.execute(mockAction);
      expect(result.success).toBe(true);
      expect(result.mode).toBe('MOCK');
    });
  });

  describe('WebhookAdapter', () => {
    it('should be NOT_CONFIGURED without webhook URL', () => {
      const adapter = new WebhookAdapter({ mode: 'NOT_CONFIGURED' });
      expect(adapter.mode).toBe('NOT_CONFIGURED');
    });

    it('should be SANDBOX with webhook URL but no secret', () => {
      const adapter = new WebhookAdapter({
        mode: 'SANDBOX',
        webhookUrl: 'https://example.com/webhook',
      });
      expect(adapter.mode).toBe('SANDBOX');
    });

    it('should be LIVE with webhook URL and secret', () => {
      const adapter = new WebhookAdapter({
        mode: 'LIVE',
        webhookUrl: 'https://example.com/webhook',
        webhookSecret: 'secret123',
      });
      expect(adapter.mode).toBe('LIVE');
    });

    it('should validate config correctly', () => {
      const adapter = new WebhookAdapter({ mode: 'LIVE', webhookUrl: 'https://example.com/webhook' });
      const validation = adapter.validateConfig();
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('LIVE mode requires webhook secret for signature verification');
    });

    it('should execute in sandbox mode', async () => {
      const adapter = new WebhookAdapter({
        mode: 'SANDBOX',
        webhookUrl: 'https://example.com/webhook',
      });

      const result = await adapter.execute(mockWebhookAction);
      expect(result.success).toBe(true);
      expect(result.mode).toBe('SANDBOX');
      expect(result.externalRefId).toMatch(/^sandbox_webhook_\d+_[a-z0-9]+$/);
    });

    it('should execute in mock mode', async () => {
      const adapter = new WebhookAdapter({
        mode: 'MOCK',
        mockDelayMs: 5,
      });

      const result = await adapter.execute(mockWebhookAction);
      expect(result.success).toBe(true);
      expect(result.mode).toBe('MOCK');
    });
  });

  describe('AdapterFactory', () => {
    beforeEach(() => {
      AdapterFactory.clearCache();
    });

    it('should return EmailAdapter for email action types', () => {
      AdapterFactory.configure({ mode: 'MOCK' });
      const adapter = AdapterFactory.getAdapter('SEND_EMAIL');
      expect(adapter).toBeInstanceOf(EmailAdapter);
      expect(adapter.mode).toBe('MOCK');
    });

    it('should return WebhookAdapter for webhook action types', () => {
      AdapterFactory.configure({ mode: 'MOCK' });
      const adapter = AdapterFactory.getAdapter('WEBHOOK_CALL');
      expect(adapter).toBeInstanceOf(WebhookAdapter);
    });

    it('should return MockAdapter for unknown action types', () => {
      AdapterFactory.configure({ mode: 'MOCK' });
      const adapter = AdapterFactory.getAdapter('UNKNOWN_ACTION');
      expect(adapter).toBeInstanceOf(MockAdapter);
    });

    it('should cache adapters', () => {
      AdapterFactory.configure({ mode: 'MOCK' });
      const adapter1 = AdapterFactory.getAdapter('SEND_EMAIL');
      const adapter2 = AdapterFactory.getAdapter('SEND_EMAIL');
      expect(adapter1).toBe(adapter2);
    });

    it('should clear cache on config change', () => {
      AdapterFactory.configure({ mode: 'MOCK' });
      const adapter1 = AdapterFactory.getAdapter('SEND_EMAIL');
      AdapterFactory.configure({ mode: 'SANDBOX', smtpHost: 'smtp.example.com' });
      const adapter2 = AdapterFactory.getAdapter('SEND_EMAIL');
      expect(adapter1).not.toBe(adapter2);
      expect(adapter2.mode).toBe('SANDBOX');
    });

    it('should return status for all adapters', () => {
      AdapterFactory.configure({ mode: 'MOCK' });
      const statuses = AdapterFactory.getAdapterStatus();
      expect(statuses.length).toBe(3);
      expect(statuses.map(s => s.name)).toEqual(['EmailAdapter', 'WebhookAdapter', 'MockAdapter']);
      expect(statuses.every(s => s.mode === 'MOCK')).toBe(true);
    });
  });
});