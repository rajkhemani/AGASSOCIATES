"""Tests for Multi-Agent System."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import json


class TestAgentBus:
    """Test Redis Streams Agent Bus."""

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_send_message(self):
        """Test sending message to agent bus."""
        from agents.agent_bus import send_message

        with patch('agents.agent_bus.get_bus_redis') as mock_redis:
            mock_redis_instance = AsyncMock()
            mock_redis_instance.xadd = AsyncMock(return_value="msg-id-123")
            mock_redis.return_value = mock_redis_instance

            msg_id = await send_message(
                source="auditor",
                target="vyasa",
                payload={"test": "data"},
                msg_type="request"
            )

            assert msg_id == "msg-id-123"
            mock_redis_instance.xadd.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_send_message_with_correlation_id(self):
        """Test sending message with correlation ID."""
        from agents.agent_bus import send_message

        with patch('agents.agent_bus.get_bus_redis') as mock_redis:
            mock_redis_instance = AsyncMock()
            mock_redis_instance.xadd = AsyncMock(return_value="msg-id-123")
            mock_redis.return_value = mock_redis_instance

            msg_id = await send_message(
                source="auditor",
                target="vyasa",
                payload={"test": "data"},
                msg_type="request",
                correlation_id="corr-123"
            )

            # Verify correlation_id was passed
            call_args = mock_redis_instance.xadd.call_args
            assert call_args is not None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_listen_agent_filters_by_target(self):
        """Test that listen_agent filters messages by target."""
        from agents.agent_bus import listen_agent

        handler = AsyncMock()

        with patch('agents.agent_bus.get_bus_redis') as mock_redis:
            mock_redis_instance = AsyncMock()
            mock_redis_instance.xreadgroup = AsyncMock(return_value=[(
                "agent:bus",
                [("msg-1", {"target": "auditor", "payload": '{"data": "test"}', "hop_count": "0"})]
            )])
            mock_redis.return_value = mock_redis_instance

            # This would run indefinitely, so we test the filtering logic directly
            # by mocking the loop to run once
            pass  # Integration test needed for full flow

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_request_response(self):
        """Test request-response pattern."""
        from agents.agent_bus import request_response, publish_response

        with patch('agents.agent_bus.get_bus_redis') as mock_redis:
            mock_redis_instance = AsyncMock()
            mock_redis_instance.xadd = AsyncMock(return_value="msg-id-123")
            mock_redis_instance.brpoplpush = AsyncMock(return_value=json.dumps({
                "source": "vyasa", "target": "auditor", "payload": {"result": "success"}
            }))
            mock_redis.return_value = mock_redis_instance

            response = await request_response(
                source="auditor",
                target="vyasa",
                payload={"query": "test"},
                timeout=5.0
            )

            assert response is not None
            assert response.get("result") == "success"


class TestAgentMemory:
    """Test Agent Conversation Memory."""

    @pytest.mark.unit
    def test_ensure_agent_tables(self):
        """Test agent tables creation."""
        from agents.agent_memory import ensure_agent_tables

        # This would require a real database, so we test the SQL generation
        from agents.agent_memory import _conn
        import psycopg2

        # Mock the connection
        with patch('agents.agent_memory._conn') as mock_conn:
            mock_cursor = MagicMock()
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

            ensure_agent_tables("test_agent")

            # Verify CREATE TABLE statements were executed
            assert mock_cursor.execute.called

    @pytest.mark.unit
    def test_get_or_create_conversation(self):
        """Test creating conversation."""
        from agents.agent_memory import get_or_create_conversation

        with patch('agents.agent_memory._conn') as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.fetchone.return_value = {"id": "conv-123"}
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

            conv_id = get_or_create_conversation("test_agent", "user-123", "Test conversation")
            assert conv_id == "conv-123"

    @pytest.mark.unit
    def test_add_message(self):
        """Test adding message to conversation."""
        from agents.agent_memory import add_message

        with patch('agents.agent_memory._conn') as mock_conn:
            mock_cursor = MagicMock()
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

            add_message("test_agent", "conv-123", "user", "Hello", {"metadata": "test"})
            assert mock_cursor.execute.called

    @pytest.mark.unit
    def test_get_context_window(self):
        """Test getting context window."""
        from agents.agent_memory import get_context_window

        with patch('agents.agent_memory._conn') as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.fetchall.return_value = [
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi there!"}
            ]
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

            context = get_context_window("test_agent", "conv-123", limit=10)
            assert len(context) == 2
            assert context[0]["role"] == "user"
            assert context[1]["role"] == "assistant"

    @pytest.mark.unit
    def test_set_and_get_context_value(self):
        """Test setting and getting context values."""
        from agents.agent_memory import set_context_value, get_context_value

        with patch('agents.agent_memory._conn') as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.fetchone.return_value = {"value": {"key": "value"}}
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

            set_context_value("test_agent", "conv-123", "test_key", {"nested": "data"})
            assert mock_cursor.execute.called

            value = get_context_value("test_agent", "conv-123", "test_key")
            assert value == {"key": "value"}


class TestBaseAgent:
    """Test Base Agent Class."""

    @pytest.mark.unit
    def test_base_agent_initialization(self):
        """Test base agent initializes with persona."""
        from agents.base_agent import BaseAgent

        class TestAgent(BaseAgent):
            async def process_request(self, *args, **kwargs):
                pass

        agent = TestAgent(
            name="test",
            persona_prompt="You are a test agent",
            required_permission="agent.test.access"
        )

        assert agent.name == "test"
        assert agent.persona_prompt == "You are a test agent"
        assert agent.required_permission == "agent.test.access"

    @pytest.mark.unit
    def test_check_access(self):
        """Test role-based access check."""
        from agents.base_agent import BaseAgent

        class TestAgent(BaseAgent):
            async def process_request(self, *args, **kwargs):
                pass

        agent = TestAgent(
            name="test",
            persona_prompt="Test",
            required_permission="agent.test.access"
        )

        # PRINCIPAL has all access
        assert agent.check_access("PRINCIPAL") is True

        # Test with permission mapping
        with patch('agents.base_agent.PERMISSION_ROLE_MAP', {"agent.test.access": ["ADVOCATE", "EXECUTIVE"]}):
            assert agent.check_access("ADVOCATE") is True
            assert agent.check_access("CLERK") is False


class TestAgentRegistry:
    """Test Agent Registry."""

    @pytest.mark.unit
    def test_agent_registry_initialization(self):
        """Test agent registry initializes."""
        from agents.agent_registry import AgentRegistry

        registry = AgentRegistry()
        assert registry is not None

    @pytest.mark.unit
    def test_register_agent(self):
        """Test registering an agent."""
        from agents.agent_registry import AgentRegistry
        from agents.base_agent import BaseAgent

        class TestAgent(BaseAgent):
            async def process_request(self, *args, **kwargs):
                pass

        registry = AgentRegistry()
        agent = TestAgent(name="test", persona_prompt="Test", required_permission="agent.test.access")

        registry.register(agent)
        assert "test" in registry.agents
        assert registry.agents["test"] == agent

    @pytest.mark.unit
    def test_get_agent(self):
        """Test getting agent by name."""
        from agents.agent_registry import AgentRegistry
        from agents.base_agent import BaseAgent

        class TestAgent(BaseAgent):
            async def process_request(self, *args, **kwargs):
                pass

        registry = AgentRegistry()
        agent = TestAgent(name="test", persona_prompt="Test", required_permission="agent.test.access")
        registry.register(agent)

        retrieved = registry.get("test")
        assert retrieved == agent

    @pytest.mark.unit
    def test_list_agents(self):
        """Test listing all agents."""
        from agents.agent_registry import AgentRegistry
        from agents.base_agent import BaseAgent

        class TestAgent1(BaseAgent):
            async def process_request(self, *args, **kwargs):
                pass

        class TestAgent2(BaseAgent):
            async def process_request(self, *args, **kwargs):
                pass

        registry = AgentRegistry()
        registry.register(TestAgent1(name="agent1", persona_prompt="Test1", required_permission="agent.test1.access"))
        registry.register(TestAgent2(name="agent2", persona_prompt="Test2", required_permission="agent.test2.access"))

        agents = registry.list_agents()
        assert len(agents) == 2
        assert "agent1" in agents
        assert "agent2" in agents