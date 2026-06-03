'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  Shield,
  Camera,
  UserCheck,
  Cpu,
  Calculator,
  MessageSquare,
  Phone,
  ArrowUpRight,
  X,
  GripHorizontal,
} from 'lucide-react';
import Link from 'next/link';

type PipelineStage = 'intake' | 'verification' | 'valuation' | 'filing' | 'acknowledged';
type EscalationTier = 1 | 2 | 3 | null;

interface NoiCase {
  id: string;
  bank: string;
  borrower: string;
  loanAmount: number;
  stage: PipelineStage;
  progress: number;
  grn: string | null;
  utr: string | null;
  createdAt: string;
  slaDeadline: string;
  escalation: EscalationTier;
  escalationReason: string | null;
  assignedAgent: string;
  priority: 'high' | 'medium' | 'low';
}

const PIPELINE_STAGES: { key: PipelineStage; label: string; icon: typeof Scale }[] = [
  { key: 'intake', label: 'Intake', icon: FileText },
  { key: 'verification', label: 'Verification', icon: UserCheck },
  { key: 'valuation', label: 'Valuation', icon: Calculator },
  { key: 'filing', label: 'Filing', icon: Cpu },
  { key: 'acknowledged', label: 'Done', icon: CheckCircle },
];

const MOCK_CASES: NoiCase[] = [
  {
    id: 'KTK-NOI-2026-0482',
    bank: 'Kotak Mahindra',
    borrower: 'Aditi Rao',
    loanAmount: 8500000,
    stage: 'filing',
    progress: 85,
    grn: '2026042800482',
    utr: 'BANK-UTR-99382',
    createdAt: '2026-04-25',
    slaDeadline: '2026-05-02',
    escalation: null,
    escalationReason: null,
    assignedAgent: 'Drafter',
    priority: 'high',
  },
  {
    id: 'AXS-NOI-2026-0391',
    bank: 'Axis Finance',
    borrower: 'Suresh Patil',
    loanAmount: 12400000,
    stage: 'verification',
    progress: 40,
    grn: null,
    utr: null,
    createdAt: '2026-04-27',
    slaDeadline: '2026-05-04',
    escalation: 2,
    escalationReason: 'Index II Mismatch',
    assignedAgent: 'Vyasa',
    priority: 'medium',
  },
  {
    id: 'HDFC-NOI-2026-0512',
    bank: 'HDFC Bank',
    borrower: 'Amit Patel',
    loanAmount: 4500000,
    stage: 'acknowledged',
    progress: 100,
    grn: '2026042600512',
    utr: 'HDFC-PAY-11223',
    createdAt: '2026-04-20',
    slaDeadline: '2026-04-27',
    escalation: null,
    escalationReason: null,
    assignedAgent: 'Executor',
    priority: 'low',
  },
];

export default function NoiCases() {
  const [cases, setCases] = useState<NoiCase[]>(MOCK_CASES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<NoiCase | null>(null);

  const filteredCases = cases.filter(
    (c) =>
      c.borrower.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-obsidian text-white p-8">
      <header className="mb-12 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" className="p-2 border border-hairline hover:bg-white/5 transition-colors">
              <Scale size={20} className="text-gray-400" />
            </Link>
            <h1 className="text-3xl font-bold tracking-tighter uppercase">NOI Pipeline</h1>
          </div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
            Autonomous Notice of Intimation Filing System
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="SEARCH CASE ID / BORROWER..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border border-hairline pl-10 pr-4 py-2 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-white transition-colors w-64"
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1F1F1F] border border-[#1F1F1F]">
        {filteredCases.map((c) => (
          <motion.div
            key={c.id}
            layoutId={c.id}
            onClick={() => setSelectedCase(c)}
            className="bg-obsidian p-8 hover:bg-white/5 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                {c.id}
              </span>
              {c.escalation && (
                <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-red-500 border border-red-500/30 px-2 py-0.5">
                  <AlertTriangle size={10} />
                  Tier {c.escalation}
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold mb-2 tracking-tight">{c.borrower}</h3>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-8">
              {c.bank} · ₹{(c.loanAmount / 100000).toFixed(1)}L
            </p>

            <div className="space-y-4">
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                <span className="text-gray-600">Stage: {c.stage}</span>
                <span className="text-white">{c.progress}%</span>
              </div>
              <div className="h-1 bg-[#1F1F1F] w-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${c.progress}%` }}
                  className="h-full bg-white"
                />
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-hairline flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                Agent: {c.assignedAgent}
              </span>
              <ArrowUpRight size={14} className="text-white" />
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedCase && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCase(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-obsidian border border-hairline p-12 overflow-hidden"
            >
              <button
                onClick={() => setSelectedCase(null)}
                className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="grid md:grid-cols-2 gap-16">
                <div>
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-6">Case Dossier</p>
                  <h2 className="text-4xl font-bold text-white tracking-tighter mb-4">{selectedCase.borrower}</h2>
                  <p className="text-gray-500 text-sm font-light tracking-wide mb-12">
                    Case reference {selectedCase.id} initiated on {selectedCase.createdAt}.
                    Assigned to {selectedCase.assignedAgent} agent for {selectedCase.stage} processing.
                  </p>

                  <div className="grid grid-cols-2 gap-8 mb-12">
                    <div>
                      <p className="text-gray-600 text-[9px] font-bold uppercase tracking-widest mb-2">Loan Amount</p>
                      <p className="text-white font-mono text-lg">₹{selectedCase.loanAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-[9px] font-bold uppercase tracking-widest mb-2">SLA Deadline</p>
                      <p className="text-white font-mono text-lg">{selectedCase.slaDeadline}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-[9px] font-bold uppercase tracking-widest mb-2">GRN Number</p>
                      <p className="text-white font-mono text-lg">{selectedCase.grn || 'PENDING'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-[9px] font-bold uppercase tracking-widest mb-2">UTR/Payment</p>
                      <p className="text-white font-mono text-lg">{selectedCase.utr || 'PENDING'}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button className="flex-1 bg-white text-black text-[10px] font-bold uppercase tracking-widest py-4 hover:bg-gray-200 transition-colors">
                      Download Draft
                    </button>
                    <button className="flex-1 border border-hairline text-white text-[10px] font-bold uppercase tracking-widest py-4 hover:bg-white/5 transition-colors">
                      View Audit Log
                    </button>
                  </div>
                </div>

                <div className="border-l border-hairline pl-16">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-10">Pipeline Progress</p>
                  <div className="space-y-10">
                    {PIPELINE_STAGES.map((stage, i) => {
                      const isCompleted = PIPELINE_STAGES.findIndex(s => s.key === selectedCase.stage) >= i;
                      const isActive = selectedCase.stage === stage.key;

                      return (
                        <div key={stage.key} className="flex items-center gap-6 group">
                          <div className={`w-10 h-10 border ${
                            isCompleted ? 'border-white bg-white text-black' : 'border-[#1F1F1F] text-gray-700'
                          } flex items-center justify-center transition-colors`}>
                            <stage.icon size={16} />
                          </div>
                          <div>
                            <p className={`text-[11px] font-bold uppercase tracking-widest ${
                              isCompleted ? 'text-white' : 'text-gray-700'
                            }`}>
                              {stage.label}
                            </p>
                            {isActive && (
                              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1 animate-pulse">
                                Processing...
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
