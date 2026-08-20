// CommandCenter - Main dashboard for Luxor9 Legal OS MVP
// Reuses patterns from ConsoleApp/LiveDashboard

'use client';

import { useState } from 'react';
import { Activity, AlertTriangle, Clock, Users, Zap, Server, Building2, FileText, TrendingUp, Loader2 } from 'lucide-react';
import { useActiveMatters, useSLARisks, usePendingApprovals, useAITasks, useUpcomingDeadlines, useExternalActions, useInstitutionActivity, useSystemHealth } from '@ag/api';
import { VirtualizedDataGrid, ColumnDef } from '@ag/ui';

const MATTERS_COLUMNS: ColumnDef<any>[] = [
  { id: 'case_number', header: 'Case #', accessorKey: 'case_number', size: 120 },
  { id: 'borrower_name', header: 'Borrower', accessorKey: 'borrower_name', size: 200 },
  { id: 'case_type', header: 'Type', accessorKey: 'case_type', size: 120 },
  { id: 'recovery_status', header: 'Status', accessorKey: 'recovery_status', size: 140 },
  { id: 'loan_amount', header: 'Amount', accessorKey: 'loan_amount', size: 130, cell: ({ getValue }) => `₹${Number(getValue()).toLocaleString('en-IN')}` },
  { id: 'hours_until_sla', header: 'SLA (hrs)', accessorKey: 'hours_until_sla', size: 100, cell: ({ getValue }) => {
    const hrs = Number(getValue());
    return hrs < 0 ? `Overdue ${Math.abs(hrs).toFixed(1)}h` : `${hrs.toFixed(1)}h`;
  }},
  { id: 'is_overdue', header: 'Risk', accessorKey: 'is_overdue', size: 80, cell: ({ getValue }) => getValue() ? '🔴' : '🟢' },
];

const RISKS_COLUMNS: ColumnDef<any>[] = [
  { id: 'case_number', header: 'Case #', accessorKey: 'case_number', size: 120 },
  { id: 'borrower_name', header: 'Borrower', accessorKey: 'borrower_name', size: 200 },
  { id: 'risk_level', header: 'Risk', accessorKey: 'risk_level', size: 100, cell: ({ getValue }) => {
    const level = getValue();
    const icons = { critical: '🔴 Critical', warning: '🟡 Warning', normal: '🟢 Normal' };
    return icons[level as keyof typeof icons] || level;
  }},
  { id: 'hours_remaining', header: 'Hours Left', accessorKey: 'hours_remaining', size: 120, cell: ({ getValue }) => `${Number(getValue()).toFixed(1)}h` },
];

const APPROVALS_COLUMNS: ColumnDef<any>[] = [
  { id: 'case_number', header: 'Case #', accessorKey: 'case_number', size: 120 },
  { id: 'borrower_name', header: 'Borrower', accessorKey: 'borrower_name', size: 200 },
  { id: 'approval_type', header: 'Type', accessorKey: 'approval_type', size: 150 },
  { id: 'status', header: 'Status', accessorKey: 'status', size: 120 },
  { id: 'requested_at', header: 'Requested', accessorKey: 'requested_at', size: 160, cell: ({ getValue }) => new Date(getValue() as string).toLocaleString() },
];

export function CommandCenter() {
  const [activeTab, setActiveTab] = useState<'matters' | 'risks' | 'approvals' | 'tasks' | 'deadlines' | 'actions' | 'institutions' | 'health'>('matters');
  
  const { data: matters, isLoading: mattersLoading } = useActiveMatters();
  const { data: risks, isLoading: risksLoading } = useSLARisks();
  const { data: approvals, isLoading: approvalsLoading } = usePendingApprovals();
  const { data: aiTasks } = useAITasks();
  const { data: deadlines } = useUpcomingDeadlines();
  const { data: actions } = useExternalActions();
  const { data: institutions } = useInstitutionActivity();
  const { data: health } = useSystemHealth();

  const tabs = [
    { id: 'matters', label: 'Active Matters', icon: FileText, count: matters?.length },
    { id: 'risks', label: 'SLA Risks', icon: AlertTriangle, count: risks?.filter(r => r.risk_level !== 'normal').length },
    { id: 'approvals', label: 'Approvals', icon: Users, count: approvals?.length },
    { id: 'tasks', label: 'AI Tasks', icon: Zap, count: aiTasks?.length },
    { id: 'deadlines', label: 'Deadlines', icon: Clock, count: deadlines?.length },
    { id: 'actions', label: 'Ext. Actions', icon: Activity, count: actions?.length },
    { id: 'institutions', label: 'Institutions', icon: Building2, count: institutions?.length },
    { id: 'health', label: 'System Health', icon: Server, count: null },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'matters':
        return (
          <VirtualizedDataGrid
            data={matters || []}
            columns={MATTERS_COLUMNS}
            rowKey="id"
            height={500}
            loading={mattersLoading}
            emptyMessage="No active matters"
          />
        );
      case 'risks':
        return (
          <VirtualizedDataGrid
            data={risks || []}
            columns={RISKS_COLUMNS}
            rowKey="id"
            height={500}
            loading={risksLoading}
            emptyMessage="No SLA risks"
          />
        );
      case 'approvals':
        return (
          <VirtualizedDataGrid
            data={approvals || []}
            columns={APPROVALS_COLUMNS}
            rowKey="id"
            height={500}
            loading={approvalsLoading}
            emptyMessage="No pending approvals"
          />
        );
      case 'health':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {health && [
              { label: 'Database', value: health.database, icon: Server },
              { label: 'Redis', value: health.redis, icon: Server },
              { label: 'AI Backend', value: health.aiBackend, icon: Zap },
            ].map((item, i) => (
              <div key={i} className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <item.icon size={20} className="text-violet-400" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className={`text-2xl font-bold ${item.value === 'healthy' ? 'text-green-400' : item.value === 'degraded' ? 'text-yellow-400' : 'text-red-400'}`}>
                  {item.value}
                </div>
              </div>
            ))}
            <div className="glass-card p-4 lg:col-span-4">
              <h3 className="font-medium mb-4">External Adapters</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {health && Object.entries(health.externalAdapters).map(([channel, mode]) => (
                  <div key={channel} className="glass-card p-3 text-center">
                    <div className="text-sm text-white/60">{channel}</div>
                    <div className={`font-mono text-sm ${mode === 'LIVE' ? 'text-green-400' : mode === 'SANDBOX' ? 'text-yellow-400' : mode === 'MOCK' ? 'text-blue-400' : 'text-white/40'}`}>
                      {mode}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="glass-card p-6 text-center text-white/60">
            <TrendingUp size={48} className="mx-auto mb-4 text-white/30" />
            <p>{tabs.find(t => t.id === activeTab)?.label} view coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold">Command Center</h1>
          <p className="text-white/60">Real-time operations overview for Banking Panel</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-mono bg-green-500/20 text-green-400 rounded-full">
            LIVE
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="glass-card overflow-hidden">
        <div className="flex overflow-x-auto pb-1" role="tablist">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-violet-500 bg-white/5'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.count !== null && tab.count !== undefined && (
                <span className="px-2 py-0.5 text-xs bg-violet-500/20 text-violet-300 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="glass-card">
        {renderContent()}
      </div>
    </div>
  );
}

export default CommandCenter;