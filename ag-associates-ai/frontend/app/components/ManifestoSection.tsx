'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function ManifestoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-40 px-6 bg-obsidian">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-gray-500 text-[11px] uppercase tracking-[0.4em] font-bold mb-12">
            The Philosophy
          </p>
          <h2 className="text-4xl sm:text-6xl font-bold text-white leading-[1.1] tracking-tighter mb-16">
            We believe that <span className="text-gray-600">complexity</span> is the enemy of scale.
            By distilling legal operations into autonomous, <span className="text-gray-600">deterministic loops</span>,
            we enable growth without the friction of human overhead.
          </h2>
          <div className="grid md:grid-cols-2 gap-12 text-gray-500 text-sm font-light tracking-wide leading-relaxed">
            <p>
              Traditional legal firms scale by adding headcount. This creates a linear relationship
              between revenue and cost, capped by the limits of human management. We reject this
              model. Our systems are designed to decouple output from staffing.
            </p>
            <p>
              Luxurious restraint isn&apos;t just an aesthetic; it&apos;s an operational mandate. We strip away
              the non-essential, leaving only precise, high-performance intelligence that works
              24/7 with zero drift.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
