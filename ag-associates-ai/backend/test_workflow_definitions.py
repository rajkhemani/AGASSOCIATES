"""Tests for the declarative workflow definitions.

Two things are being protected here. First, that the structural checks in
``WorkflowDefinition`` actually fire — they exist to catch the exact defects
ADR 0002 documents (an unreachable state, a dead terminal), so a test that only
exercised the happy path would prove nothing. Second, that wiring NOI through
the registry did not quietly change the NOI machine, which is live.
"""

from datetime import date

import pytest

from workflows.definitions import (
    MORTGAGE_REGISTRATION,
    NOI,
    PUBLIC_NOTICE,
    WORKFLOWS,
    Deadline,
    WorkflowDefinition,
    get_workflow,
)

ALL_WORKFLOWS = [NOI, MORTGAGE_REGISTRATION, PUBLIC_NOTICE]


def _definition(**overrides) -> dict:
    """A minimal well-formed definition, for mutating one field at a time."""
    base = {
        "slug": "sample",
        "label": "Sample",
        "status_field": "sample_status",
        "redis_prefix": "sample:case:",
        "states": ("START", "END"),
        "transitions": {"START": ("END",), "END": ()},
        "initial_states": ("START",),
        "terminal_states": ("END",),
    }
    base.update(overrides)
    return base


# --------------------------------------------------------------------------
# Structural validation
# --------------------------------------------------------------------------


def test_minimal_definition_is_accepted():
    workflow = WorkflowDefinition(**_definition())
    assert workflow.allowed_from("START") == ("END",)
    assert workflow.is_terminal("END")


def test_unreachable_state_is_rejected():
    """ADR 0002: RECTIFY shipped defined-but-unwired. That must not compile."""
    with pytest.raises(ValueError, match="cannot be reached"):
        WorkflowDefinition(
            **_definition(
                states=("START", "ORPHAN", "END"),
                transitions={"START": ("END",), "ORPHAN": ("END",), "END": ()},
            )
        )


def test_dead_end_that_is_not_terminal_is_rejected():
    """The mirror failure: a stage cases enter and can never leave."""
    with pytest.raises(ValueError, match="no way forward but is not terminal"):
        WorkflowDefinition(
            **_definition(
                states=("START", "STUCK", "END"),
                transitions={"START": ("STUCK", "END"), "STUCK": (), "END": ()},
            )
        )


def test_terminal_state_with_outgoing_transitions_is_rejected():
    with pytest.raises(ValueError, match="is terminal but still has outgoing"):
        WorkflowDefinition(
            **_definition(
                states=("START", "END"),
                transitions={"START": ("END",), "END": ("START",)},
            )
        )


def test_transition_to_undeclared_state_is_rejected():
    with pytest.raises(ValueError, match="does not exist"):
        WorkflowDefinition(**_definition(transitions={"START": ("TYPO",), "END": ()}))


def test_transition_from_undeclared_state_is_rejected():
    with pytest.raises(ValueError, match="transitions from unknown state"):
        WorkflowDefinition(
            **_definition(transitions={"START": ("END",), "GHOST": ("END",), "END": ()})
        )


def test_workflow_without_initial_state_is_rejected():
    with pytest.raises(ValueError, match="no case can start"):
        WorkflowDefinition(**_definition(initial_states=()))


def test_deadline_on_unknown_state_is_rejected():
    with pytest.raises(ValueError, match="deadline on unknown state"):
        WorkflowDefinition(
            **_definition(
                deadlines={
                    "NOWHERE": Deadline(
                        label="x", options=(7,), starts_from="somewhere"
                    )
                }
            )
        )


def test_transitions_are_not_mutable_after_construction():
    workflow = WorkflowDefinition(**_definition())
    with pytest.raises(TypeError):
        workflow.transitions["START"] = ("START",)


def test_deadlines_are_not_mutable_after_construction():
    workflow = WorkflowDefinition(
        **_definition(
            deadlines={
                "START": Deadline(label="x", options=(7,), starts_from="somewhere")
            }
        )
    )
    with pytest.raises(TypeError):
        workflow.deadlines["START"] = Deadline(
            label="y", options=(1,), starts_from="elsewhere"
        )


def test_transition_from_a_stage_this_workflow_does_not_know_is_reported_as_such():
    """A stored stage can be a legacy value or another workflow's status.

    Reporting that as "(terminal state)" would point the reader at the wrong
    problem entirely.
    """
    workflow = WorkflowDefinition(**_definition())
    with pytest.raises(ValueError, match="Unknown sample stage 'LEGACY_VALUE'"):
        workflow.validate_transition("LEGACY_VALUE", "END")


def test_transition_to_a_stage_this_workflow_does_not_know_is_reported_as_such():
    workflow = WorkflowDefinition(**_definition())
    with pytest.raises(ValueError, match="Unknown sample stage 'TYPO'"):
        workflow.validate_transition("START", "TYPO")


def test_an_exception_can_still_be_recorded_against_an_unknown_stage():
    """Recording a problem must never be blocked, whatever the case holds."""
    workflow = WorkflowDefinition(
        **_definition(
            states=("START", "END"),
            transitions={"START": ("END",), "END": (), "REJECTED": ()},
            terminal_states=("END", "REJECTED"),
            exception_states=("REJECTED",),
        )
    )
    workflow.validate_transition("LEGACY_VALUE", "REJECTED")


# --------------------------------------------------------------------------
# Every shipped workflow, checked generically
# --------------------------------------------------------------------------


@pytest.mark.parametrize("workflow", ALL_WORKFLOWS, ids=lambda w: w.slug)
def test_shipped_workflow_reaches_a_terminal_state(workflow):
    """Every ordinary stage must have some route to an ending."""
    reverse: dict[str, set[str]] = {s: set() for s in workflow.states}
    for origin, targets in workflow.transitions.items():
        for target in targets:
            if target in reverse:
                reverse[target].add(origin)

    can_finish = set()
    queue = [s for s in workflow.terminal_states if s in workflow.states]
    while queue:
        state = queue.pop()
        if state in can_finish:
            continue
        can_finish.add(state)
        queue.extend(reverse.get(state, ()))

    assert set(workflow.states) - can_finish == set()


@pytest.mark.parametrize("workflow", ALL_WORKFLOWS, ids=lambda w: w.slug)
def test_shipped_workflow_rejects_a_skipped_stage(workflow):
    """A case may not jump the queue — the defect ADR 0002 calls out."""
    first = workflow.initial_states[0]
    reachable_in_one = set(workflow.allowed_from(first))
    faraway = [
        s
        for s in workflow.states
        if s != first
        and s not in reachable_in_one
        and s not in workflow.exception_states
    ]
    assert faraway, f"{workflow.slug} is too short to test a skip"
    with pytest.raises(ValueError, match=r"Invalid .* transition"):
        workflow.validate_transition(first, faraway[-1])


@pytest.mark.parametrize("workflow", ALL_WORKFLOWS, ids=lambda w: w.slug)
def test_exception_states_are_always_enterable(workflow):
    """A mismatch is discovered, not scheduled — it can arrive at any point."""
    for state in workflow.states:
        for exception in workflow.exception_states:
            workflow.validate_transition(state, exception)


@pytest.mark.parametrize("workflow", ALL_WORKFLOWS, ids=lambda w: w.slug)
def test_exception_states_can_be_left_again(workflow):
    """Being off the happy path must not strand a case.

    The counterpart to the test above, and the one that was missing: entry into
    an exception was covered, exit was not, so `ON_HOLD` shipped with no way
    out at all. An exception either offers a route back or is terminal.
    """
    for state in workflow.exception_states:
        onward = [target for target in workflow.allowed_from(state) if target != state]
        assert workflow.is_terminal(state) or onward, (
            f"{workflow.slug}: {state} strands the case"
        )


def test_exception_state_without_an_exit_is_rejected():
    """The invariant above, enforced at construction rather than in review."""
    with pytest.raises(ValueError, match="STRANDED"):
        WorkflowDefinition(
            **_definition(
                exception_states=("STRANDED",),
                transitions={"START": ("END",), "END": ()},
            )
        )


def test_exception_state_that_only_loops_to_itself_is_rejected():
    """A self-loop is not a route out — the case is still stuck on it."""
    with pytest.raises(ValueError, match="STRANDED"):
        WorkflowDefinition(
            **_definition(
                exception_states=("STRANDED",),
                transitions={
                    "START": ("END",),
                    "END": (),
                    "STRANDED": ("STRANDED",),
                },
            )
        )


def test_registry_covers_every_workflow_exactly_once():
    assert set(WORKFLOWS) == {w.slug for w in ALL_WORKFLOWS}
    assert len(WORKFLOWS) == len(ALL_WORKFLOWS)


def test_workflows_do_not_share_storage():
    """Two workflows writing the same column or key prefix would collide."""
    assert len({w.status_field for w in ALL_WORKFLOWS}) == len(ALL_WORKFLOWS)
    assert len({w.redis_prefix for w in ALL_WORKFLOWS}) == len(ALL_WORKFLOWS)


def test_get_workflow_names_alternatives_when_unknown():
    with pytest.raises(KeyError, match="public_notice"):
        get_workflow("nonexistent")


# --------------------------------------------------------------------------
# NOI — pinned against the machine that is already live
# --------------------------------------------------------------------------


def test_noi_machine_is_unchanged():
    """The live NOI machine, pinned.

    These are the values that were inline in noi_agent.py. If this test has to
    be edited, the live NOI workflow is changing and that is a decision, not a
    refactor.

    It has been edited once, deliberately: ``MISMATCH`` previously had no exit,
    so a case flagged as mismatched could only be moved on with ``force=True``.
    It now rejoins at ``VERIFIED``. That is the single difference from the
    original inline machine, and it only widens what is permitted — no move
    that was legal before has been withdrawn.
    """
    assert NOI.states == (
        "DOCUMENTS_RECEIVED",
        "CHALLAN_GENERATED",
        "CHALLAN_PAID",
        "VERIFIED",
        "NOI_DROP_RECEIVED",
        "RECTIFY",
        "NOI_FILED",
        "ACKNOWLEDGED",
        "COMPLETED",
    )
    assert dict(NOI.transitions) == {
        "DOCUMENTS_RECEIVED": ("CHALLAN_GENERATED",),
        "CHALLAN_GENERATED": ("CHALLAN_PAID",),
        "CHALLAN_PAID": ("VERIFIED",),
        "VERIFIED": ("NOI_DROP_RECEIVED", "RECTIFY"),
        "NOI_DROP_RECEIVED": ("NOI_FILED", "RECTIFY"),
        "RECTIFY": ("NOI_FILED", "VERIFIED"),
        "NOI_FILED": ("ACKNOWLEDGED",),
        "ACKNOWLEDGED": ("COMPLETED",),
        "COMPLETED": (),
        "MISMATCH": ("VERIFIED",),
    }
    assert set(NOI.exception_states) == {"MISMATCH", "REJECTED"}
    assert set(NOI.terminal_states) == {"COMPLETED", "REJECTED"}
    assert NOI.status_field == "noi_status"
    assert NOI.redis_prefix == "noi:case:"


def test_noi_rectify_rejoins_the_main_line():
    """RECTIFY is a branch, not a siding — it was unreachable once."""
    assert "RECTIFY" in NOI.allowed_from("VERIFIED")
    assert "NOI_FILED" in NOI.allowed_from("RECTIFY")


def test_noi_completed_is_reachable():
    assert "COMPLETED" in NOI.allowed_from("ACKNOWLEDGED")


def test_noi_section_89b_window_runs_thirty_days_from_the_mortgage():
    deadline = NOI.deadlines["DOCUMENTS_RECEIVED"]
    assert deadline.options == (30,)
    assert "deposit of title deeds" in deadline.starts_from
    assert deadline.due_on(date(2026, 3, 1)) == date(2026, 3, 31)


# --------------------------------------------------------------------------
# Mortgage registration
# --------------------------------------------------------------------------


def test_mortgage_registration_follows_the_sop_sequence():
    assert MORTGAGE_REGISTRATION.allowed_from("DOCUMENTS_RECEIVED") == (
        "DRAFT_PREPARED",
    )
    assert MORTGAGE_REGISTRATION.allowed_from("APPROVED") == ("REGISTRATION_SCHEDULED",)
    assert MORTGAGE_REGISTRATION.allowed_from("REGISTERED") == ("DOCUMENTS_COLLECTED",)
    assert MORTGAGE_REGISTRATION.is_terminal("CLOSED")


def test_mortgage_registration_cannot_register_before_approval():
    """Registering an unapproved draft is the error the review stage prevents."""
    with pytest.raises(ValueError, match="Invalid mortgage_registration transition"):
        MORTGAGE_REGISTRATION.validate_transition("DRAFT_PREPARED", "REGISTERED")


def test_mortgage_registration_review_can_send_a_draft_back():
    assert "DRAFT_PREPARED" in MORTGAGE_REGISTRATION.allowed_from("INTERNAL_REVIEW")


# --------------------------------------------------------------------------
# Public notice
# --------------------------------------------------------------------------


def test_public_notice_branches_at_the_end_of_the_waiting_period():
    assert set(PUBLIC_NOTICE.allowed_from("AWAITING_OBJECTIONS")) == {
        "OBJECTION_RECEIVED",
        "CLEAR",
    }


def test_public_notice_objection_escalates_before_it_can_clear():
    """A claim cannot be waved through — it goes to escalation first."""
    with pytest.raises(ValueError, match="Invalid public_notice transition"):
        PUBLIC_NOTICE.validate_transition("OBJECTION_RECEIVED", "CLEAR")
    assert PUBLIC_NOTICE.allowed_from("OBJECTION_RECEIVED") == ("ESCALATED",)
    assert "CLEAR" in PUBLIC_NOTICE.allowed_from("ESCALATED")


def test_public_notice_cannot_close_before_the_window_is_resolved():
    with pytest.raises(ValueError, match="Invalid public_notice transition"):
        PUBLIC_NOTICE.validate_transition("AWAITING_OBJECTIONS", "CLOSED")


def test_public_notice_objection_window_offers_the_three_sop_periods():
    deadline = PUBLIC_NOTICE.deadlines["AWAITING_OBJECTIONS"]
    assert deadline.options == (7, 15, 30)
    assert deadline.blocking is True
    assert "publication" in deadline.starts_from


def test_public_notice_window_requires_an_explicit_period():
    """Three windows are permitted, so defaulting to one would be a guess."""
    deadline = PUBLIC_NOTICE.deadlines["AWAITING_OBJECTIONS"]
    with pytest.raises(ValueError, match="pass the one that applies"):
        deadline.due_on(date(2026, 3, 1))


def test_public_notice_window_rejects_an_unsanctioned_period():
    deadline = PUBLIC_NOTICE.deadlines["AWAITING_OBJECTIONS"]
    with pytest.raises(ValueError, match="not a valid window"):
        deadline.due_on(date(2026, 3, 1), days=21)


def test_public_notice_window_closes_and_expires_on_the_right_days():
    deadline = PUBLIC_NOTICE.deadlines["AWAITING_OBJECTIONS"]
    published = date(2026, 3, 1)

    assert deadline.due_on(published, days=7) == date(2026, 3, 8)
    assert deadline.due_on(published, days=15) == date(2026, 3, 16)
    assert deadline.due_on(published, days=30) == date(2026, 3, 31)

    # The closing day itself is still inside the window.
    assert not deadline.is_overdue(published, date(2026, 3, 8), days=7)
    assert deadline.is_overdue(published, date(2026, 3, 9), days=7)


def test_deadline_rejects_a_nonsensical_window():
    with pytest.raises(ValueError, match="non-positive"):
        Deadline(label="x", options=(0,), starts_from="whenever")
    with pytest.raises(ValueError, match="no window options"):
        Deadline(label="x", options=(), starts_from="whenever")
