'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Globe, Brain, Database, GitMerge } from 'lucide-react';

const components = [
  {
    icon: Globe,
    label: 'The Gateway',
    subtitle: 'Execution',
    tech: 'FastAPI',
    desc: 'High-performance routing connecting the backend to the outside world. Handles all external requests and webhook ingestion.',
  },
  {
    icon: Brain,
    label: 'The Brain',
    subtitle: 'Reasoning',
    tech: 'Qwen 2.5 / Llama 3 · Ollama',
    desc: 'Fine-tuned local models for complex reasoning without exposing client data to third-party APIs. 100% private.',
  },
  {
    icon: Database,
    label: 'The Memory',
    subtitle: 'RAG',
    tech: 'PostgreSQL + pgvector',
    desc: 'Stores millions of legal precedents. Vector similarity search retrieves the closest legal template instantly.',
  },
  {
    icon: GitMerge,
    label: 'The Nervous System',
    subtitle: 'Orchestration',
    tech: 'LangGraph · n8n',
    desc: 'Enforcing rigid, fault-tolerant agent loops. The deterministic state machine that never drifts.',
  },
];

export default function TechStack() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="tech" ref={ref} className="py-40 px-6 bg-obsidian">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-24"
        >
          <p className="text-gray-500 text-[11px] uppercase tracking-[0.4em] font-bold mb-10">The Stack</p>
          <h2 className="text-5xl sm:text-7xl font-bold text-white tracking-tighter mb-8">
            Built for Precision.
          </h2>
          <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto font-light tracking-wide leading-relaxed">
            Anatomical architecture — every layer has a single purpose. No vendor lock-in. Zero cloud dependency.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#1F1F1F] border border-[#1F1F1F]">
          {components.map((comp, i) => (
            <motion.div
              key={comp.label}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-obsidian p-12 hover:bg-white/5 transition-all group"
            >
              <div className="flex items-start gap-8">
                <div className="w-12 h-12 border border-[#1F1F1F] flex items-center justify-center shrink-0 group-hover:border-white transition-colors">
                  <comp.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-bold text-[11px] uppercase tracking-widest">{comp.label}</h3>
                    <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 border border-[#1F1F1F] text-gray-500 font-bold">
                      {comp.subtitle}
                    </span>
                  </div>
                  <p className="text-white text-[10px] font-bold uppercase tracking-widest mb-6">{comp.tech}</p>
                  <p className="text-gray-500 text-xs font-light leading-relaxed tracking-wide">{comp.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
