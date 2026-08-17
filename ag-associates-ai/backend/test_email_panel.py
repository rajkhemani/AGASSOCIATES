"""Tests for panel-client sender recognition.

The behaviour being protected is narrow but load-bearing: recognition decides
how a message is *handled*, never whether it survives. The list that stood here
before omitted three real panel clients and their mail was discarded, so these
tests pin both the classification and the fact that ICICI — named on the old
list, not a client — no longer walks straight into case creation.
"""

import os

import pytest

from email_intake.panel import (
    PANEL_INSTITUTIONS,
    Recognition,
    configured_domains,
    recognise,
)

KNOWN = ("kotak.com", "kvb.co.in")
PANEL_SIZE = 7


@pytest.fixture(autouse=True)
def _no_env_override(monkeypatch):
    """Each test states its own domains; the environment must not leak in."""
    monkeypatch.delenv("BANK_EMAIL_DOMAINS", raising=False)


# --------------------------------------------------------------------------
# Classification
# --------------------------------------------------------------------------


def test_a_configured_domain_is_recognised():
    assert recognise("ops@kotak.com", KNOWN) is Recognition.KNOWN


def test_a_subdomain_of_a_configured_domain_is_recognised():
    """Banks routinely send from a sending subdomain, not the apex."""
    assert recognise("noreply@loans.kotak.com", KNOWN) is Recognition.KNOWN


def test_a_domain_that_merely_ends_in_the_same_letters_is_not_recognised():
    """`notkotak.com` must not match `kotak.com` — suffix, not substring."""
    assert recognise("x@notkotak.com", KNOWN) is Recognition.UNKNOWN


def test_an_unconfigured_domain_is_unknown_not_rejected():
    assert recognise("someone@example.org", KNOWN) is Recognition.UNKNOWN


@pytest.mark.parametrize("sender", ["", "   ", "no-at-sign", "Name Only"])
def test_a_sender_with_no_parseable_domain_is_unparseable(sender):
    assert recognise(sender, KNOWN) is Recognition.UNPARSEABLE


def test_recognition_is_case_insensitive_on_the_domain():
    assert recognise("Ops@KOTAK.com", KNOWN) is Recognition.KNOWN


def test_a_display_name_form_still_resolves_the_domain():
    assert recognise("Kotak Ops <ops@kotak.com>", KNOWN) is Recognition.KNOWN


# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------


def test_the_built_in_default_is_used_when_nothing_is_configured():
    assert configured_domains() == ("kotak.com", "kotakmahindra.com")


def test_the_override_replaces_the_default_rather_than_extending_it():
    """An operator must be able to remove a wrong entry, not only add."""
    os.environ["BANK_EMAIL_DOMAINS"] = "kvb.co.in"
    try:
        assert configured_domains() == ("kvb.co.in",)
    finally:
        del os.environ["BANK_EMAIL_DOMAINS"]


def test_the_override_tolerates_whitespace_at_signs_and_case(monkeypatch):
    monkeypatch.setenv(
        "BANK_EMAIL_DOMAINS", "  @KVB.co.in , cholamandalam.com ,, @kotak.com "
    )
    assert configured_domains() == ("kvb.co.in", "cholamandalam.com", "kotak.com")


def test_a_blank_override_falls_back_to_the_default(monkeypatch):
    monkeypatch.setenv("BANK_EMAIL_DOMAINS", "   ")
    assert configured_domains() == ("kotak.com", "kotakmahindra.com")


# --------------------------------------------------------------------------
# The panel itself
# --------------------------------------------------------------------------


def test_the_panel_lists_the_seven_published_institutions():
    """Spelled out, so a name silently dropped or added fails here.

    A count alone would pass an edit that swapped one institution for another,
    which is exactly the class of change that lost three clients' mail.
    """
    assert set(PANEL_INSTITUTIONS) == {
        "Kotak Mahindra Bank Ltd.",
        "Kotak Mahindra Prime Ltd.",
        "Axis Finance Ltd.",
        "Karur Vysya Bank",
        "Cholamandalam Investment and Finance Company Ltd.",
        "Muthoot Homefin (India) Ltd.",
        "Easy Home Finance",
    }
    assert len(PANEL_INSTITUTIONS) == PANEL_SIZE  # no duplicates


def test_the_three_previously_dropped_clients_are_on_the_panel():
    """These were absent from the old filter, so their mail was discarded."""
    joined = " | ".join(PANEL_INSTITUTIONS)
    for client in ("Karur Vysya", "Cholamandalam", "Easy Home Finance"):
        assert client in joined


def test_no_non_client_lender_is_named_on_the_panel():
    joined = " ".join(PANEL_INSTITUTIONS).upper()
    for outsider in ("ICICI", "HDFC", "SBI", "YES BANK", "INDUSIND", "IDFC"):
        assert outsider not in joined


def test_a_non_client_sender_is_not_auto_processed_by_default():
    """ICICI was on the old list. It must now go to review, not to intake."""
    assert recognise("noreply@icicibank.com") is Recognition.UNKNOWN
