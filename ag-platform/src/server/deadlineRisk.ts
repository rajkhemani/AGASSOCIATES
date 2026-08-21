export type DeadlineRiskLevel = 'missing' | 'on_track' | 'at_risk' | 'breached';

export interface DeadlineRiskInput {
  deadline: Date | string | null | undefined;
  warningHours: number;
  now?: Date;
}

export interface DeadlineRisk {
  level: DeadlineRiskLevel;
  deadline: Date | null;
  hoursUntilDeadline: number | null;
  overdueHours: number;
}

/**
 * Classifies a deadline using only the supplied deadline, clock, and warning window.
 * It intentionally does not apply statutory or business-calendar assumptions.
 */
export function calculateDeadlineRisk(input: DeadlineRiskInput): DeadlineRisk {
  if (!Number.isFinite(input.warningHours) || input.warningHours < 0) {
    throw new Error('warningHours must be a non-negative finite number');
  }

  if (input.deadline === null || input.deadline === undefined) {
    return { level: 'missing', deadline: null, hoursUntilDeadline: null, overdueHours: 0 };
  }

  const deadline = input.deadline instanceof Date ? new Date(input.deadline) : new Date(input.deadline);
  const now = input.now ? new Date(input.now) : new Date();
  if (Number.isNaN(deadline.getTime()) || Number.isNaN(now.getTime())) {
    throw new Error('deadline and now must be valid dates');
  }

  const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / 3_600_000;
  const level =
    hoursUntilDeadline <= 0
      ? 'breached'
      : hoursUntilDeadline <= input.warningHours
        ? 'at_risk'
        : 'on_track';

  return {
    level,
    deadline,
    hoursUntilDeadline,
    overdueHours: Math.max(0, -hoursUntilDeadline),
  };
}
