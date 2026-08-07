"""Declarative state machines for the firm's legal-operations workflows.

Each workflow the firm runs — Notice of Intimation, mortgage registration,
public notice — is a linear sequence of stages with a small number of branches
and one or more clocks running against it. Before this module those rules lived
inline in ``noi_agent.py``: a states list, a transitions dict, notification
templates in ``auto_comms.py`` and a status allow-list in ``main.py``. ADR 0002
records the consequence — adding a single state meant editing three files, and
the first version of the NOI machine shipped with ``RECTIFY`` unreachable and
``COMPLETED`` dead.

Copying that shape once per workflow would have tripled the problem. So the
rules are data here, and the structural invariants that were previously assumed
are checked when a definition is constructed: every transition target must
exist, every state must be reachable from an initial state, and terminal states
must actually terminate. A malformed workflow fails at import, not in
production on a case that is already half-filed.

Stage sequences are taken from the firm's internal SOPs. Only the process shape
is encoded — the role matrices and approval blocks in those documents are
deliberately not represented here.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta
from types import MappingProxyType
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    # Only ever used in annotations, which `from __future__ import annotations`
    # keeps as strings — so this never needs to exist at runtime.
    from collections.abc import Mapping

__all__ = [
    "MORTGAGE_REGISTRATION",
    "NOI",
    "PUBLIC_NOTICE",
    "WORKFLOWS",
    "Deadline",
    "WorkflowDefinition",
    "get_workflow",
]


@dataclass(frozen=True)
class Deadline:
    """A clock attached to a stage.

    ``options`` holds the permissible windows in days. Most deadlines have
    exactly one; the public-notice objection window is chosen per case, so it
    carries several and the caller must say which applies.
    """

    label: str
    options: tuple[int, ...]
    #: What starts the clock. Prose, because the trigger is a real-world event
    #: (a mortgage executed, a notice published) that the system is told about
    #: rather than something it can observe.
    starts_from: str
    #: True when the workflow may not advance past this stage until the window
    #: closes, as opposed to a target the firm merely tracks against.
    blocking: bool = True

    def __post_init__(self) -> None:
        if not self.options:
            raise ValueError(f"Deadline {self.label!r} has no window options")
        if any(days <= 0 for days in self.options):
            raise ValueError(f"Deadline {self.label!r} has a non-positive window")

    def due_on(self, started: date, days: int | None = None) -> date:
        """Return the date this window closes.

        ``days`` may be omitted only when the deadline has a single option.
        """
        if days is None:
            if len(self.options) > 1:
                raise ValueError(
                    f"Deadline {self.label!r} has several windows "
                    f"({', '.join(str(d) for d in self.options)} days) — "
                    f"pass the one that applies to this case"
                )
            days = self.options[0]
        elif days not in self.options:
            raise ValueError(
                f"{days} is not a valid window for {self.label!r}; "
                f"expected one of {', '.join(str(d) for d in self.options)}"
            )
        return started + timedelta(days=days)

    def is_overdue(self, started: date, as_of: date, days: int | None = None) -> bool:
        """True once ``as_of`` is past the closing date."""
        return as_of > self.due_on(started, days)


@dataclass(frozen=True)
class WorkflowDefinition:
    """One workflow's stages, permitted moves between them, and its clocks."""

    slug: str
    label: str
    #: Column on the cases table holding this workflow's stage.
    status_field: str
    #: Key prefix used when a case is held in Redis rather than Postgres.
    redis_prefix: str
    states: tuple[str, ...]
    transitions: Mapping[str, tuple[str, ...]]
    #: Stages a case may legitimately begin at.
    initial_states: tuple[str, ...]
    #: Stages from which there is no way forward.
    terminal_states: tuple[str, ...]
    #: Off-happy-path stages. Reachability is not required of them, because
    #: they are entered from wherever the problem was noticed.
    exception_states: tuple[str, ...] = ()
    deadlines: Mapping[str, Deadline] = field(default_factory=dict)

    def __post_init__(self) -> None:
        known = set(self.states) | set(self.exception_states)

        self._check_names_are_unique(known)
        self._check_transitions_name_real_states(known)
        self._check_endpoints_name_real_states(known)
        self._check_every_state_is_reachable()
        self._check_no_state_strands_a_case()
        self._check_deadlines_name_real_states(known)

        object.__setattr__(
            self, "transitions", MappingProxyType(dict(self.transitions))
        )
        object.__setattr__(self, "deadlines", MappingProxyType(dict(self.deadlines)))

    def _check_names_are_unique(self, known: set[str]) -> None:
        duplicates = len(self.states) + len(self.exception_states) - len(known)
        if duplicates:
            raise ValueError(f"{self.slug}: {duplicates} state name(s) declared twice")

    def _check_transitions_name_real_states(self, known: set[str]) -> None:
        for origin, targets in self.transitions.items():
            if origin not in known:
                raise ValueError(
                    f"{self.slug}: transitions from unknown state {origin!r}"
                )
            for target in targets:
                if target not in known:
                    raise ValueError(
                        f"{self.slug}: transition {origin} → {target} "
                        f"names a state that does not exist"
                    )

    def _check_endpoints_name_real_states(self, known: set[str]) -> None:
        for group in ("initial_states", "terminal_states"):
            for name in getattr(self, group):
                if name not in known:
                    raise ValueError(
                        f"{self.slug}: {group} names unknown state {name!r}"
                    )

        if not self.initial_states:
            raise ValueError(f"{self.slug}: no initial state, so no case can start")

        for name in self.terminal_states:
            if self.transitions.get(name):
                raise ValueError(
                    f"{self.slug}: {name} is terminal but still has outgoing "
                    f"transitions {list(self.transitions[name])}"
                )

    def _check_every_state_is_reachable(self) -> None:
        """The failure ADR 0002 describes: a state defined but wired to nothing.

        Exception states are exempt — they are entered from wherever the
        problem was noticed rather than from a declared predecessor.
        """
        unreachable = set(self.states) - self._reachable()
        if unreachable:
            raise ValueError(
                f"{self.slug}: {sorted(unreachable)} cannot be reached from "
                f"{list(self.initial_states)}"
            )

    def _check_no_state_strands_a_case(self) -> None:
        """The mirror image: a stage entered that cannot be left.

        Exception states are *included* here — being off the happy path is not
        a reason to strand a case, so an exception either offers a route back
        or is declared terminal. A self-loop does not count as a route back.
        """
        for name in (*self.states, *self.exception_states):
            if name in self.terminal_states:
                continue
            onward = [target for target in self.allowed_from(name) if target != name]
            if not onward:
                raise ValueError(
                    f"{self.slug}: {name} has no way forward but is not terminal"
                )

    def _check_deadlines_name_real_states(self, known: set[str]) -> None:
        for name in self.deadlines:
            if name not in known:
                raise ValueError(f"{self.slug}: deadline on unknown state {name!r}")

    def _reachable(self) -> set[str]:
        seen: set[str] = set()
        queue = list(self.initial_states)
        while queue:
            state = queue.pop()
            if state in seen:
                continue
            seen.add(state)
            queue.extend(self.transitions.get(state, ()))
        return seen

    def allowed_from(self, state: str) -> tuple[str, ...]:
        """Stages reachable in one step from ``state``."""
        return tuple(self.transitions.get(state, ()))

    def is_terminal(self, state: str) -> bool:
        return state in self.terminal_states

    def knows(self, state: str) -> bool:
        """True if ``state`` belongs to this workflow at all."""
        return state in self.states or state in self.exception_states

    def validate_transition(self, current: str, new: str) -> None:
        """Raise unless ``current → new`` is a permitted move.

        Moves into an exception state are always allowed and are checked first:
        a mismatch or a rejection is discovered rather than scheduled, and
        recording one must never be blocked — including on a case whose stored
        stage this workflow does not recognise.
        """
        if new in self.exception_states:
            return

        # ``current`` typically arrives from the cases table, so it can be a
        # stage this workflow has never defined — a legacy value, or another
        # workflow's status written to the wrong column. Reporting that as
        # "(terminal state)" would send the reader looking in the wrong place.
        if not self.knows(current):
            raise ValueError(
                f"Unknown {self.slug} stage {current!r}; this workflow's stages "
                f"are {list(self.states)}"
            )
        if not self.knows(new):
            raise ValueError(
                f"Unknown {self.slug} stage {new!r}; this workflow's stages "
                f"are {list(self.states)}"
            )

        allowed = self.allowed_from(current)
        if new not in allowed:
            raise ValueError(
                f"Invalid {self.slug} transition: {current} → {new}. "
                f"Allowed from {current}: {list(allowed) or '(terminal state)'}"
            )


# --------------------------------------------------------------------------
# Notice of Intimation
#
# Filing under Section 89B of the Registration Act, 1908. The clock is the one
# that matters most in the practice: 30 days from the date the mortgage is
# created by deposit of title deeds. RECTIFY is a real branch — a filing sent
# back for correction rejoins the main line rather than starting over.
# --------------------------------------------------------------------------
NOI = WorkflowDefinition(
    slug="noi",
    label="Notice of Intimation",
    status_field="noi_status",
    redis_prefix="noi:case:",
    states=(
        "DOCUMENTS_RECEIVED",
        "CHALLAN_GENERATED",
        "CHALLAN_PAID",
        "VERIFIED",
        "NOI_DROP_RECEIVED",
        "RECTIFY",
        "NOI_FILED",
        "ACKNOWLEDGED",
        "COMPLETED",
    ),
    transitions={
        "DOCUMENTS_RECEIVED": ("CHALLAN_GENERATED",),
        "CHALLAN_GENERATED": ("CHALLAN_PAID",),
        "CHALLAN_PAID": ("VERIFIED",),
        "VERIFIED": ("NOI_DROP_RECEIVED", "RECTIFY"),
        "NOI_DROP_RECEIVED": ("NOI_FILED", "RECTIFY"),
        "RECTIFY": ("NOI_FILED", "VERIFIED"),
        "NOI_FILED": ("ACKNOWLEDGED",),
        "ACKNOWLEDGED": ("COMPLETED",),
        "COMPLETED": (),
        # A mismatch is corrected and the file goes back for re-verification.
        # This edge is new: previously MISMATCH had no exit at all, so the only
        # way to move such a case on was force=True. Widening only — nothing
        # that was permitted before has been withdrawn.
        "MISMATCH": ("VERIFIED",),
    },
    initial_states=("DOCUMENTS_RECEIVED",),
    terminal_states=("COMPLETED", "REJECTED"),
    exception_states=("MISMATCH", "REJECTED"),
    deadlines={
        "DOCUMENTS_RECEIVED": Deadline(
            label="Section 89B filing window",
            options=(30,),
            starts_from="date of the mortgage — deposit of title deeds",
        ),
    },
)


# --------------------------------------------------------------------------
# Mortgage registration
#
# Six stages, per the firm's SOP: intake and completeness check, drafting,
# internal review, registrar verification with a date fixed, registration
# itself, then collection of the endorsed originals and closure.
#
# The review → drafting edge is an inference, not a stage listed in the SOP:
# the SOP says the case "proceeds only after final approval is obtained",
# which implies review can withhold approval and send the draft back. Modelling
# it as a dead end would be the stricter reading but would leave no legal move
# for the commonest outcome of a review.
# --------------------------------------------------------------------------
MORTGAGE_REGISTRATION = WorkflowDefinition(
    slug="mortgage_registration",
    label="Mortgage Registration",
    status_field="mortgage_status",
    redis_prefix="mortgage:case:",
    states=(
        "DOCUMENTS_RECEIVED",
        "DRAFT_PREPARED",
        "INTERNAL_REVIEW",
        "APPROVED",
        "REGISTRATION_SCHEDULED",
        "REGISTERED",
        "DOCUMENTS_COLLECTED",
        "CLOSED",
    ),
    transitions={
        "DOCUMENTS_RECEIVED": ("DRAFT_PREPARED",),
        "DRAFT_PREPARED": ("INTERNAL_REVIEW",),
        "INTERNAL_REVIEW": ("APPROVED", "DRAFT_PREPARED"),
        "APPROVED": ("REGISTRATION_SCHEDULED",),
        "REGISTRATION_SCHEDULED": ("REGISTERED",),
        "REGISTERED": ("DOCUMENTS_COLLECTED",),
        "DOCUMENTS_COLLECTED": ("CLOSED",),
        "CLOSED": (),
        # A held case is not an ended case. It either restarts from intake once
        # whatever blocked it is resolved, or it is cancelled outright.
        "ON_HOLD": ("DOCUMENTS_RECEIVED", "CANCELLED"),
    },
    initial_states=("DOCUMENTS_RECEIVED",),
    terminal_states=("CLOSED", "CANCELLED"),
    exception_states=("ON_HOLD", "CANCELLED"),
)


# --------------------------------------------------------------------------
# Public notice
#
# Seven stages, per the firm's SOP. The objection window is the reason this
# workflow needs automation at all: after publication the case sits for a fixed
# period during which nothing happens unless a claim arrives, and the SOP is
# explicit that the timeline must complete before the matter proceeds. A window
# that closes unnoticed is the failure this encodes against.
#
# The window is 7, 15 or 30 days, set per case by bank requirement, the nature
# of the transaction and the assessed legal risk — so the caller must state
# which applies rather than inheriting a default.
# --------------------------------------------------------------------------
PUBLIC_NOTICE = WorkflowDefinition(
    slug="public_notice",
    label="Public Notice",
    status_field="public_notice_status",
    redis_prefix="notice:case:",
    states=(
        "DOCUMENTS_RECEIVED",
        "TITLE_VERIFICATION",
        "DRAFTED",
        "PUBLISHED",
        "AWAITING_OBJECTIONS",
        "OBJECTION_RECEIVED",
        "ESCALATED",
        "CLEAR",
        "CLOSED",
    ),
    transitions={
        "DOCUMENTS_RECEIVED": ("TITLE_VERIFICATION",),
        "TITLE_VERIFICATION": ("DRAFTED",),
        "DRAFTED": ("PUBLISHED",),
        "PUBLISHED": ("AWAITING_OBJECTIONS",),
        # The branch at the end of the waiting period: a claim arrived, or the
        # window closed quietly and the property is treated as clear.
        "AWAITING_OBJECTIONS": ("OBJECTION_RECEIVED", "CLEAR"),
        "OBJECTION_RECEIVED": ("ESCALATED",),
        # An escalated matter either resolves in favour of proceeding or the
        # dependent registration is paused pending clarification.
        "ESCALATED": ("CLEAR", "ON_HOLD"),
        "CLEAR": ("CLOSED",),
        "CLOSED": (),
        # The SOP pauses the dependent registration "until clarification" —
        # which means the pause ends. A held matter goes back to escalation for
        # the clarification to be assessed, or clears on the strength of it.
        "ON_HOLD": ("ESCALATED", "CLEAR"),
    },
    initial_states=("DOCUMENTS_RECEIVED",),
    terminal_states=("CLOSED",),
    exception_states=("ON_HOLD",),
    deadlines={
        "AWAITING_OBJECTIONS": Deadline(
            label="Objection window",
            options=(7, 15, 30),
            starts_from="date of newspaper publication",
        ),
    },
)


WORKFLOWS: Mapping[str, WorkflowDefinition] = MappingProxyType(
    {w.slug: w for w in (NOI, MORTGAGE_REGISTRATION, PUBLIC_NOTICE)}
)


def get_workflow(slug: str) -> WorkflowDefinition:
    """Look up a workflow by slug, naming the alternatives when it is unknown."""
    try:
        return WORKFLOWS[slug]
    except KeyError:
        known = ", ".join(sorted(WORKFLOWS))
        raise KeyError(f"Unknown workflow {slug!r}; known workflows: {known}") from None
