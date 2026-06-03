'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Mail, MessageSquare, Linkedin, ArrowRight } from 'lucide-react';

const contactLinks = [
  {
    icon: Mail,
    label: 'Email',
    value: 'partnerships@agassociates.in',
    href: 'mailto:partnerships@agassociates.in',
    primary: true,
  },
  {
    icon: MessageSquare,
    label: 'WhatsApp',
    value: '+91 96992 18421',
    href: 'https://wa.me/919699218421',
    primary: false,
  },
  {
    icon: Linkedin,
    label: 'LinkedIn',
    value: 'Adv. Aditya Gade',
    href: 'https://linkedin.com/in/adityagade',
    primary: false,
  },
];

export default function ContactSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="contact" ref={ref} className="py-40 px-6 relative bg-obsidian">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Label */}
          <p className="text-gray-500 text-[11px] uppercase tracking-[0.4em] font-bold mb-10">
            Intelligent Orchestration
          </p>

          {/* Headline */}
          <h2 className="text-5xl sm:text-6xl md:text-8xl font-bold text-white mb-10 leading-[0.9] tracking-tighter">
            Stop managing tasks. <br />
            <span className="text-gray-600">Scale intelligence.</span>
          </h2>

          {/* Body */}
          <p className="text-gray-500 text-sm sm:text-base mb-16 max-w-xl mx-auto leading-relaxed font-light tracking-wide">
            Blitzscaling requires decoupling growth from headcount. By deploying local, multi-agent
            architectures, operations scale exponentially with absolute precision.
          </p>

          {/* Contact links */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {contactLinks.map((link, i) => {
              const Icon = link.icon;
              return (
                <motion.a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 16 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 px-8 py-4 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${
                    link.primary
                      ? 'bg-white text-black'
                      : 'border border-hairline text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.value}
                </motion.a>
              );
            })}
          </div>

          {/* Dashboard CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center"
          >
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-white transition-colors duration-300 text-[10px] font-bold uppercase tracking-widest group"
            >
              Access AG Associates Dashboard
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
