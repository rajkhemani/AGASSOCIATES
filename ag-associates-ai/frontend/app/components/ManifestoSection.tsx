'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const practiceAreas = [
  {
    icon: '⚖️',
    title: 'Notice of Intimation (NOI)',
    description: 'End-to-end Section 89B filing under Registration Act, 1908 within 30-day post-disbursement window',
    details: ['0.3% Stamp Duty via GRAS', 'Aadhaar/PAN Owner Consent', 'IGR Acknowledgment'],
  },
  {
    icon: '🔍',
    title: 'Title Search & Search Reports',
    description: 'Comprehensive 30-year property title investigation, encumbrance search, marketable title certification',
    details: ['30-Year Index-II Verification', 'Public Notice Claim Vetting', 'Non-Encumbrance Report'],
  },
  {
    icon: '🏦',
    title: 'Mortgage Registration',
    description: 'Execution of Equitable Mortgage (EQM) and Registered Mortgage deeds with Sub-Registrar endorsement',
    details: ['Title Deed Modification', 'Power of Attorney Vetting', 'Bank Lien Marking'],
  },
  {
    icon: '📄',
    title: 'CTC & Encumbrance Certificates',
    description: 'Procurement of Certified True Copies from property registries and official government clearance certificates',
    details: ['Certified Web Copies', 'Property Valuation Verification', 'Mutation Entry Validation'],
  },
  {
    icon: '📢',
    title: 'Public Notices & Vetting',
    description: 'Drafting and publishing mandatory newspaper public notices for property title verification',
    details: ['Vernacular & English Dailies', '14-Day Objections Vetting', 'Certificate of Clearance'],
  },
  {
    icon: '⚡',
    title: 'Balance Transfers & Franking',
    description: 'Fast-track loan balance transfer documentation, franking validation, multi-bank legal reconciliation',
    details: ['Bank Takeover Documentation', 'Franking / e-Stamp Audit', 'Advocate Empanelment Audits'],
  },
];

export default function ManifestoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="practices" ref={ref} className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <p className="text-accent-blue font-mono text-xs uppercase tracking-[0.25em] mb-5">
            Banking Law & Statutory Services
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white max-w-3xl mx-auto leading-tight">
            Purpose-built for{' '}
            <span className="gradient-text">Commercial Banks, HFCs & NBFCs</span>
          </h2>
        </motion.div>

        {/* Practice Areas Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {practiceAreas.map((area, i) => (
            <motion.div
              key={area.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.35 + i * 0.08 }}
              className="glass rounded-2xl p-6 border border-white/[0.06] hover:border-accent-blue/30 hover:bg-white/[0.025] transition-all duration-300"
            >
              <div className="text-4xl mb-4">{area.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{area.title}</h3>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">{area.description}</p>
              <ul className="space-y-2 text-sm text-gray-500">
                {area.details.map((detail, di) => (
                  <li key={di} className="flex items-center gap-2">
                    <span className="text-accent-blue w-1.5 h-1.5 rounded-full" />
                    {detail}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-500 text-sm font-mono">
            — Jurisdiction: Thane West (Majiwada/Panchpakhadi) & Mumbai MMR Sub-Registrar Offices
          </p>
        </motion.div>
      </div>
    </section>
  );
}
