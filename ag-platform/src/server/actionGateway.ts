import { logAuditEvent } from './audit.ts';
import { AuthUser } from './auth.ts';

export type ActionLevel = 'L0' | 'L1' | 'L2' | 'L3';

export interface ActionDefinition {
  level: ActionLevel;
  requiredPermissions: string[];
  requiredApprovals: number;
  approverRoles: string[];
}

export const ACTION_DEFINITIONS: Record<string, ActionDefinition> = {
  'matter.read': { level: 'L0', requiredPermissions: ['matter:read'], requiredApprovals: 0, approverRoles: [] },
  'matter.update': { level: 'L1', requiredPermissions: ['matter:update'], requiredApprovals: 0, approverRoles: [] },
  'document.delete': { level: 'L2', requiredPermissions: ['document:delete'], requiredApprovals: 1, approverRoles: ['PRINCIPAL', 'ADVOCATE'] },
  'rpa.execute': { level: 'L3', requiredPermissions: ['rpa:execute'], requiredApprovals: 2, approverRoles: ['PRINCIPAL'] },
  'payment.release': { level: 'L3', requiredPermissions: ['payment:release'], requiredApprovals: 2, approverRoles: ['PRINCIPAL'] },
};

export interface ActionApproval {
  approverId: string;
  role: string;
}

export interface ActionDecision {
  allowed: boolean;
  level: ActionLevel;
  requiredApprovals: number;
  reason?: string;
}

export function evaluateAction(
  action: string,
  actor: AuthUser,
  approvals: readonly ActionApproval[] = [],
): ActionDecision {
  const definition = ACTION_DEFINITIONS[action];
  if (!definition) {
    return { allowed: false, level: 'L3', requiredApprovals: 0, reason: 'Unknown action' };
  }
  const permissions = actor.permissions ?? [];
  if (!definition.requiredPermissions.every(permission => permissions.includes(permission))) {
    return { allowed: false, level: definition.level, requiredApprovals: definition.requiredApprovals, reason: 'Missing permission' };
  }
  const distinctApprovers = new Set(approvals.filter(a => a.approverId !== actor.id).map(a => a.approverId));
  const validApproverIds = new Set(
    approvals
      .filter(a => definition.approverRoles.includes(a.role) && distinctApprovers.has(a.approverId))
      .map(a => a.approverId),
  );
  if (validApproverIds.size < definition.requiredApprovals) {
    return {
      allowed: false,
      level: definition.level,
      requiredApprovals: definition.requiredApprovals,
      reason: 'Additional approval required',
    };
  }
  return { allowed: true, level: definition.level, requiredApprovals: definition.requiredApprovals };
}

export async function executeAction<T>(
  action: string,
  actor: AuthUser,
  orgId: string,
  handler: () => Promise<T>,
  approvals: readonly ActionApproval[] = [],
): Promise<T> {
  const decision = evaluateAction(action, actor, approvals);
  await logAuditEvent({
    orgId,
    eventType: decision.allowed ? 'ACTION_EXECUTED' : 'ACTION_BLOCKED',
    eventCategory: 'action',
    actorId: actor.id,
    actorRole: actor.role,
    actorType: 'user',
    metadata: { action, level: decision.level, reason: decision.reason, requiredApprovals: decision.requiredApprovals },
    severity: decision.allowed ? 'info' : 'warning',
  });
  if (!decision.allowed) throw new Error(decision.reason || 'Action not permitted');
  return handler();
}
