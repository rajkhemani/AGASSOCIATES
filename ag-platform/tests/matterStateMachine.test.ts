import { describe, expect, it } from 'vitest';
import { CaseStatus } from '../src/types/domain.ts';
import { assertMatterTransition, canTransitionMatter } from '../src/server/matterStateMachine.ts';

describe('Matter state machine', () => {
  it('allows the normal intake path', () => {
    expect(canTransitionMatter(CaseStatus.RECEIVED, CaseStatus.ASSIGNED)).toBe(true);
    expect(canTransitionMatter(CaseStatus.QUALITY_CHECK, CaseStatus.DELIVERED)).toBe(true);
  });

  it('rejects terminal-state mutation', () => {
    expect(canTransitionMatter(CaseStatus.CLOSED, CaseStatus.IN_PROGRESS)).toBe(false);
    expect(() => assertMatterTransition(CaseStatus.CLOSED, CaseStatus.IN_PROGRESS)).toThrow();
  });
});
