import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale, AlertTriangle, CheckCircle, Clock, FileText, Search,
  Shield, Camera, UserCheck, Cpu, Calculator, MessageSquare, Phone,
  Loader2,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type PipelineStage = 'intake' | 'verification' | 'valuation' | 'filing' | 'acknowledged';
type EscalationTier = 1 | 2 | 3 | null;

interface NoiCase {
  id: string;
  case_number: string;
  bank_name: string;
  borrower_name: string;
  loan_amount: number;
  stage: PipelineStage;
  progress: number;
  grn: string | null;
  utr: string | null;
  created_at: string;
  sla_deadline: string;
  escalation: EscalationTier;
  escalation_reason: string | null;
  assigned_agent: string;
  priority: 'high' | 'medium' | 'low';
}

const PIPELINE_STAGES: { key: PipelineStage; label: string; icon: typeof FileText }[] = [
  { key: 'intake', label: 'Intake', icon: FileText },
  { key: 'verification', label: 'Verification', icon: UserCheck },
  { key: 'valuation', label: 'Valuation', icon: Calculator },
  { key: 'filing', label: 'Filing', icon: Cpu },
  { key: 'acknowledged', label: 'Acknowledged', icon: CheckCircle },
];

const AGENTS: Record<PipelineStage, string> = {
  intake: 'Aisha (Gatekeeper)',
  verification: 'Vyasa (Reader)',
  valuation: 'Auditor (Bouncer)',
  filing: 'Executor (RPA)',
  acknowledged: 'Sentinel (QC)',
};

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const deadline = new Date(dateStr);
  return Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const STAGE_MAP: Record<string, PipelineStage> = {
  RECEIVED: 'intake',
  DOCUMENT_COLLECTION: 'verification',
  IN_PROGRESS: 'valuation',
  QUALITY_CHECK: 'filing',
  REGISTERED: 'acknowledged',
  DELIVERED: 'acknowledged',
  CLOSED: 'acknowledged',
};

const STATUS_PROGRESS: Record<string, number> = {
  RECEIVED: 10,
  DOCUMENT_COLLECTION: 30,
  IN_PROGRESS: 50,
  QUALITY_CHECK: 75,
  REGISTERED: 100,
  DELIVERED: 100,
  CLOSED: 100,
};

const BANK_COLORS: Record<string, string> = {
  HDFC: 'bg-blue-500/10 text-blue-300',
  ICICI: 'bg-purple-500/10 text-purple-300',
  SBI: 'bg-emerald-500/10 text-emerald-300',
  LICHFL: 'bg-amber-500/10 text-amber-300',
};

function getBankColor(bankName: string): string {
  for (const [code, color] of Object.entries(BANK_COLORS)) {
    if (bankName?.toUpperCase().includes(code)) return color;
  }
  return 'bg-white/10 text-white/60';
}

function caseToNoi(kase: any): NoiCase {
  const stage = STAGE_MAP[kase.status] || 'intake';
  return {
    id: kase.case_number || kase.id,
    case_number: kase.case_number,
    bank_name: kase.bank_name || kase.bank?.name || 'Unknown',
    borrower_name: kase.borrower_name,
    loan_amount: Number(kase.loan_amount) || 0,
    stage,
    progress: STATUS_PROGRESS[kase.status] || STATUS_PROGRESS[kase.status] || 10,
    grn: kase.grn || null,
    utr: kase.utr || null,
    created_at: kase.received_date || kase.created_at,
    sla_deadline: kase.sla_deadline,
    escalation: kase.escalation_tier || null,
    escalation_reason: kase.escalation_reason || null,
    assigned_agent: kase.assigned_agent || AGENTS[stage],
    priority: kase.priority || 'medium',
  };
}

function StageIndicator({ current, stage }: { current: PipelineStage; stage: typeof PIPELINE_STAGES[0] }) {
  const stageIndex = PIPELINE_STAGES.findIndex(s => s.key === current);
  const thisIndex = PIPELINE_STAGES.findIndex(s => s.key === stage.key);
  const isComplete = thisIndex < stageIndex;
  const isActive = thisIndex === stageIndex;
  const Icon = stage.icon;

  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        "relative flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500",
        isComplete ? 'bg-emerald-500/20 border border-emerald-500/40' :
        isActive ? 'bg-violet-500/20 border border-violet-500/50' :
        'bg-white/[0.03] border border-white/[0.06]'
      )}>
        <Icon size={16} className={cn(
          isComplete ? 'text-emerald-400' :
          isActive ? 'text-violet-400' :
          'text-white/30'
        )} />
        {isActive && (
          <motion.span
            layoutId="noi-pulse"
            className="absolute inset-0 rounded-full border border-violet-500/30"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-xs font-medium", isComplete ? 'text-emerald-400' : isActive ? 'text-white' : 'text-white/40')}>
          {stage.label}
        </p>
        <p className="text-[10px] font-mono text-white/40 truncate">
          {AGENTS[stage.key]}
        </p>
      </div>
      {isComplete && <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />}
    </div>
  );
}

function SLACountdown({ deadline, createdAt }: { deadline: string; createdAt: string }) {
  const [now, setNow] = useState(new Date());
  const slaDays = daysUntil(deadline);
  const totalDays = Math.max(1, Math.ceil((new Date(deadline).getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)));
  const elapsed = totalDays - slaDays;
  const pct = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));
  const isUrgent = slaDays <= 7;
  const isWarning = slaDays <= 14 && slaDays > 7;

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className={isUrgent ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-violet-400'} />
          <span className="text-xs font-medium text-white/50">Section 89B SLA</span>
        </div>
        <span className={cn(
          "text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded",
          isUrgent ? 'bg-red-500/15 text-red-400' :
          isWarning ? 'bg-amber-500/15 text-amber-400' :
          'bg-emerald-500/10 text-emerald-400'
        )}>
          {isUrgent ? 'Critical' : isWarning ? 'Warning' : 'On Track'}
        </span>
      </div>

      <div className="text-center mb-4">
        <motion.span
          key={slaDays}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn("text-4xl font-bold", isUrgent ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-violet-400')}
        >
          {slaDays}
        </motion.span>
        <p className="text-white/40 text-xs mt-1">days remaining of {totalDays}</p>
      </div>

      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.5 }}
          className={cn("h-full rounded-full", isUrgent ? 'bg-red-400' : isWarning ? 'bg-amber-400' : 'bg-violet-400/60')}
        />
      </div>
    </div>
  );
}

function EscalationMatrix({ cases }: { cases: NoiCase[] }) {
  const tiers = [
    {
      tier: 1, label: 'Auto-Resolution',
      icon: MessageSquare,
      desc: 'Missing documents, blurry photos — AI auto-messages client via WhatsApp',
      color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20',
      cases: cases.filter(c => c.escalation === 1),
    },
    {
      tier: 2, label: 'Dashboard Flag',
      icon: Shield,
      desc: 'Name mismatch, API timeout — flagged as NEEDS_REVIEW',
      color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20',
      cases: cases.filter(c => c.escalation === 2),
    },
    {
      tier: 3, label: 'Critical Escalation',
      icon: Phone,
      desc: 'Stamp duty mismatch, 30-day SLA breach risk — WhatsApp alert to founder',
      color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20',
      cases: cases.filter(c => c.escalation === 3),
    },
  ];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-5">
        <AlertTriangle size={16} className="text-violet-400" />
        <h3 className="text-white font-semibold text-base">3-Tier Escalation Matrix</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tiers.map(t => (
          <div key={t.tier} className={cn(t.bg, t.border, "border rounded-lg p-4")}>
            <div className="flex items-center gap-2 mb-2">
              <t.icon size={16} className={t.color} />
              <span className={cn("text-xs font-medium", t.color)}>Tier {t.tier}</span>
            </div>
            <p className="text-white font-medium text-sm mb-1">{t.label}</p>
            <p className="text-white/40 text-[11px] leading-relaxed mb-3">{t.desc}</p>
            <div className="flex items-center gap-1.5">
              <span className={cn("text-lg font-bold", t.color)}>{t.cases.length}</span>
              <span className="text-white/40 text-[10px]">active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CaseCard({ caseData, selected, onSelect }: { caseData: NoiCase; selected: boolean; onSelect: () => void }) {
  const stageIndex = PIPELINE_STAGES.findIndex(s => s.key === caseData.stage);
  const slaDays = daysUntil(caseData.sla_deadline);
  const isUrgent = slaDays <= 7;
  const isWarning = slaDays <= 14 && slaDays > 7;
  const isComplete = caseData.stage === 'acknowledged';

  return (
    <motion.button
      onClick={onSelect}
      className={cn(
        "w-full text-left glass-card rounded-xl p-5 transition-all duration-300",
        selected && 'ring-1 ring-violet-500/40',
        isUrgent && 'border-red-500/20'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isComplete ? 'bg-emerald-400' : isUrgent ? 'bg-red-400' : isWarning ? 'bg-amber-400' : 'bg-violet-400/50'
          )} />
          <span className="text-xs font-mono text-white/50">{caseData.id}</span>
        </div>
        <div className={cn(
          "text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded",
          getBankColor(caseData.bank_name)
        )}>
          {caseData.bank_name}
        </div>
      </div>

      <h3 className="text-white font-medium text-base mb-1">{caseData.borrower_name}</h3>
      <p className="text-white/40 text-xs mb-3">{formatCurrency(caseData.loan_amount)}</p>

      <div className="mb-3">
        <div className="flex justify-between text-[10px] font-mono text-white/40 mb-1">
          <span>{PIPELINE_STAGES[stageIndex]?.label}</span>
          <span>{caseData.progress}%</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${caseData.progress}%` }}
            transition={{ duration: 1 }}
            className={cn("h-full rounded-full", isComplete ? 'bg-emerald-400' : isUrgent ? 'bg-red-400' : 'bg-violet-400/60')}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock size={12} className={isUrgent ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-white/40'} />
          <span className={cn("text-xs font-mono", isUrgent ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-white/40')}>
            {slaDays}d remaining
          </span>
        </div>
        {caseData.escalation && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded",
            caseData.escalation === 3 ? 'bg-red-500/15 text-red-400' :
            caseData.escalation === 2 ? 'bg-amber-500/15 text-amber-400' :
            'bg-blue-500/10 text-blue-300'
          )}>
            <AlertTriangle size={10} />
            T{caseData.escalation}
          </div>
        )}
        {caseData.grn && (
          <span className="text-[10px] font-mono text-emerald-400/60">GRN ✓</span>
        )}
      </div>
    </motion.button>
  );
}

export default function NoiPipeline() {
  const [cases, setCases] = useState<NoiCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBank, setFilterBank] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<PipelineStage | 'all'>('all');

  useEffect(() => {
    async function fetchCases() {
      try {
        const res = await fetch('/api/cases');
        if (res.ok) {
          const data = await res.json();
          const array = Array.isArray(data) ? data : (data.data || []);
          const noiCases = array.map(caseToNoi);
          if (noiCases.length > 0) setSelectedId(noiCases[0].id);
          setCases(noiCases);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, []);

  const selected = cases.find(c => c.id === selectedId) ?? cases[0];
  const filtered = cases.filter(c => {
    if (filterBank !== 'all' && c.bank_name !== filterBank) return false;
    if (filterStage !== 'all' && c.stage !== filterStage) return false;
    if (searchQuery && !c.borrower_name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const banks = [...new Set(cases.map(c => c.bank_name))];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-violet-400" />
          <span className="text-white/60 text-sm font-medium">Loading NOI Pipeline...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-[1440px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-10"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Scale size={20} className="text-violet-400" />
              </div>
              <div>
                <h1 className="text-2xl font-serif text-white tracking-tight">NOI Pipeline</h1>
                <p className="text-white/40 text-xs font-mono">Notice of Intimation · Section 89B Registration Act</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400/60" />
              {cases.filter(c => c.stage !== 'acknowledged').length} active
            </div>
            <div className="h-6 w-px bg-white/[0.06]" />
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
              {cases.filter(c => c.stage === 'acknowledged').length} filed
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 flex-wrap"
            >
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search borrower or case ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-violet-500/30 transition-all"
                />
              </div>
              <select
                value={filterBank}
                onChange={e => setFilterBank(e.target.value)}
                className="glass-select text-xs"
              >
                <option value="all">All Banks</option>
                {banks.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select
                value={filterStage}
                onChange={e => setFilterStage(e.target.value as PipelineStage | 'all')}
                className="glass-select text-xs"
              >
                <option value="all">All Stages</option>
                {PIPELINE_STAGES.map(s => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </motion.div>

            <motion.div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="glass-card rounded-xl p-10 text-center">
                  <Search size={32} className="text-white/30 mx-auto mb-3" />
                  <p className="text-white/50 text-sm">No cases match your filters</p>
                </div>
              ) : (
                filtered.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <CaseCard
                      caseData={c}
                      selected={c.id === selectedId}
                      onSelect={() => setSelectedId(c.id)}
                    />
                  </motion.div>
                ))
              )}
            </motion.div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {selected && (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="sticky top-8 space-y-4"
                >
                  <div className="glass-card rounded-xl p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-[10px] font-mono text-violet-400/60 uppercase tracking-widest mb-1">Case Details</p>
                        <h2 className="text-white font-serif text-lg leading-tight">{selected.borrower_name}</h2>
                        <p className="text-white/40 text-xs font-mono mt-0.5">{selected.id}</p>
                      </div>
                      <div className={cn(
                        "px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider",
                        selected.priority === 'high' ? 'bg-red-500/10 text-red-400' :
                        selected.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-blue-500/10 text-blue-300'
                      )}>
                        {selected.priority}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-white/[0.02] rounded-lg p-3">
                        <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1">Bank</p>
                        <p className="text-white text-sm">{selected.bank_name}</p>
                      </div>
                      <div className="bg-white/[0.02] rounded-lg p-3">
                        <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1">Loan</p>
                        <p className="text-white text-sm">{formatCurrency(selected.loan_amount)}</p>
                      </div>
                      <div className="bg-white/[0.02] rounded-lg p-3">
                        <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1">Created</p>
                        <p className="text-white text-sm">{formatDate(selected.created_at)}</p>
                      </div>
                      <div className="bg-white/[0.02] rounded-lg p-3">
                        <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1">Agent</p>
                        <p className="text-white text-sm truncate">{selected.assigned_agent}</p>
                      </div>
                    </div>

                    {selected.grn && (
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-4 py-3 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider">GRN</p>
                            <p className="text-emerald-400 text-sm font-mono mt-0.5">{selected.grn}</p>
                          </div>
                          <CheckCircle size={16} className="text-emerald-400" />
                        </div>
                        {selected.utr && (
                          <div className="mt-2 pt-2 border-t border-emerald-500/10">
                            <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider">UTR</p>
                            <p className="text-white text-sm font-mono mt-0.5">{selected.utr}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {selected.escalation && (
                      <div className={cn(
                        "rounded-lg px-4 py-3 mb-4",
                        selected.escalation === 3 ? 'bg-red-500/10 border border-red-500/20' :
                        selected.escalation === 2 ? 'bg-amber-500/10 border border-amber-500/20' :
                        'bg-blue-500/10 border border-blue-500/20'
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle size={14} className={cn(
                            selected.escalation === 3 ? 'text-red-400' :
                            selected.escalation === 2 ? 'text-amber-400' : 'text-blue-300'
                          )} />
                          <span className={cn(
                            "text-[10px] font-mono uppercase tracking-wider",
                            selected.escalation === 3 ? 'text-red-400' :
                            selected.escalation === 2 ? 'text-amber-400' : 'text-blue-300'
                          )}>
                            Tier {selected.escalation} Escalation
                          </span>
                        </div>
                        <p className="text-white/50 text-xs">{selected.escalation_reason}</p>
                      </div>
                    )}

                    <div className="space-y-1">
                      {PIPELINE_STAGES.map(s => (
                        <StageIndicator key={s.key} current={selected.stage} stage={s} />
                      ))}
                    </div>
                  </div>

                  <SLACountdown deadline={selected.sla_deadline} createdAt={selected.created_at} />
                  <EscalationMatrix cases={cases} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
