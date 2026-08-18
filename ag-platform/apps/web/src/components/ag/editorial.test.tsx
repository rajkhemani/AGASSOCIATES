// Render smoke tests for the Editorial-theme pages (design handoff implementation).
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import EditorialLanding from '../home/EditorialLanding';
import ConsoleApp from '../console/ConsoleApp';

describe('EditorialLanding', () => {
  it('renders all landing sections', () => {
    const html = renderToString(
      <MemoryRouter>
        <EditorialLanding />
      </MemoryRouter>
    );
    expect(html).toContain('AG Associates');
    expect(html).toContain('without');
    expect(html).toContain('id="manifesto"');
    expect(html).toContain('id="workforce"');
    expect(html).toContain('id="workflow"');
    expect(html).toContain('id="flywheel"');
    // all six agents present
    for (const name of ['Aisha', 'Vyasa', 'Drafter', 'Auditor', 'Executor', 'Accountant']) {
      expect(html).toContain(name);
    }
  });
});

describe('ConsoleApp', () => {
  it('renders the dashboard with rail navigation', () => {
    const html = renderToString(
      <MemoryRouter>
        <ConsoleApp />
      </MemoryRouter>
    );
    expect(html).toContain('Operations');
    expect(html).toContain('Live cases on the desk');
    expect(html).toContain('AG-26-0418');
    expect(html).toContain('Banking Panel · Thane MH');
    // rail entries for all six screens
    for (const label of ['Dashboard', 'Case Files', 'Case Detail', 'Client Portal', 'Deed Preview', 'Workforce']) {
      expect(html).toContain(label);
    }
  });
});
