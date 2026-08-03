'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MessageSquare, Eye, FileText, Cpu, ShieldCheck, Calculator } from 'lucide-react';

const agents = [
  {
    name: 'Aisha',
    role: 'Intake & Document Collector',
    icon: MessageSquare,
    color: 'blue',
    desc: 'WhatsApp & n8n webhook integration. Collects case details, triggers automated follow-ups for missing documents.',
    spec: 'FastAPI · n8n · WhatsApp Business API',
  },
  {
    name: 'Vyasa',
    role: 'KYC & Document Verifier',
    icon: Eye,
    color: 'purple',
    desc: 'Multimodal vision model extracts text from Aadhaar/PAN; performs visual forgery detection on KYC documents.',
    spec: 'Qwen-VL · pdfplumber · Ollama',
  },
  {
    name: 'Drafter',
    role: 'Legal Document Generator',
    icon: FileText,
    color: 'amber',
    desc: 'RAG-powered template engine. Injects verified data into Maharashtra legal templates (NOI, Title Reports, Mortgage Deeds).',
    spec: 'pgvector · RAG · Sentence Transformers',
  },
  {
    name: 'Executor',
    role: 'API Gateway & E-Filing',
    icon: Cpu,
    color: 'green',
    desc: 'Triggers GRAS stamp duty payments, NeSL e-filing payloads. Handles IGR portal automation via RPA.',
    spec: 'FastAPI · GRAS API · NeSL · Playwright RPA',
  },
  {
    name: 'Auditor',
    role: 'Quality Assurance Gatekeeper',
    icon: ShieldCheck,
    color: 'orange',
    desc: 'Validates every field, amount, and compliance flag. Loops back to Drafter on any discrepancy. Zero-tolerance gate.',
    spec: 'LangGraph Stateful Loop · Llama 3',
  },
  {
    name: 'Accountant',
    role: 'Financial Reconciliation',
    icon: Calculator,
    color: 'blue',
    desc: 'Parses bank sanction letters & payment PDFs. Reconciles stamp duty, registration fees, bank charges. Updates master sheets.',
    spec: 'pdfplumber · gspread · FastAPI',
  },
];

const colorStyles: Record<string, { card: string; iconWrap: string; icon: string; badge: string }> = {
  blue: {
    card: 'border-accent-blue/25 hover:border-accent-blue/50 hover:shadow-accent-blue/10',
    iconWrap: 'bg-accent-blue/10 border border-accent-blue/20',
    icon: 'text-accent-blue',
    badge: 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20',
  },
  purple: {
    card: 'border-accent-purple/25 hover:border-accent-purple/50 hover:shadow-accent-purple/10',
    iconWrap: 'bg-accent-purple/10 border border-accent-purple/20',
    icon: 'text-accent-purple',
    badge: 'bg-accent-purple/10 text-accent-purple border border-accent-purple/20',
  },
  amber: {
    card: 'border-accent-amber/25 hover:border-accent-amber/50 hover:shadow-accent-amber/10',
    iconWrap: 'bg-accent-amber/10 border border-accent-amber/20',
    icon: 'text-accent-amber',
    badge: 'bg-accent-amber/10 text-accent-amber border border-accent-amber/20',
  },
  green: {
    card: 'border-accent-green/25 hover:border-accent-green/50 hover:shadow-accent-green/10',
    iconWrap: 'bg-accent-green/10 border border-accent-green/20',
    icon: 'text-accent-green',
    badge: 'bg-accent-green/10 text-accent-green border border-accent-green/20',
  },
  orange: {
    card: 'border-accent-orange/25 hover:border-accent-orange/50 hover:shadow-accent-orange/10',
    iconWrap: 'bg-accent-orange/10 border border-accent-orange/20',
    icon: 'text-accent-orange',
    badge: 'bg-accent-orange/10 text-accent-orange border border-accent-orange/20',
  },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export default function AgentRoster() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <div ref={ref} className="py-20 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.65 }}
        className="mb-14"
      >
        <p className="text-accent-purple font-mono text-xs uppercase tracking-[0.25em] mb-3">
          AI Agent Pipeline (Luxor9 LegalOS)
        </p>
        <h3 className="text-3xl sm:text-4xl font-bold text-white">Core Pipeline Agents</h3>
        <p className="text-gray-500 mt-3 text-base max-w-2xl">
          Six specialized agents orchestrate NOI filing end-to-end — from WhatsApp intake to IGR acknowledgment.
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {agents.map((agent) => {
          const styles = colorStyles[agent.color];
          const Icon = agent.icon;
          return (
            <motion.div
              key={agent.name}
              variants={cardVariants}
              whileHover={{ scale: 1.025, y: -4 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className={`glass rounded-2xl p-6 border hover:shadow-xl transition-all duration-300 cursor-default ${styles.card}`}
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-xl ${styles.iconWrap} flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${styles.icon}`} />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg leading-tight">{agent.name}</h4>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono ${styles.badge}`}>
                    {agent.role}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-400 text-sm leading-relaxed mb-4">{agent.desc}</p>

              {/* Spec tag */}
              <p className={`text-xs font-mono ${styles.icon} opacity-60`}>{agent.spec}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
