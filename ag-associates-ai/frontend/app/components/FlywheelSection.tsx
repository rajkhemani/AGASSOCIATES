'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { RefreshCw, Zap, Shield, TrendingUp } from 'lucide-react';

const flywheel = [
  { icon: Zap, label: 'Execution', desc: 'Autonomous agents process cases in minutes.' },
  { icon: Shield, label: 'Precision', desc: 'Deterministic loops eliminate human error.' },
  { icon: TrendingUp, label: 'Scale', desc: 'Growth decoupled from headcount.' },
  { icon: RefreshCw, label: 'Learning', desc: 'Continuous RAG optimization.' },
];

export default function FlywheelSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-40 px-6 bg-obsidian">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <p className="text-gray-500 text-[11px] uppercase tracking-[0.4em] font-bold mb-10">
              The Engine
            </p>
            <h2 className="text-5xl sm:text-7xl font-bold text-white mb-10 leading-[0.9] tracking-tighter">
              The LegalOps <br />
              <span className="text-gray-600">Flywheel.</span>
            </h2>
            <p className="text-gray-500 text-base max-w-lg font-light tracking-wide leading-relaxed">
              Our architecture creates a self-reinforcing cycle of efficiency.
              As more cases are processed, our vector memory grows,
              precision increases, and time-to-filing drops.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-px bg-[#1F1F1F] border border-[#1F1F1F]">
            {flywheel.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-obsidian p-10 hover:bg-white/5 transition-colors group"
              >
                <item.icon className="w-6 h-6 text-white mb-8 group-hover:scale-110 transition-transform" />
                <h3 className="text-white font-bold text-[11px] uppercase tracking-widest mb-3">{item.label}</h3>
                <p className="text-gray-500 text-xs font-light leading-relaxed tracking-wide">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
