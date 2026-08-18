import { Express } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// OpenAPI 3.0 specification
const openAPISpec = {
  openapi: '3.0.3',
  info: {
    title: 'AG Associates - Luxor9 LegalOS API',
    version: '2.0.0',
    description: 'Deterministic Multi-Agent Legal Infrastructure API',
    contact: {
      name: 'AG Associates',
      email: 'admin@advadiityagade.com',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Current API version',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              requestId: { type: 'string' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      Case: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          case_number: { type: 'string' },
          org_id: { type: 'string', format: 'uuid' },
          bank_id: { type: 'string', format: 'uuid' },
          case_type: { type: 'string', enum: [
            'TITLE_SEARCH', 'LEGAL_VETTING', 'CTC', 'PROPERTY_REGISTRATION',
            'MORTGAGE_REGISTRATION', 'INTIMATION_MORTGAGE', 'FRANKING',
            'BALANCE_TRANSFER', 'PUBLIC_NOTICE', 'POWER_OF_ATTORNEY',
            'LEAVE_AND_LICENSE', 'GIFT_DEED', 'MARKET_VALUATION',
            'HOME_LOAN', 'LOAN_AGAINST_PROPERTY', 'MACHINERY_LOAN', 'PROJECT_LOAN',
          ]},
          status: { type: 'string', enum: [
            'RECEIVED', 'ASSIGNED', 'DOCUMENT_COLLECTION', 'IN_PROGRESS',
            'PENDING_REGISTRATION', 'REGISTERED', 'QUALITY_CHECK',
            'DELIVERED', 'INVOICED', 'CLOSED', 'ON_HOLD', 'REJECTED', 'CANCELLED',
          ]},
          borrower_name: { type: 'string' },
          loan_amount: { type: 'number', format: 'float' },
          received_date: { type: 'string', format: 'date-time' },
          sla_deadline: { type: 'string', format: 'date-time', nullable: true },
          assigned_executive_id: { type: 'string', format: 'uuid', nullable: true },
          disbursement_total: { type: 'number', format: 'float' },
          professional_fee: { type: 'number', format: 'float' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateCaseRequest: {
        type: 'object',
        required: ['borrower_name', 'org_id', 'bank_id', 'case_type'],
        properties: {
          borrower_name: { type: 'string', minLength: 1, maxLength: 255 },
          org_id: { type: 'string', format: 'uuid' },
          bank_id: { type: 'string', format: 'uuid' },
          case_type: { type: 'string', enum: [
            'TITLE_SEARCH', 'LEGAL_VETTING', 'CTC', 'PROPERTY_REGISTRATION',
            'MORTGAGE_REGISTRATION', 'INTIMATION_MORTGAGE', 'FRANKING',
            'BALANCE_TRANSFER', 'PUBLIC_NOTICE', 'POWER_OF_ATTORNEY',
            'LEAVE_AND_LICENSE', 'GIFT_DEED', 'MARKET_VALUATION',
            'HOME_LOAN', 'LOAN_AGAINST_PROPERTY', 'MACHINERY_LOAN', 'PROJECT_LOAN',
          ]},
          loan_amount: { type: 'number', format: 'float', minimum: 0 },
          professional_fee: { type: 'number', format: 'float', minimum: 0 },
          sla_deadline: { type: 'string', format: 'date-time', nullable: true },
          property_address: { type: 'string', maxLength: 500 },
          property_city: { type: 'string', maxLength: 100 },
        },
      },
      UpdateCaseStatusRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: [
            'RECEIVED', 'ASSIGNED', 'DOCUMENT_COLLECTION', 'IN_PROGRESS',
            'PENDING_REGISTRATION', 'REGISTERED', 'QUALITY_CHECK',
            'DELIVERED', 'INVOICED', 'CLOSED', 'ON_HOLD', 'REJECTED', 'CANCELLED',
          ]},
          notes: { type: 'string', maxLength: 1000 },
        },
      },
      Timesheet: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          org_id: { type: 'string', format: 'uuid' },
          case_id: { type: 'string', format: 'uuid' },
          profile_id: { type: 'string', format: 'uuid' },
          task_description: { type: 'string' },
          start_time: { type: 'string', format: 'date-time' },
          end_time: { type: 'string', format: 'date-time', nullable: true },
          duration_minutes: { type: 'integer' },
          is_billable: { type: 'boolean' },
          hourly_rate: { type: 'number', format: 'float' },
          advocate_name: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateTimesheetRequest: {
        type: 'object',
        required: ['org_id', 'case_id', 'profile_id', 'task_description', 'start_time'],
        properties: {
          org_id: { type: 'string', format: 'uuid' },
          case_id: { type: 'string', format: 'uuid' },
          profile_id: { type: 'string', format: 'uuid' },
          task_description: { type: 'string', minLength: 1, maxLength: 1000 },
          start_time: { type: 'string', format: 'date-time' },
          end_time: { type: 'string', format: 'date-time' },
          duration_minutes: { type: 'integer', minimum: 1 },
          is_billable: { type: 'boolean', default: true },
          hourly_rate: { type: 'number', format: 'float', minimum: 0 },
        },
      },
      Document: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          case_id: { type: 'string', format: 'uuid' },
          org_id: { type: 'string', format: 'uuid' },
          uploader_id: { type: 'string', format: 'uuid', nullable: true },
          name: { type: 'string' },
          storage_path: { type: 'string' },
          bucket_id: { type: 'string' },
          content_type: { type: 'string', nullable: true },
          size_bytes: { type: 'integer' },
          category: { type: 'string', nullable: true },
          version_number: { type: 'integer' },
          uploaded_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateDocumentRequest: {
        type: 'object',
        required: ['name', 'storage_path'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255 },
          storage_path: { type: 'string', minLength: 1, maxLength: 500 },
          bucket_id: { type: 'string', maxLength: 100, default: 'case-documents' },
          content_type: { type: 'string', maxLength: 100 },
          size_bytes: { type: 'integer', minimum: 0, default: 0 },
          category: { type: 'string', maxLength: 100 },
        },
      },
      Bank: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          short_code: { type: 'string' },
          type: { type: 'string', enum: ['BANK', 'NBFC'] },
          billing_contact: { type: 'string', format: 'email', nullable: true },
          advance_balance: { type: 'number', format: 'float' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      CaseStats: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          inFlight: { type: 'integer' },
          held: { type: 'integer' },
          medianTat: { type: 'number', format: 'float' },
        },
      },
      BankVolume: {
        type: 'object',
        properties: {
          short_code: { type: 'string' },
          name: { type: 'string' },
          volume: { type: 'integer' },
        },
      },
      DashboardStatus: {
        type: 'object',
        properties: {
          totalTemplates: { type: 'integer' },
          activeAgents: { type: 'integer' },
          systemStatus: { type: 'string' },
          recentActivities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                action: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                details: { type: 'string' },
              },
            },
          },
        },
      },
      AuthUser: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['PRINCIPAL', 'ADVOCATE', 'EXECUTIVE', 'CLERK', 'BANK_VIEWER', 'APPLICANT'] },
          orgId: { type: 'string', format: 'uuid', nullable: true },
          fullName: { type: 'string', nullable: true },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'fullName'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          fullName: { type: 'string', minLength: 1, maxLength: 255 },
          orgId: { type: 'string', format: 'uuid' },
          role: { type: 'string', enum: ['PRINCIPAL', 'ADVOCATE', 'EXECUTIVE', 'CLERK', 'BANK_VIEWER'] },
        },
      },
      AIQuotaError: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'AI Quota Exceeded' },
        },
      },
      NeSLExecuteResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          transaction_id: { type: 'string', nullable: true },
          filing_reference: { type: 'string', nullable: true },
          message: { type: 'string', nullable: true },
          error: { type: 'string', nullable: true },
          mode: { type: 'string', enum: ['mock', 'production'] },
        },
      },
      NOIWorkflowRequest: {
        type: 'object',
        required: ['case_id', 'action'],
        properties: {
          case_id: { type: 'string' },
          action: { type: 'string', enum: ['generate_challan', 'verify_docs', 'file_noi', 'acknowledge', 'status'] },
          acknowledgment_number: { type: 'string', nullable: true },
        },
      },
      NOIWorkflowResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string', nullable: true },
          data: { type: 'object', nullable: true },
        },
      },
      NOIStatus: {
        type: 'object',
        properties: {
          case_id: { type: 'string' },
          borrower_name: { type: 'string' },
          bank_name: { type: 'string' },
          loan_amount: { type: 'string' },
          noi_status: { type: 'string' },
          grn_number: { type: 'string', nullable: true },
          acknowledgment_number: { type: 'string', nullable: true },
        },
      },
    },
  },
  security: [
    { bearerAuth: [] },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Basic health check',
        tags: ['System'],
        responses: {
          '200': {
            description: 'System is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    database: { type: 'string' },
                    version: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/health/deep': {
      get: {
        summary: 'Deep health check with dependency verification',
        tags: ['System'],
        responses: {
          '200': {
            description: 'Health check results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['healthy', 'degraded'] },
                    checks: {
                      type: 'object',
                      properties: {
                        database: { type: 'string' },
                        supabase: { type: 'string' },
                      },
                    },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/metrics': {
      get: {
        summary: 'Prometheus metrics endpoint',
        tags: ['System'],
        responses: {
          '200': {
            description: 'Prometheus metrics in text format',
            content: {
              'text/plain': {
                schema: { type: 'string' },
              },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current authenticated user',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Current user info',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/AuthUser' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Not authenticated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Email/password login',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/AuthUser' },
                  },
                },
              },
            },
          },
          '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register new user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          '201': { description: 'Registration successful' },
          '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Logout current user',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Logged out successfully' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Refresh session token',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Session refreshed' },
          '401': { description: 'Session expired', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/cases': {
      get: {
        summary: 'List all cases for organization',
        tags: ['Cases'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of cases',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Case' },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create new case',
        tags: ['Cases'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateCaseRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Case created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Case' },
              },
            },
          },
          '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/cases/stats': {
      get: {
        summary: 'Get case statistics',
        tags: ['Cases'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'by', in: 'query', schema: { type: 'string', enum: ['bank'] }, description: 'Group by field' },
        ],
        responses: {
          '200': {
            description: 'Case statistics',
            content: {
              'application/json': {
                oneOf: [
                  { $ref: '#/components/schemas/CaseStats' },
                  { type: 'array', items: { $ref: '#/components/schemas/BankVolume' } },
                ],
              },
            },
          },
        },
      },
    },
    '/cases/{id}': {
      get: {
        summary: 'Get case by ID',
        tags: ['Cases'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Case details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Case' } } },
          },
          '404': { description: 'Case not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      patch: {
        summary: 'Update case status',
        tags: ['Cases'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateCaseStatusRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Case updated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Case' } } },
          },
          '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Case not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/cases/{id}/status': {
      put: {
        summary: 'Update case status (legacy endpoint)',
        tags: ['Cases'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateCaseStatusRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Status updated' },
          '404': { description: 'Case not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/cases/{id}/timeline': {
      get: {
        summary: 'Get case timeline',
        tags: ['Cases'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Case timeline entries',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      case_id: { type: 'string' },
                      status_from: { type: 'string' },
                      status_to: { type: 'string' },
                      notes: { type: 'string' },
                      changed_by: { type: 'string' },
                      created_at: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/cases/{caseId}/documents': {
      get: {
        summary: 'List documents for a case',
        tags: ['Documents'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'caseId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'List of documents',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Document' } },
              },
            },
          },
        },
      },
      post: {
        summary: 'Upload document for a case',
        tags: ['Documents'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'caseId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateDocumentRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Document created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Document' } } },
          },
          '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/timesheets': {
      get: {
        summary: 'List timesheets',
        tags: ['Timesheets'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'case_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'org_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'List of timesheets',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Timesheet' } } } },
          },
        },
      },
      post: {
        summary: 'Create timesheet entry',
        tags: ['Timesheets'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateTimesheetRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Timesheet created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Timesheet' } } },
          },
          '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/dashboard/status': {
      get: {
        summary: 'Get dashboard status',
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Dashboard status',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DashboardStatus' } } },
          },
        },
      },
    },
    '/nesl/execute': {
      post: {
        summary: 'Execute NeSL filing',
        tags: ['NeSL'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'NeSL filing result',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/NeSLExecuteResponse' } } },
          },
        },
      },
    },
    '/workforce/agents/status': {
      get: {
        summary: 'Get workforce agent status',
        tags: ['Workforce'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Agent status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    agents: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          role: { type: 'string' },
                          load: { type: 'integer' },
                          status: { type: 'string' },
                        },
                      },
                    },
                    cluster: { type: 'string' },
                    today: { type: 'integer' },
                    avgTatHours: { type: 'number' },
                    cersaiFiled: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/webhooks/virus-scan': {
      post: {
        summary: 'Virus scan webhook',
        tags: ['Webhooks'],
        security: [{ apiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  bucketId: { type: 'string' },
                  filePath: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Scan result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    safe: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
    // AI Routes
    '/ai/generate-brief': {
      post: {
        summary: 'Generate project brief',
        tags: ['AI'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['project_name', 'client_name', 'scope_description'],
                properties: {
                  project_name: { type: 'string' },
                  client_name: { type: 'string' },
                  scope_description: { type: 'string' },
                  deliverables: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Streaming markdown response' },
          '402': { description: 'AI Quota Exceeded', content: { 'application/json': { schema: { $ref: '#/components/schemas/AIQuotaError' } } } },
        },
      },
    },
    '/ai/suggest-tasks': {
      post: {
        summary: 'Suggest tasks based on brief',
        tags: ['AI'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['brief'],
                properties: {
                  brief: { type: 'string' },
                  existingTasks: { type: 'array', items: { type: 'object' } },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Suggested tasks',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    tasks: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          title: { type: 'string' },
                          description: { type: 'string' },
                          status: { type: 'string' },
                          priority: { type: 'string' },
                          estimatedHours: { type: 'number' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/ai/draft-email': {
      post: {
        summary: 'Draft client email',
        tags: ['AI'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email_type', 'context_data'],
                properties: {
                  email_type: { type: 'string' },
                  context_data: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Email draft',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    draft: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/ai/send-email': {
      post: {
        summary: 'Send email via Resend',
        tags: ['AI'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['to', 'subject', 'body'],
                properties: {
                  to: { type: 'string', format: 'email' },
                  subject: { type: 'string' },
                  body: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Email sent' },
        },
      },
    },
    '/ai/invoice-line-item': {
      post: {
        summary: 'Generate invoice line items',
        tags: ['AI'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['time_entries', 'project_name'],
                properties: {
                  time_entries: { type: 'array', items: { type: 'object' } },
                  project_name: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Invoice line items',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    lineItems: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          description: { type: 'string' },
                          totalHours: { type: 'number' },
                          suggestedRate: { type: 'number' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/ai/summarize-document': {
      post: {
        summary: 'Summarize document',
        tags: ['AI'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['extracted_text'],
                properties: {
                  extracted_text: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Document summary',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    summary: {
                      type: 'object',
                      properties: {
                        summaryParagraph: { type: 'string' },
                        keyPoints: { type: 'array', items: { type: 'string' } },
                        actionItems: { type: 'array', items: { type: 'string' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/ai/search-projects': {
      post: {
        summary: 'Semantic project search',
        tags: ['AI'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['query'],
                properties: {
                  query: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Search results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    results: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/ai/ingest-project': {
      post: {
        summary: 'Ingest project for semantic search',
        tags: ['AI'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['projectId', 'content'],
                properties: {
                  projectId: { type: 'string' },
                  content: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Project ingested' },
        },
      },
    },
    '/ai/vet-document': {
      post: {
        summary: 'Legal document vetting',
        tags: ['AI'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['documentText'],
                properties: {
                  documentText: { type: 'string' },
                  documentType: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Vetting result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['APPROVED', 'NEEDS_MANUAL_REVIEW', 'REJECTED'] },
                    feedback: { type: 'string' },
                    risks: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export function setupOpenAPI(app: Express, apiPrefix: string) {
  // Serve OpenAPI JSON
  app.get(`${apiPrefix}/openapi.json`, (req, res) => {
    res.json(openAPISpec);
  });

  // Serve Scalar API reference (development only)
  if (process.env.NODE_ENV !== 'production') {
    try {
      const scalarHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>API Reference</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
  <script id="api-reference" data-url="${apiPrefix}/openapi.json"></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>
      `;
      app.get(`${apiPrefix}/docs`, (req, res) => {
        res.send(scalarHTML);
      });
    } catch (e) {
      // Scalar not available
    }
  }
}

export { openAPISpec };