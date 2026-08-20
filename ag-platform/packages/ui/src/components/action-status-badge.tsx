'use client';

import * as React from 'react';
import { cn } from '../utils/cn';
import { CheckCircle, XCircle, Clock, Loader2, AlertCircle, HelpCircle, PauseCircle, PlayCircle, SkipForward, RotateCcw, Shield, Flag, Zap, Eye, Edit, Trash2, Download, Upload, Mail, Bell, Calendar, Clock as ClockIcon, Users, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from './dropdown-menu';

export type ActionStatus =
  | 'idle'
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused'
  | 'retrying'
  | 'scheduled'
  | 'queued'
  | 'blocked'
  | 'requires_review'
  | 'approved'
  | 'rejected';

export type ActionType =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'approval'
  | 'notification'
  | 'background'
  | 'scheduled'
  | 'manual';

export interface ActionStatusBadgeProps {
  status: ActionStatus;
  type?: ActionType;
  label?: string;
  showIcon?: boolean;
  showLabel?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'soft' | 'dot';
  animated?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  tooltip?: string;
  progress?: number;
  className?: string;
}

export interface ActionStatusConfig {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  label: string;
  description: string;
  pulse?: boolean;
}

const statusConfig: Record<ActionStatus, ActionStatusConfig> = {
  idle: {
    icon: Circle,
    color: 'bg-muted text-muted-foreground border-muted',
    label: 'Idle',
    description: 'Not started',
  },
  pending: {
    icon: Clock,
    color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    label: 'Pending',
    description: 'Waiting to start',
  },
  running: {
    icon: Loader2,
    color: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    label: 'Running',
    description: 'In progress',
    pulse: true,
  },
  completed: {
    icon: CheckCircle,
    color: 'bg-green-500/10 text-green-700 border-green-500/20',
    label: 'Completed',
    description: 'Finished successfully',
  },
  failed: {
    icon: XCircle,
    color: 'bg-red-500/10 text-red-700 border-red-500/20',
    label: 'Failed',
    description: 'Execution failed',
  },
  cancelled: {
    icon: PauseCircle,
    color: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
    label: 'Cancelled',
    description: 'Manually stopped',
  },
  paused: {
    icon: PauseCircle,
    color: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
    label: 'Paused',
    description: 'Temporarily stopped',
  },
  retrying: {
    icon: RotateCcw,
    color: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
    label: 'Retrying',
    description: 'Attempting again',
    pulse: true,
  },
  scheduled: {
    icon: Calendar,
    color: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
    label: 'Scheduled',
    description: 'Set for future execution',
  },
  queued: {
    icon: Clock,
    color: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20',
    label: 'Queued',
    description: 'Waiting in queue',
  },
  blocked: {
    icon: ShieldAlert,
    color: 'bg-red-500/10 text-red-700 border-red-500/20',
    label: 'Blocked',
    description: 'Waiting on dependency',
  },
  requires_review: {
    icon: Eye,
    color: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    label: 'Requires Review',
    description: 'Needs manual approval',
  },
  approved: {
    icon: ShieldCheck,
    color: 'bg-green-500/10 text-green-700 border-green-500/20',
    label: 'Approved',
    description: 'Approved for execution',
  },
  rejected: {
    icon: ShieldX,
    color: 'bg-red-500/10 text-red-700 border-red-500/20',
    label: 'Rejected',
    description: 'Rejected by reviewer',
  },
};

const typeConfig: Record<ActionType, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  default: { icon: Zap, color: 'bg-muted text-muted-foreground' },
  primary: { icon: Zap, color: 'bg-primary text-primary-foreground' },
  secondary: { icon: Zap, color: 'bg-secondary text-secondary-foreground' },
  destructive: { icon: Trash2, color: 'bg-destructive text-destructive-foreground' },
  approval: { icon: ShieldCheck, color: 'bg-green-500/10 text-green-700' },
  notification: { icon: Bell, color: 'bg-blue-500/10 text-blue-700' },
  background: { icon: PlayCircle, color: 'bg-purple-500/10 text-purple-700' },
  scheduled: { icon: Calendar, color: 'bg-indigo-500/10 text-indigo-700' },
  manual: { icon: Edit, color: 'bg-orange-500/10 text-orange-700' },
};

const sizeClasses = {
  xs: 'px-1.5 py-0.5 text-[10px] gap-1',
  sm: 'px-2 py-0.5 text-xs gap-1.5',
  md: 'px-2.5 py-1 text-sm gap-2',
  lg: 'px-3 py-1.5 text-base gap-2.5',
};

const iconSizes = {
  xs: 'h-2.5 w-2.5',
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function ActionStatusBadge({
  status,
  type = 'default',
  label,
  showIcon = true,
  showLabel = true,
  size = 'md',
  variant = 'solid',
  animated = false,
  clickable = false,
  onClick,
  tooltip,
  progress,
  className,
}: ActionStatusBadgeProps) {
  const config = statusConfig[status];
  const typeCfg = typeConfig[type];
  const Icon = config.icon;
  const TypeIcon = typeCfg.icon;

  const displayLabel = label || config.label;

  const baseClasses = cn(
    'inline-flex items-center font-medium rounded-full border transition-all',
    sizeClasses[size],
    className
  );

  const variantClasses = {
    solid: config.color,
    outline: config.color.replace('bg-', 'bg-transparent ').replace('text-', 'text-').replace('border-', 'border-'),
    soft: config.color.replace('border-', 'border-transparent'),
    dot: 'bg-transparent border-transparent px-2',
  };

  const content = (
    <>
      {showIcon && (
        <span
          className={cn(
            'flex items-center justify-center',
            iconSizes[size],
            animated && config.pulse && 'animate-pulse'
          )}
        >
          <Icon className={cn('flex-shrink-0', iconSizes[size])} />
        </span>
      )}
      {showLabel && <span className="whitespace-nowrap">{displayLabel}</span>}
      {progress !== undefined && progress > 0 && progress < 100 && (
        <span className="text-xs font-mono tabular-nums">
          {Math.round(progress)}%
        </span>
      )}
    </>
  );

  if (variant === 'dot') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5',
          className
        )}
        title={tooltip || config.description}
      >
        <span
          className={cn(
            'rounded-full',
            size === 'xs' && 'h-1.5 w-1.5',
            size === 'sm' && 'h-2 w-2',
            size === 'md' && 'h-2.5 w-2.5',
            size === 'lg' && 'h-3 w-3',
            config.color.replace('bg-', 'bg-').replace('text-', '').replace('border-', '')
          )}
          style={{
            animation: animated && config.pulse ? 'pulse 2s ease-in-out infinite' : undefined,
          }}
        />
        {showLabel && <span className="text-sm">{displayLabel}</span>}
      </span>
    );
  }

  const Element = clickable ? Button : 'span';

  return (
    <Element
      className={cn(baseClasses, variantClasses[variant])}
      onClick={onClick}
      title={tooltip || config.description}
      disabled={!clickable}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      {content}
    </Element>
  );
}

// Compound component for action with status and dropdown
interface ActionWithStatusProps {
  status: ActionStatus;
  type?: ActionType;
  label: string;
  description?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: 'default' | 'destructive' | 'outline';
    disabled?: boolean;
  }>;
  onStatusClick?: () => void;
  className?: string;
}

export function ActionWithStatus({
  status,
  type = 'default',
  label,
  description,
  actions = [],
  onStatusClick,
  className,
}: ActionWithStatusProps) {
  const config = statusConfig[status];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <ActionStatusBadge
        status={status}
        type={type}
        label={label}
        size="md"
        variant="soft"
        clickable={!!onStatusClick}
        onClick={onStatusClick}
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        <div className="text-xs text-muted-foreground">
          {config.description}
        </div>
      </div>

      {actions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{label} Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {actions.map((action) => (
              <DropdownMenuItem
                key={action.label}
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(action.variant === 'destructive' && 'text-red-600')}
              >
                {action.icon && <span className="mr-2 h-4 w-4">{action.icon}</span>}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// Progress ring variant
interface ActionProgressRingProps {
  status: ActionStatus;
  progress: number;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  className?: string;
}

export function ActionProgressRing({
  status,
  progress,
  size = 48,
  strokeWidth = 4,
  showPercentage = true,
  className,
}: ActionProgressRingProps) {
  const config = statusConfig[status];
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const colorMap = {
    idle: 'currentColor',
    pending: '#f59e0b',
    running: '#3b82f6',
    completed: '#10b981',
    failed: '#ef4444',
    cancelled: '#6b7280',
    paused: '#f97316',
    retrying: '#a855f7',
    scheduled: '#6366f1',
    queued: '#06b6d4',
    blocked: '#ef4444',
    requires_review: '#f59e0b',
    approved: '#10b981',
    rejected: '#ef4444',
  };

  const strokeColor = colorMap[status] || 'currentColor';

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          className="text-muted"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="transition-all duration-300"
          strokeWidth={strokeWidth}
          stroke={strokeColor}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>

      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium">
            {Math.round(progress)}%
          </span>
        </div>
      )}

      {!showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <config.icon className={cn('text-foreground', `h-${size * 0.3} w-${size * 0.3}`)} />
        </div>
      )}
    </div>
  );
}