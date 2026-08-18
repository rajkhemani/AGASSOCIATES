import { describe, it, expect } from 'vitest';
import {
  CreateCaseSchema,
  UpdateCaseStatusSchema,
  CreateDocumentSchema,
  CreateTimesheetSchema,
  CreateDisbursementSchema,
  CreateBankSchema,
  CreateOrganizationSchema,
  CreateProfileSchema,
  validate,
  validateParams,
  validateQuery,
} from '../../src/server/validation.ts';

describe('Validation Schemas', () => {
  describe('CreateCaseSchema', () => {
    it('validates valid case data', () => {
      const validData = {
        borrower_name: 'John Doe',
        org_id: '550e8400-e29b-41d4-a716-446655440000',
        bank_id: '550e8400-e29b-41d4-a716-446655440001',
        case_type: 'INTIMATION_MORTGAGE',
        loan_amount: 5000000,
        property_address: '123 Test Street',
        property_city: 'Mumbai',
      };

      const result = CreateCaseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects missing borrower_name', () => {
      const invalidData = {
        org_id: '550e8400-e29b-41d4-a716-446655440000',
        bank_id: '550e8400-e29b-41d4-a716-446655440001',
        case_type: 'INTIMATION_MORTGAGE',
      };

      const result = CreateCaseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.path.includes('borrower_name'))).toBe(true);
      }
    });

    it('rejects invalid org_id format', () => {
      const invalidData = {
        borrower_name: 'John Doe',
        org_id: 'not-a-uuid',
        bank_id: '550e8400-e29b-41d4-a716-446655440001',
        case_type: 'INTIMATION_MORTGAGE',
      };

      const result = CreateCaseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects invalid case_type', () => {
      const invalidData = {
        borrower_name: 'John Doe',
        org_id: '550e8400-e29b-41d4-a716-446655440000',
        bank_id: '550e8400-e29b-41d4-a716-446655440001',
        case_type: 'INVALID_TYPE',
      };

      const result = CreateCaseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('accepts all valid case types', () => {
      const validTypes = [
        'TITLE_SEARCH', 'LEGAL_VETTING', 'CTC', 'PROPERTY_REGISTRATION',
        'MORTGAGE_REGISTRATION', 'INTIMATION_MORTGAGE', 'FRANKING',
        'BALANCE_TRANSFER', 'PUBLIC_NOTICE', 'POWER_OF_ATTORNEY',
        'LEAVE_AND_LICENSE', 'GIFT_DEED', 'MARKET_VALUATION',
        'HOME_LOAN', 'LOAN_AGAINST_PROPERTY', 'MACHINERY_LOAN', 'PROJECT_LOAN',
      ];

      for (const type of validTypes) {
        const data = {
          borrower_name: 'John Doe',
          org_id: '550e8400-e29b-41d4-a716-446655440000',
          bank_id: '550e8400-e29b-41d4-a716-446655440001',
          case_type: type,
        };
        const result = CreateCaseSchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('UpdateCaseStatusSchema', () => {
    it('validates valid status', () => {
      const validData = {
        status: 'IN_PROGRESS',
        notes: 'Processing case',
      };

      const result = UpdateCaseStatusSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid status', () => {
      const invalidData = {
        status: 'INVALID_STATUS',
      };

      const result = UpdateCaseStatusSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('accepts all valid statuses', () => {
      const validStatuses = [
        'RECEIVED', 'ASSIGNED', 'DOCUMENT_COLLECTION', 'IN_PROGRESS',
        'PENDING_REGISTRATION', 'REGISTERED', 'QUALITY_CHECK',
        'DELIVERED', 'INVOICED', 'CLOSED', 'ON_HOLD', 'REJECTED', 'CANCELLED',
      ];

      for (const status of validStatuses) {
        const result = UpdateCaseStatusSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it('allows optional notes', () => {
      const result = UpdateCaseStatusSchema.safeParse({ status: 'IN_PROGRESS' });
      expect(result.success).toBe(true);
    });
  });

  describe('CreateDocumentSchema', () => {
    it('validates valid document', () => {
      const validData = {
        name: 'sanction_letter.pdf',
        storage_path: '/documents/case-123/sanction_letter.pdf',
        bucket_id: 'case-documents',
        content_type: 'application/pdf',
        size_bytes: 1024000,
        category: 'sanction_letter',
      };

      const result = CreateDocumentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects missing name', () => {
      const invalidData = {
        storage_path: '/documents/test.pdf',
      };

      const result = CreateDocumentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects missing storage_path', () => {
      const invalidData = {
        name: 'test.pdf',
      };

      const result = CreateDocumentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('uses default bucket_id', () => {
      const data = {
        name: 'test.pdf',
        storage_path: '/documents/test.pdf',
      };

      const result = CreateDocumentSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.bucket_id).toBe('case-documents');
      }
    });
  });

  describe('CreateTimesheetSchema', () => {
    it('validates valid timesheet', () => {
      const validData = {
        org_id: '550e8400-e29b-41d4-a716-446655440000',
        case_id: '550e8400-e29b-41d4-a716-446655440001',
        profile_id: '550e8400-e29b-41d4-a716-446655440002',
        task_description: 'Reviewed documents',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T12:00:00Z',
        duration_minutes: 120,
        is_billable: true,
        hourly_rate: 5000,
      };

      const result = CreateTimesheetSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid UUID', () => {
      const invalidData = {
        org_id: 'not-uuid',
        case_id: '550e8400-e29b-41d4-a716-446655440001',
        profile_id: '550e8400-e29b-41d4-a716-446655440002',
        task_description: 'Test',
        start_time: '2024-01-15T10:00:00Z',
      };

      const result = CreateTimesheetSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects invalid datetime format', () => {
      const invalidData = {
        org_id: '550e8400-e29b-41d4-a716-446655440000',
        case_id: '550e8400-e29b-41d4-a716-446655440001',
        profile_id: '550e8400-e29b-41d4-a716-446655440002',
        task_description: 'Test',
        start_time: 'not-a-date',
      };

      const result = CreateTimesheetSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('requires duration_minutes >= 1', () => {
      const invalidData = {
        org_id: '550e8400-e29b-41d4-a716-446655440000',
        case_id: '550e8400-e29b-41d4-a716-446655440001',
        profile_id: '550e8400-e29b-41d4-a716-446655440002',
        task_description: 'Test',
        start_time: '2024-01-15T10:00:00Z',
        duration_minutes: 0,
      };

      const result = CreateTimesheetSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateDisbursementSchema', () => {
    it('validates valid disbursement', () => {
      const validData = {
        case_id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'STAMP_DUTY',
        amount: 15000,
        paid_date: '2024-01-15T10:00:00Z',
        is_reimbursed: false,
      };

      const result = CreateDisbursementSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('requires positive amount', () => {
      const invalidData = {
        case_id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'STAMP_DUTY',
        amount: -100,
      };

      const result = CreateDisbursementSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('accepts all valid disbursement types', () => {
      const validTypes = [
        'STAMP_DUTY', 'REGISTRATION_FEE', 'FRANKING_CHARGE', 'CTC_FEE',
        'CHALLAN_0_3_PCT', 'MTR_FEE', 'ESBTR_FEE', 'NEWSPAPER_CHARGE', 'OTHER',
      ];

      for (const type of validTypes) {
        const result = CreateDisbursementSchema.safeParse({
          case_id: '550e8400-e29b-41d4-a716-446655440000',
          type,
          amount: 1000,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('CreateBankSchema', () => {
    it('validates valid bank', () => {
      const validData = {
        name: 'Test Bank',
        short_code: 'TEST',
        type: 'BANK',
        billing_contact: 'billing@testbank.com',
        advance_balance: 100000,
      };

      const result = CreateBankSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('uppercases short_code', () => {
      const data = {
        name: 'Test Bank',
        short_code: 'test',
        type: 'BANK',
      };

      const result = CreateBankSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.short_code).toBe('TEST');
      }
    });

    it('accepts both BANK and NBFC types', () => {
      for (const type of ['BANK', 'NBFC']) {
        const result = CreateBankSchema.safeParse({
          name: 'Test',
          short_code: 'TEST',
          type,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('CreateOrganizationSchema', () => {
    it('validates valid organization', () => {
      const result = CreateOrganizationSchema.safeParse({ name: 'Test Org' });
      expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
      const result = CreateOrganizationSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateProfileSchema', () => {
    it('validates valid profile', () => {
      const validData = {
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        org_id: '550e8400-e29b-41d4-a716-446655440001',
        full_name: 'John Doe',
        phone: '+91-9876543210',
        role: 'ADVOCATE',
      };

      const result = CreateProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('defaults role to EXECUTIVE', () => {
      const data = {
        full_name: 'John Doe',
      };

      const result = CreateProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('EXECUTIVE');
      }
    });

    it('accepts all valid roles', () => {
      const validRoles = ['PRINCIPAL', 'ADVOCATE', 'EXECUTIVE', 'CLERK', 'BANK_VIEWER'];

      for (const role of validRoles) {
        const result = CreateProfileSchema.safeParse({
          full_name: 'John Doe',
          role,
        });
        expect(result.success).toBe(true);
      }
    });
  });
});

describe('Validation Middleware', () => {
  import { Request, Response, NextFunction } from 'express';
  import { z } from 'zod';

  const mockReq = (body: any) => ({
    body,
    query: {},
    params: {},
  } as Request);

  const mockRes = () => {
    const res: Partial<Response> = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    return res as Response;
  };

  const mockNext = vi.fn();

  it('passes valid data', () => {
    const schema = z.object({ name: z.string().min(1) });
    const middleware = validate(schema);

    const req = mockReq({ name: 'Test' });
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects invalid data', () => {
    const schema = z.object({ name: z.string().min(1) });
    const middleware = validate(schema);

    const req = mockReq({ name: '' });
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });
});