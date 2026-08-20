// MattersList - List view for matters/cases

'use client';

import { Search, Filter, Plus, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { VirtualizedDataGrid, ColumnDef } from '@ag/ui';
import { useActiveMatters } from '@ag/api';

const COLUMNS: ColumnDef<any>[] = [
  { id: 'case_number', header: 'Case #', accessorKey: 'case_number', size: 120, cell: ({ getValue, row }) => (
    <Link to={`/matters/${row.original.id}`} className="text-violet-400 hover:underline">{getValue()}</Link>
  )},
  { id: 'borrower_name', header: 'Borrower', accessorKey: 'borrower_name', size: 200 },
  { id: 'case_type', header: 'Type', accessorKey: 'case_type', size: 120 },
  { id: 'recovery_status', header: 'Recovery Status', accessorKey: 'recovery_status', size: 150 },
  { id: 'loan_amount', header: 'Loan Amount', accessorKey: 'loan_amount', size: 140, cell: ({ getValue }) => `₹${Number(getValue()).toLocaleString('en-IN')}` },
  { id: 'bank_id', header: 'Bank', accessorKey: 'bank_id', size: 120 },
  { id: 'hours_until_sla', header: 'SLA (hrs)', accessorKey: 'hours_until_sla', size: 100, cell: ({ getValue }) => {
    const hrs = Number(getValue());
    return hrs < 0 ? `Overdue ${Math.abs(hrs).toFixed(1)}h` : `${hrs.toFixed(1)}h`;
  }},
  { id: 'actions', header: 'Actions', accessorKey: 'id', size: 100, cell: ({ row }) => (
    <Link to={`/matters/${row.original.id}`} className="text-violet-400 hover:underline">View</Link>
  )},
];

export function MattersList() {
  const [search, setSearch] = useState('');
  const { data: matters, isLoading } = useActiveMatters();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold">Matters</h1>
          <p className="text-white/60">All active cases and recovery workflows</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="glass-button flex items-center gap-2">
            <Plus size={16} /> New Matter
          </button>
        </div>
      </div>

      <div className="glass-card">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search matters..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50"
            />
          </div>
          <button className="glass-button flex items-center gap-2">
            <Filter size={16} /> Filters
          </button>
        </div>
        <VirtualizedDataGrid
          data={matters || []}
          columns={COLUMNS}
          rowKey="id"
          height={600}
          loading={isLoading}
          globalFilter={search}
          onGlobalFilterChange={setSearch}
          emptyMessage="No matters found"
        />
      </div>
    </div>
  );
}

export default MattersList;