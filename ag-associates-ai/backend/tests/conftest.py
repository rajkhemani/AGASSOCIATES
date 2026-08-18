"""Pytest configuration and fixtures for ag-associates-ai tests."""

import os
import sys
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from unittest.mock import AsyncMock, MagicMock, patch

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Set test environment variables before importing config
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("LLM_MOCK_MODE", "true")
os.environ.setdefault("DATABASE_PASSWORD", "test_password")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test_jwt_secret")
os.environ.setdefault("N8N_WEBHOOK_KEY", "test_webhook_key")
os.environ.setdefault("TELEGRAM_BOT_TOKEN", "test_bot_token")
os.environ.setdefault("IGR_PORTAL_USERNAME", "test_user")
os.environ.setdefault("IGR_PORTAL_PASSWORD", "test_pass")
os.environ.setdefault("ZOHO_EMAIL_PASS", "test_email_pass")

from config import LLM_MOCK_MODE


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
def mock_llm_mode():
    """Ensure LLM_MOCK_MODE is enabled for all tests."""
    with patch('config.LLM_MOCK_MODE', True):
        yield


@pytest.fixture
def mock_redis():
    """Mock Redis client."""
    with patch('redis.asyncio.from_url') as mock:
        redis_mock = AsyncMock()
        mock.return_value = redis_mock
        yield redis_mock


@pytest.fixture
def mock_supabase():
    """Mock Supabase client."""
    with patch('supabase.create_client') as mock:
        supabase_mock = MagicMock()
        mock.return_value = supabase_mock
        yield supabase_mock


@pytest.fixture
def mock_httpx():
    """Mock httpx AsyncClient."""
    with patch('httpx.AsyncClient') as mock:
        client_mock = AsyncMock()
        mock.return_value.__aenter__.return_value = client_mock
        yield client_mock


@pytest.fixture
def sample_case_data():
    """Sample case data for testing."""
    return {
        "case_id": "TEST-20240101000000",
        "borrower_name": "Test Borrower",
        "bank_name": "Kotak Mahindra Bank",
        "loan_amount": "5000000",
        "property_address": "123 Test Street, Thane",
        "property_city": "Thane",
        "grn_number": "GRN123456",
        "acknowledgment_number": "ACK789012",
    }


@pytest.fixture
def mock_noi_agent():
    """Mock NOI Agent for testing."""
    from unittest.mock import AsyncMock
    from noi_agent import NOIAgent

    agent = NOIAgent()
    agent.get_case = AsyncMock()
    agent.update_noi_status = AsyncMock(return_value=True)
    agent.generate_challan = AsyncMock(return_value={"success": True, "grn_number": "GRN123"})
    agent.verify_documents = AsyncMock(return_value={"success": True, "documents": {}})
    agent.file_noi = AsyncMock(return_value={"success": True, "acknowledgment_number": "ACK123"})
    agent.acknowledge = AsyncMock(return_value={"success": True})
    return agent


# Test markers
def pytest_configure(config):
    config.addinivalue_line("markers", "unit: Unit tests")
    config.addinivalue_line("markers", "integration: Integration tests")
    config.addinivalue_line("markers", "slow: Slow tests")
    config.addinivalue_line("markers", "requires_vllm: Tests requiring vLLM")
    config.addinivalue_line("markers", "requires_db: Tests requiring database")