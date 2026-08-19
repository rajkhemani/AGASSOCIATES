import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, FileText, CheckCircle, Clock, Brain, Database, Zap, RefreshCw, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DashboardStatus {
  totalTemplates: number;
  activeAgents: number;
  systemStatus: string;
  recentActivities?: Array<{
    action: string;
    timestamp: string;
    details: string;
  }>;
}

type WorkflowStep = 'intake' | 'drafting' | 'auditing' | 'nesl' | 'complete';

interface WorkflowState {
  currentStep: WorkflowStep;
  progress: number;
  agentActive: string;
  lastUpdate: string;
}

const WORKFLOW_STEPS: { key: WorkflowStep; label: string; icon: typeof Brain }[] = [
  { key: 'intake', label: 'Intake', icon: Brain },
  { key: 'drafting', label: 'Drafting', icon: FileText },
  { key: 'auditing', label: 'Auditing', icon: CheckCircle },
  { key: 'nesl', label: 'NeSL', icon: Zap },
  { key: 'complete', label: 'Complete', icon: Activity },
];

const STEP_COLORS: Record<string, string> = {
  intake: 'text-violet-400',
  drafting: 'text-indigo-400',
  auditing: 'text-orange-400',
  nesl: 'text-cyan-400',
  complete: 'text-emerald-400',
};

function getAgentForStep(step: WorkflowStep): string {
  switch (step) {
    case 'intake': return 'Aisha (Intake)';
    case 'drafting': return 'Drafter (Legal Architect)';
    case 'auditing': return 'Auditor (QA)';
    case 'nesl': return 'Executor (RPA)';
    case 'complete': return 'All Agents';
  }
}

export default function WorkflowDashboard() {
  const [status, setStatus] = useState<DashboardStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [neslStatus, setNeslStatus] = useState<'idle' | 'processing' | 'filed'>('idle');
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const [workflow, setWorkflow] = useState<WorkflowState>({
    currentStep: 'intake',
    progress: 0,
    agentActive: 'None',
    lastUpdate: new Date().toISOString(),
  });

  const neslFiledRef = useRef(false);
  const workflowTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const fetchStatus = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/dashboard/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    const stepSequence: WorkflowStep[] = ['intake', 'drafting', 'auditing', 'nesl', 'complete'];
    const STEP_DELAY = 4000;
    const CYCLE_PAUSE = 5000;
    let cancelled = false;

    const tick = (idx: number) => {
      if (cancelled) return;

      if (idx < stepSequence.length) {
        const step = stepSequence[idx];
        if (step === 'intake') {
          neslFiledRef.current = false;
        }
        setWorkflow({
          currentStep: step,
          progress: ((idx + 1) / stepSequence.length) * 100,
          agentActive: getAgentForStep(step),
          lastUpdate: new Date().toISOString(),
        });
        const t = setTimeout(() => tick(idx + 1), STEP_DELAY);
        workflowTimers.current.push(t);
      } else {
        const t = setTimeout(() => {
          if (!cancelled) tick(0);
        }, CYCLE_PAUSE);
        workflowTimers.current.push(t);
      }
    };

    const t = setTimeout(() => tick(0), STEP_DELAY);
    workflowTimers.current.push(t);

    return () => {
      cancelled = true;
      workflowTimers.current.forEach(clearTimeout);
      workflowTimers.current = [];
    };
  }, []);

  useEffect(() => {
    if (workflow.currentStep === 'complete' && !neslFiledRef.current) {
      neslFiledRef.current = true;
      handleNeslFiling();
    }
  }, [workflow.currentStep]);

  const handleNeslFiling = async () => {
    setNeslStatus('processing');
    try {
      const res = await fetch('/api/nesl/execute', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setTransactionId(data.transaction_id);
        setNeslStatus('filed');
      } else {
        setNeslStatus('idle');
      }
    } catch {
      setNeslStatus('idle');
    }
  };

  const isStepActive = (step: string) => {
    return workflow.currentStep === step || (step === 'nesl' && neslStatus !== 'idle');
  };

  const isStepCompleted = (step: string) => {
    const order = WORKFLOW_STEPS.map(s => s.key);
    const currentIdx = order.indexOf(workflow.currentStep);
    const stepIdx = order.indexOf(step as WorkflowStep);
    return stepIdx < currentIdx;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-violet-400" />
          <span className="text-white/60 text-sm font-medium">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-serif font-bold text-white">AI Workflow Dashboard</h1>
          <p className="text-white/50 text-sm mt-1">Real-time agent workflow monitor</p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={refreshing}
          className="glass-button flex items-center gap-2"
        >
          <RefreshCw size={16} className={cn(refreshing && 'animate-spin')} />
          Refresh
        </button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-4">
            <Database size={32} className="text-violet-400" />
            <div>
              <p className="text-white/50 text-sm">Templates</p>
              <p className="text-2xl font-bold text-white">{status?.totalTemplates ?? 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-4">
            <Brain size={32} className="text-indigo-400" />
            <div>
              <p className="text-white/50 text-sm">Active Agents</p>
              <p className="text-2xl font-bold text-white">{status?.activeAgents ?? 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-4">
            <Activity size={32} className="text-emerald-400" />
            <div>
              <p className="text-white/50 text-sm">System Status</p>
              <p className="text-lg font-bold text-emerald-400 capitalize">{status?.systemStatus ?? 'Unknown'}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-4">
            <Zap size={32} className={cn(neslStatus === 'filed' ? 'text-emerald-400' : 'text-white/40')} />
            <div>
              <p className="text-white/50 text-sm">NeSL Status</p>
              <p className="text-lg font-bold text-white capitalize">{neslStatus}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-8"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Current Workflow</h2>

        <div className="mb-8">
          <div className="flex justify-between text-sm text-white/50 mb-2">
            <span>Progress</span>
            <span>{Math.round(workflow.progress)}%</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${workflow.progress}%` }}
              transition={{ duration: 0.5 }}
              className={cn("h-full rounded-full", STEP_COLORS[workflow.currentStep])}
              style={{ backgroundColor: 'currentColor' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {WORKFLOW_STEPS.map((step, index) => {
            const active = isStepActive(step.key);
            const completed = isStepCompleted(step.key);
            const Icon = step.icon;

            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex flex-col items-center p-4 rounded-lg transition-all",
                  active ? 'glass-panel' : 'bg-white/[0.03]'
                )}
              >
                <div className={cn("mb-2", active ? STEP_COLORS[step.key] : 'text-white/30')}>
                  <Icon size={24} />
                </div>
                <span className="text-sm text-white/70 capitalize">{step.label}</span>
                {completed && <CheckCircle size={16} className="text-emerald-400 mt-1" />}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 p-4 glass-card">
          <div className="flex justify-between items-center">
            <span className="text-white/50">Active Agent:</span>
            <motion.span
              key={workflow.agentActive}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn("font-semibold", STEP_COLORS[workflow.currentStep])}
            >
              {workflow.agentActive}
            </motion.span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-white/50">Last Update:</span>
            <span className="text-white/60 text-sm">
              {new Date(workflow.lastUpdate).toLocaleTimeString()}
            </span>
          </div>
        </div>

        <AnimatePresence>
          {transactionId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 p-4 glass-card border-l-4 border-emerald-500"
            >
              <div className="flex items-center gap-3">
                <CheckCircle size={24} className="text-emerald-400" />
                <div>
                  <p className="text-emerald-400 font-semibold">NeSL Filed Successfully</p>
                  <p className="text-white/60 text-sm">Transaction ID: {transactionId}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-6"
      >
        <h2 className="text-2xl font-bold text-white mb-4">Recent Activities</h2>
        <div className="space-y-3">
          {status?.recentActivities?.length ? (
            status.recentActivities.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-3 bg-white/[0.03] rounded-lg"
              >
                <Clock size={20} className="text-white/40" />
                <div className="flex-1">
                  <p className="text-white font-medium">{activity.action.toUpperCase()}</p>
                  <p className="text-white/50 text-sm">{activity.details}</p>
                </div>
                <span className="text-white/40 text-xs">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </span>
              </motion.div>
            ))
          ) : (
            <p className="text-white/40 text-center py-4">No recent activities</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
