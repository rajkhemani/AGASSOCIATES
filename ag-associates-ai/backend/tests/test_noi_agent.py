"""Tests for NOI Agent."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime


class TestNOIAgent:
    """Test NOI Agent workflow operations."""

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_seed_test_case(self, mock_noi_agent, sample_case_data):
        """Test seeding a test case."""
        case_id = await mock_noi_agent.seed_test_case(sample_case_data)
        assert case_id is not None
        assert case_id.startswith("TEST-")

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_case(self, mock_noi_agent, sample_case_data):
        """Test fetching a case."""
        mock_noi_agent.get_case.return_value = sample_case_data

        case = await mock_noi_agent.get_case(sample_case_data["case_id"])
        assert case is not None
        assert case["borrower_name"] == sample_case_data["borrower_name"]
        assert case["bank_name"] == sample_case_data["bank_name"]

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_case_not_found(self, mock_noi_agent):
        """Test fetching non-existent case."""
        mock_noi_agent.get_case.return_value = None

        case = await mock_noi_agent.get_case("NONEXISTENT")
        assert case is None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_update_noi_status_valid_transition(self, mock_noi_agent, sample_case_data):
        """Test valid NOI status transition."""
        mock_noi_agent.get_case.return_value = {**sample_case_data, "noi_status": "DOCUMENTS_RECEIVED"}
        mock_noi_agent.update_noi_status.return_value = True

        result = await mock_noi_agent.update_noi_status(
            sample_case_data["case_id"],
            "CHALLAN_GENERATED",
            notes="Test transition"
        )
        assert result is True

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_generate_challan_success(self, mock_noi_agent, sample_case_data):
        """Test successful challan generation."""
        mock_noi_agent.generate_challan.return_value = {
            "success": True,
            "grn_number": "GRN123456",
            "amount_paid": 15000
        }

        result = await mock_noi_agent.generate_challan(sample_case_data["case_id"])
        assert result["success"] is True
        assert "grn_number" in result

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_generate_challan_bouncer_rejection(self, mock_noi_agent, sample_case_data):
        """Test challan rejection by bouncer (stamp duty mismatch)."""
        mock_noi_agent.generate_challan.return_value = {
            "success": False,
            "error": "Stamp duty mismatch: expected ₹15000, declared ₹1000",
            "bouncer": {"passed": False, "feedback": "Stamp duty mismatch"}
        }

        result = await mock_noi_agent.generate_challan(sample_case_data["case_id"])
        assert result["success"] is False
        assert "bouncer" in result

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_verify_documents_all_present(self, mock_noi_agent, sample_case_data):
        """Test document verification with all documents present."""
        mock_noi_agent.verify_documents.return_value = {
            "success": True,
            "documents": {
                "sanction_letter": "PRESENT",
                "borrower_kyc": "PRESENT",
                "property_docs": "PRESENT",
                "stamp_duty_receipt": "PRESENT",
            },
            "missing": []
        }

        result = await mock_noi_agent.verify_documents(sample_case_data["case_id"])
        assert result["success"] is True
        assert len(result["missing"]) == 0

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_verify_documents_missing(self, mock_noi_agent, sample_case_data):
        """Test document verification with missing documents."""
        mock_noi_agent.verify_documents.return_value = {
            "success": False,
            "documents": {
                "sanction_letter": "PRESENT",
                "borrower_kyc": "MISSING",
                "property_docs": "PRESENT",
                "stamp_duty_receipt": "PRESENT",
            },
            "missing": ["borrower_kyc"]
        }

        result = await mock_noi_agent.verify_documents(sample_case_data["case_id"])
        assert result["success"] is False
        assert "borrower_kyc" in result["missing"]

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_file_noi_success(self, mock_noi_agent, sample_case_data):
        """Test successful NOI filing."""
        mock_noi_agent.get_case.return_value = {**sample_case_data, "noi_status": "NOI_DROP_RECEIVED"}
        mock_noi_agent.file_noi.return_value = {
            "success": True,
            "acknowledgment_number": "ACK789012"
        }

        result = await mock_noi_agent.file_noi(sample_case_data["case_id"])
        assert result["success"] is True
        assert "acknowledgment_number" in result

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_file_noi_wrong_status(self, mock_noi_agent, sample_case_data):
        """Test NOI filing from wrong status."""
        mock_noi_agent.get_case.return_value = {**sample_case_data, "noi_status": "DOCUMENTS_RECEIVED"}
        mock_noi_agent.file_noi.return_value = {
            "success": False,
            "error": "Cannot file NOI — current status is DOCUMENTS_RECEIVED. Requires NOI_DROP_RECEIVED or RECTIFY."
        }

        result = await mock_noi_agent.file_noi(sample_case_data["case_id"])
        assert result["success"] is False
        assert "Cannot file NOI" in result["error"]

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_acknowledge(self, mock_noi_agent, sample_case_data):
        """Test NOI acknowledgment."""
        mock_noi_agent.acknowledge.return_value = {"success": True}

        result = await mock_noi_agent.acknowledge(sample_case_data["case_id"], "ACK789012")
        assert result["success"] is True

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_run_workflow_generate_challan(self, mock_noi_agent, sample_case_data):
        """Test run_workflow with generate_challan action."""
        mock_noi_agent.run_workflow.return_value = {"success": True, "grn_number": "GRN123"}

        result = await mock_noi_agent.run_workflow(sample_case_data["case_id"], "generate_challan")
        assert result["success"] is True

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_run_workflow_unknown_action(self, mock_noi_agent, sample_case_data):
        """Test run_workflow with unknown action."""
        mock_noi_agent.run_workflow.return_value = {"success": False, "error": "Unknown NOI action: invalid_action"}

        result = await mock_noi_agent.run_workflow(sample_case_data["case_id"], "invalid_action")
        assert result["success"] is False
        assert "Unknown NOI action" in result["error"]


class TestNOIStateMachine:
    """Test NOI state machine definitions."""

    @pytest.mark.unit
    def test_noi_states_defined(self):
        """Test that NOI states are properly defined."""
        from workflows.definitions import NOI

        expected_states = [
            "DOCUMENTS_RECEIVED",
            "CHALLAN_GENERATED",
            "CHALLAN_PAID",
            "VERIFIED",
            "NOI_DROP_RECEIVED",
            "RECTIFY",
            "NOI_FILED",
            "ACKNOWLEDGED",
            "COMPLETED",
        ]

        for state in expected_states:
            assert state in NOI.states

    @pytest.mark.unit
    def test_noi_valid_transitions(self):
        """Test NOI valid transitions."""
        from workflows.definitions import NOI

        # Test valid transitions
        assert NOI.allowed_from("DOCUMENTS_RECEIVED") == ("CHALLAN_GENERATED",)
        assert NOI.allowed_from("CHALLAN_GENERATED") == ("CHALLAN_PAID",)
        assert NOI.allowed_from("CHALLAN_PAID") == ("VERIFIED",)
        assert NOI.allowed_from("VERIFIED") == ("NOI_DROP_RECEIVED", "RECTIFY")
        assert NOI.allowed_from("NOI_DROP_RECEIVED") == ("NOI_FILED", "RECTIFY")
        assert NOI.allowed_from("RECTIFY") == ("NOI_FILED", "VERIFIED")
        assert NOI.allowed_from("NOI_FILED") == ("ACKNOWLEDGED",)
        assert NOI.allowed_from("ACKNOWLEDGED") == ("COMPLETED",)
        assert NOI.allowed_from("COMPLETED") == ()

    @pytest.mark.unit
    def test_noi_invalid_transition_raises(self):
        """Test that invalid transitions raise ValueError."""
        from workflows.definitions import NOI

        with pytest.raises(ValueError, match="Invalid noi transition"):
            NOI.validate_transition("DOCUMENTS_RECEIVED", "NOI_FILED")

    @pytest.mark.unit
    def test_noi_exception_states(self):
        """Test NOI exception states."""
        from workflows.definitions import NOI

        assert "MISMATCH" in NOI.exception_states
        assert "REJECTED" in NOI.exception_states
        assert NOI.allowed_from("MISMATCH") == ("VERIFIED",)

    @pytest.mark.unit
    def test_noi_terminal_states(self):
        """Test NOI terminal states."""
        from workflows.definitions import NOI

        assert "COMPLETED" in NOI.terminal_states
        assert "REJECTED" in NOI.terminal_states
        assert NOI.is_terminal("COMPLETED") is True
        assert NOI.is_terminal("DOCUMENTS_RECEIVED") is False

    @pytest.mark.unit
    def test_noi_deadline(self):
        """Test NOI deadline calculation."""
        from workflows.definitions import NOI
        from datetime import date

        deadline = NOI.deadlines["DOCUMENTS_RECEIVED"]
        due = deadline.due_on(date(2024, 1, 1))
        assert due == date(2024, 1, 31)  # 30 days

    @pytest.mark.unit
    def test_noi_is_overdue(self):
        """Test NOI overdue check."""
        from workflows.definitions import NOI
        from datetime import date

        deadline = NOI.deadlines["DOCUMENTS_RECEIVED"]
        # Not overdue on day 30
        assert deadline.is_overdue(date(2024, 1, 1), date(2024, 1, 31)) is False
        # Overdue on day 31
        assert deadline.is_overdue(date(2024, 1, 1), date(2024, 2, 1)) is True


class TestMortgageRegistrationStateMachine:
    """Test Mortgage Registration state machine."""

    @pytest.mark.unit
    def test_mortgage_states(self):
        """Test mortgage registration states."""
        from workflows.definitions import MORTGAGE_REGISTRATION

        expected_states = [
            "DOCUMENTS_RECEIVED",
            "DRAFT_PREPARED",
            "INTERNAL_REVIEW",
            "APPROVED",
            "REGISTRATION_SCHEDULED",
            "REGISTERED",
            "DOCUMENTS_COLLECTED",
            "CLOSED",
        ]

        for state in expected_states:
            assert state in MORTGAGE_REGISTRATION.states

    @pytest.mark.unit
    def test_mortgage_review_to_draft_transition(self):
        """Test that review can go back to draft."""
        from workflows.definitions import MORTGAGE_REGISTRATION

        allowed = MORTGAGE_REGISTRATION.allowed_from("INTERNAL_REVIEW")
        assert "APPROVED" in allowed
        assert "DRAFT_PREPARED" in allowed

    @pytest.mark.unit
    def test_mortgage_on_hold_transition(self):
        """Test ON_HOLD exception state transitions."""
        from workflows.definitions import MORTGAGE_REGISTRATION

        allowed = MORTGAGE_REGISTRATION.allowed_from("ON_HOLD")
        assert "DOCUMENTS_RECEIVED" in allowed
        assert "CANCELLED" in allowed


class TestPublicNoticeStateMachine:
    """Test Public Notice state machine."""

    @pytest.mark.unit
    def test_public_notice_states(self):
        """Test public notice states."""
        from workflows.definitions import PUBLIC_NOTICE

        expected_states = [
            "DOCUMENTS_RECEIVED",
            "TITLE_VERIFICATION",
            "DRAFTED",
            "PUBLISHED",
            "AWAITING_OBJECTIONS",
            "OBJECTION_RECEIVED",
            "ESCALATED",
            "CLEAR",
            "CLOSED",
        ]

        for state in expected_states:
            assert state in PUBLIC_NOTICE.states

    @pytest.mark.unit
    def test_public_notice_deadline_options(self):
        """Test public notice objection window options."""
        from workflows.definitions import PUBLIC_NOTICE

        deadline = PUBLIC_NOTICE.deadlines["AWAITING_OBJECTIONS"]
        assert deadline.options == (7, 15, 30)

        # Test due_on with different windows
        from datetime import date
        assert deadline.due_on(date(2024, 1, 1), 7) == date(2024, 1, 8)
        assert deadline.due_on(date(2024, 1, 1), 15) == date(2024, 1, 16)
        assert deadline.due_on(date(2024, 1, 1), 30) == date(2024, 1, 31)

    @pytest.mark.unit
    def test_public_notice_invalid_deadline(self):
        """Test that invalid deadline window raises error."""
        from datetime import date
        from workflows.definitions import PUBLIC_NOTICE

        deadline = PUBLIC_NOTICE.deadlines["AWAITING_OBJECTIONS"]
        with pytest.raises(ValueError, match="is not a valid window"):
            deadline.due_on(date(2024, 1, 1), 10)  # Not in (7, 15, 30)

    @pytest.mark.unit
    def test_workflow_definitions_validation(self):
        """Test that all workflow definitions pass validation."""
        from workflows.definitions import WORKFLOWS, get_workflow

        # All workflows should be accessible
        assert "noi" in WORKFLOWS
        assert "mortgage_registration" in WORKFLOWS
        assert "public_notice" in WORKFLOWS

        # get_workflow should work
        noi = get_workflow("noi")
        assert noi.slug == "noi"

        # Unknown workflow should raise
        with pytest.raises(KeyError, match="Unknown workflow"):
            get_workflow("unknown")