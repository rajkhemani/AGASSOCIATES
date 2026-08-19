"""Evaluation of the statutory and contractual clocks running against a case.

``workflows.definitions`` declares the clocks — the Section 89B filing window,
the newspaper objection window — but declaring one does not watch it. Nothing
in the backend evaluated them, and there was no scheduler for anything to
evaluate them from. A window that closes unnoticed is the firm's worst failure
mode: on a Notice of Intimation it leaves the bank holding a security interest
that was never properly intimated, and no later step recovers it.

This module is the evaluation half, kept deliberately free of I/O so the
arithmetic can be tested without a database, a clock, or a network. Callers
supply the cases and the current date; ``scan`` returns what is due and how
badly.

The clock's start is a real-world event the system is *told* about — the date a
mortgage was created by deposit of title deeds, the date a notice appeared in
the newspaper. It is never inferred from when a row happened to be written,
because the two differ and only the former has legal meaning.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from collections.abc import Iterable, Mapping
    from datetime import date

    from workflows.definitions import Deadline, WorkflowDefinition

__all__ = [
    "DEFAULT_WARN_WITHIN_DAYS",
    "CaseClock",
    "DeadlineStatus",
    "ScanFault",
    "ScanResult",
    "Severity",
    "evaluate",
    "scan",
]

#: How far ahead of a closing window to start warning. Chosen so a filing that
#: needs a challan, a payment and a portal submission still has working days in
#: hand — not so early that every case sits permanently in warning.
DEFAULT_WARN_WITHIN_DAYS = 7


class Severity(str, Enum):
    """How much attention a clock needs, worst last.

    Ordered so ``max()`` over a set of statuses yields the most urgent, and so
    a caller can filter with a simple comparison.
    """

    OK = "ok"
    DUE_SOON = "due_soon"
    DUE_TODAY = "due_today"
    OVERDUE = "overdue"

    @property
    def rank(self) -> int:
        return _SEVERITY_ORDER.index(self)

    def __lt__(self, other: object) -> bool:
        if not isinstance(other, Severity):
            return NotImplemented
        return self.rank < other.rank


_SEVERITY_ORDER = [Severity.OK, Severity.DUE_SOON, Severity.DUE_TODAY, Severity.OVERDUE]


@dataclass(frozen=True)
class CaseClock:
    """One case's position against one clock.

    ``started_on`` is the legally meaningful trigger date, not the row's
    creation date. ``window_days`` is required only where the workflow permits
    several windows — the public-notice objection period being the one that
    does.
    """

    case_id: str
    workflow: str
    stage: str
    started_on: date
    window_days: int | None = None


@dataclass(frozen=True)
class DeadlineStatus:
    """The verdict on one clock, ready to be alerted on or displayed."""

    case_id: str
    workflow: str
    stage: str
    label: str
    started_on: date
    due_on: date
    days_remaining: int
    severity: Severity

    @property
    def is_actionable(self) -> bool:
        """True when someone needs to be told."""
        return self.severity is not Severity.OK

    def describe(self) -> str:
        """A one-line summary fit for a notification body."""
        if self.severity is Severity.OVERDUE:
            overdue_by = -self.days_remaining
            day_word = "day" if overdue_by == 1 else "days"
            return (
                f"{self.label} closed on {self.due_on.isoformat()} — "
                f"{overdue_by} {day_word} ago"
            )
        if self.severity is Severity.DUE_TODAY:
            return f"{self.label} closes today ({self.due_on.isoformat()})"
        day_word = "day" if self.days_remaining == 1 else "days"
        return (
            f"{self.label} closes on {self.due_on.isoformat()} — "
            f"{self.days_remaining} {day_word} left"
        )


def _severity(days_remaining: int, warn_within_days: int) -> Severity:
    if days_remaining < 0:
        return Severity.OVERDUE
    if days_remaining == 0:
        return Severity.DUE_TODAY
    if days_remaining <= warn_within_days:
        return Severity.DUE_SOON
    return Severity.OK


def evaluate(
    workflow: WorkflowDefinition,
    clock: CaseClock,
    as_of: date,
    warn_within_days: int = DEFAULT_WARN_WITHIN_DAYS,
) -> DeadlineStatus | None:
    """Assess one case against the clock attached to its current stage.

    Returns ``None`` when the stage carries no deadline — most stages do not,
    and a caller scanning every case should not have to know which.

    Raises ``ValueError`` if the case names a stage this workflow does not
    have, or if the workflow permits several windows and the case did not say
    which applies. Both are data faults worth surfacing rather than guessing
    past: silently picking 7 days for a 30-day objection period would report a
    case as clear three weeks early.
    """
    # Every workflow here begins at DOCUMENTS_RECEIVED, so a clock paired with
    # the wrong definition would match on the stage name and return a deadline
    # computed from the wrong statute — silently, and plausibly.
    if clock.workflow != workflow.slug:
        raise ValueError(
            f"Case {clock.case_id}: clock is for {clock.workflow!r} but was "
            f"evaluated against {workflow.slug!r}"
        )

    if not workflow.knows(clock.stage):
        raise ValueError(
            f"Case {clock.case_id}: {clock.stage!r} is not a stage of {workflow.slug}"
        )

    deadline: Deadline | None = workflow.deadlines.get(clock.stage)
    if deadline is None:
        return None

    due_on = deadline.due_on(clock.started_on, clock.window_days)
    days_remaining = (due_on - as_of).days

    return DeadlineStatus(
        case_id=clock.case_id,
        workflow=workflow.slug,
        stage=clock.stage,
        label=deadline.label,
        started_on=clock.started_on,
        due_on=due_on,
        days_remaining=days_remaining,
        severity=_severity(days_remaining, warn_within_days),
    )


@dataclass(frozen=True)
class ScanFault:
    """A case the scan could not assess, and why."""

    case_id: str
    workflow: str
    reason: str


@dataclass(frozen=True)
class ScanResult:
    """What a scan found: the cases that need attention, and the ones it
    could not judge.

    Faults are returned rather than logged and forgotten. A case whose window
    cannot be computed is precisely a case nobody is watching, so burying it
    would recreate the failure this module exists to prevent.
    """

    due: tuple[DeadlineStatus, ...]
    faults: tuple[ScanFault, ...]

    @property
    def needs_attention(self) -> bool:
        return bool(self.due or self.faults)


def scan(
    workflows: Mapping[str, WorkflowDefinition],
    clocks: Iterable[CaseClock],
    as_of: date,
    warn_within_days: int = DEFAULT_WARN_WITHIN_DAYS,
    actionable_only: bool = True,
) -> ScanResult:
    """Assess many cases at once, most urgent first.

    No single case can stop the scan. A row naming an unknown workflow, an
    unknown stage, an objection window with no period stated, or a start date
    that is not a date at all is recorded as a fault and the scan continues — a
    nightly sweep over the whole book must not be aborted by one malformed
    record. ``CaseClock`` does no runtime type checking, and clocks are built
    from database rows, so a ``started_on`` that arrived as a string reaches the
    date arithmetic and raises ``TypeError`` there.

    ``due`` is ordered by severity, then by how little time is left, so its
    first entry is always the case in most trouble.
    """
    due: list[DeadlineStatus] = []
    faults: list[ScanFault] = []

    for clock in clocks:
        workflow = workflows.get(clock.workflow)
        if workflow is None:
            faults.append(
                ScanFault(
                    case_id=clock.case_id,
                    workflow=clock.workflow,
                    reason=f"unknown workflow {clock.workflow!r}",
                )
            )
            continue

        try:
            status = evaluate(workflow, clock, as_of, warn_within_days)
        except (ValueError, TypeError) as exc:
            faults.append(
                ScanFault(
                    case_id=clock.case_id, workflow=clock.workflow, reason=str(exc)
                )
            )
            continue

        if status is None:
            continue
        if actionable_only and not status.is_actionable:
            continue
        due.append(status)

    due.sort(key=lambda s: (-s.severity.rank, s.days_remaining))
    return ScanResult(due=tuple(due), faults=tuple(faults))
