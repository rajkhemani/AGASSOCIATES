// AG Console shell — left rail nav + top bar (Editorial theme, from design handoff).
import type { ReactNode } from 'react';
import { AgLogo, LiveDot, MONO, SERIF, SANS } from '../ag/primitives';

export type ConsoleRoute = 'dashboard' | 'cases' | 'detail' | 'portal' | 'deed' | 'agents';

const NAV_ITEMS: { id: ConsoleRoute; label: string; sub: string }[] = [
  { id: 'dashboard', label: 'Dashboard', sub: 'Operations' },
  { id: 'cases', label: 'Case Files', sub: 'Live & closed' },
  { id: 'detail', label: 'Case Detail', sub: 'AG-26-0418' },
  { id: 'portal', label: 'Client Portal', sub: 'Borrower view' },
  { id: 'deed', label: 'Deed Preview', sub: 'MODT draft' },
  { id: 'agents', label: 'Workforce', sub: '6 agents' },
];

const railLabel = {
  fontFamily: MONO,
  fontSize: 10,
  letterSpacing: '.22em',
  textTransform: 'uppercase' as const,
  color: 'var(--muted)',
};

export function Rail({ route, setRoute, publicView }: { route: ConsoleRoute; setRoute: (r: ConsoleRoute) => void; publicView?: boolean }) {
  return (
    <aside
      style={{
        width: 248,
        flexShrink: 0,
        padding: '28px 0',
        borderRight: '1px solid var(--line)',
        background: 'var(--paper)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'auto',
      }}
    >
      <div style={{ padding: '0 22px 24px', borderBottom: '1px solid var(--line)' }}>
        <AgLogo />
        <div style={{ ...railLabel, marginTop: 10, letterSpacing: '.18em' }}>Banking Panel · Thane MH</div>
      </div>

        <nav style={{ padding: '18px 14px' }} aria-label="Console">
        <div style={{ ...railLabel, padding: '0 8px 10px' }}>Console</div>
        {NAV_ITEMS.filter(it => !publicView || it.id === 'dashboard').map((it) => {
          const active = route === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setRoute(it.id)}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 14px',
                margin: '2px 0',
                border: 0,
                borderRadius: 6,
                cursor: 'pointer',
                background: active ? 'rgba(154,107,30,.1)' : 'transparent',
                color: active ? 'var(--ink)' : 'var(--ink-2)',
                fontFamily: SANS,
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'background .15s',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'rgba(26,31,46,.04)';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ display: 'block', fontFamily: SERIF, fontSize: 15, fontWeight: 500 }}>{it.label}</span>
              <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{it.sub}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '14px 22px', marginTop: 18, borderTop: '1px solid var(--line)' }}>
        <div style={{ ...railLabel, marginBottom: 12 }}>Status</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 6 }}>
          <LiveDot /> <span>vLLM · Qwen 2.5 · 7B</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 6 }}>
          <LiveDot /> <span>pgvector · 768d</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <LiveDot color="var(--accent)" /> <span>IGR-MH · Slot booked</span>
        </div>
      </div>
    </aside>
  );
}

export function TopBar({ title, subtitle, right }: { title: string; subtitle: string; right?: ReactNode }) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        padding: '28px 36px 24px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--bg)',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10.5,
            letterSpacing: '.24em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: 8,
          }}
        >
          {subtitle}
        </div>
        <h1 style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 340, letterSpacing: '-.02em', margin: 0 }}>{title}</h1>
      </div>
      <div>{right}</div>
    </header>
  );
}
