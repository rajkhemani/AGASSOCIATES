'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const steps = [
  {
    time: '00:00',
    label: 'Client Ping',
    agent: 'Client',
    desc: 'Requests rent agreement via WhatsApp.',
    isEnd: false,
  },
  {
    time: '00:16',
    label: 'Vyasa',
    agent: 'Verification',
    desc: 'Reads uploaded Aadhaar, extracts JSON.',
    isEnd: false,
  },
  {
    time: '00:17',
    label: 'Drafter',
    agent: 'Drafting',
    desc: 'Generates 15-page legal document.',
    isEnd: false,
  },
  {
    time: '00:18',
    label: 'Auditor',
    agent: 'Audit',
    desc: 'Confirms deposit amounts match perfectly.',
    isEnd: false,
  },
  {
    time: '00:19',
    label: 'Executor',
    agent: 'Execution',
    desc: 'Triggers Aadhaar E-Sign OTP.',
    isEnd: false,
  },
  {
    time: '00:25',
    label: 'Done',
    agent: 'Filed ✓',
    desc: 'NOI filed automatically. Zero human intervention.',
    isEnd: true,
  },
];

export default function WorkflowTimeline() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <div ref={ref} className="max-w-7xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.65 }}
        className="text-center mb-24"
      >
        <p className="text-gray-500 text-[11px] uppercase tracking-[0.4em] font-bold mb-10">
          The Workflow
        </p>
        <h3 className="text-5xl sm:text-7xl font-bold text-white tracking-tighter">
          Intake-to-Filing in 25 Minutes.
        </h3>
        <p className="text-gray-500 mt-8 text-sm max-w-xl mx-auto font-light tracking-wide leading-relaxed">
          WhatsApp message → legal PDF → government NeSL filing. Zero human involvement.
        </p>
      </motion.div>

      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-px bg-[#1F1F1F] border border-[#1F1F1F]">
          {steps.map((step, i) => (
            <motion.div
              key={step.time}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="bg-obsidian p-8 flex flex-col items-center text-center group hover:bg-white/5 transition-colors"
            >
              <div className={`w-12 h-12 mb-8 flex items-center justify-center border ${step.isEnd ? 'border-white bg-white text-black' : 'border-[#1F1F1F] text-white'}`}>
                {step.isEnd ? <CheckCircle className="w-5 h-5" /> : <span className="text-[10px] font-bold font-mono">{step.time}</span>}
              </div>

              <h4 className="text-white font-bold text-[11px] uppercase tracking-widest mb-3">{step.label}</h4>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-4 opacity-50">{step.agent}</p>
              <p className="text-gray-500 text-[11px] font-light leading-relaxed tracking-wide">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
