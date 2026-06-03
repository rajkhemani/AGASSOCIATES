'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';
import NavBar from './components/NavBar';
import HeroSection from './components/HeroSection';
import WorkflowTimeline from './components/WorkflowTimeline';
import AgentRoster from './components/AgentRoster';
import FlywheelSection from './components/FlywheelSection';
import ManifestoSection from './components/ManifestoSection';
import ExceptionMatrix from './components/ExceptionMatrix';
import AishaChat from './components/AishaChat';
import TechStack from './components/TechStack';
import ContactSection from './components/ContactSection';

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <main className="min-h-screen bg-obsidian text-white selection:bg-white selection:text-black">
      <NavBar />
      
      <div className="relative">
        <HeroSection />
        
        <div id="manifesto">
          <ManifestoSection />
        </div>

        <div id="project" className="py-32 border-t border-hairline">
          <WorkflowTimeline />
          <div className="h-40" />
          <AgentRoster />
          <div className="h-40" />
          <FlywheelSection />
        </div>

        <div id="tech" className="py-32 border-t border-hairline">
          <TechStack />
          <div className="h-20" />
          <ExceptionMatrix />
        </div>

        <div id="contact" className="border-t border-hairline">
          <ContactSection />
        </div>
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-10 right-10 w-16 h-16 rounded-sm bg-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all z-50 group"
      >
        {isChatOpen ? (
          <X className="w-7 h-7 text-black" />
        ) : (
          <MessageSquare className="w-7 h-7 text-black" />
        )}
      </button>

      {/* Aisha Chat Modal */}
      <AnimatePresence>
        {isChatOpen && (
          <AishaChat onClose={() => setIsChatOpen(false)} useUnified={true} />
        )}
      </AnimatePresence>

      <footer className="py-20 border-t border-hairline text-center bg-obsidian">
        <p className="text-gray-600 text-[10px] font-bold uppercase tracking-[0.3em]">
          © {new Date().getFullYear()} AG Associates · Adv. Aditya Gade. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
