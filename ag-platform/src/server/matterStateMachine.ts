import { CaseStatus } from '../types/domain.ts';

const transitions: Record<CaseStatus, readonly CaseStatus[]> = {
  [CaseStatus.RECEIVED]: [CaseStatus.ASSIGNED, CaseStatus.DOCUMENT_COLLECTION, CaseStatus.IN_PROGRESS, CaseStatus.REJECTED],
  [CaseStatus.ASSIGNED]: [CaseStatus.DOCUMENT_COLLECTION, CaseStatus.IN_PROGRESS, CaseStatus.ON_HOLD, CaseStatus.REJECTED],
  [CaseStatus.DOCUMENT_COLLECTION]: [CaseStatus.IN_PROGRESS, CaseStatus.ON_HOLD, CaseStatus.REJECTED],
  [CaseStatus.IN_PROGRESS]: [CaseStatus.PENDING_REGISTRATION, CaseStatus.QUALITY_CHECK, CaseStatus.ON_HOLD, CaseStatus.REJECTED],
  [CaseStatus.PENDING_REGISTRATION]: [CaseStatus.REGISTERED, CaseStatus.ON_HOLD, CaseStatus.REJECTED],
  [CaseStatus.REGISTERED]: [CaseStatus.QUALITY_CHECK, CaseStatus.DELIVERED],
  [CaseStatus.QUALITY_CHECK]: [CaseStatus.DELIVERED, CaseStatus.IN_PROGRESS, CaseStatus.ON_HOLD],
  [CaseStatus.DELIVERED]: [CaseStatus.INVOICED, CaseStatus.CLOSED],
  [CaseStatus.INVOICED]: [CaseStatus.CLOSED],
  [CaseStatus.CLOSED]: [],
  [CaseStatus.ON_HOLD]: [CaseStatus.ASSIGNED, CaseStatus.DOCUMENT_COLLECTION, CaseStatus.IN_PROGRESS, CaseStatus.REJECTED],
  [CaseStatus.REJECTED]: [],
};

export function canTransitionMatter(from: CaseStatus, to: CaseStatus): boolean {
  return from === to || transitions[from]?.includes(to) === true;
}

export function assertMatterTransition(from: CaseStatus, to: CaseStatus): void {
  if (!canTransitionMatter(from, to)) {
    throw new Error(`Invalid matter transition: ${from} -> ${to}`);
  }
}

export function allowedMatterTransitions(from: CaseStatus): readonly CaseStatus[] {
  return transitions[from] ?? [];
}
