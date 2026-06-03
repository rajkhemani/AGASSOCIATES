'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

export default function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-obsidian">
      {/* Blueprint background */}
      <div className="absolute inset-0 blueprint-grid opacity-20 pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-hairline text-[11px] font-semibold tracking-widest uppercase text-gray-400 mb-10"
        >
          <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
            <span className={`${reduceMotion ? '' : 'animate-ping'} absolute inline-flex h-full w-full rounded-full bg-white opacity-75`} />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
          </span>
          System Online · AG Associates
        </motion.div>

        {/* Name */}
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="text-6xl sm:text-7xl md:text-9xl font-bold text-white mb-8 leading-[0.9] tracking-tighter"
        >
          Adv. Aditya <br />
          <span className="text-gray-500">Gade</span>
        </motion.h1>

        {/* Sub-description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="text-gray-400 text-sm sm:text-base max-w-lg mx-auto mb-12 leading-relaxed tracking-wide font-light"
        >
          Architecting autonomous AI workforces for the future of LegalOps.
          Zero staff. Exponential scale. Luxurious restraint.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <motion.a
            href="#project"
            whileTap={{ scale: 0.98 }}
            className="btn-stitch-primary"
          >
            Explore the Project
          </motion.a>
          <motion.a
            href="/dashboard"
            whileTap={{ scale: 0.98 }}
            className="btn-stitch-secondary"
          >
            Live Dashboard →
          </motion.a>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        aria-hidden="true"
      >
        <motion.div
          animate={reduceMotion ? {} : { y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-1 text-gray-700"
        >
          <ArrowDown className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </section>
  );
}
