"""Tests for Executor Agent and RPA."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime


class TestExecutorAgent:
    """Test Executor Agent."""

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_executor_agent_initialization(self):
        """Test executor agent initializes correctly."""
        from agents.executor.agent import ExecutorAgent

        agent = ExecutorAgent()
        assert agent.name == "executor"
        assert agent.required_permission == "agent.executor.access"

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_executor_check_access_allowed(self):
        """Test executor access check for allowed role."""
        from agents.executor.agent import ExecutorAgent

        agent = ExecutorAgent()
        # EXECUTIVE should have access
        assert agent.check_access("EXECUTIVE") is True

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_executor_check_access_denied(self):
        """Test executor access check for denied role."""
        from agents.executor.agent import ExecutorAgent

        agent = ExecutorAgent()
        # BANK_VIEWER should not have access
        assert agent.check_access("BANK_VIEWER") is False


class TestIGRExecutor:
    """Test IGR RPA Executor."""

    @pytest.mark.unit
    def test_igr_executor_initialization(self):
        """Test IGR executor initializes with config."""
        from igr_executor import IgrRpaExecutor

        executor = IgrRpaExecutor()
        assert executor.portal_url is not None
        assert executor.portal_username is not None
        assert executor.sel is not None

    @pytest.mark.unit
    def test_igr_selectors_loaded(self):
        """Test that IGR selectors are loaded from config."""
        from igr_executor import IgrRpaExecutor

        executor = IgrRpaExecutor()
        expected_selectors = [
            "username_input",
            "password_input",
            "login_button",
            "otp_input",
            "otp_verify_button",
            "dashboard_indicator",
            "file_noi_link",
            "noi_form",
            "borrower_name_input",
            "loan_amount_input",
            "property_address_input",
            "property_city_input",
            "bank_name_input",
            "grn_input",
            "sanction_letter_upload",
            "borrower_kyc_upload",
            "stamp_duty_upload",
            "submit_button",
            "success_indicator",
            "acknowledgment_span",
        ]

        for selector in expected_selectors:
            assert selector in executor.sel

    @pytest.mark.unit
    def test_igr_upload_path_resolution(self):
        """Test document upload path resolution."""
        from igr_executor import IgrRpaExecutor

        executor = IgrRpaExecutor()
        path = executor._upload_path("sanction_letter", "TEST-123")
        assert "sanction_letter.pdf" in path
        assert "TEST-123" in path

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_igr_file_noi_requires_grn(self):
        """Test that IGR filing requires GRN."""
        from igr_executor import IgrRpaExecutor

        executor = IgrRpaExecutor()

        # Mock the circuit breaker check
        with patch.object(executor, '_check_igr_breaker', return_value=True):
            result = await executor.file_noi(
                case_id="TEST-123",
                borrower_name="Test",
                loan_amount="1000000",
                property_address="123 Street",
                property_city="Mumbai",
                bank_name="Kotak",
                grn_number=""  # Empty GRN
            )

        assert result["success"] is False
        assert "GRN number required" in result["error"]

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_igr_circuit_breaker_open(self):
        """Test IGR circuit breaker open returns HITL task."""
        from igr_executor import IgrRpaExecutor
        from circuit_breaker import CircuitState

        executor = IgrRpaExecutor()

        # Mock circuit breaker to return OPEN
        with patch('igr_executor.get_breaker') as mock_get_breaker:
            mock_breaker = AsyncMock()
            mock_breaker.state.return_value = CircuitState.OPEN
            mock_breaker.can_pass.return_value = False
            mock_get_breaker.return_value = mock_breaker

            with patch('igr_executor.hitl_queue.add_task', new_callable=AsyncMock) as mock_add_task:
                result = await executor.file_noi(
                    case_id="TEST-123",
                    borrower_name="Test",
                    loan_amount="1000000",
                    property_address="123 Street",
                    property_city="Mumbai",
                    bank_name="Kotak",
                    grn_number="GRN123"
                )

        assert result["success"] is False
        assert result["hitl"] is True
        assert "circuit breaker" in result["error"].lower()
        mock_add_task.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_igr_wait_for_otp_timeout(self):
        """Test OTP wait timeout."""
        from igr_executor import IgrRpaExecutor

        executor = IgrRpaExecutor()

        with patch('redis.asyncio.from_url') as mock_redis:
            mock_redis_instance = AsyncMock()
            mock_redis_instance.get.return_value = None  # No OTP
            mock_redis.return_value = mock_redis_instance

            otp = await executor._wait_for_otp("igr:TEST-123", timeout_seconds=1)
            assert otp is None


class TestGRASExecutor:
    """Test GRAS Challan Executor."""

    @pytest.mark.unit
    def test_gras_executor_import(self):
        """Test GRAS executor can be imported."""
        # This will fail if the module doesn't exist
        try:
            from executor_agent import executor_agent
            assert executor_agent is not None
        except ImportError:
            pytest.skip("GRAS executor not implemented yet")


class TestCircuitBreaker:
    """Test Circuit Breaker functionality."""

    @pytest.mark.unit
    def test_circuit_breaker_states(self):
        """Test circuit breaker state enum."""
        from circuit_breaker import CircuitState

        assert CircuitState.CLOSED.value == "closed"
        assert CircuitState.OPEN.value == "open"
        assert CircuitState.HALF_OPEN.value == "half_open"

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_circuit_breaker_record_success(self):
        """Test recording success closes breaker."""
        from circuit_breaker import get_breaker, CircuitState

        breaker = get_breaker("test_breaker")

        # Record failures to open
        for _ in range(5):
            await breaker.record_failure("test error")

        state = await breaker.state()
        assert state == CircuitState.OPEN

        # Record successes to close
        for _ in range(3):
            await breaker.record_success()

        state = await breaker.state()
        assert state == CircuitState.CLOSED


class TestHITLQueue:
    """Test Human-in-the-Loop Queue."""

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_hitl_add_task(self):
        """Test adding task to HITL queue."""
        from hitl_queue import hitl_queue

        task_id = await hitl_queue.add_task(
            portal="igr",
            case_id="TEST-123",
            action="file_noi",
            payload={"test": "data"},
            reason="Test reason"
        )

        assert task_id is not None

        # Verify task was added
        tasks = await hitl_queue.list_pending()
        assert any(t["id"] == task_id for t in tasks)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_hitl_claim_task(self):
        """Test claiming HITL task."""
        from hitl_queue import hitl_queue

        task_id = await hitl_queue.add_task(
            portal="igr",
            case_id="TEST-123",
            action="file_noi",
            payload={},
            reason="Test"
        )

        task = await hitl_queue.claim_task(task_id, "test_user")
        assert task is not None
        assert task["claimed_by"] == "test_user"

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_hitl_complete_task(self):
        """Test completing HITL task."""
        from hitl_queue import hitl_queue

        task_id = await hitl_queue.add_task(
            portal="igr",
            case_id="TEST-123",
            action="file_noi",
            payload={},
            reason="Test"
        )

        await hitl_queue.claim_task(task_id, "test_user")
        task = await hitl_queue.complete_task(task_id, "Completed successfully")
        assert task is not None
        assert task["status"] == "completed"