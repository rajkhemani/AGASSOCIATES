'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Mail, MessageSquare, Linkedin, Send, ArrowRight } from 'lucide-react';

const contactLinks = [
  {
    icon: Send,
    label: 'Telegram',
    value: 'AI Team Chat',
    href: 'https://t.me/AGAssociatesBot',
    primary: true,
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'admin@advadiityagade.com',
    href: 'mailto:admin@advadiityagade.com',
    primary: false,
  },
  {
    icon: MessageSquare,
    label: 'WhatsApp',
    value: 'Message on WhatsApp',
    href: 'https://wa.me/919699218421',
    primary: false,
  },
  {
    icon: Linkedin,
    label: 'LinkedIn',
    value: 'Adv. Aditya Gade',
    href: 'https://www.linkedin.com/in/adv-adiitya-gade-211a74257/',
    primary: false,
  },
];

export default function ContactSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="contact" ref={ref} className="py-32 px-6 relative overflow-hidden">
      {/* Blueprint grid */}
      <div className="absolute inset-0 blueprint-grid opacity-20 pointer-events-none" />

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] orb bg-accent-blue/6" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Label */}
          <p className="text-accent-blue font-mono text-xs uppercase tracking-[0.25em] mb-6">
            The Future of Legal Practice
          </p>

          {/* Headline */}
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Stop managing files.{' '}
            <span className="gradient-text">Start orchestrating results.</span>
          </h2>

          {/* Body */}
          <p className="text-gray-400 text-base sm:text-lg mb-14 max-w-2xl mx-auto leading-relaxed">
            AG Associates is a boutique property law firm in Thane, Maharashtra, pioneering the shift
            to autonomous legal operations. By deploying a private, multi-agent AI workforce, we handle
            high-volume property documentation with absolute precision and data sovereignty.
          </p>

          {/* Contact links */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {contactLinks.map((link, i) => {
              const Icon = link.icon;
              return (
                <motion.a
                  key={link.label}
                  href={link.href ?? undefined}
                  initial={{ opacity: 0, y: 16 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex items-center gap-3 px-7 py-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    link.primary
                      ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white shadow-lg shadow-accent-blue/20'
                      : 'glass border border-white/10 text-white hover:border-white/20'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.value}
                </motion.a>
              );
            })}
          </div>

          {/* Location Callout */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
            className="text-gray-500 text-sm mb-8 font-mono"
          >
            Thane, Maharashtra, India
          </motion.p>

          {/* Dashboard CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center"
          >
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-accent-blue transition-colors duration-200 text-sm font-medium group"
            >
              View the live AG Associates AI Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
