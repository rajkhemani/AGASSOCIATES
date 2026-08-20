// @ag/api/hooks - TanStack Query hooks for all API endpoints

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, queryKeys, invalidate, type ApiError } from '../client';
import { useAuthStore } from '@ag/web/src/store/useAuthStore';

// Type definitions for API responses
export interface ActiveMatter {
  id: string;
  case_number: string;
  borrower_name: string;
  case_type: string;
  status: string;
  bank_id: string;
  loan_amount: number;
  sla_deadline: string;
  recovery_status: string;
  workflow_instance_id?: string;
  current_state?: string;
  hours_until_sla: number;
  is_overdue: boolean;
}

export interface SLARisk {
  id: string;
  case_number: string;
  borrower_name: string;
  case_type: string;
  sla_deadline: string;
  hours_remaining: number;
  risk_level: 'critical' | 'warning' | 'normal';
}

export interface PendingApproval {
  id: string;
  case_id: string;
  case_number: string;
  borrower_name: string;
  approval_type: string;
  requested_by: string;
  requested_at: string;
  required_approvers: string[];
  approvals: Record<string, { approved: boolean; at: string }>;
  status: string;
}

export interface AITask {
  id: string;
  case_id: string;
  case_number: string;
  agent: string;
  agent_version: string;
  model_provider: string;
  model_route: string;
  status: string;
  started_at: string;
  completed_at?: string;
  confidence?: number;
  risk_flags?: string[];
  input_hash: string;
}

export interface UpcomingDeadline {
  id: string;
  workflow_instance_id: string;
  case_id: string;
  case_number: string;
  borrower_name: string;
  deadline_type: string;
  label: string;
  due_at: string;
  status: string;
  hours_until_due: number;
}

export interface ExternalAction {
  id: string;
  case_id: string;
  case_number: string;
  action_type: string;
  channel: string;
  status: string;
  adapter_mode: 'LIVE' | 'SANDBOX' | 'MOCK' | 'NOT_CONFIGURED';
  external_ref_id?: string;
  attempt_count: number;
  last_attempt_at?: string;
  created_at: string;
}

export interface InstitutionActivity {
  id: string;
  bank_name: string;
  case_count: number;
  active_cases: number;
  completed_cases: number;
  avg_tat_hours: number;
  sla_breaches: number;
  last_activity: string;
}

export interface SystemHealth {
  database: 'healthy' | 'degraded' | 'down';
  redis: 'healthy' | 'degraded' | 'down';
  aiBackend: 'healthy' | 'degraded' | 'down';
  externalAdapters: Record<string, 'LIVE' | 'SANDBOX' | 'MOCK' | 'NOT_CONFIGURED'>;
  lastCheck: string;
}

// Command Center Hooks
export function useActiveMatters() {
  const orgId = useAuthStore((state) => state.user?.app_metadata?.org_id);
  
  return useQuery({
    queryKey: queryKeys.commandCenter.activeMatters(orgId || ''),
    queryFn: () => api.get<{ matters: ActiveMatter[] }>('/command-center/active-matters'),
    enabled: !!orgId,
    select: (data) => data.matters,
  });
}

export function useSLARisks() {
  const orgId = useAuthStore((state) => state.user?.app_metadata?.org_id);
  
  return useQuery({
    queryKey: queryKeys.commandCenter.slaRisks(orgId || ''),
    queryFn: () => api.get<{ risks: SLARisk[] }>('/command-center/sla-risks'),
    enabled: !!orgId,
    select: (data) => data.risks,
  });
}

export function usePendingApprovals() {
  const orgId = useAuthStore((state) => state.user?.app_metadata?.org_id);
  
  return useQuery({
    queryKey: queryKeys.commandCenter.pendingApprovals(orgId || ''),
    queryFn: () => api.get<{ approvals: PendingApproval[] }>('/command-center/pending-approvals'),
    enabled: !!orgId,
    select: (data) => data.approvals,
  });
}

export function useAITasks() {
  const orgId = useAuthStore((state) => state.user?.app_metadata?.org_id);
  
  return useQuery({
    queryKey: queryKeys.commandCenter.aiTasks(orgId || ''),
    queryFn: () => api.get<{ tasks: AITask[] }>('/command-center/ai-tasks'),
    enabled: !!orgId,
    select: (data) => data.tasks,
  });
}

export function useUpcomingDeadlines() {
  const orgId = useAuthStore((state) => state.user?.app_metadata?.org_id);
  
  return useQuery({
    queryKey: queryKeys.commandCenter.upcomingDeadlines(orgId || ''),
    queryFn: () => api.get<{ deadlines: UpcomingDeadline[] }>('/command-center/upcoming-deadlines'),
    enabled: !!orgId,
    select: (data) => data.deadlines,
  });
}

export function useExternalActions() {
  const orgId = useAuthStore((state) => state.user?.app_metadata?.org_id);
  
  return useQuery({
    queryKey: queryKeys.commandCenter.externalActions(orgId || ''),
    queryFn: () => api.get<{ actions: ExternalAction[] }>('/command-center/external-actions'),
    enabled: !!orgId,
    select: (data) => data.actions,
  });
}

export function useInstitutionActivity() {
  const orgId = useAuthStore((state) => state.user?.app_metadata?.org_id);
  
  return useQuery({
    queryKey: queryKeys.commandCenter.institutionActivity(orgId || ''),
    queryFn: () => api.get<{ institutions: InstitutionActivity[] }>('/command-center/institution-activity'),
    enabled: !!orgId,
    select: (data) => data.institutions,
  });
}

export function useSystemHealth() {
  const orgId = useAuthStore((state) => state.user?.app_metadata?.org_id);
  
  return useQuery({
    queryKey: queryKeys.commandCenter.systemHealth(orgId || ''),
    queryFn: () => api.get<{ health: SystemHealth }>('/command-center/system-health'),
    enabled: !!orgId,
    select: (data) => data.health,
    refetchInterval: 60_000, // Refetch every minute
  });
}

// Approval mutations
export function useApproveApproval() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((state) => state.user?.app_metadata?.org_id);
  
  return useMutation({
    mutationFn: (approvalId: string) => 
      api.post<{ success: boolean }>(`/approvals/${approvalId}/approve`, {}),
    onSuccess: () => {
      invalidate.approvals(orgId || '');
    },
    onError: (error: ApiError) => {
      console.error('Approval failed:', error.message);
    },
  });
}

export function useRejectApproval() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((state) => state.user?.app_metadata?.org_id);
  
  return useMutation({
    mutationFn: ({ approvalId, reason }: { approvalId: string; reason: string }) => 
      api.post<{ success: boolean }>(`/approvals/${approvalId}/reject`, { reason }),
    onSuccess: () => {
      invalidate.approvals(orgId || '');
    },
  });
}

// Generic mutation hook factory
export function createMutationHook<TData, TVariables>(
  endpoint: string,
  method: 'post' | 'put' | 'patch' | 'delete',
  invalidationKeys: string[]
) {
  return function useMutationHook() {
    const queryClient = useQueryClient();
    const orgId = useAuthStore((state) => state.user?.app_metadata?.org_id);
    
    return useMutation<TData, ApiError, TVariables>({
      mutationFn: (variables) => api[method]<TData>(endpoint, variables),
      onSuccess: () => {
        invalidationKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key, orgId] });
        });
      },
    });
  };
}

export const useCreateMatter = createMutationHook(
  '/matters',
  'post',
  ['matters']
);

export const useUpdateMatter = createMutationHook(
  '/matters/:id',
  'patch',
  ['matters']
);

export const useCreateTask = createMutationHook(
  '/tasks',
  'post',
  ['tasks']
);

export const useUpdateTask = createMutationHook(
  '/tasks/:id',
  'patch',
  ['tasks']
);

export const useCreateDocument = createMutationHook(
  '/documents',
  'post',
  ['documents']
);

export const useUploadDocument = createMutationHook(
  '/documents/upload',
  'post',
  ['documents']
);

export const useCreateAction = createMutationHook(
  '/actions',
  'post',
  ['actions']
);

export const useUpdateAction = createMutationHook(
  '/actions/:id',
  'patch',
  ['actions']
);