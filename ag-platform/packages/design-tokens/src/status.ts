/**
 * Status Tokens — Semantic status system
 *
 * Provides a unified status token system that works across all themes.
 * Uses the color.role.state pattern for consistent status representation.
 */

import type { SemanticColorTokens } from './colors';

// Status types used across the application
export type StatusType =
  | 'pending'
  | 'active'
  | 'completed'
  | 'error'
  | 'warning'
  | 'info'
  | 'success'
  | 'neutral'
  | 'draft'
  | 'review'
  | 'approved'
  | 'rejected'
  | 'archived'
  | 'cancelled'
  | 'expired'
  | 'processing'
  | 'queued'
  | 'failed'
  | 'blocked';

// Status variant for visual treatment
export type StatusVariant = 'solid' | 'outline' | 'soft' | 'ghost';

// Status size
export type StatusSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Base status configuration (theme-agnostic structure)
export const baseStatusConfig = {
  // Core workflow statuses
  pending: {
    label: 'Pending',
    description: 'Awaiting action or review',
    icon: 'clock',
    order: 1,
  },
  active: {
    label: 'Active',
    description: 'Currently in progress',
    icon: 'activity',
    order: 2,
  },
  processing: {
    label: 'Processing',
    description: 'Being processed',
    icon: 'loader',
    order: 3,
  },
  queued: {
    label: 'Queued',
    description: 'Waiting in queue',
    icon: 'list',
    order: 4,
  },
  review: {
    label: 'Under Review',
    description: 'Pending review or approval',
    icon: 'eye',
    order: 5,
  },
  approved: {
    label: 'Approved',
    description: 'Approved and ready',
    icon: 'check-circle',
    order: 6,
  },
  completed: {
    label: 'Completed',
    description: 'Successfully finished',
    icon: 'check-circle-2',
    order: 7,
  },
  // Error/problem statuses
  error: {
    label: 'Error',
    description: 'An error occurred',
    icon: 'alert-circle',
    order: 8,
  },
  failed: {
    label: 'Failed',
    description: 'Process failed',
    icon: 'x-circle',
    order: 9,
  },
  blocked: {
    label: 'Blocked',
    description: 'Blocked by dependency',
    icon: 'shield-alert',
    order: 10,
  },
  rejected: {
    label: 'Rejected',
    description: 'Not approved',
    icon: 'x-circle',
    order: 11,
  },
  cancelled: {
    label: 'Cancelled',
    description: 'Cancelled by user',
    icon: 'ban',
    order: 12,
  },
  expired: {
    label: 'Expired',
    description: 'Past validity period',
    icon: 'clock-alert',
    order: 13,
  },
  // Neutral/informational statuses
  draft: {
    label: 'Draft',
    description: 'Work in progress, not submitted',
    icon: 'file-text',
    order: 14,
  },
  info: {
    label: 'Information',
    description: 'Informational status',
    icon: 'info',
    order: 15,
  },
  warning: {
    label: 'Warning',
    description: 'Attention required',
    icon: 'alert-triangle',
    order: 16,
  },
  neutral: {
    label: 'Neutral',
    description: 'No specific status',
    icon: 'minus-circle',
    order: 17,
  },
  archived: {
    label: 'Archived',
    description: 'Moved to archive',
    icon: 'archive',
    order: 18,
  },
} as const;

// Semantic status tokens derived from color tokens
export function createStatusTokens(colors: SemanticColorTokens['status']) {
  return {
    // Map base statuses to color roles
    pending: colors.pending,
    active: colors.active,
    processing: colors.info,
    queued: colors.info,
    review: colors.warning,
    approved: colors.success,
    completed: colors.completed,
    error: colors.error,
    failed: colors.error,
    blocked: colors.warning,
    rejected: colors.error,
    cancelled: colors.neutral,
    expired: colors.warning,
    draft: colors.neutral,
    info: colors.info,
    warning: colors.warning,
    neutral: colors.neutral,
    archived: colors.neutral,
    success: colors.success,
  } as const;
}

// Status display configurations per variant
export const statusVariants = {
  solid: {
    // Full background color
    bg: 'var(--ag-color-status-{status}-bg)',
    text: 'var(--ag-color-status-{status}-text)',
    border: 'var(--ag-color-status-{status}-border)',
  },
  outline: {
    // Transparent background, colored border and text
    bg: 'transparent',
    text: 'var(--ag-color-status-{status}-text)',
    border: 'var(--ag-color-status-{status}-border)',
  },
  soft: {
    // Subtle background, colored text
    bg: 'var(--ag-color-status-{status}-bg)',
    text: 'var(--ag-color-status-{status}-text)',
    border: 'transparent',
  },
  ghost: {
    // Minimal - only text color
    bg: 'transparent',
    text: 'var(--ag-color-status-{status}-text)',
    border: 'transparent',
  },
} as const;

// Status size configurations
export const statusSizes = {
  xs: {
    padding: '0.125rem 0.5rem',   // 2px 8px
    fontSize: '0.625rem',          // 10px
    gap: '0.25rem',                // 4px
    iconSize: '0.625rem',          // 10px
    borderRadius: '9999px',
  },
  sm: {
    padding: '0.25rem 0.625rem',   // 4px 10px
    fontSize: '0.75rem',           // 12px
    gap: '0.375rem',               // 6px
    iconSize: '0.75rem',           // 12px
    borderRadius: '9999px',
  },
  md: {
    padding: '0.375rem 0.75rem',   // 6px 12px
    fontSize: '0.875rem',          // 14px
    gap: '0.5rem',                 // 8px
    iconSize: '1rem',              // 16px
    borderRadius: '9999px',
  },
  lg: {
    padding: '0.5rem 1rem',        // 8px 16px
    fontSize: '1rem',              // 16px
    gap: '0.5rem',                 // 8px
    iconSize: '1.125rem',          // 18px
    borderRadius: '9999px',
  },
  xl: {
    padding: '0.75rem 1.5rem',     // 12px 24px
    fontSize: '1.125rem',          // 18px
    gap: '0.75rem',                // 12px
    iconSize: '1.25rem',           // 20px
    borderRadius: '9999px',
  },
} as const;

// Status icon mappings (Lucide icon names)
export const statusIcons = {
  pending: 'clock',
  active: 'activity',
  processing: 'loader',
  queued: 'list',
  review: 'eye',
  approved: 'check-circle',
  completed: 'check-circle-2',
  error: 'alert-circle',
  failed: 'x-circle',
  blocked: 'shield-alert',
  rejected: 'x-circle',
  cancelled: 'ban',
  expired: 'clock-alert',
  draft: 'file-text',
  info: 'info',
  warning: 'alert-triangle',
  neutral: 'minus-circle',
  archived: 'archive',
  success: 'check-circle',
} as const;

// Legal/workflow-specific status groups
export const statusGroups = {
  // Case lifecycle statuses
  case: [
    'draft',
    'pending',
    'review',
    'active',
    'processing',
    'approved',
    'completed',
    'rejected',
    'cancelled',
    'archived',
  ],
  // Document statuses
  document: [
    'draft',
    'pending',
    'review',
    'approved',
    'rejected',
    'expired',
    'archived',
  ],
  // Task statuses
  task: [
    'pending',
    'queued',
    'active',
    'processing',
    'blocked',
    'completed',
    'failed',
    'cancelled',
  ],
  // Payment/financial statuses
  payment: [
    'pending',
    'processing',
    'completed',
    'failed',
    'refunded',
    'cancelled',
    'expired',
  ],
  // Communication statuses
  communication: [
    'draft',
    'queued',
    'processing',
    'sent',
    'delivered',
    'read',
    'failed',
    'bounced',
  ],
  // Approval workflow statuses
  approval: [
    'pending',
    'review',
    'approved',
    'rejected',
    'cancelled',
  ],
} as const;

// Status priority for sorting (higher = more urgent)
export const statusPriority = {
  error: 100,
  failed: 100,
  blocked: 90,
  expired: 80,
  rejected: 70,
  warning: 60,
  review: 50,
  processing: 40,
  queued: 30,
  active: 20,
  pending: 10,
  approved: 5,
  completed: 5,
  success: 5,
  info: 3,
  draft: 2,
  neutral: 1,
  cancelled: 0,
  archived: 0,
} as const;

export type StatusTokens = {
  config: typeof baseStatusConfig;
  variants: typeof statusVariants;
  sizes: typeof statusSizes;
  icons: typeof statusIcons;
  groups: typeof statusGroups;
  priority: typeof statusPriority;
  create: typeof createStatusTokens;
};

export const statusTokens: StatusTokens = {
  config: baseStatusConfig,
  variants: statusVariants,
  sizes: statusSizes,
  icons: statusIcons,
  groups: statusGroups,
  priority: statusPriority,
  create: createStatusTokens,
} as const;

export type StatusTypeKey = keyof typeof baseStatusConfig;
export type StatusVariantKey = keyof typeof statusVariants;
export type StatusSizeKey = keyof typeof statusSizes;