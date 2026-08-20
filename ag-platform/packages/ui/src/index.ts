/**
 * @ag/ui — Unified Component Library
 *
 * A comprehensive component library built on top of Radix UI primitives
 * and styled with Tailwind CSS, consuming design tokens from @ag/design-tokens.
 */

// Core utilities
export { cn } from './utils/cn';

// Hooks
export * from './hooks';

// Components
export { Button } from './components/button';
export { Input } from './components/input';
export * from './components/select';
export * from './components/table';
export * from './components/modal';
export { Badge } from './components/badge';
export * from './components/card';
export * from './components/skeleton';
export * from './components/empty-state';
export * from './components/error-state';
export * from './components/command-palette';
export * from './components/data-grid';
export * from './components/split-view';
export * from './components/timeline';
export * from './components/workflow-stepper';
export * from './components/approval-card';
export * from './components/action-status-badge';
export * from './components/dropdown-menu';

// Re-export types
export type { ThemeMode, ColorScheme } from './hooks/use-theme';
export type { ActionStatus, ActionType } from './components/action-status-badge';
export type { ApprovalStatus } from './components/approval-card';
export type { TimelineItem, TimelineItemStatus } from './components/timeline';
export type { WorkflowStep, StepStatus } from './components/workflow-stepper';