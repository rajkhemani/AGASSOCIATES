import { describe, expect, it } from 'vitest';
import { calculateDeadlineRisk } from '../src/server/deadlineRisk.ts';

const now = new Date('2026-08-20T10:00:00.000Z');

describe('calculateDeadlineRisk', () => {
  it('classifies missing deadlines without inventing a deadline', () => {
    expect(calculateDeadlineRisk({ deadline: null, warningHours: 24, now })).toEqual({
      level: 'missing',
      deadline: null,
      hoursUntilDeadline: null,
      overdueHours: 0,
    });
  });

  it('uses the supplied warning window deterministically', () => {
    const result = calculateDeadlineRisk({
      deadline: '2026-08-21T10:00:00.000Z',
      warningHours: 24,
      now,
    });
    expect(result.level).toBe('at_risk');
    expect(result.hoursUntilDeadline).toBe(24);
    expect(result.overdueHours).toBe(0);
  });

  it('reports overdue hours for breached deadlines', () => {
    const result = calculateDeadlineRisk({
      deadline: '2026-08-20T07:30:00.000Z',
      warningHours: 24,
      now,
    });
    expect(result.level).toBe('breached');
    expect(result.overdueHours).toBe(2.5);
  });

  it('rejects invalid warning windows', () => {
    expect(() => calculateDeadlineRisk({ deadline: now, warningHours: -1, now })).toThrow();
  });
});
