'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderClosed,
  Camera,
  Activity,
  Settings,
  ChevronRight,
  Scan,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wifi,
  WifiOff,
  X,
  ArrowLeft,
  FileText,
  MapPin,
  User,
  LogOut,
  RefreshCw,
  Circle,
  Download,
} from 'lucide-react';
import Link from 'next/link';

type Tab = 'cases' | 'scanner' | 'activity' | 'settings';
type CaseStatus = 'pending' | 'verified' | 'filing' | 'complete' | 'escalated';
type EscalationTier = 1 | 2 | 3 | null;

interface MobileCase {
  id: string;
  shortId: string;
  bank: string;
  borrower: string;
  property: string;
  amount: number;
  status: CaseStatus;
  progress: number;
  escalation: EscalationTier;
  slaDays: number;
  pendingDocuments: string[];
  assignedAt: string;
}

const MOCK_MOBILE_CASES: MobileCase[] = [
  { id: 'KOTAK-NOI-2026-0042', shortId: 'KTK-042', bank: 'Kotak Mahindra', borrower: 'Aditi Rao', property: 'Flat 302, Vasant Vihar, Thane W', amount: 4500000, status: 'filing', progress: 72, escalation: null, slaDays: 23, pendingDocuments: [], assignedAt: '2026-04-28' },
  { id: 'AXIS-NOI-2026-0039', shortId: 'AXS-039', bank: 'Axis Finance', borrower: 'Suresh Patil', property: 'Bungalow 15, Hiranandani Estate', amount: 12000000, status: 'escalated', progress: 45, escalation: 2, slaDays: 26, pendingDocuments: ['PAN Card', 'Index II'], assignedAt: '2026-04-30' },
  { id: 'HDFC-NOI-2026-0051', shortId: 'HDF-051', bank: 'HDFC Bank', borrower: 'Amit Patel', property: 'Shop 4, Lodha Boulevard', amount: 8500000, status: 'complete', progress: 100, escalation: null, slaDays: 19, pendingDocuments: [], assignedAt: '2026-04-25' },
];

export default function NoiMobile() {
  const [activeTab, setActiveTab] = useState<Tab>('cases');
  const [selectedCase, setSelectedCase] = useState<MobileCase | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  return (
    <div className="min-h-screen bg-obsidian text-white flex flex-col font-sans max-w-md mx-auto border-x border-hairline">
      {/* Mobile Header */}
      <header className="px-6 py-6 border-b border-hairline bg-obsidian flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center border border-white text-white font-bold text-xs">
            AG
          </div>
          <div>
            <h1 className="text-xs font-bold uppercase tracking-widest leading-none">Field App</h1>
            <div className="flex items-center gap-1 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500">
                {isOnline ? 'Network Stable' : 'Offline Mode'}
              </span>
            </div>
          </div>
        </div>
        <button className="w-8 h-8 border border-hairline flex items-center justify-center text-gray-500">
          <User size={14} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'cases' && (
          <div className="divide-y divide-hairline">
            {MOCK_MOBILE_CASES.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCase(c)}
                className="p-6 active:bg-white/5 transition-colors group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{c.shortId}</span>
                  {c.escalation && (
                    <div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-red-500">
                      <AlertTriangle size={8} /> TIER {c.escalation}
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-1">{c.borrower}</h3>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mb-4">
                  {c.bank} · ₹{(c.amount / 100000).toFixed(1)}L
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 bg-[#1F1F1F]">
                      <div className="h-full bg-white" style={{ width: `${c.progress}%` }} />
                    </div>
                    <span className="text-[8px] font-bold text-gray-600">{c.progress}%</span>
                  </div>
                  <ChevronRight size={14} className="text-gray-700 group-hover:text-white transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'scanner' && (
          <div className="p-8 text-center h-full flex flex-col items-center justify-center">
            <div className="w-20 h-20 border border-hairline flex items-center justify-center mb-8">
              <Scan size={32} className="text-white" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4">Document Scanner</h2>
            <p className="text-[10px] text-gray-500 font-light tracking-wide uppercase leading-relaxed mb-10">
              Align document within frame. <br />AI will auto-crop and enhance.
            </p>
            <button className="w-full bg-white text-black py-4 text-[10px] font-bold uppercase tracking-widest">
              Launch Camera
            </button>
          </div>
        )}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 w-full max-w-md bg-obsidian border-t border-hairline px-4 py-4 flex justify-around items-center z-50">
        {[
          { id: 'cases', icon: FolderClosed },
          { id: 'scanner', icon: Camera },
          { id: 'activity', icon: Activity },
          { id: 'settings', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`p-3 transition-colors ${activeTab === tab.id ? 'text-white' : 'text-gray-700'}`}
          >
            <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 1.5} />
          </button>
        ))}
      </nav>

      {/* Case Details Overlay */}
      <AnimatePresence>
        {selectedCase && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-obsidian flex flex-col max-w-md mx-auto"
          >
            <header className="px-6 py-6 border-b border-hairline flex items-center gap-4">
              <button onClick={() => setSelectedCase(null)} className="p-2 -ml-2">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-xs font-bold uppercase tracking-widest">Case details</h2>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="mb-12">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-4">{selectedCase.id}</p>
                <h3 className="text-2xl font-bold tracking-tighter mb-2">{selectedCase.borrower}</h3>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-10">{selectedCase.property}</p>

                <div className="grid grid-cols-2 gap-8 py-8 border-y border-hairline">
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-gray-600 mb-2">Loan Amount</p>
                    <p className="text-sm font-bold font-mono">₹{selectedCase.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-gray-600 mb-2">SLA Status</p>
                    <p className="text-sm font-bold uppercase tracking-widest text-green-500">{selectedCase.slaDays} Days Left</p>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Requirements</h4>
                <div className="space-y-4">
                  {selectedCase.pendingDocuments.length > 0 ? (
                    selectedCase.pendingDocuments.map(doc => (
                      <div key={doc} className="flex items-center justify-between p-4 border border-hairline">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">{doc}</span>
                        <Upload size={14} className="text-gray-700" />
                      </div>
                    ))
                  ) : (
                    <div className="p-10 border border-hairline border-dashed text-center">
                      <CheckCircle2 size={24} className="mx-auto text-white mb-4" />
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600">All documents verified</p>
                    </div>
                  )}
                </div>
              </div>

              <button className="w-full bg-white text-black py-5 text-[10px] font-bold uppercase tracking-widest mt-16">
                Start Document Collection
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
