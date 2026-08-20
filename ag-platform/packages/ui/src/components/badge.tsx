'use client';

import * as React from 'react';
import { cn } from '../utils/cn';
import { statusTokens } from '@ag/design-tokens';

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning'
    | 'info'
    | 'pending'
    | 'active'
    | 'completed';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

function Badge({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground border border-input',
    success: 'bg-green-500/10 text-green-700 dark:text-green-400 dark:bg-green-500/20 border border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 dark:bg-yellow-500/20 border border-yellow-500/20',
    info: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 dark:bg-blue-500/20 border border-blue-500/20',
    pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 dark:bg-yellow-500/20 border border-yellow-500/20',
    active: 'bg-green-500/10 text-green-700 dark:text-green-400 dark:bg-green-500/20 border border-green-500/20',
    completed: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 dark:bg-blue-500/20 border border-blue-500/20',
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
    xl: 'px-5 py-2 text-lg',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };