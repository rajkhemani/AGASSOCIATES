"""Which senders the intake recognises as panel clients.

The sender filter used to be a hardcoded list of thirteen bank domains that did
not match the firm's actual panel. It named institutions the firm does not act
for, and omitted three that it does — so mail from real clients was discarded
before it was read, silently, by a `continue`.

Two changes follow from that.

First, the recognised set is configuration rather than code. `BANK_EMAIL_DOMAINS`
overrides it entirely, so a new client can be onboarded without a deploy.

Second, and more important: recognition now only decides *how* a message is
handled, never *whether*. An unrecognised sender is set aside for a human to
look at, not dropped. An incomplete domain list is then a nuisance rather than
silent data loss — which matters because several panel entities do not send
from the domain their brand name suggests, and guessing at one would reinstate
exactly the bug this replaces.

Institution names track the published panel in `apps/web/src/content/site.ts`.
"""

from __future__ import annotations

import os
import re
from enum import StrEnum

__all__ = [
    "PANEL_INSTITUTIONS",
    "Recognition",
    "configured_domains",
    "recognise",
]

#: The firm's panel, as published. Kept here so the intake and the website
#: cannot drift apart without someone noticing.
PANEL_INSTITUTIONS = (
    "Kotak Mahindra Bank Ltd.",
    "Kotak Mahindra Prime Ltd.",
    "Axis Finance Ltd.",
    "Karur Vysya Bank",
    "Cholamandalam Investment and Finance Company Ltd.",
    "Muthoot Homefin (India) Ltd.",
    "Easy Home Finance",
)

#: Domains confirmed to belong to panel clients. Deliberately shorter than
#: PANEL_INSTITUTIONS: several panel entities are NBFC subsidiaries that do not
#: necessarily send from the parent bank's domain, and an unverified guess here
#: would route a stranger's mail straight into case creation. Add confirmed
#: domains via BANK_EMAIL_DOMAINS rather than by guessing.
_CONFIRMED_DOMAINS = (
    "kotak.com",
    "kotakmahindra.com",
)

_SENDER = re.compile(r"@([\w.-]+)")


class Recognition(StrEnum):
    """Why a message was or was not recognised, for logging and triage.

    A closed set rather than bare strings, so a typo at a call site fails
    rather than silently comparing unequal and sending mail to review.
    """

    KNOWN = "known"
    UNKNOWN = "unknown"
    UNPARSEABLE = "unparseable"


def configured_domains() -> tuple[str, ...]:
    """The domains treated as panel clients for this process.

    `BANK_EMAIL_DOMAINS` replaces the built-in list rather than extending it,
    so an operator can correct a wrong entry, not only add to it.
    """
    override = os.environ.get("BANK_EMAIL_DOMAINS", "").strip()
    if not override:
        return _CONFIRMED_DOMAINS
    return tuple(
        part.strip().lower().lstrip("@") for part in override.split(",") if part.strip()
    )


def recognise(sender: str, domains: tuple[str, ...] | None = None) -> Recognition:
    """Classify a sender. Never a reason on its own to discard the message.

    Subdomains count: mail from `noreply.loans.example.com` matches a
    configured `example.com`, since banks commonly send from one.
    """
    match = _SENDER.search(sender or "")
    if not match:
        return Recognition.UNPARSEABLE

    domain = match.group(1).lower().rstrip(".")
    for known in domains if domains is not None else configured_domains():
        if domain == known or domain.endswith("." + known):
            return Recognition.KNOWN
    return Recognition.UNKNOWN
