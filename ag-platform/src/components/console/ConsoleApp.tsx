// AG Console — banking-panel operations console (Editorial theme, from design handoff).
import { useState } from 'react';
import { LiveDot, MONO, SERIF } from '../ag/primitives';
import { Rail, TopBar } from './ConsoleShell';
import type { ConsoleRoute } from './ConsoleShell';
import { Dashboard, CasesScreen, CaseDetail, ClientPortal, DeedPreview, AgentsScreen } from './screens';
import '../../styles/ag-editorial.css';

const TITLES: Record<ConsoleRoute, [string, string]> = {
  dashboard: ['Operations', 'Today, Tuesday'],
  cases: ['Case Files', 'All files · banking panel'],
  detail: ['Case Detail', 'Live · in audit'],
  portal: ['Client Portal', 'Borrower-facing view'],
  deed: ['Deed Preview', 'MODT · v3'],
  agents: ['Workforce', 'Six agents · one chamber'],
};

export default function ConsoleApp() {
  const [route, setRoute] = useState<ConsoleRoute>('dashboard');

  const screens: Record<ConsoleRoute, JSX.Element> = {
    dashboard: <Dashboard />,
    cases: <CasesScreen />,
    detail: <CaseDetail />,
    portal: <ClientPortal />,
    deed: <DeedPreview />,
    agents: <AgentsScreen />,
  };

  const [sub, title] = TITLES[route];

  const right = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)', fontFamily: MONO }}>
        <LiveDot /> 7 LIVE · 3 IDLE
      </span>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'var(--ink)',
          color: 'var(--paper)',
          display: 'grid',
          placeItems: 'center',
          fontFamily: SERIF,
          fontSize: 14,
          fontStyle: 'italic',
        }}
        aria-hidden="true"
      >
        AG
      </div>
    </div>
  );

  return (
    <div className="ag-editorial" style={{ display: 'flex', minHeight: '100vh' }}>
      <Rail route={route} setRoute={setRoute} />
      <main style={{ flex: 1, minWidth: 0 }}>
        <TopBar title={title} subtitle={sub} right={right} />
        <div key={route}>{screens[route]}</div>
      </main>
    </div>
  );
}
