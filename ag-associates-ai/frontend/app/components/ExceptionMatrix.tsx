'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Shield, AlertTriangle, User, Zap } from 'lucide-react';

const tiers = [
  {
    icon: Zap,
    label: 'Tier 1: Auto-Retry',
    badge: 'Autonomous',
    desc: 'Mathematical discrepancies trigger immediate agent re-loops with self-correcting prompts.'
  },
  {
    icon: AlertTriangle,
    label: 'Tier 2: Escalation',
    badge: 'Human-in-loop',
    desc: 'External API failures or edge cases notify staff via Telegram for rapid manual intervention.'
  },
  {
    icon: User,
    label: 'Tier 3: Principal',
    badge: 'Critical',
    desc: 'System-wide errors or high-value case exceptions trigger direct advocate notification.'
  },
];

export default function ExceptionMatrix() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-40 px-6 bg-obsidian">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-24"
        >
          <p className="text-gray-500 text-[11px] uppercase tracking-[0.4em] font-bold mb-10">Guardrails</p>
          <h2 className="text-5xl sm:text-7xl font-bold text-white tracking-tighter mb-8">The Exception Matrix</h2>
          <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto font-light tracking-wide leading-relaxed">
            Rigid protocol for when things go wrong. No ambiguity, no missed cases.
          </p>
        </motion.div>

        <div className="flex flex-col gap-px bg-[#1F1F1F] border border-[#1F1F1F]">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.label}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-obsidian p-10 flex flex-col md:flex-row md:items-center gap-8 group hover:bg-white/5 transition-all"
            >
              <div className="w-12 h-12 border border-[#1F1F1F] flex items-center justify-center shrink-0">
                <tier.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <h3 className="text-white font-bold text-[11px] uppercase tracking-widest">{tier.label}</h3>
                  <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 border border-white text-white font-bold">
                    {tier.badge}
                  </span>
                </div>
                <p className="text-gray-500 text-xs font-light tracking-wide leading-relaxed">{tier.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
