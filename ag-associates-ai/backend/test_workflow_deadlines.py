"""Tests for statutory clock evaluation.

The arithmetic here decides whether the firm is told about a closing window, so
the boundaries are tested explicitly — the day a window closes is still inside
it, the day after is not. Off-by-one in either direction is the whole failure:
one direction cries wolf, the other stays quiet through a missed filing.
"""

from datetime import date

import pytest

from workflows.deadlines import (
    DEFAULT_WARN_WITHIN_DAYS,
    CaseClock,
    Severity,
    evaluate,
    scan,
)
from workflows.definitions import (
    MORTGAGE_REGISTRATION,
    NOI,
    PUBLIC_NOTICE,
    WORKFLOWS,
)

# The date a mortgage was created by deposit of title deeds. The Section 89B
# window runs 30 days from here, so it closes on the 31st.
MORTGAGED = date(2026, 3, 1)
SECTION_89B_DAYS = 30
WINDOW_CLOSES = date(2026, 3, 31)


def noi_clock(**overrides) -> CaseClock:
    base = {
        "case_id": "AG-1",
        "workflow": "noi",
        "stage": "DOCUMENTS_RECEIVED",
        "started_on": MORTGAGED,
    }
    base.update(overrides)
    return CaseClock(**base)


# --------------------------------------------------------------------------
# Stages without a clock
# --------------------------------------------------------------------------


def test_a_stage_with_no_deadline_returns_nothing():
    """Most stages carry no clock; a scanner must not have to know which."""
    assert evaluate(NOI, noi_clock(stage="NOI_FILED"), as_of=MORTGAGED) is None


def test_a_workflow_with_no_deadlines_at_all_is_silent():
    clock = CaseClock(
        case_id="AG-2",
        workflow="mortgage_registration",
        stage="DRAFT_PREPARED",
        started_on=MORTGAGED,
    )
    assert evaluate(MORTGAGE_REGISTRATION, clock, as_of=MORTGAGED) is None


# --------------------------------------------------------------------------
# Boundaries — the whole point
# --------------------------------------------------------------------------


def test_the_closing_day_is_still_inside_the_window():
    status = evaluate(NOI, noi_clock(), as_of=WINDOW_CLOSES)
    assert status.due_on == WINDOW_CLOSES
    assert status.days_remaining == 0
    assert status.severity is Severity.DUE_TODAY


def test_the_day_after_closing_is_overdue():
    status = evaluate(NOI, noi_clock(), as_of=date(2026, 4, 1))
    assert status.days_remaining == -1
    assert status.severity is Severity.OVERDUE


def test_a_case_well_inside_its_window_is_not_actionable():
    status = evaluate(NOI, noi_clock(), as_of=MORTGAGED)
    assert status.days_remaining == SECTION_89B_DAYS
    assert status.severity is Severity.OK
    assert status.is_actionable is False


def test_the_warning_threshold_is_inclusive():
    """Exactly `warn_within_days` out must already warn, not on the next day."""
    at_threshold = date(2026, 3, 31 - DEFAULT_WARN_WITHIN_DAYS)
    status = evaluate(NOI, noi_clock(), as_of=at_threshold)
    assert status.days_remaining == DEFAULT_WARN_WITHIN_DAYS
    assert status.severity is Severity.DUE_SOON

    day_before = date(2026, 3, 30 - DEFAULT_WARN_WITHIN_DAYS)
    assert evaluate(NOI, noi_clock(), as_of=day_before).severity is Severity.OK


def test_the_warning_window_is_configurable():
    status = evaluate(NOI, noi_clock(), as_of=date(2026, 3, 20), warn_within_days=14)
    assert status.severity is Severity.DUE_SOON
    assert evaluate(NOI, noi_clock(), as_of=date(2026, 3, 20)).severity is Severity.OK


# --------------------------------------------------------------------------
# The public-notice objection window — several permitted periods
# --------------------------------------------------------------------------


def notice_clock(days: int | None) -> CaseClock:
    return CaseClock(
        case_id="AG-3",
        workflow="public_notice",
        stage="AWAITING_OBJECTIONS",
        started_on=date(2026, 3, 1),
        window_days=days,
    )


@pytest.mark.parametrize(
    ("days", "closes"),
    [(7, date(2026, 3, 8)), (15, date(2026, 3, 16)), (30, date(2026, 3, 31))],
)
def test_each_permitted_objection_period_closes_on_its_own_date(days, closes):
    status = evaluate(PUBLIC_NOTICE, notice_clock(days), as_of=date(2026, 3, 1))
    assert status.due_on == closes


def test_an_objection_window_without_a_stated_period_is_refused():
    """Defaulting to 7 would clear a 30-day case three weeks early."""
    with pytest.raises(ValueError, match="pass the one that applies"):
        evaluate(PUBLIC_NOTICE, notice_clock(None), as_of=date(2026, 3, 1))


def test_an_objection_window_of_an_unsanctioned_length_is_refused():
    with pytest.raises(ValueError, match="not a valid window"):
        evaluate(PUBLIC_NOTICE, notice_clock(21), as_of=date(2026, 3, 1))


# --------------------------------------------------------------------------
# Bad data
# --------------------------------------------------------------------------


def test_a_stage_the_workflow_does_not_have_is_refused():
    with pytest.raises(ValueError, match="not a stage of noi"):
        evaluate(NOI, noi_clock(stage="INVENTED"), as_of=MORTGAGED)


# --------------------------------------------------------------------------
# Scanning the whole book
# --------------------------------------------------------------------------


def test_scan_returns_the_worst_case_first():
    as_of = date(2026, 3, 30)
    clocks = [
        noi_clock(case_id="due-soon", started_on=date(2026, 3, 5)),
        noi_clock(case_id="overdue", started_on=date(2026, 1, 1)),
        noi_clock(case_id="due-today", started_on=date(2026, 2, 28)),
    ]
    result = scan(WORKFLOWS, clocks, as_of=as_of)

    assert [s.case_id for s in result.due] == ["overdue", "due-today", "due-soon"]
    assert result.due[0].severity is Severity.OVERDUE
    assert result.faults == ()


def test_scan_ranks_more_overdue_cases_ahead_of_less_overdue_ones():
    clocks = [
        noi_clock(case_id="late", started_on=date(2026, 2, 1)),
        noi_clock(case_id="later", started_on=date(2026, 1, 1)),
    ]
    result = scan(WORKFLOWS, clocks, as_of=date(2026, 4, 1))
    assert [s.case_id for s in result.due] == ["later", "late"]


def test_scan_hides_cases_that_are_comfortably_inside_their_window():
    clocks = [noi_clock(case_id="fine")]
    assert scan(WORKFLOWS, clocks, as_of=MORTGAGED).due == ()
    relaxed = scan(WORKFLOWS, clocks, as_of=MORTGAGED, actionable_only=False)
    assert len(relaxed.due) == 1


def test_scan_skips_a_case_naming_an_unknown_workflow():
    """One bad row must not stop a scan across the whole book."""
    clocks = [
        CaseClock("bad", "conveyancing", "DOCUMENTS_RECEIVED", MORTGAGED),
        noi_clock(case_id="good", started_on=date(2026, 1, 1)),
    ]
    result = scan(WORKFLOWS, clocks, as_of=date(2026, 4, 1))
    assert [s.case_id for s in result.due] == ["good"]
    assert [f.case_id for f in result.faults] == ["bad"]
    assert "unknown workflow" in result.faults[0].reason


def test_scan_covers_several_workflows_at_once():
    clocks = [
        noi_clock(case_id="noi-late", started_on=date(2026, 1, 1)),
        notice_clock(7),
    ]
    result = scan(WORKFLOWS, clocks, as_of=date(2026, 4, 1))
    assert {s.workflow for s in result.due} == {"noi", "public_notice"}


# --------------------------------------------------------------------------
# What a person actually reads
# --------------------------------------------------------------------------


def test_an_overdue_case_says_how_long_it_has_been_overdue():
    status = evaluate(NOI, noi_clock(), as_of=date(2026, 4, 3))
    assert status.describe() == (
        "Section 89B filing window closed on 2026-03-31 — 3 days ago"
    )


def test_one_day_is_not_pluralised():
    assert "1 day ago" in evaluate(NOI, noi_clock(), as_of=date(2026, 4, 1)).describe()
    assert (
        "1 day left" in evaluate(NOI, noi_clock(), as_of=date(2026, 3, 30)).describe()
    )


def test_a_case_closing_today_says_so():
    status = evaluate(NOI, noi_clock(), as_of=WINDOW_CLOSES)
    assert status.describe() == "Section 89B filing window closes today (2026-03-31)"


def test_severity_orders_worst_last():
    assert Severity.OK < Severity.DUE_SOON < Severity.DUE_TODAY < Severity.OVERDUE
    assert max([Severity.DUE_SOON, Severity.OVERDUE, Severity.OK]) is Severity.OVERDUE


def test_scan_records_a_bad_stage_as_a_fault_and_carries_on():
    """The reason `scan` exists: one malformed row cannot abort a sweep.

    A nightly scan over the whole book that dies on the first bad record
    leaves every case after it unwatched.
    """
    clocks = [
        CaseClock("bad-stage", "noi", "INVENTED", MORTGAGED),
        noi_clock(case_id="good", started_on=date(2026, 1, 1)),
    ]
    result = scan(WORKFLOWS, clocks, as_of=date(2026, 4, 1))

    assert [s.case_id for s in result.due] == ["good"]
    assert [f.case_id for f in result.faults] == ["bad-stage"]
    assert "not a stage of noi" in result.faults[0].reason


def test_scan_records_a_missing_objection_window_as_a_fault():
    """The realistic bad row: window_days is optional and often unset."""
    clocks = [notice_clock(None), noi_clock(case_id="good")]
    result = scan(WORKFLOWS, clocks, as_of=date(2026, 3, 1))

    assert [f.case_id for f in result.faults] == ["AG-3"]
    assert "pass the one that applies" in result.faults[0].reason


def test_a_fault_still_counts_as_needing_attention():
    """A case nobody can assess is a case nobody is watching."""
    result = scan(WORKFLOWS, [notice_clock(None)], as_of=date(2026, 3, 1))
    assert result.due == ()
    assert result.needs_attention is True


def test_scan_records_a_start_date_that_is_not_a_date_as_a_fault():
    """`CaseClock` does no type checking and clocks are built from DB rows.

    A `started_on` that arrived as a string reaches `date + timedelta` and
    raises `TypeError` there, not `ValueError` — which would escape the scan
    and leave every case after it unassessed.
    """
    clocks = [
        noi_clock(case_id="bad-date", started_on="2026-03-01"),
        noi_clock(case_id="good", started_on=date(2026, 1, 1)),
    ]
    result = scan(WORKFLOWS, clocks, as_of=date(2026, 4, 1))

    assert [s.case_id for s in result.due] == ["good"]
    assert [f.case_id for f in result.faults] == ["bad-date"]
    assert result.faults[0].workflow == "noi"


def test_a_scan_result_cannot_be_edited_after_the_fact():
    """A verdict handed to a notifier must be the verdict the scan reached."""
    result = scan(WORKFLOWS, [noi_clock(started_on=date(2026, 1, 1))], as_of=MORTGAGED)
    with pytest.raises(AttributeError):
        result.due.append(None)


def test_a_clean_scan_needs_no_attention():
    result = scan(WORKFLOWS, [noi_clock()], as_of=MORTGAGED)
    assert result.needs_attention is False


def test_a_clock_evaluated_against_the_wrong_workflow_is_refused():
    """Every workflow starts at DOCUMENTS_RECEIVED, so the stage name alone
    would match and yield a deadline computed from the wrong statute."""
    mortgage_clock = CaseClock(
        case_id="AG-9",
        workflow="mortgage_registration",
        stage="DOCUMENTS_RECEIVED",
        started_on=MORTGAGED,
    )
    with pytest.raises(ValueError, match="clock is for 'mortgage_registration'"):
        evaluate(NOI, mortgage_clock, as_of=MORTGAGED)
