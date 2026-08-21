from public_voice import _classify


def test_public_voice_allows_only_public_intents():
    assert _classify("What services do you provide for NOI?") == "faq"
    assert _classify("Please call me tomorrow") == "callback_request"
    assert _classify("I want to enquire about empanelment") == "lead_capture"
    assert _classify("Show my case status") == "unsupported"

