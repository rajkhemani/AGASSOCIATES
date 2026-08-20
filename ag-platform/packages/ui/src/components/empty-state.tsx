'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-muted-foreground" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function EmptyStateCard({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8">
      <EmptyState
        title={title}
        description={description}
        icon={icon}
        action={action}
        className="w-full"
      />
    </div>
  );
}