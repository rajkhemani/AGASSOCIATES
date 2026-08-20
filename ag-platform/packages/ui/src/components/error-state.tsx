'use client';

import * as React from 'react';
import { cn } from '../utils/cn';
import { RefreshCw, AlertCircle, WifiOff, Server, Database } from 'lucide-react';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'network' | 'server' | 'not-found' | 'permission';
  action?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}

const variantConfig = {
  default: {
    icon: AlertCircle,
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again.',
  },
  network: {
    icon: WifiOff,
    title: 'Connection lost',
    description: 'Please check your internet connection and try again.',
  },
  server: {
    icon: Server,
    title: 'Server error',
    description: 'Our servers are experiencing issues. Please try again later.',
  },
  'not-found': {
    icon: Database,
    title: 'Not found',
    description: 'The requested resource could not be found.',
  },
  permission: {
    icon: AlertCircle,
    title: 'Access denied',
    description: 'You do not have permission to access this resource.',
  },
};

export function ErrorState({
  title,
  description,
  variant = 'default',
  action,
  onRetry,
  className,
}: ErrorStateProps) {
  const config = variantConfig[variant];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
      role="alert"
    >
      <div className="mb-4 text-destructive/60" aria-hidden="true">
        <config.icon className="h-12 w-12" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title || config.title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        {description || config.description}
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full max-w-sm">
        {onRetry && (
          <button
            onClick={onRetry}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
              'w-full sm:w-auto'
            )}
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        )}
        {action && (
          <div className="w-full sm:w-auto">{action}</div>
        )}
      </div>
    </div>
  );
}

export function ErrorStateCard({
  title,
  description,
  variant = 'default',
  action,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8">
      <ErrorState
        title={title}
        description={description}
        variant={variant}
        action={action}
        onRetry={onRetry}
        className="w-full"
      />
    </div>
  );
}

export function InlineError({
  message,
  onDismiss,
  className,
}: {
  message: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive',
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <p className="flex-1">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 rounded-md p-1 text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
          aria-label="Dismiss"
        >
          <span className="sr-only">Dismiss</span>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}