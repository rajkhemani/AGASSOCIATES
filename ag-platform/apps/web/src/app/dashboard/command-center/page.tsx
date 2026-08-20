// Command Center Dashboard Page
// P6 Task 1: Command Center Dashboard
// Path: ag-platform/apps/web/src/app/dashboard/command-center/page.tsx

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  AlertTriangle, 
  Clock, 
  Brain, 
  Calendar, 
  Send, 
  Building2, 
  Activity,
  Shield,
  TrendingUp,
  TrendingDown,
  Loader2,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SkeletonList } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

// ============================================================
// Types
// ============================================================

interface ActiveMatter {
  id: string;
  caseNumber: string;
  borrowerName: string;
  caseType: string;
  status: string;
  bankName: string;
  loanAmount: number;
  slaDeadline: string;
  recoveryStatus?: string;
  workflowInstanceId?: string;
  currentState?: string;
  isOverdue: boolean;
  hoursUntilSla: number;
}

interface SLARiskItem {
  id: string;
  caseNumber: string;
  borrowerName: string;
  hoursRemaining: number;
  slaDeadline: string;
  riskLevel: 'critical' | 'warning' | 'normal';
  caseType: string;
}

interface PendingApproval {
  id: string;
  caseId: string;
  caseNumber: string;
  borrowerName: string;
  approvalType: string;
  requestedBy: string;
  requestedAt: string;
  requiredApprovers: string[];
  approvals: Array<{
    approverId: string;
    role: string;
    decision: 'approved' | 'rejected' | 'pending';
    timestamp: string;
  }>;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
}

interface AITask {
  id: string;
  caseId: string;
  caseNumber: string;
  agent: string;
  agentVersion: string;
  modelProvider: string;
  modelRoute: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'review_required';
  startedAt: string;
  completedAt?: string;
  confidence?: number;
  riskFlags?: string[];
  inputHash: string;
}

interface UpcomingDeadline {
  id: string;
  caseId: string;
  caseNumber: string;
  borrowerName: string;
  deadlineType: 'statutory' | 'sla' | 'internal' | 'escalation';
  label: string;
  dueAt: string;
  status: 'pending' | 'triggered' | 'completed' | 'breached';
  workflowInstanceId?: string;
  hoursUntilDue: number;
}

interface ExternalActionItem {
  id: string;
  caseId: string;
  caseNumber: string;
  actionType: string;
  channel: string;
  status: 'proposed' | 'policy_checked' | 'approval_pending' | 'approved' | 'executing' | 'succeeded' | 'failed' | 'cancelled';
  adapterMode: 'LIVE' | 'SANDBOX' | 'MOCK' | 'NOT_CONFIGURED';
  externalRefId?: string;
  attempts: number;
  lastAttemptAt?: string;
  createdAt: string;
}

interface InstitutionActivity {
  id: string;
  bankName: string;
  caseCount: number;
  activeCases: number;
  completedCases: number;
  avgTatHours: number;
  slaBreaches: number;
  lastActivity: string;
}

interface SystemHealth {
  database: 'healthy' | 'degraded' | 'down';
  redis: 'healthy' | 'degraded' | 'down';
  aiBackend: 'healthy' | 'degraded' | 'down';
  externalAdapters: Record<string, 'LIVE' | 'SANDBOX' | 'MOCK' | 'NOT_CONFIGURED'>;
  lastCheck: string;
}

// ============================================================
// Utility Functions
// ============================================================

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  
  if (diffMs < 0) {
    const pastMs = -diffMs;
    const hours = Math.floor(pastMs / (1000 * 60 * 60));
    const minutes = Math.floor((pastMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m ago`;
    return `${minutes}m ago`;
  }
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m`;
}

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

function getRiskColor(risk: string): string {
  switch (risk) {
    case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'warning': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    default: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
    case 'succeeded':
    case 'approved':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    case 'running':
    case 'executing':
    case 'executing':
      return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
    case 'pending':
    case 'proposed':
    case 'policy_checked':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'failed':
    case 'rejected':
    case 'breached':
      return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'review_required':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    default:
      return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  }
}

function getAdapterModeColor(mode: string): string {
  switch (mode) {
    case 'LIVE': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    case 'SANDBOX': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'MOCK': return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
    case 'NOT_CONFIGURED': return 'text-red-400 bg-red-500/10 border-red-500/20';
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  }
}

function getHealthColor(health: string): string {
  switch (health) {
    case 'healthy': return 'text-emerald-400';
    case 'degraded': return 'text-amber-400';
    case 'down': return 'text-red-400';
    default: return 'text-slate-400';
  }
}

// ============================================================
// Section Components
// ============================================================

function SectionHeader({ 
  title, 
  subtitle, 
  icon: Icon, 
  iconColor = 'text-violet-400',
  action 
}: { 
  title: string; 
  subtitle?: string; 
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-6"
    >
      <div className="flex items-center gap-3">
        <Icon size={24} className={iconColor} aria-hidden="true" />
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {subtitle && <p className="text-white/50 text-sm">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </motion.div>
  );
}

function MetricCard({ 
  label, 
  value, 
  trend, 
  trendUp = true,
  icon: Icon,
  iconColor = 'text-violet-400'
}: { 
  label: string; 
  value: string | number; 
  trend?: string; 
  trendUp?: boolean;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-4">
        <Icon size={32} className={iconColor} aria-hidden="true" />
        <div className="flex-1">
          <p className="text-white/50 text-sm">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {trend && (
            <p className={cn('text-xs font-medium mt-1 flex items-center gap-1', trendUp ? 'text-emerald-400' : 'text-red-400')}>
              {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trend}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Active Matters Section
function ActiveMattersSection({ matters, loading, error, onRefresh }: { 
  matters: ActiveMatter[]; 
  loading: boolean; 
  error: string | null;
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <motion.div className="glass-card p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <SectionHeader title="Active Matters" subtitle={`${matters.length} active cases`} icon={FileText} />
        <SkeletonList rows={5} />
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div className="glass-card p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <SectionHeader title="Active Matters" icon={FileText} action={
          <button onClick={onRefresh} className="glass-button text-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Retry
          </button>
        } />
        <ErrorState title="Failed to load active matters" message={error} onRetry={onRefresh} />
      </motion.div>
    );
  }

  return (
    <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader 
        title="Active Matters" 
        subtitle={`${matters.length} active cases`} 
        icon={FileText} 
        action={
          <button onClick={onRefresh} className="glass-button text-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        } 
      />
      
      {matters.length === 0 ? (
        <EmptyState 
          title="No active matters" 
          description="All cases are completed or on hold" 
          icon={<FileText size={48} className="text-white/20" />}
        />
      ) : (
        <div className="space-y-3" role="list" aria-label="Active Matters">
          {matters.map((matter, index) => (
            <motion.div
              key={matter.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border transition-all",
                matter.isOverdue 
                  ? 'bg-rose-500/10 border-rose-500/20' 
                  : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05]'
              )}
              role="listitem"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white truncate">{matter.borrowerName}</h3>
                  <span className="font-mono text-xs font-bold text-violet-400">{matter.caseNumber}</span>
                  {matter.isOverdue && (
                    <span className="ml-auto flex items-center gap-1 text-xs font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                      <AlertTriangle size={10} /> OVERDUE
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-white/60">
                  <span className="flex items-center gap-1"><FileText size={12} /> {matter.caseType.replace(/_/g, ' ')}</span>
                  <span className="flex items-center gap-1"><Building2 size={12} /> {matter.bankName}</span>
                  <span className="flex items-center gap-1"><Zap size={12} /> ₹{(matter.loanAmount / 10000000).toFixed(2)} Cr</span>
                  {matter.recoveryStatus && (
                    <span className="flex items-center gap-1"><Activity size={12} /> {matter.recoveryStatus.replace(/_/g, ' ')}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-bold text-white">{formatHours(matter.hoursUntilSla)}</p>
                <p className="text-xs text-white/50">SLA deadline</p>
                <p className="text-xs text-white/40 mt-1">{new Date(matter.slaDeadline).toLocaleString()}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// SLA Risk Section
function SLARiskSection({ risks, loading, error, onRefresh }: { 
  risks: SLARiskItem[]; 
  loading: boolean; 
  error: string | null;
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <motion.div className="glass-card p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <SectionHeader title="SLA Risk" subtitle="Cases approaching deadline" icon={AlertTriangle} iconColor="text-amber-400" />
        <SkeletonList rows={4} />
      </motion.div>
    );
  }

  const criticalRisks = risks.filter(r => r.riskLevel === 'critical');
  const warningRisks = risks.filter(r => r.riskLevel === 'warning');

  return (
    <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader 
        title="SLA Risk" 
        subtitle={`${criticalRisks.length} critical, ${warningRisks.length} warnings`} 
        icon={AlertTriangle} 
        iconColor="text-amber-400"
        action={
          <button onClick={onRefresh} className="glass-button text-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        } 
      />
      
      {risks.length === 0 ? (
        <EmptyState 
          title="No SLA risks" 
          description="All cases are within SLA limits" 
          icon={<CheckCircle size={48} className="text-emerald-400" />}
        />
      ) : (
        <div className="space-y-3" role="list" aria-label="SLA Risks">
          {risks.map((risk, index) => (
            <motion.div
              key={risk.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border transition-all",
                getRiskColor(risk.riskLevel)
              )}
              role="listitem"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white truncate">{risk.borrowerName}</h3>
                  <span className="font-mono text-xs font-bold text-amber-400">{risk.caseNumber}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-white/60">
                  <span className="flex items-center gap-1"><FileText size={12} /> {risk.caseType.replace(/_/g, ' ')}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {formatHours(risk.hoursRemaining)} remaining</span>
                </div>
              </div>
              <div className="text-right">
                <span className={cn(
                  'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium',
                  getRiskColor(risk.riskLevel)
                )}>
                  {risk.riskLevel.toUpperCase()}
                </span>
                <p className="text-xs text-white/40 mt-1">{formatRelativeTime(risk.slaDeadline)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Pending Approvals Section
function PendingApprovalsSection({ approvals, loading, error, onRefresh }: { 
  approvals: PendingApproval[]; 
  loading: boolean; 
  error: string | null;
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <motion.div className="glass-card p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <SectionHeader title="Pending Approvals" subtitle="Awaiting review" icon={Shield} iconColor="text-blue-400" />
        <SkeletonList rows={4} />
      </motion.div>
    );
  }

  const pendingApprovals = approvals.filter(a => a.status === 'pending');

  return (
    <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader 
        title="Pending Approvals" 
        subtitle={`${pendingApprovals.length} awaiting review`} 
        icon={Shield} 
        iconColor="text-blue-400"
        action={
          <button onClick={onRefresh} className="glass-button text-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        } 
      />
      
      {approvals.length === 0 ? (
        <EmptyState 
          title="No approvals pending" 
          description="All approval requests are processed" 
          icon={<CheckCircle size={48} className="text-emerald-400" />}
        />
      ) : (
        <div className="space-y-3" role="list" aria-label="Pending Approvals">
          {approvals.map((approval, index) => (
            <motion.div
              key={approval.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-all"
              role="listitem"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white truncate">{approval.borrowerName}</h3>
                  <span className="font-mono text-xs font-bold text-violet-400">{approval.caseNumber}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-white/60">
                  <span className="flex items-center gap-1"><Shield size={12} /> {approval.approvalType.replace(/_/g, ' ')}</span>
                  <span className="flex items-center gap-1"><Send size={12} /> Requested by {approval.requestedBy}</span>
                </div>
              </div>
              <div className="text-right">
                <span className={cn(
                  'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium',
                  getStatusColor(approval.status)
                )}>
                  {approval.status.toUpperCase()}
                </span>
                <p className="text-xs text-white/40 mt-1">{formatRelativeTime(approval.requestedAt)}</p>
                <div className="flex items-center justify-end gap-1 mt-2">
                  {approval.requiredApprovers.map((role, i) => {
                    const approval = approval.approvals.find(a => a.role === role);
                    return (
                      <span key={i} className={cn(
                        'w-2 h-2 rounded-full',
                        approval?.decision === 'approved' ? 'bg-emerald-400' :
                        approval?.decision === 'rejected' ? 'bg-red-400' :
                        'bg-slate-500'
                      )} title={`${role}: ${approval?.decision || 'pending'}`} />
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// AI Tasks Section
function AITasksSection({ tasks, loading, error, onRefresh }: { 
  tasks: AITask[]; 
  loading: boolean; 
  error: string | null;
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <motion.div className="glass-card p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <SectionHeader title="AI Tasks" subtitle="Agent pipeline status" icon={Brain} iconColor="text-indigo-400" />
        <SkeletonList rows={4} />
      </motion.div>
    );
  }

  const runningTasks = tasks.filter(t => t.status === 'running' || t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const failedTasks = tasks.filter(t => t.status === 'failed');
  const reviewTasks = tasks.filter(t => t.status === 'review_required');

  return (
    <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader 
        title="AI Tasks" 
        subtitle={`${runningTasks.length} running, ${completedTasks.length} done, ${failedTasks.length} failed, ${reviewTasks.length} need review`} 
        icon={Brain} 
        iconColor="text-indigo-400"
        action={
          <button onClick={onRefresh} className="glass-button text-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        } 
      />
      
      {tasks.length === 0 ? (
        <EmptyState 
          title="No AI tasks" 
          description="No agent runs in progress" 
          icon={<Brain size={48} className="text-indigo-400" />}
        />
      ) : (
        <div className="space-y-3" role="list" aria-label="AI Tasks">
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-all"
              role="listitem"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-indigo-400">{task.caseNumber}</span>
                  <span className="text-white/70">{task.agent} v{task.agentVersion}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-white/60">
                  <span className="flex items-center gap-1"><Brain size={12} /> {task.modelProvider} / {task.modelRoute}</span>
                  {task.confidence !== undefined && (
                    <span className="flex items-center gap-1"><TrendingUp size={12} /> {Math.round(task.confidence * 100)}% confidence</span>
                  )}
                  {task.riskFlags && task.riskFlags.length > 0 && (
                    <span className="flex items-center gap-1 text-amber-400"><AlertTriangle size={12} /> {task.riskFlags.join(', ')}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className={cn(
                  'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium',
                  getStatusColor(task.status)
                )}>
                  {task.status.toUpperCase().replace('_', ' ')}
                </span>
                <p className="text-xs text-white/40 mt-1">{formatRelativeTime(task.startedAt)}</p>
                {task.completedAt && (
                  <p className="text-xs text-white/40">Completed {formatRelativeTime(task.completedAt)}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Upcoming Deadlines Section
function UpcomingDeadlinesSection({ deadlines, loading, error, onRefresh }: { 
  deadlines: UpcomingDeadline[]; 
  loading: boolean; 
  error: string | null;
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <motion.div className="glass-card p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <SectionHeader title="Upcoming Deadlines" subtitle="Statutory & internal clocks" icon={Calendar} iconColor="text-cyan-400" />
        <SkeletonList rows={4} />
      </motion.div>
    );
  }

  const statutoryDeadlines = deadlines.filter(d => d.deadlineType === 'statutory');
  const otherDeadlines = deadlines.filter(d => d.deadlineType !== 'statutory');

  return (
    <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader 
        title="Upcoming Deadlines" 
        subtitle={`${statutoryDeadlines.length} statutory, ${otherDeadlines.length} internal`} 
        icon={Calendar} 
        iconColor="text-cyan-400"
        action={
          <button onClick={onRefresh} className="glass-button text-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        } 
      />
      
      {deadlines.length === 0 ? (
        <EmptyState 
          title="No upcoming deadlines" 
          description="All deadlines are satisfied or distant" 
          icon={<Calendar size={48} className="text-emerald-400" />}
        />
      ) : (
        <div className="space-y-3" role="list" aria-label="Upcoming Deadlines">
          {deadlines.map((deadline, index) => (
            <motion.div
              key={deadline.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border transition-all",
                deadline.status === 'breached' ? 'bg-red-500/10 border-red-500/20' :
                deadline.status === 'triggered' ? 'bg-amber-500/10 border-amber-500/20' :
                'bg-white/[0.03] border-white/10 hover:bg-white/[0.05]'
              )}
              role="listitem"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white truncate">{deadline.borrowerName}</h3>
                  <span className="font-mono text-xs font-bold text-cyan-400">{deadline.caseNumber}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-white/60">
                  <span className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                    deadline.deadlineType === 'statutory' ? 'bg-purple-500/20 text-purple-400' :
                    deadline.deadlineType === 'sla' ? 'bg-blue-500/20 text-blue-400' :
                    deadline.deadlineType === 'internal' ? 'bg-indigo-500/20 text-indigo-400' :
                    'bg-red-500/20 text-red-400'
                  )}>
                    {deadline.deadlineType.toUpperCase()}
                  </span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {deadline.label}</span>
                  <span className="flex items-center gap-1">{formatHours(deadline.hoursUntilDue)}</span>
                </div>
              </div>
              <div className="text-right">
                <span className={cn(
                  'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium',
                  getStatusColor(deadline.status)
                )}>
                  {deadline.status.toUpperCase()}
                </span>
                <p className="text-xs text-white/40 mt-1">{formatRelativeTime(deadline.dueAt)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// External Actions Section
function ExternalActionsSection({ actions, loading, error, onRefresh }: { 
  actions: ExternalActionItem[]; 
  loading: boolean; 
  error: string | null;
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <motion.div className="glass-card p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <SectionHeader title="External Actions" subtitle="Action Gateway dispatches" icon={Send} iconColor="text-orange-400" />
        <SkeletonList rows={4} />
      </motion.div>
    );
  }

  const succeededActions = actions.filter(a => a.status === 'succeeded');
  const failedActions = actions.filter(a => a.status === 'failed');
  const pendingActions = actions.filter(a => ['proposed', 'policy_checked', 'approval_pending', 'approved', 'executing'].includes(a.status));

  return (
    <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader 
        title="External Actions" 
        subtitle={`${succeededActions.length} succeeded, ${failedActions.length} failed, ${pendingActions.length} pending`} 
        icon={Send} 
        iconColor="text-orange-400"
        action={
          <button onClick={onRefresh} className="glass-button text-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        } 
      />
      
      {actions.length === 0 ? (
        <EmptyState 
          title="No external actions" 
          description="No Action Gateway dispatches yet" 
          icon={<Send size={48} className="text-orange-400" />}
        />
      ) : (
        <div className="space-y-3" role="list" aria-label="External Actions">
          {actions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-all"
              role="listitem"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white truncate">{action.caseNumber}</h3>
                  <span className="text-white/70">{action.actionType}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-white/60">
                  <span className="flex items-center gap-1"><Send size={12} /> {action.channel}</span>
                  <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs', getAdapterModeColor(action.adapterMode))}>
                    {action.adapterMode}
                  </span>
                  <span className="flex items-center gap-1"><Zap size={12} /> {action.attempts} attempt(s)</span>
                </div>
              </div>
              <div className="text-right">
                <span className={cn(
                  'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium',
                  getStatusColor(action.status)
                )}>
                  {action.status.toUpperCase().replace('_', ' ')}
                </span>
                <p className="text-xs text-white/40 mt-1">{formatRelativeTime(action.createdAt)}</p>
                {action.externalRefId && (
                  <p className="text-xs font-mono text-white/50 mt-1">{action.externalRefId}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Institution Activity Section
function InstitutionActivitySection({ institutions, loading, error, onRefresh }: { 
  institutions: InstitutionActivity[]; 
  loading: boolean; 
  error: string | null;
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <motion.div className="glass-card p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <SectionHeader title="Institution Activity" subtitle="Bank partner metrics" icon={Building2} iconColor="text-emerald-400" />
        <SkeletonList rows={4} />
      </motion.div>
    );
  }

  return (
    <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader 
        title="Institution Activity" 
        subtitle={`${institutions.length} bank partners`} 
        icon={Building2} 
        iconColor="text-emerald-400"
        action={
          <button onClick={onRefresh} className="glass-button text-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        } 
      />
      
      {institutions.length === 0 ? (
        <EmptyState 
          title="No institution data" 
          description="No bank partner activity recorded" 
          icon={<Building2 size={48} className="text-emerald-400" />}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-3 text-xs font-semibold text-white/50 uppercase tracking-wider">Institution</th>
                <th className="text-right p-3 text-xs font-semibold text-white/50 uppercase tracking-wider">Total Cases</th>
                <th className="text-right p-3 text-xs font-semibold text-white/50 uppercase tracking-wider">Active</th>
                <th className="text-right p-3 text-xs font-semibold text-white/50 uppercase tracking-wider">Completed</th>
                <th className="text-right p-3 text-xs font-semibold text-white/50 uppercase tracking-wider">Avg TAT</th>
                <th className="text-right p-3 text-xs font-semibold text-white/50 uppercase tracking-wider">SLA Breaches</th>
                <th className="text-right p-3 text-xs font-semibold text-white/50 uppercase tracking-wider">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {institutions.map((inst, index) => (
                <motion.tr
                  key={inst.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td className="p-3 font-medium text-white">{inst.bankName}</td>
                  <td className="p-3 text-right font-mono text-white">{inst.caseCount}</td>
                  <td className="p-3 text-right font-mono text-violet-400">{inst.activeCases}</td>
                  <td className="p-3 text-right font-mono text-emerald-400">{inst.completedCases}</td>
                  <td className="p-3 text-right text-white/70">{inst.avgTatHours.toFixed(1)}h</td>
                  <td className="p-3 text-right font-mono text-red-400">{inst.slaBreaches}</td>
                  <td className="p-3 text-right text-white/50 text-sm">{formatRelativeTime(inst.lastActivity)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

// System Health Section
function SystemHealthSection({ health, loading, error, onRefresh }: { 
  health: SystemHealth | null; 
  loading: boolean; 
  error: string | null;
  onRefresh: () => void;
}) {
  if (loading || !health) {
    return (
      <motion.div className="glass-card p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <SectionHeader title="System Health" subtitle="Infrastructure status" icon={Activity} iconColor="text-emerald-400" />
        <SkeletonList rows={4} />
      </motion.div>
    );
  }

  const adapters = Object.entries(health.externalAdapters);
  const liveAdapters = adapters.filter(([_, mode]) => mode === 'LIVE').length;
  const mockAdapters = adapters.filter(([_, mode]) => mode === 'MOCK').length;
  const notConfiguredAdapters = adapters.filter(([_, mode]) => mode === 'NOT_CONFIGURED').length;

  return (
    <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader 
        title="System Health" 
        subtitle={`Last checked: ${formatRelativeTime(health.lastCheck)}`} 
        icon={Activity} 
        iconColor="text-emerald-400"
        action={
          <button onClick={onRefresh} className="glass-button text-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        } 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard 
          label="Database" 
          value={health.database.toUpperCase()} 
          icon={Database} 
          iconColor={getHealthColor(health.database)}
          trend={health.database === 'healthy' ? 'OK' : 'CHECK'}
          trendUp={health.database === 'healthy'}
        />
        <MetricCard 
          label="Redis" 
          value={health.redis.toUpperCase()} 
          icon={Database} 
          iconColor={getHealthColor(health.redis)}
          trend={health.redis === 'healthy' ? 'OK' : 'CHECK'}
          trendUp={health.redis === 'healthy'}
        />
        <MetricCard 
          label="AI Backend" 
          value={health.aiBackend.toUpperCase()} 
          icon={Brain} 
          iconColor={getHealthColor(health.aiBackend)}
          trend={health.aiBackend === 'healthy' ? 'OK' : 'CHECK'}
          trendUp={health.aiBackend === 'healthy'}
        />
        <MetricCard 
          label="Adapters" 
          value={`${liveAdapters} LIVE, ${mockAdapters} MOCK`} 
          icon={Zap} 
          iconColor="text-orange-400"
          trend={notConfiguredAdapters > 0 ? `${notConfiguredAdapters} not configured` : 'All configured'}
          trendUp={notConfiguredAdapters === 0}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">External Adapters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {adapters.map(([name, mode]) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "p-4 rounded-xl border text-center transition-all",
                getAdapterModeColor(mode)
              )}
            >
              <div className="font-mono text-lg font-bold">{name}</div>
              <div className={cn('text-xs font-medium mt-1', getAdapterModeColor(mode))}>
                {mode}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Main Dashboard Component
// ============================================================

export default function CommandCenterDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [activeMatters, setActiveMatters] = useState<ActiveMatter[]>([]);
  const [slaRisks, setSLARisks] = useState<SLARiskItem[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [aiTasks, setAITasks] = useState<AITask[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [externalActions, setExternalActions] = useState<ExternalActionItem[]>([]);
  const [institutionActivity, setInstitutionActivity] = useState<InstitutionActivity[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [
        mattersRes,
        slaRes,
        approvalsRes,
        aiTasksRes,
        deadlinesRes,
        actionsRes,
        institutionsRes,
        healthRes
      ] = await Promise.allSettled([
        fetch('/api/dashboard/command-center/active-matters'),
        fetch('/api/dashboard/command-center/sla-risks'),
        fetch('/api/dashboard/command-center/pending-approvals'),
        fetch('/api/dashboard/command-center/ai-tasks'),
        fetch('/api/dashboard/command-center/upcoming-deadlines'),
        fetch('/api/dashboard/command-center/external-actions'),
        fetch('/api/dashboard/command-center/institution-activity'),
        fetch('/api/dashboard/command-center/system-health'),
      ]);

      if (mattersRes.status === 'fulfilled' && mattersRes.value.ok) {
        const data = await mattersRes.value.json();
        setActiveMatters(data.matters || []);
      }
      if (slaRes.status === 'fulfilled' && slaRes.value.ok) {
        const data = await slaRes.value.json();
        setSLARisks(data.risks || []);
      }
      if (approvalsRes.status === 'fulfilled' && approvalsRes.value.ok) {
        const data = await approvalsRes.value.json();
        setPendingApprovals(data.approvals || []);
      }
      if (aiTasksRes.status === 'fulfilled' && aiTasksRes.value.ok) {
        const data = await aiTasksRes.value.json();
        setAITasks(data.tasks || []);
      }
      if (deadlinesRes.status === 'fulfilled' && deadlinesRes.value.ok) {
        const data = await deadlinesRes.value.json();
        setUpcomingDeadlines(data.deadlines || []);
      }
      if (actionsRes.status === 'fulfilled' && actionsRes.value.ok) {
        const data = await actionsRes.value.json();
        setExternalActions(data.actions || []);
      }
      if (institutionsRes.status === 'fulfilled' && institutionsRes.value.ok) {
        const data = await institutionsRes.value.json();
        setInstitutionActivity(data.institutions || []);
      }
      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        const data = await healthRes.value.json();
        setSystemHealth(data.health || null);
      }

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchAllData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="glass-nav border-b border-white/10">
        <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Activity size={20} className="text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-white">Command Center</h1>
              <p className="text-white/50 text-sm">Real-time operations dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/50 text-sm hidden sm:block">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="glass-button"
              aria-label="Refresh dashboard"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-full mx-auto px-6 py-8 space-y-8">
        {/* Top Metrics Row */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4"
        >
          <MetricCard 
            label="Active Matters" 
            value={activeMatters.length} 
            icon={FileText} 
            iconColor="text-violet-400"
            trend={`${activeMatters.filter(m => m.isOverdue).length} overdue`}
            trendUp={activeMatters.filter(m => m.isOverdue).length === 0}
          />
          <MetricCard 
            label="SLA Risks" 
            value={slaRisks.filter(r => r.riskLevel === 'critical').length} 
            icon={AlertTriangle} 
            iconColor="text-amber-400"
            trend={`${slaRisks.filter(r => r.riskLevel === 'warning').length} warnings`}
            trendUp={slaRisks.filter(r => r.riskLevel === 'critical').length === 0}
          />
          <MetricCard 
            label="Pending Approvals" 
            value={pendingApprovals.filter(a => a.status === 'pending').length} 
            icon={Shield} 
            iconColor="text-blue-400"
            trend={`${pendingApprovals.length} total`}
            trendUp={pendingApprovals.filter(a => a.status === 'pending').length === 0}
          />
          <MetricCard 
            label="AI Tasks Running" 
            value={aiTasks.filter(t => t.status === 'running' || t.status === 'pending').length} 
            icon={Brain} 
            iconColor="text-indigo-400"
            trend={`${aiTasks.filter(t => t.status === 'completed').length} completed`}
            trendUp={aiTasks.filter(t => t.status === 'failed').length === 0}
          />
        </motion.div>

        {/* Grid Layout - 2 columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <ActiveMattersSection 
              matters={activeMatters} 
              loading={loading} 
              error={error} 
              onRefresh={handleRefresh} 
            />
            <PendingApprovalsSection 
              approvals={pendingApprovals} 
              loading={loading} 
              error={error} 
              onRefresh={handleRefresh} 
            />
            <UpcomingDeadlinesSection 
              deadlines={upcomingDeadlines} 
              loading={loading} 
              error={error} 
              onRefresh={handleRefresh} 
            />
            <InstitutionActivitySection 
              institutions={institutionActivity} 
              loading={loading} 
              error={error} 
              onRefresh={handleRefresh} 
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <SLARiskSection 
              risks={slaRisks} 
              loading={loading} 
              error={error} 
              onRefresh={handleRefresh} 
            />
            <AITasksSection 
              tasks={aiTasks} 
              loading={loading} 
              error={error} 
              onRefresh={handleRefresh} 
            />
            <ExternalActionsSection 
              actions={externalActions} 
              loading={loading} 
              error={error} 
              onRefresh={handleRefresh} 
            />
            <SystemHealthSection 
              health={systemHealth} 
              loading={loading} 
              error={error} 
              onRefresh={handleRefresh} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}