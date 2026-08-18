/// <reference types="vitest/globals" />
import { vi } from 'vitest';

// Mock environment variables
vi.stubGlobal('import.meta', {
  env: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    SUPABASE_JWT_SECRET: 'test-jwt-secret',
    NODE_ENV: 'test',
  },
});

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user', email: 'test@test.com' } }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user', email: 'test@test.com' } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
}));

// Mock Resend
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: 'test-email-id' }, error: null }),
    },
  })),
}));

// Mock AI SDK
vi.mock('ai', () => ({
  streamText: vi.fn().mockResolvedValue({
    pipeTextStreamToResponse: vi.fn(),
  }),
  generateText: vi.fn().mockResolvedValue({ text: 'Generated text' }),
  generateObject: vi.fn().mockResolvedValue({ object: {} }),
  embed: vi.fn().mockResolvedValue({ embedding: [0.1, 0.2, 0.3] }),
}));

vi.mock('@ai-sdk/google', () => ({
  google: vi.fn(() => 'gemini-model'),
}));

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
  onopen: null,
  onclose: null,
  onmessage: null,
  onerror: null,
  send: vi.fn(),
  close: vi.fn(),
})) as any;

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  },
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};