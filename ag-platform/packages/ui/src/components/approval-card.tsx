'use client';

import * as React from 'react';
import { cn } from '../utils/cn';
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2, User, FileText, ArrowRight, MoreHorizontal, ExternalLink, Download, MessageSquare, History } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './dropdown-menu';

export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'changes_requested'
  | 'expired'
  | 'cancelled';

export interface ApprovalAction {
  id: string;
  label: string;
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

export interface ApprovalComment {
  id: string;
  author: {
    name: string;
    avatar?: string;
    role?: string;
  };
  content: string;
  timestamp: Date | string;
  type: 'comment' | 'approval' | 'rejection' | 'changes_requested';
}

export interface ApprovalCardProps {
  id: string;
  title: string;
  description?: string;
  status: ApprovalStatus;
  requester: {
    name: string;
    avatar?: string;
    role?: string;
    email?: string;
  };
  createdAt: Date | string;
  updatedAt?: Date | string;
  dueDate?: Date | string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  tags?: string[];
  documentUrl?: string;
  documentName?: string;
  actions?: ApprovalAction[];
  comments?: ApprovalComment[];
  showComments?: boolean;
  maxComments?: number;
  onAction?: (actionId: string, approvalId: string) => void;
  onViewDocument?: () => void;
  onViewHistory?: () => void;
  className?: string;
  compact?: boolean;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    label: 'Pending Review',
    description: 'Awaiting approval',
  },
  approved: {
    icon: CheckCircle,
    color: 'bg-green-500/10 text-green-700 border-green-500/20',
    label: 'Approved',
    description: 'Approved and processed',
  },
  rejected: {
    icon: XCircle,
    color: 'bg-red-500/10 text-red-700 border-red-500/20',
    label: 'Rejected',
    description: 'Request was rejected',
  },
  changes_requested: {
    icon: AlertCircle,
    color: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
    label: 'Changes Requested',
    description: 'Modifications needed',
  },
  expired: {
    icon: Clock,
    color: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
    label: 'Expired',
    description: 'Approval period ended',
  },
  cancelled: {
    icon: XCircle,
    color: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
    label: 'Cancelled',
    description: 'Request was cancelled',
  },
};

const priorityConfig = {
  low: { color: 'bg-blue-500/10 text-blue-700', label: 'Low' },
  medium: { color: 'bg-yellow-500/10 text-yellow-700', label: 'Medium' },
  high: { color: 'bg-orange-500/10 text-orange-700', label: 'High' },
  urgent: { color: 'bg-red-500/10 text-red-700', label: 'Urgent' },
};

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

export function ApprovalCard({
  id,
  title,
  description,
  status,
  requester,
  createdAt,
  updatedAt,
  dueDate,
  priority = 'medium',
  category,
  tags = [],
  documentUrl,
  documentName,
  actions = [],
  comments = [],
  showComments = true,
  maxComments = 3,
  onAction,
  onViewDocument,
  onViewHistory,
  className,
  compact = false,
}: ApprovalCardProps) {
  const config = statusConfig[status];
  const priorityCfg = priorityConfig[priority];
  const StatusIcon = config.icon;
  const [expandedComments, setExpandedComments] = React.useState(false);

  const displayComments = expandedComments || comments.length <= maxComments
    ? comments
    : comments.slice(0, maxComments);

  const handleActionClick = (action: ApprovalAction) => {
    if (action.requiresConfirmation && action.confirmationMessage) {
      if (!window.confirm(action.confirmationMessage)) return;
    }
    onAction?.(action.id, id);
  };

  const defaultActions: ApprovalAction[] = [
    {
      id: 'approve',
      label: 'Approve',
      variant: 'default',
      icon: <CheckCircle className="h-4 w-4" />,
      onClick: () => handleActionClick({ id: 'approve', label: 'Approve', variant: 'default', onClick: () => {} }),
      disabled: status !== 'pending',
    },
    {
      id: 'reject',
      label: 'Reject',
      variant: 'destructive',
      icon: <XCircle className="h-4 w-4" />,
      onClick: () => handleActionClick({ id: 'reject', label: 'Reject', variant: 'destructive', onClick: () => {} }),
      disabled: status !== 'pending',
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to reject this request?',
    },
    {
      id: 'request_changes',
      label: 'Request Changes',
      variant: 'outline',
      icon: <AlertCircle className="h-4 w-4" />,
      onClick: () => handleActionClick({ id: 'request_changes', label: 'Request Changes', variant: 'outline', onClick: () => {} }),
      disabled: status !== 'pending',
    },
  ];

  const allActions = [...actions, ...defaultActions.filter(a => !actions.some(existing => existing.id === a.id))];

  if (compact) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border',
                  config.color
                )}
              >
                <StatusIcon className="h-5 w-5" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="font-medium text-sm text-foreground truncate">
                    {title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={config.color}>
                      {config.label}
                    </Badge>
                    {priority !== 'medium' && (
                      <Badge variant="outline" className={priorityCfg.color}>
                        {priorityCfg.label}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {allActions.slice(0, 2).map((action) => (
                    <Button
                      key={action.id}
                      variant={action.variant}
                      size="sm"
                      onClick={() => handleActionClick(action)}
                      disabled={action.disabled}
                    >
                      {action.icon}
                      <span className="hidden sm:inline">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
              {description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                  {description}
                </p>
              )}
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {requester.name}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(createdAt)}
                </span>
                {dueDate && (
                  <span className={cn(
                    'flex items-center gap-1',
                    new Date(dueDate) < new Date() && status === 'pending'
                      ? 'text-red-500'
                      : ''
                  )}>
                    <Clock className="h-3 w-3" />
                    Due: {formatDate(dueDate)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border',
                  config.color
                )}
              >
                <StatusIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={config.color}>
                    {config.label}
                  </Badge>
                  {priority !== 'medium' && (
                    <Badge variant="outline" className={priorityCfg.color}>
                      {priorityCfg.label}
                    </Badge>
                  )}
                  {category && (
                    <Badge variant="secondary">{category}</Badge>
                  )}
                </div>
              </div>
            </div>

            {description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-right text-xs text-muted-foreground">
              <div>Created: {formatDate(createdAt)}</div>
              {updatedAt && (
                <div>Updated: {formatRelativeTime(updatedAt)}</div>
              )}
              {dueDate && (
                <div className={cn(
                  'font-medium',
                  new Date(dueDate) < new Date() && status === 'pending'
                    ? 'text-red-500'
                    : ''
                )}>
                  Due: {formatDate(dueDate)}
                </div>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {documentUrl && (
                  <DropdownMenuItem onClick={onViewDocument}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Document
                  </DropdownMenuItem>
                )}
                {documentUrl && (
                  <DropdownMenuItem>
                    <Download className="mr-2 h-4 w-4" />
                    Download Document
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onViewHistory}>
                  <History className="mr-2 h-4 w-4" />
                  View History
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setExpandedComments(!expandedComments)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {expandedComments ? 'Hide Comments' : 'Show Comments'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Requester info */}
        <div className="flex items-center gap-3 pt-3 border-t">
          <div className="flex items-center gap-2">
            {requester.avatar ? (
              <img
                src={requester.avatar}
                alt={requester.name}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium">{requester.name}</p>
              <p className="text-xs text-muted-foreground">
                {requester.role || 'Requester'}
                {requester.email && ` • ${requester.email}`}
              </p>
            </div>
          </div>

          {documentUrl && documentName && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewDocument}
              className="ml-auto shrink-0"
            >
              <FileText className="mr-2 h-4 w-4" />
              {documentName}
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Actions */}
      {(status === 'pending' || actions.length > 0) && (
        <div className="border-t px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {allActions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant}
                size="sm"
                onClick={() => handleActionClick(action)}
                disabled={action.disabled || action.loading}
                loading={action.loading}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      {showComments && comments.length > 0 && (
        <div className="border-t">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium">Comments ({comments.length})</h5>
              {comments.length > maxComments && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedComments(!expandedComments)}
                >
                  {expandedComments ? 'Show Less' : `Show ${comments.length - maxComments} More`}
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {displayComments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex gap-3"
                >
                  <div className="flex-shrink-0">
                    {comment.author.avatar ? (
                      <img
                        src={comment.author.avatar}
                        alt={comment.author.name}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{comment.author.name}</span>
                      {comment.author.role && (
                        <Badge variant="secondary" className="text-xs">
                          {comment.author.role}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(comment.timestamp)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-foreground">{comment.content}</p>
                    {comment.type !== 'comment' && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {comment.type.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </div>
      )}
    </Card>
  );
}