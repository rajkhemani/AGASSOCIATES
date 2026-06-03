'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

const navLinks = [
  { label: 'Manifesto', href: '#manifesto' },
  { label: 'Project', href: '#project' },
  { label: 'Tech', href: '#tech' },
  { label: 'Contact', href: '#contact' },
];

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-obsidian/80 backdrop-blur-xl border-b border-hairline py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" aria-label="Adv. Aditya Gade — Home" className="flex items-center gap-3 group">
          <div className="w-8 h-8 flex items-center justify-center text-white font-bold text-sm border border-white">
            AG
          </div>
          <div className="hidden sm:block">
            <p className="text-white text-xs font-bold tracking-tighter uppercase leading-none">Adv. Aditya Gade</p>
            <p className="text-gray-500 text-[9px] uppercase tracking-widest mt-1">Legal OS</p>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-gray-500 hover:text-white transition-colors duration-300 text-[11px] font-bold uppercase tracking-widest"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <motion.a
          href="/dashboard"
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-2 px-5 py-2 border border-white text-white text-[11px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300"
        >
          <span>Dashboard</span>
          <ExternalLink className="w-3 h-3" />
        </motion.a>
      </div>
    </motion.nav>
  );
}
