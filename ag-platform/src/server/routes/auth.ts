import { Router, Request, Response } from 'express';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from 'express';

const router = Router();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

function getSupabase(req: Request, res: Response) {
  return createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
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
}

// GET /api/auth/me - Get current user session
router.get('/me', async (req, res) => {
  try {
    const supabase = getSupabase(req, res);
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, org_id, role, full_name')
      .eq('user_id', user.id)
      .single();

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: profile?.role || 'applicant',
        orgId: profile?.org_id,
        fullName: profile?.full_name,
      },
    });
  } catch (err: any) {
    console.error('Auth/me error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to get session' } });
  }
});

// POST /api/auth/login - Email/password login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Email and password required' } });
    }

    const supabase = getSupabase(req, res);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: error.message } });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, org_id, role, full_name')
      .eq('user_id', data.user!.id)
      .single();

    res.json({
      user: {
        id: data.user!.id,
        email: data.user!.email,
        role: profile?.role || 'applicant',
        orgId: profile?.org_id,
        fullName: profile?.full_name,
      },
    });
  } catch (err: any) {
    console.error('Auth/login error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Login failed' } });
  }
});

// POST /api/auth/register - Register new user (invite-only in production)
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, orgId, role } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Email, password, and full name required' } });
    }

    const supabase = getSupabase(req, res);
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: error.message } });
    }

    // Create profile
    if (data.user) {
      await supabase.from('profiles').insert({
        user_id: data.user.id,
        full_name: fullName,
        org_id: orgId || null,
        role: role || 'applicant',
      });
    }

    res.status(201).json({ message: 'Registration successful. Please check email for verification.' });
  } catch (err: any) {
    console.error('Auth/register error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Registration failed' } });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const supabase = getSupabase(req, res);
    await supabase.auth.signOut();
    res.json({ message: 'Logged out successfully' });
  } catch (err: any) {
    console.error('Auth/logout error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Logout failed' } });
  }
});

// POST /api/auth/refresh - Refresh session
router.post('/refresh', async (req, res) => {
  try {
    const supabase = getSupabase(req, res);
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Session expired' } });
    }

    res.json({ session: data.session });
  } catch (err: any) {
    console.error('Auth/refresh error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Token refresh failed' } });
  }
});

export default router;