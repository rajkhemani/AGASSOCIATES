// Shared primitives for the AG Editorial design (landing + console).
import type { CSSProperties, ReactNode } from 'react';

export const MONO = "'IBM Plex Mono', monospace";
export const SERIF = "'Fraunces', serif";
export const SANS = "'IBM Plex Sans', sans-serif";

export function Eyebrow({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: MONO,
        fontSize: 10.5,
        letterSpacing: '.24em',
        textTransform: 'uppercase',
        color: color || 'var(--accent)',
      }}
    >
      <span
        style={{ display: 'inline-block', width: 18, height: 1, background: 'currentColor', opacity: 0.6 }}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

export function LiveDot({ color = 'var(--green)' }: { color?: string }) {
  const dot: CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: 99,
    background: color,
    animation: 'ag-pulse-dot 1.6s ease-in-out infinite',
  };
  return (
    <span style={{ position: 'relative', width: 8, height: 8, display: 'inline-block' }} aria-hidden="true">
      <span style={dot} />
      <span style={{ ...dot, inset: -4, opacity: 0.25 }} />
    </span>
  );
}

export type PillTone =
  | 'live'
  | 'closed'
  | 'flagged'
  | 'urgent'
  | 'standard'
  | 'info'
  | 'good'
  | 'warn';

const PILL_TONES: Record<PillTone, { bg: string; col: string }> = {
  live: { bg: 'rgba(61,122,74,.12)', col: 'var(--green)' },
  closed: { bg: 'rgba(26,31,46,.06)', col: 'var(--muted)' },
  flagged: { bg: 'rgba(168,57,43,.1)', col: 'var(--red)' },
  urgent: { bg: 'rgba(168,57,43,.1)', col: 'var(--red)' },
  standard: { bg: 'rgba(26,31,46,.05)', col: 'var(--muted)' },
  info: { bg: 'rgba(58,91,138,.1)', col: 'var(--blue)' },
  good: { bg: 'rgba(61,122,74,.12)', col: 'var(--green)' },
  warn: { bg: 'rgba(168,57,43,.1)', col: 'var(--red)' },
};

export function Pill({ children, tone = 'standard' }: { children: ReactNode; tone?: PillTone }) {
  const c = PILL_TONES[tone] || PILL_TONES.standard;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 9px',
        borderRadius: 99,
        fontFamily: MONO,
        fontSize: 10,
        letterSpacing: '.12em',
        textTransform: 'uppercase',
        background: c.bg,
        color: c.col,
      }}
    >
      {children}
    </span>
  );
}

export function AgLogo() {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          width: 30,
          height: 30,
          display: 'grid',
          placeItems: 'center',
          border: '1px solid var(--accent)',
          color: 'var(--accent)',
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 13,
          letterSpacing: '-.02em',
          borderRadius: 4,
        }}
        aria-hidden="true"
      >
        AG
      </span>
      <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500 }}>
        <em style={{ fontStyle: 'italic' }}>AG&nbsp;Associates</em>
      </span>
    </span>
  );
}
