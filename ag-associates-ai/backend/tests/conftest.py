"""Pytest configuration and fixtures for ag-associates-ai tests."""

import os
import sys
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from unittest.mock import AsyncMock, MagicMock, patch

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Set test environment variables BEFORE importing any modules
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("LLM_MOCK_MODE", "true")
os.environ.setdefault("DATABASE_PASSWORD", "test_password")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test_jwt_secret")
os.environ.setdefault("N8N_WEBHOOK_KEY", "test_webhook_key")
os.environ.setdefault("TELEGRAM_BOT_TOKEN", "test_bot_token")
os.environ.setdefault("IGR_PORTAL_USERNAME", "test_user")
os.environ.setdefault("IGR_PORTAL_PASSWORD", "test_pass")
os.environ.setdefault("ZOHO_EMAIL_PASS", "test_email_pass")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")

# Mock external dependencies BEFORE they're imported
sys.modules['pgvector'] = MagicMock()
sys.modules['pgvector.psycopg2'] = MagicMock()
sys.modules['playwright'] = MagicMock()
sys.modules['playwright.async_api'] = MagicMock()
sys.modules['redis'] = MagicMock()
sys.modules['redis.asyncio'] = MagicMock()
sys.modules['fakeredis'] = MagicMock()
sys.modules['psycopg2'] = MagicMock()
sys.modules['psycopg2.extras'] = MagicMock()
sys.modules['sentence_transformers'] = MagicMock()
sys.modules['langchain'] = MagicMock()
sys.modules['langchain_community'] = MagicMock()
sys.modules['langchain_openai'] = MagicMock()
sys.modules['langgraph'] = MagicMock()
sys.modules['langsmith'] = MagicMock()
sys.modules['crewai'] = MagicMock()
sys.modules['gspread'] = MagicMock()
sys.modules['pdfplumber'] = MagicMock()
sys.modules['pdfkit'] = MagicMock()
sys.modules['boto3'] = MagicMock()
sys.modules['soundfile'] = MagicMock()
sys.modules['faster_whisper'] = MagicMock()
sys.modules['piper_tts'] = MagicMock()
sys.modules['openwakeword'] = MagicMock()
sys.modules['sounddevice'] = MagicMock()

# Mock structlog
structlog_mock = MagicMock()
structlog_mock.get_logger = MagicMock(return_value=MagicMock())
structlog_mock.configure = MagicMock()
structlog_mock.stdlib = MagicMock()
structlog_mock.processors = MagicMock()
structlog_mock.dev = MagicMock()
structlog_mock.contextvars = MagicMock()
sys.modules['structlog'] = structlog_mock
sys.modules['structlog.stdlib'] = structlog_mock.stdlib
sys.modules['structlog.processors'] = structlog_mock.processors
sys.modules['structlog.dev'] = structlog_mock.dev
sys.modules['structlog.contextvars'] = structlog_mock.contextvars

# Mock prometheus_client
prometheus_mock = MagicMock()
prometheus_mock.Counter = MagicMock
prometheus_mock.Histogram = MagicMock
prometheus_mock.Gauge = MagicMock
prometheus_mock.CollectorRegistry = MagicMock
prometheus_mock.generate_latest = MagicMock
prometheus_mock.CONTENT_TYPE_LATEST = "text/plain"
sys.modules['prometheus_client'] = prometheus_mock

# Mock opentelemetry
otel_mock = MagicMock()
otel_mock.trace = MagicMock()
otel_mock.sdk = MagicMock()
otel_mock.sdk.trace = MagicMock()
otel_mock.sdk.resources = MagicMock()
otel_mock.exporter = MagicMock()
otel_mock.exporter.prometheus = MagicMock()
otel_mock.metrics = MagicMock()
otel_mock.sdk.metrics = MagicMock()
sys.modules['opentelemetry'] = otel_mock
sys.modules['opentelemetry.trace'] = otel_mock.trace
sys.modules['opentelemetry.sdk'] = otel_mock.sdk
sys.modules['opentelemetry.sdk.trace'] = otel_mock.sdk.trace
sys.modules['opentelemetry.sdk.resources'] = otel_mock.sdk.resources
sys.modules['opentelemetry.exporter'] = otel_mock.exporter
sys.modules['opentelemetry.exporter.prometheus'] = otel_mock.exporter.prometheus
sys.modules['opentelemetry.metrics'] = otel_mock.metrics
sys.modules['opentelemetry.sdk.metrics'] = otel_mock.sdk.metrics

# Mock tenacity
tenacity_mock = MagicMock()
tenacity_mock.retry = MagicMock
tenacity_mock.stop_after_attempt = MagicMock
tenacity_mock.wait_exponential = MagicMock
tenacity_mock.retry_if_exception_type = MagicMock
sys.modules['tenacity'] = tenacity_mock

# Now import config after mocks are set up
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


# Mock the agents module imports to avoid external dependencies
@pytest.fixture(autouse=True)
def mock_agents_module():
    """Mock agents module to avoid external dependencies."""
    with patch.dict('sys.modules', {
        'agents': MagicMock(),
        'agents.db': MagicMock(),
        'agents.agent_bus': MagicMock(),
        'agents.agent_memory': MagicMock(),
        'agents.agent_registry': MagicMock(),
        'agents.base_agent': MagicMock(),
        'agents.auditor': MagicMock(),
        'agents.vyasa': MagicMock(),
        'agents.bouncer': MagicMock(),
        'agents.accountant': MagicMock(),
        'agents.noi': MagicMock(),
        'agents.executor': MagicMock(),
        'agents.drafter': MagicMock(),
        'agents.agent_init': MagicMock(),
        'agents.stamp_duty': MagicMock(),
    }):
        yield


# Test markers
def pytest_configure(config):
    config.addinivalue_line("markers", "unit: Unit tests")
    config.addinivalue_line("markers", "integration: Integration tests")
    config.addinivalue_line("markers", "slow: Slow tests")
    config.addinivalue_line("markers", "requires_vllm: Tests requiring vLLM")
    config.addinivalue_line("markers", "requires_db: Tests requiring database")