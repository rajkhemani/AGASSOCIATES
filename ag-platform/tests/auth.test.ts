import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSupabaseMiddleware, requireRole, requireOrgAccess, optionalAuth } from '../../src/server/auth.ts';
import { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import express from 'express';

// Mock Supabase
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@test.com' } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'test-profile', org_id: 'test-org', role: 'ADVOCATE', full_name: 'Test User' },
        error: null,
      }),
    })),
  })),
}));

describe('Auth Middleware', () => {
  let app: express.Express;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());

    mockReq = {
      cookies: {},
      headers: {},
    } as Partial<Request>;

    mockRes = {
      cookie: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as Partial<Response>;

    mockNext = vi.fn();
  });

  describe('createSupabaseMiddleware', () => {
    it('attaches user to request on valid session', async () => {
      const middleware = createSupabaseMiddleware();

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.id).toBe('test-user');
      expect(mockReq.user?.role).toBe('ADVOCATE');
      expect(mockReq.user?.orgId).toBe('test-org');
    });

    it('returns 401 for invalid session', async () => {
      // Re-mock to return no user
      const { createServerClient } = await import('@supabase/ssr');
      (createServerClient as any).mockImplementationOnce(() => ({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Invalid token' } }),
        },
        from: vi.fn(),
      }));

      const middleware = createSupabaseMiddleware();

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('allows authorized roles', () => {
      const middleware = requireRole('PRINCIPAL', 'ADVOCATE');

      mockReq.user = { id: 'test-user', role: 'ADVOCATE', orgId: 'test-org' };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('rejects unauthorized roles', () => {
      const middleware = requireRole('PRINCIPAL', 'ADVOCATE');

      mockReq.user = { id: 'test-user', role: 'CLERK', orgId: 'test-org' };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: 'FORBIDDEN' }),
        })
      );
    });

    it('rejects when no user', () => {
      const middleware = requireRole('PRINCIPAL');

      mockReq.user = undefined;

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('requireOrgAccess', () => {
    it('allows when user has orgId', () => {
      const middleware = requireOrgAccess();

      mockReq.user = { id: 'test-user', role: 'ADVOCATE', orgId: 'test-org' };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('rejects when user has no orgId', () => {
      const middleware = requireOrgAccess();

      mockReq.user = { id: 'test-user', role: 'APPLICANT', orgId: undefined };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('optionalAuth', () => {
    it('continues without user when no session', async () => {
      const { createServerClient } = await import('@supabase/ssr');
      (createServerClient as any).mockImplementationOnce(() => ({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      }));

      const middleware = optionalAuth();

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    it('attaches user when session valid', async () => {
      const middleware = optionalAuth();

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
    });
  });
});