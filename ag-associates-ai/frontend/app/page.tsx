'use client';

import NavBar from './components/NavBar';
import HeroSection from './components/HeroSection';
import ManifestoSection from './components/ManifestoSection';
import AgentRoster from './components/AgentRoster';
import WorkflowTimeline from './components/WorkflowTimeline';
import TechStack from './components/TechStack';
import ExceptionMatrix from './components/ExceptionMatrix';
import FlywheelSection from './components/FlywheelSection';
import ContactSection from './components/ContactSection';

export default function Home() {
  return (
    <main className="min-h-screen bg-dark-bg selection:bg-accent-blue/30 selection:text-white">
      <NavBar />
      <HeroSection />
      <div className="space-y-32 pb-32">
        <ManifestoSection />
        <AgentRoster />
        <WorkflowTimeline />
        <TechStack />
        <ExceptionMatrix />
        <FlywheelSection />
        <ContactSection />
      </div>

      <footer className="py-12 px-6 border-t border-white/[0.05] bg-dark-bg relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white font-bold text-xs">
              AG
            </div>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} AG Associates. Built by LUXORANOVA.
            </p>
          </div>
          <div className="flex gap-8">
            <a href="#manifesto" className="text-gray-500 hover:text-white text-sm transition-colors">Manifesto</a>
            <a href="#project" className="text-gray-500 hover:text-white text-sm transition-colors">Project</a>
            <a href="#tech" className="text-gray-500 hover:text-white text-sm transition-colors">Stack</a>
            <a href="/dashboard" className="text-gray-500 hover:text-white text-sm transition-colors">Dashboard</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
