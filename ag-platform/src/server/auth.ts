import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Express, Request, Response, NextFunction } from 'express';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('SUPABASE_URL or SUPABASE_ANON_KEY not configured. Auth will not work correctly.');
}

export interface AuthUser {
  id: string;
  role: string;
  email?: string;
  orgId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      supabase?: ReturnType<typeof createServerClient>;
    }
  }
}

export function createSupabaseMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const supabase = createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      cookies: {
        get(name: string) {
          return req.cookies?.[name];
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookie(name, value, { ...options, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
        },
        remove(name: string, options: CookieOptions) {
          res.cookie(name, '', { ...options, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0 });
        },
      },
    });

    req.supabase = supabase;

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, org_id, role')
      .eq('user_id', user.id)
      .single();

    req.user = {
      id: user.id,
      email: user.email,
      role: profile?.role || 'applicant',
      orgId: profile?.org_id,
    };

    next();
  };
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
      return;
    }
    next();
  };
}

export function requireOrgAccess() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.orgId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Organization access required' } });
      return;
    }
    next();
  };
}

export function optionalAuth() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const supabase = createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      cookies: {
        get(name: string) {
          return req.cookies?.[name];
        },
        set() {},
        remove() {},
      },
    });

    req.supabase = supabase;

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, org_id, role')
        .eq('user_id', user.id)
        .single();

      req.user = {
        id: user.id,
        email: user.email,
        role: profile?.role || 'applicant',
        orgId: profile?.org_id,
      };
    }

    next();
  };
}