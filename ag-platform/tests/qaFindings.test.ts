import { describe, expect, it } from 'vitest';
import { normalizeQAFinding } from '../src/server/qaFindings.ts';

describe('QA finding foundation', () => {
  it('normalizes rule findings for persistence', () => {
    expect(normalizeQAFinding({
      orgId: 'org',
      caseId: 'case',
      code: '  MISSING_DOC  ',
      title: '  Missing document ',
      severity: 'high',
    })).toMatchObject({
      code: 'MISSING_DOC',
      title: 'Missing document',
      source: 'rule',
      evidence: {},
    });
  });

  it('requires a stable code and title', () => {
    expect(() => normalizeQAFinding({
      orgId: 'org',
      caseId: 'case',
      code: ' ',
      title: 'Finding',
      severity: 'low',
    })).toThrow();
  });
});
