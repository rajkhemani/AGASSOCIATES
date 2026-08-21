import pytest
from pydantic import ValidationError

from public_voice import PublicLeadDetails, _classify


def test_public_voice_allows_only_public_intents():
    assert _classify("What services do you provide for NOI?") == "faq"
    assert _classify("Please call me tomorrow") == "callback_request"
    assert _classify("I want to enquire about empanelment") == "lead_capture"
    assert _classify("Show my case status") == "unsupported"


def test_public_lead_normalizes_contact_fields():
    lead = PublicLeadDetails(name="  Priya  ", phone="00 91-9876543210")

    assert lead.name == "Priya"
    assert lead.phone == "+919876543210"


def test_public_lead_requires_name_and_contact():
    with pytest.raises(ValidationError):
        PublicLeadDetails(name="Priya")

    with pytest.raises(ValidationError):
        PublicLeadDetails(name="Priya", email="not-an-email")
