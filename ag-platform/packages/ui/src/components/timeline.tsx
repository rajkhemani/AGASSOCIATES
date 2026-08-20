'use client';

import * as React from 'react';
import { cn } from '../utils/cn';
import { Clock, CheckCircle, AlertCircle, Loader2, XCircle, MoreHorizontal } from 'lucide-react';

export type TimelineItemStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'error'
  | 'warning';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: Date | string;
  status: TimelineItemStatus;
  icon?: React.ReactNode;
  metadata?: Record<string, string | number>;
  actions?: React.ReactNode;
  variant?: 'default' | 'compact' | 'detailed';
}

interface TimelineProps {
  items: TimelineItem[];
  orientation?: 'vertical' | 'horizontal';
  reverse?: boolean;
  showTimestamps?: boolean;
  timestampFormat?: 'relative' | 'absolute' | 'time';
  className?: string;
  onItemClick?: (item: TimelineItem) => void;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    label: 'Pending',
  },
  active: {
    icon: Loader2,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20 animate-pulse',
    label: 'In Progress',
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-500 bg-green-500/10 border-green-500/20',
    label: 'Completed',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-500 bg-red-500/10 border-red-500/20',
    label: 'Error',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    label: 'Warning',
  },
};

function formatTimestamp(
  timestamp: Date | string,
  format: 'relative' | 'absolute' | 'time' = 'relative'
): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

  if (format === 'time') {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (format === 'absolute') {
    return date.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Relative
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TimelineItemComponent({
  item,
  index,
  total,
  orientation = 'vertical',
  showTimestamps = true,
  timestampFormat = 'relative',
  onClick,
}: {
  item: TimelineItem;
  index: number;
  total: number;
  orientation: 'vertical' | 'horizontal';
  showTimestamps: boolean;
  timestampFormat: 'relative' | 'absolute' | 'time';
  onClick?: (item: TimelineItem) => void;
}) {
  const config = statusConfig[item.status];
  const StatusIcon = config.icon;
  const isLast = index === total - 1;
  const isFirst = index === 0;

  const handleClick = () => onClick?.(item);

  if (orientation === 'horizontal') {
    return (
      <div
        className={cn(
          'flex flex-col items-center flex-1 min-w-[120px]',
          onClick && 'cursor-pointer hover:opacity-80'
        )}
        onClick={handleClick}
      >
        <div className="relative flex flex-col items-center">
          {/* Connection line */}
          {!isFirst && (
            <div
              className={cn(
                'w-full h-0.5 mb-2',
                item.status === 'completed' ? 'bg-green-500' : 'bg-muted'
              )}
            />
          )}

          {/* Status indicator */}
          <div
            className={cn(
              'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2',
              item.status === 'completed'
                ? 'bg-green-500 border-green-500 text-white'
                : item.status === 'active'
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : item.status === 'error'
                    ? 'bg-red-500 border-red-500 text-white'
                    : 'bg-background border-muted text-muted-foreground'
            )}
          >
            {item.icon ? (
              item.icon
            ) : (
              <StatusIcon className="h-5 w-5" />
            )}
          </div>

          {/* Timestamp */}
          {showTimestamps && (
            <div className="mt-1 text-xs text-muted-foreground text-center whitespace-nowrap">
              {formatTimestamp(item.timestamp, timestampFormat)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mt-3 w-full text-center">
          <h4 className="font-medium text-sm text-foreground">{item.title}</h4>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {item.description}
            </p>
          )}
          {item.actions && (
            <div className="mt-2">{item.actions}</div>
          )}
        </div>
      </div>
    );
  }

  // Vertical orientation
  return (
    <div
      className={cn(
        'relative flex gap-4',
        onClick && 'cursor-pointer'
      )}
      onClick={handleClick}
    >
      {/* Timeline line and indicator */}
      <div className="relative flex-shrink-0 w-6">
        {/* Vertical line */}
        <div
          className={cn(
            'absolute left-2.5 w-0.5',
            isFirst ? 'top-5' : 'top-0',
            isLast ? 'h-[calc(100%-2.5rem)]' : 'h-full',
            item.status === 'completed' ? 'bg-green-500' : 'bg-muted'
          )}
        />

        {/* Status dot */}
        <div
          className={cn(
            'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2',
            item.status === 'completed'
              ? 'bg-green-500 border-green-500 text-white'
              : item.status === 'active'
                ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                : item.status === 'error'
                  ? 'bg-red-500 border-red-500 text-white'
                  : item.status === 'warning'
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'bg-background border-muted text-muted-foreground'
          )}
        >
          {item.icon ? (
            item.icon
          ) : (
            <StatusIcon className="h-5 w-5" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm text-foreground">{item.title}</h4>
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full',
                  config.color
                )}
              >
                {config.label}
              </span>
            </div>

            {item.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
            )}

            {item.metadata && Object.keys(item.metadata).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(item.metadata).map(([key, value]) => (
                  <span
                    key={key}
                    className="px-2 py-0.5 text-xs text-muted-foreground bg-muted rounded"
                  >
                    {key}: {value}
                  </span>
                ))}
              </div>
            )}

            {item.actions && (
              <div className="mt-2">{item.actions}</div>
            )}
          </div>

          {showTimestamps && (
            <div className="flex-shrink-0 text-right">
              <time
                className="text-xs text-muted-foreground whitespace-nowrap"
                dateTime={typeof item.timestamp === 'string' ? item.timestamp : item.timestamp.toISOString()}
              >
                {formatTimestamp(item.timestamp, timestampFormat)}
              </time>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Timeline({
  items,
  orientation = 'vertical',
  reverse = false,
  showTimestamps = true,
  timestampFormat = 'relative',
  className,
  onItemClick,
}: TimelineProps) {
  const sortedItems = React.useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return reverse ? timeB - timeA : timeA - timeB;
    });
    return sorted;
  }, [items, reverse]);

  if (orientation === 'horizontal') {
    return (
      <div
        className={cn(
          'flex overflow-x-auto gap-4 p-4',
          className
        )}
        role="timeline"
        aria-label="Timeline"
      >
        {sortedItems.map((item, index) => (
          <TimelineItemComponent
            key={item.id}
            item={item}
            index={index}
            total={sortedItems.length}
            orientation="horizontal"
            showTimestamps={showTimestamps}
            timestampFormat={timestampFormat}
            onClick={onItemClick}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn('space-y-4', className)}
      role="timeline"
      aria-label="Timeline"
    >
      {sortedItems.map((item, index) => (
        <TimelineItemComponent
          key={item.id}
          item={item}
          index={index}
          total={sortedItems.length}
          orientation="vertical"
          showTimestamps={showTimestamps}
          timestampFormat={timestampFormat}
          onClick={onItemClick}
        />
      ))}
    </div>
  );
}

// Compact timeline variant for sidebars
export function CompactTimeline({
  items,
  maxItems = 5,
  showTimestamps = true,
  className,
}: {
  items: TimelineItem[];
  maxItems?: number;
  showTimestamps?: boolean;
  className?: string;
}) {
  const displayItems = items.slice(0, maxItems);
  const remaining = items.length - maxItems;

  return (
    <div className={cn('space-y-3', className)}>
      {displayItems.map((item, index) => (
        <div
          key={item.id}
          className="flex items-start gap-3"
        >
          <div className="relative flex-shrink-0">
            <div className="absolute left-2 top-5 bottom-0 w-0.5 bg-muted" />
            <div
              className={cn(
                'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2',
                item.status === 'completed'
                  ? 'bg-green-500 border-green-500 text-white'
                  : item.status === 'active'
                    ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                    : item.status === 'error'
                      ? 'bg-red-500 border-red-500 text-white'
                      : 'bg-background border-muted text-muted-foreground'
              )}
            >
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {item.title}
            </p>
            {item.description && (
              <p className="text-xs text-muted-foreground truncate">
                {item.description}
              </p>
            )}
            {showTimestamps && (
              <time className="text-xs text-muted-foreground">
                {formatTimestamp(item.timestamp, 'relative')}
              </time>
            )}
          </div>
        </div>
      ))}
      {remaining > 0 && (
        <div className="text-center text-sm text-muted-foreground py-2">
          +{remaining} more items
        </div>
      )}
    </div>
  );
}