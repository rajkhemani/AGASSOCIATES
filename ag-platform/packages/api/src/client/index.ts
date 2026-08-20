// @ag/api/client - TanStack Query API Client with org_id injection

import { QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@ag/web/src/store/useAuthStore';

// API Configuration
const API_BASE = '/api/v1';
const DEFAULT_STALE_TIME = 30_000; // 30 seconds
const DEFAULT_GC_TIME = 5 * 60_000; // 5 minutes

// Create a single QueryClient instance (singleton pattern)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME,
      gcTime: DEFAULT_GC_TIME,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 0,
    },
  },
});

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Get auth token and org_id from Zustand store
function getAuthHeaders(): Record<string, string> {
  const { session, role } = useAuthStore.getState();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  // org_id is injected via middleware on server, but we also send it for
  // explicit tenant context validation
  // Note: In production, org_id comes from JWT claims verified by middleware
  // This header is for explicit context and debugging
  const user = useAuthStore.getState().user;
  if (user?.app_metadata?.org_id) {
    headers['X-Org-ID'] = user.app_metadata.org_id;
  }

  return headers;
}

// Core fetch wrapper with error handling
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: { code?: string; message?: string; requestId?: string } = {};
    try {
      errorData = await response.json();
    } catch {
      // Ignore parse errors
    }

    throw new ApiError(
      response.status,
      errorData.code || 'API_ERROR',
      errorData.message || `Request failed with status ${response.status}`,
      errorData.requestId || response.headers.get('X-Request-ID') || undefined
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// HTTP method helpers
export const api = {
  get: <T>(endpoint: string, params?: Record<string, string>) => {
    const url = params ? `${endpoint}?${new URLSearchParams(params).toString()}` : endpoint;
    return fetchApi<T>(url, { method: 'GET' });
  },

  post: <T>(endpoint: string, body: unknown) =>
    fetchApi<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body: unknown) =>
    fetchApi<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  patch: <T>(endpoint: string, body: unknown) =>
    fetchApi<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string) =>
    fetchApi<T>(endpoint, { method: 'DELETE' }),
};

// Query key factory for consistent cache keys
export const queryKeys = {
  // Command Center
  commandCenter: {
    activeMatters: (orgId: string) => ['command-center', 'active-matters', orgId] as const,
    slaRisks: (orgId: string) => ['command-center', 'sla-risks', orgId] as const,
    pendingApprovals: (orgId: string) => ['command-center', 'pending-approvals', orgId] as const,
    aiTasks: (orgId: string) => ['command-center', 'ai-tasks', orgId] as const,
    upcomingDeadlines: (orgId: string) => ['command-center', 'upcoming-deadlines', orgId] as const,
    externalActions: (orgId: string) => ['command-center', 'external-actions', orgId] as const,
    institutionActivity: (orgId: string) => ['command-center', 'institution-activity', orgId] as const,
    systemHealth: (orgId: string) => ['command-center', 'system-health', orgId] as const,
  },

  // Matters / Cases
  matters: {
    list: (orgId: string, filters?: Record<string, string>) =>
      ['matters', 'list', orgId, filters] as const,
    detail: (orgId: string, matterId: string) =>
      ['matters', 'detail', orgId, matterId] as const,
    workflow: (orgId: string, matterId: string) =>
      ['matters', 'workflow', orgId, matterId] as const,
  },

  // Tasks
  tasks: {
    list: (orgId: string, filters?: Record<string, string>) =>
      ['tasks', 'list', orgId, filters] as const,
    detail: (orgId: string, taskId: string) =>
      ['tasks', 'detail', orgId, taskId] as const,
  },

  // Approvals
  approvals: {
    list: (orgId: string, filters?: Record<string, string>) =>
      ['approvals', 'list', orgId, filters] as const,
    detail: (orgId: string, approvalId: string) =>
      ['approvals', 'detail', orgId, approvalId] as const,
  },

  // Documents
  documents: {
    list: (orgId: string, matterId?: string) =>
      ['documents', 'list', orgId, matterId] as const,
    detail: (orgId: string, documentId: string) =>
      ['documents', 'detail', orgId, documentId] as const,
    versions: (orgId: string, documentId: string) =>
      ['documents', 'versions', orgId, documentId] as const,
  },

  // Actions
  actions: {
    list: (orgId: string, filters?: Record<string, string>) =>
      ['actions', 'list', orgId, filters] as const,
    detail: (orgId: string, actionId: string) =>
      ['actions', 'detail', orgId, actionId] as const,
  },

  // Reports
  reports: {
    list: (orgId: string) => ['reports', 'list', orgId] as const,
    detail: (orgId: string, reportId: string) => ['reports', 'detail', orgId, reportId] as const,
  },

  // Admin
  admin: {
    users: (orgId: string) => ['admin', 'users', orgId] as const,
    workflows: (orgId: string) => ['admin', 'workflows', orgId] as const,
    settings: (orgId: string) => ['admin', 'settings', orgId] as const,
  },
};

// Helper to get org_id from auth store
export function getOrgId(): string | undefined {
  const user = useAuthStore.getState().user;
  return user?.app_metadata?.org_id;
}

// Invalidation helpers
export const invalidate = {
  all: () => queryClient.invalidateQueries({ queryKey: ['command-center'] }),
  matters: (orgId: string) => queryClient.invalidateQueries({ queryKey: ['matters', 'list', orgId] }),
  tasks: (orgId: string) => queryClient.invalidateQueries({ queryKey: ['tasks', 'list', orgId] }),
  approvals: (orgId: string) => queryClient.invalidateQueries({ queryKey: ['approvals', 'list', orgId] }),
  documents: (orgId: string) => queryClient.invalidateQueries({ queryKey: ['documents', 'list', orgId] }),
  actions: (orgId: string) => queryClient.invalidateQueries({ queryKey: ['actions', 'list', orgId] }),
};

export default queryClient;