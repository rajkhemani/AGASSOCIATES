'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MessageSquare, Eye, FileText, Cpu, ShieldCheck, Calculator } from 'lucide-react';

const agents = [
  {
    name: 'Aisha',
    role: 'Intake',
    icon: MessageSquare,
    desc: 'WhatsApp/n8n integration. Automated follow-up for missing documents.',
  },
  {
    name: 'Vyasa',
    role: 'Verifier',
    icon: Eye,
    desc: 'Multimodal extraction from Aadhaar/PAN; forgery detection.',
  },
  {
    name: 'Drafter',
    role: 'Architect',
    icon: FileText,
    desc: 'RAG-powered drafting into verified Maharashtra legal templates.',
  },
  {
    name: 'Executor',
    role: 'Operator',
    icon: Cpu,
    desc: 'Triggers e-Stamping and NeSL government registry payloads.',
  },
  {
    name: 'Auditor',
    role: 'QA Boss',
    icon: ShieldCheck,
    desc: 'The strict gatekeeper. Halts process on even 1-rupee discrepancies.',
  },
  {
    name: 'Accountant',
    role: 'Reconciliation',
    icon: Calculator,
    desc: 'Zero-touch bank statement parsing and ledger synchronization.',
  },
];

export default function AgentRoster() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <div ref={ref} className="max-w-7xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.65 }}
        className="mb-24"
      >
        <p className="text-gray-500 text-[11px] uppercase tracking-[0.4em] font-bold mb-10">
          The Workforce
        </p>
        <h3 className="text-5xl sm:text-7xl font-bold text-white tracking-tighter">Meet the Agents.</h3>
        <p className="text-gray-500 mt-8 text-sm max-w-xl font-light tracking-wide leading-relaxed">
          Six autonomous agents, each with a deterministic role. No human ambiguity.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1F1F1F] border border-[#1F1F1F]">
        {agents.map((agent, i) => (
          <motion.div
            key={agent.name}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="bg-obsidian p-10 hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-start justify-between mb-12">
              <div className="w-12 h-12 border border-[#1F1F1F] flex items-center justify-center group-hover:border-white transition-colors">
                <agent.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 border border-white text-white font-bold opacity-30 group-hover:opacity-100 transition-opacity">
                {agent.role}
              </span>
            </div>
            <h4 className="text-white font-bold text-[11px] uppercase tracking-widest mb-4">{agent.name}</h4>
            <p className="text-gray-500 text-xs font-light leading-relaxed tracking-wide">{agent.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
