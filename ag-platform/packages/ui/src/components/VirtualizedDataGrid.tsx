// VirtualizedDataGrid - High-performance virtualized table using react-window + @tanstack/react-table
// Reusable component for large datasets (10k+ rows)

'use client';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
  PaginationState,
  ExpandedState,
} from '@tanstack/react-table';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { useMemo, useState, useCallback, type ReactNode, type KeyboardEvent } from 'react';
import { ChevronUp, ChevronDown, ChevronRight, Search, Filter, ChevronLeft } from 'lucide-react';
import { clsx } from 'clsx';

export interface ColumnDef<TData> {
  id: string;
  header: string;
  accessorKey?: keyof TData;
  accessorFn?: (row: TData) => unknown;
  cell?: (info: { getValue: () => unknown; row: TData }) => ReactNode;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  filterFn?: (row: TData, columnId: string, value: unknown, addMeta: (meta: unknown) => void) => boolean;
  size?: number;
  minSize?: number;
  maxSize?: number;
}

export interface VirtualizedDataGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  rowKey: keyof TData | ((row: TData) => string);
  height?: number;
  rowHeight?: number;
  overscan?: number;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  pagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  expanded?: ExpandedState;
  onExpandedChange?: (expanded: ExpandedState) => void;
  globalFilter?: string;
  onGlobalFilterChange?: (filter: string) => void;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  enableRowSelection?: boolean;
  onRowClick?: (row: TData) => void;
  onRowDoubleClick?: (row: TData) => void;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function DefaultHeader<TData>({
  column,
  sorting,
  onSortingChange,
}: {
  column: any;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
}) {
  const isSorted = sorting.find(s => s.id === column.id);
  const isAsc = isSorted?.desc === false;
  const isDesc = isSorted?.desc === true;

  return (
    <button
      onClick={column.getToggleSortingHandler()}
      className="flex items-center gap-1 px-3 py-2 text-left text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors select-none"
      style={{ width: '100%' }}
      aria-sort={isAsc ? 'ascending' : isDesc ? 'descending' : 'none'}
    >
      <span>{column.columnDef.header}</span>
      {column.getCanSort() && (
        <span className="flex-shrink-0">
          {isAsc ? <ChevronUp size={14} className="text-white" /> : isDesc ? <ChevronDown size={14} className="text-white" /> : <ChevronUp size={14} className="text-white/30" />}
        </span>
      )}
    </button>
  );
}

function DefaultFilter<TData>({
  column,
  columnFilters,
  onColumnFiltersChange,
}: {
  column: any;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
}) {
  const filter = columnFilters.find(f => f.id === column.id);
  const value = (filter?.value as string) || '';

  return (
    <input
      type="text"
      value={value}
      onChange={e => column.setFilterValue(e.target.value)}
      placeholder={`Filter ${column.columnDef.header}...`}
      className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50"
      aria-label={`Filter ${column.columnDef.header}`}
    />
  );
}

function DefaultCell<TData>({
  cell,
  column,
}: {
  cell: any;
  column: any;
}) {
  const renderValue = column.columnDef.cell 
    ? column.columnDef.cell({ getValue: cell.getValue, row: cell.row.original })
    : cell.getValue();
  
  return (
    <div className="px-3 py-2 text-sm text-white/90 truncate">
      {renderValue}
    </div>
  );
}

function GlobalFilter({
  table,
}: {
  table: any;
}) {
  const [value, setValue] = useState(table.getState().globalFilter || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    table.setGlobalFilter(newValue);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Search all columns..."
        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50"
        aria-label="Global search"
      />
    </div>
  );
}

export function VirtualizedDataGrid<TData extends Record<string, any>>({
  data,
  columns,
  rowKey,
  height = 600,
  rowHeight = 48,
  overscan = 5,
  sorting = [],
  onSortingChange,
  columnFilters = [],
  onColumnFiltersChange,
  pagination,
  onPaginationChange,
  expanded = {},
  onExpandedChange,
  globalFilter,
  onGlobalFilterChange,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableRowSelection = false,
  onRowClick,
  onRowDoubleClick,
  emptyMessage = 'No data available',
  loading = false,
  className = '',
  style,
}: VirtualizedDataGridProps<TData>) {
  const columnHelper = useMemo(() => createColumnHelper<TData>(), []);

  const tableColumns = useMemo(() => 
    columns.map(col => {
      const baseColumn = columnHelper.accessor(col.accessorKey as string, {
        id: col.id,
        header: col.header,
        cell: col.cell ? (info) => flexRender(col.cell!(info), info) : undefined,
        enableSorting: col.enableSorting ?? enableSorting,
        enableFiltering: col.enableFiltering ?? enableFiltering,
        filterFn: col.filterFn,
        size: col.size,
        minSize: col.minSize,
        maxSize: col.maxSize,
      });
      return baseColumn;
    }), 
    [columns, columnHelper, enableSorting, enableFiltering]
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      pagination,
      expanded,
      globalFilter,
    },
    onSortingChange,
    onColumnFiltersChange,
    onPaginationChange,
    onExpandedChange,
    onGlobalFilterChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    manualPagination: !!pagination,
    manualSorting: !!onSortingChange,
    manualFiltering: !!onColumnFiltersChange,
    manualGlobalFilter: !!onGlobalFilterChange,
    manualExpanded: !!onExpandedChange,
  });

  const rowVirtualizer = useMemo(() => {
    const rowModel = table.getRowModel();
    return (index: number, style: React.CSSProperties) => {
      const row = rowModel.rows[index];
      if (!row) return null;

      const getRowKey = typeof rowKey === 'function' ? rowKey : (r: TData) => String(r[rowKey]);
      const key = getRowKey(row.original);
      const isExpanded = expanded[key];

      return (
        <div
          key={key}
          style={{
            ...style,
            display: 'flex',
          }}
          className={clsx(
            'flex w-full border-b border-white/5 transition-colors',
            isExpanded && 'bg-white/5',
            onRowClick && 'cursor-pointer hover:bg-white/5',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500'
          )}
          tabIndex={onRowClick ? 0 : -1}
          onClick={() => onRowClick?.(row.original)}
          onDoubleClick={() => onRowDoubleClick?.(row.original)}
          onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onRowClick?.(row.original);
            }
          }}
          role="row"
          aria-rowindex={index + 1}
          aria-expanded={isExpanded}
        >
          {row.getVisibleCells().map(cell => (
            <div
              key={cell.id}
              style={{
                width: `${cell.getSize()}px`,
                flexShrink: 0,
                flexGrow: 0,
              }}
              className="flex items-center"
              role="gridcell"
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          ))}
        </div>
      );
    };
  }, [table, rowKey, expanded, onRowClick, onRowDoubleClick]);

  const headerHeight = 48;
  const filterRowHeight = enableFiltering ? 48 : 0;

  return (
    <div className={clsx('glass-card overflow-hidden flex flex-col', className)} style={style} role="grid" aria-label="Data grid">
      {/* Global Filter */}
      {(globalFilter !== undefined || onGlobalFilterChange) && (
        <div className="p-4 border-b border-white/10">
          <GlobalFilter table={table} />
        </div>
      )}

      {/* Column Headers */}
      <div className="flex border-b border-white/10 bg-white/5" style={{ height: headerHeight }} role="rowgroup">
        {table.getHeaderGroups().map(headerGroup => (
          <div key={headerGroup.id} className="flex w-full h-full" role="row">
            {headerGroup.headers.map(header => (
              <div
                key={header.id}
                style={{ width: `${header.getSize()}px`, flexShrink: 0, flexGrow: 0 }}
                className="h-full"
                role="columnheader"
                aria-sort={header.column.getIsSorted() ? (header.column.getIsSorted() === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Filter Row */}
      {enableFiltering && (
        <div className="flex border-b border-white/10 bg-white/5" style={{ height: filterRowHeight }} role="rowgroup">
          {table.getHeaderGroups()[0]?.headers.map(header => (
            <div
              key={header.id}
              style={{ width: `${header.getSize()}px`, flexShrink: 0, flexGrow: 0 }}
              className="h-full flex items-center px-2"
              role="row"
            >
              {header.column.getCanFilter() && (
                <DefaultFilter
                  column={header.column}
                  columnFilters={columnFilters}
                  onColumnFiltersChange={onColumnFiltersChange || (() => {})}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Virtualized Rows */}
      <div className="flex-1 overflow-auto" role="rowgroup" style={{ height: height - headerHeight - filterRowHeight }}>
        {loading ? (
          <div className="flex items-center justify-center h-full text-white/50">
            <div className="animate-spin rounded-full border-4 border-violet-500 border-t-transparent" style={{ width: 32, height: 32 }} />
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/50">
            {emptyMessage}
          </div>
        ) : (
          <List
            height={height - headerHeight - filterRowHeight}
            itemCount={table.getRowModel().rows.length}
            itemSize={rowHeight}
            overscanCount={overscan}
            width="100%"
            itemData={undefined}
          >
            {rowVirtualizer}
          </List>
        )}
      </div>

      {/* Pagination */}
      {enablePagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
          <div className="text-sm text-white/60">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 rounded text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 rounded text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { flexRender, createColumnHelper };
export type { SortingState, ColumnFiltersState, PaginationState, ExpandedState };