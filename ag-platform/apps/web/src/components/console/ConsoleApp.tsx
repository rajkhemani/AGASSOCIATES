// AG Console — banking-panel operations console (Editorial theme, from design handoff).
import { useState } from 'react';
import { LiveDot, MONO, SERIF } from '../ag/primitives';
import { Rail, TopBar } from './ConsoleShell';
import type { ConsoleRoute } from './ConsoleShell';
import { CasesScreen, CaseDetail, ClientPortal, DeedPreview, AgentsScreen } from './screens';
import { ConnectionIndicator } from './ConnectionIndicator';
import { LiveDashboard } from './LiveDashboard';
import '../../styles/ag-editorial.css';

const TITLES: Record<ConsoleRoute, [string, string]> = {
  dashboard: ['Operations', 'Today, Tuesday'],
  cases: ['Case Files', 'All files · banking panel'],
  detail: ['Case Detail', 'Live · in audit'],
  portal: ['Client Portal', 'Borrower-facing view'],
  deed: ['Deed Preview', 'MODT · v3'],
  agents: ['Workforce', 'Six agents · one chamber'],
};

interface ConsoleAppProps {
  publicView?: boolean;
}

export default function ConsoleApp({ publicView = false }: ConsoleAppProps) {
  const [route, setRoute] = useState<ConsoleRoute>('dashboard');

  const activeRoute = publicView && route !== 'dashboard' ? 'dashboard' : route;

  const screens: Record<ConsoleRoute, JSX.Element> = {
    dashboard: <LiveDashboard />,
    cases: <CasesScreen />,
    detail: <CaseDetail />,
    portal: <ClientPortal />,
    deed: <DeedPreview />,
    agents: <AgentsScreen />,
  };

  const [sub, title] = TITLES[activeRoute];

  const right = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <ConnectionIndicator />
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
      <Rail route={activeRoute} setRoute={publicView ? () => {} : setRoute} publicView={publicView} />
      <main style={{ flex: 1, minWidth: 0 }}>
        <TopBar title={title} subtitle={sub} right={right} />
        <div key={activeRoute}>{screens[activeRoute]}</div>
      </main>
    </div>
  );
}
