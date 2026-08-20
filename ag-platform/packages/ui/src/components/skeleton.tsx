'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

interface SkeletonListProps {
  rows?: number;
  rowHeight?: string;
  rowWidth?: string | string[];
}

function SkeletonList({
  rows = 5,
  rowHeight = 'h-12',
  rowWidth = 'w-full',
}: SkeletonListProps) {
  const widths = Array.isArray(rowWidth) ? rowWidth : Array(rows).fill(rowWidth);

  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className={`${rowHeight} ${widths[i]}`} />
        </div>
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  title?: boolean;
  description?: boolean;
  actions?: number;
}

function SkeletonCard({ title = true, description = true, actions = 1 }: SkeletonCardProps) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
      {title && <Skeleton className="h-6 w-3/4" />}
      {description && <Skeleton className="h-4 w-full" />}
      {description && <Skeleton className="h-4 w-2/3" />}
      {actions > 0 && (
        <div className="flex justify-end space-x-2 pt-4">
          {Array.from({ length: actions }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
      )}
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  <Skeleton className="h-4 w-3/4" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b last:border-b-0">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="p-4 align-middle">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { Skeleton, SkeletonList, SkeletonCard, SkeletonTable };