import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Case creation validation
export const CreateCaseSchema = z.object({
  borrower_name: z.string().min(1, 'Borrower name is required').max(255),
  org_id: z.string().uuid('Invalid organization ID'),
  bank_id: z.string().uuid('Invalid bank ID'),
  case_type: z.enum([
    'TITLE_SEARCH',
    'LEGAL_VETTING',
    'CTC',
    'PROPERTY_REGISTRATION',
    'MORTGAGE_REGISTRATION',
    'INTIMATION_MORTGAGE',
    'FRANKING',
    'BALANCE_TRANSFER',
    'PUBLIC_NOTICE',
    'POWER_OF_ATTORNEY',
    'LEAVE_AND_LICENSE',
    'GIFT_DEED',
    'MARKET_VALUATION',
    'HOME_LOAN',
    'LOAN_AGAINST_PROPERTY',
    'MACHINERY_LOAN',
    'PROJECT_LOAN',
  ]),
  loan_amount: z.number().positive('Loan amount must be positive').optional(),
  professional_fee: z.number().min(0).optional(),
  sla_deadline: z.string().datetime().optional().nullable(),
  property_address: z.string().max(500).optional(),
  property_city: z.string().max(100).optional(),
});

// Case status update validation
export const UpdateCaseStatusSchema = z.object({
  status: z.enum([
    'RECEIVED', 'ASSIGNED', 'DOCUMENT_COLLECTION', 'IN_PROGRESS',
    'PENDING_REGISTRATION', 'REGISTERED', 'QUALITY_CHECK',
    'DELIVERED', 'INVOICED', 'CLOSED', 'ON_HOLD', 'REJECTED', 'CANCELLED'
  ]),
  notes: z.string().max(1000).optional(),
});

// Document creation validation
export const CreateDocumentSchema = z.object({
  name: z.string().min(1, 'Document name is required').max(255),
  storage_path: z.string().min(1, 'Storage path is required').max(500),
  bucket_id: z.string().max(100).default('case-documents'),
  content_type: z.string().max(100).optional(),
  size_bytes: z.number().int().min(0).default(0),
  category: z.string().max(100).optional(),
});

// Timesheet creation validation
export const CreateTimesheetSchema = z.object({
  org_id: z.string().uuid('Invalid organization ID'),
  case_id: z.string().uuid('Invalid case ID'),
  profile_id: z.string().uuid('Invalid profile ID'),
  task_description: z.string().min(1, 'Task description is required').max(1000),
  start_time: z.string().datetime('Invalid start time format'),
  end_time: z.string().datetime('Invalid end time format').optional(),
  duration_minutes: z.number().int().min(1, 'Duration must be at least 1 minute').optional(),
  is_billable: z.boolean().default(true),
  hourly_rate: z.number().min(0).optional(),
});

// Disbursement creation validation
export const CreateDisbursementSchema = z.object({
  case_id: z.string().uuid('Invalid case ID'),
  type: z.enum([
    'STAMP_DUTY', 'REGISTRATION_FEE', 'FRANKING_CHARGE', 'CTC_FEE',
    'CHALLAN_0_3_PCT', 'MTR_FEE', 'ESBTR_FEE', 'NEWSPAPER_CHARGE', 'OTHER'
  ]),
  amount: z.number().positive('Amount must be positive'),
  paid_date: z.string().datetime().optional(),
  is_reimbursed: z.boolean().default(false),
});

// Bank creation validation
export const CreateBankSchema = z.object({
  name: z.string().min(1).max(255),
  short_code: z.string().min(1).max(20).toUpperCase(),
  type: z.enum(['BANK', 'NBFC']),
  billing_contact: z.string().email().optional(),
  advance_balance: z.number().default(0),
});

// Organization creation validation
export const CreateOrganizationSchema = z.object({
  name: z.string().min(1).max(255),
});

// Profile creation/update validation
export const CreateProfileSchema = z.object({
  user_id: z.string().uuid().optional(),
  org_id: z.string().uuid().optional(),
  bank_id: z.string().uuid().optional(),
  full_name: z.string().min(1).max(255),
  phone: z.string().max(20).optional(),
  role: z.enum(['PRINCIPAL', 'ADVOCATE', 'EXECUTIVE', 'CLERK', 'BANK_VIEWER']).default('EXECUTIVE'),
});

// Validation middleware factory
export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }
      next(error);
    }
  };
}

// Query parameter validation
export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }
      next(error);
    }
  };
}

// Params validation
export function validateParams(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid route parameters',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }
      next(error);
    }
  };
}