'use client';

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
  ThHTMLAttributes,
  TdHTMLAttributes,
} from 'react';

// ─── Types ───────────────────────────────────────────────────────────

type ThemeVariant = 'glass' | 'editorial' | 'default';

// ─── cn helper ───────────────────────────────────────────────────────

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

// ─── Button ──────────────────────────────────────────────────────────

type ButtonVariant = 'default' | 'outline' | 'ghost';

export function Button({
  children,
  variant = 'default',
  theme = 'default',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  theme?: ThemeVariant;
}) {
  const base =
    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50';

  const variants: Record<ButtonVariant, string> = {
    default: 'bg-indigo-700 text-white hover:bg-indigo-800',
    outline: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700',
    ghost: 'hover:bg-slate-100 text-slate-600',
  };

  const themeClasses: Record<ThemeVariant, string> = {
    glass:
      'backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 hover:border-white/30 active:scale-95',
    editorial:
      'border border-[var(--line)] hover:bg-[rgba(154,107,30,0.06)] text-[var(--ink)]',
    default: '',
  };

  return (
    <button
      className={cn(base, variants[variant], themeClasses[theme], className)}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── Card / Panel ────────────────────────────────────────────────────

type CardProps = { children: ReactNode; className?: string; theme?: ThemeVariant };

export function Card({ children, className = '', theme = 'default' }: CardProps) {
  const themes: Record<ThemeVariant, string> = {
    glass: 'backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl shadow-lg',
    editorial: 'border border-[var(--line)] rounded-[6px] bg-[var(--paper)]',
    default: 'rounded-lg border border-slate-200 bg-white shadow-sm',
  };

  return <div className={cn(themes[theme], className)}>{children}</div>;
}

export function Panel({ children, className = '', theme = 'default' }: CardProps) {
  const themes: Record<ThemeVariant, string> = {
    glass:
      'backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl',
    editorial:
      'border border-[var(--line)] rounded-[6px] bg-[var(--paper)] p-6',
    default: 'rounded-xl border border-slate-200 bg-white p-6 shadow-sm',
  };

  return <div className={cn(themes[theme], className)}>{children}</div>;
}

// ─── Input ───────────────────────────────────────────────────────────

export function Input({
  className = '',
  theme = 'default',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { theme?: ThemeVariant }) {
  const themes: Record<ThemeVariant, string> = {
    glass:
      'w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200',
    editorial:
      'w-full px-[14px] py-[10px] border border-[var(--line)] rounded-[6px] bg-[var(--paper)] text-[var(--ink)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30',
    default:
      'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500',
  };

  return <input className={cn(themes[theme], className)} {...props} />;
}

// ─── Badge / Pill ────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'live' | 'closed' | 'flagged';

export function Badge({
  children,
  variant = 'default',
  theme = 'default',
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  theme?: ThemeVariant;
}) {
  const glassVariants: Record<string, string> = {
    default: 'bg-white/10 border border-white/20 text-white/80',
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    danger: 'bg-red-500/20 text-red-400 border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    live: 'bg-green-500/20 text-green-400 border-green-500/30',
    closed: 'bg-white/10 text-white/50 border-white/10',
    flagged: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const editorialVariants: Record<string, string> = {
    default: 'bg-[rgba(26,31,46,0.05)] text-[var(--muted)]',
    success: 'bg-[rgba(61,122,74,0.12)] text-[var(--green)]',
    warning: 'bg-[rgba(168,57,43,0.1)] text-[var(--red)]',
    danger: 'bg-[rgba(168,57,43,0.1)] text-[var(--red)]',
    info: 'bg-[rgba(58,91,138,0.1)] text-[var(--blue)]',
    live: 'bg-[rgba(61,122,74,0.12)] text-[var(--green)]',
    closed: 'bg-[rgba(26,31,46,0.06)] text-[var(--muted)]',
    flagged: 'bg-[rgba(168,57,43,0.1)] text-[var(--red)]',
  };

  const defaultVariants: Record<string, string> = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    live: 'bg-green-100 text-green-700',
    closed: 'bg-slate-100 text-slate-500',
    flagged: 'bg-red-100 text-red-700',
  };

  const variantMap =
    theme === 'glass'
      ? glassVariants
      : theme === 'editorial'
        ? editorialVariants
        : defaultVariants;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantMap[variant] || variantMap.default,
      )}
    >
      {children}
    </span>
  );
}

// ─── Table ───────────────────────────────────────────────────────────

export function Table({
  children,
  className = '',
  theme = 'default',
  ...props
}: TableHTMLAttributes<HTMLTableElement> & { theme?: ThemeVariant }) {
  const themes: Record<ThemeVariant, string> = {
    glass: 'w-full text-left border-collapse',
    editorial: 'w-full text-left border-collapse',
    default: 'w-full text-left border-collapse',
  };

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border',
        theme === 'glass'
          ? 'backdrop-blur-xl bg-white/5 border border-white/10'
          : theme === 'editorial'
            ? 'border border-[var(--line)] bg-[var(--paper)]'
            : 'border border-slate-200 bg-white shadow-sm',
        className,
      )}
    >
      <table className={themes[theme]} {...props}>
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  className = '',
  ...props
}: ThHTMLAttributes<HTMLTableHeaderCellElement>) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200',
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className = '',
  ...props
}: TdHTMLAttributes<HTMLTableDataCellElement>) {
  return (
    <td
      className={cn('px-4 py-3 text-sm text-slate-700 border-b border-slate-100', className)}
      {...props}
    >
      {children}
    </td>
  );
}

// ─── Modal / Drawer ──────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  children,
  title,
  theme = 'default',
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  theme?: ThemeVariant;
}) {
  if (!open) return null;

  const themes: Record<ThemeVariant, string> = {
    glass:
      'backdrop-blur-xl bg-black/60 border border-white/10 rounded-2xl shadow-2xl',
    editorial:
      'border border-[var(--line)] bg-[var(--paper)] rounded-[12px] shadow-xl',
    default:
      'rounded-xl border border-slate-200 bg-white shadow-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={cn('relative w-full max-w-lg p-6', themes[theme])}>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-white/50 hover:text-white transition-colors text-xl leading-none"
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  children,
  title,
  side = 'right',
  theme = 'default',
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  side?: 'left' | 'right';
  theme?: ThemeVariant;
}) {
  if (!open) return null;

  const themes: Record<ThemeVariant, string> = {
    glass:
      'backdrop-blur-xl bg-black/80 border-l border-white/10 shadow-2xl',
    editorial:
      'border-l border-[var(--line)] bg-[var(--paper)]',
    default:
      'border-l border-slate-200 bg-white shadow-xl',
  };

  const sideClass = side === 'left' ? 'left-0' : 'right-0';

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed top-0 h-full w-96 overflow-y-auto p-6',
          sideClass,
          themes[theme],
        )}
      >
        {title && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-white/50 hover:text-white transition-colors text-xl leading-none"
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
