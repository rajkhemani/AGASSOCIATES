import os
from dotenv import load_dotenv

load_dotenv()


def _env_bool(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _env_list(name: str, default: str = "") -> list[str]:
    raw = os.getenv(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


def _required_env(name: str) -> str:
    """Get required environment variable, raise if not set."""
    value = os.getenv(name)
    if not value:
        raise ValueError(f"Required environment variable {name} is not set")
    return value


def _optional_env(name: str, default: str = "") -> str:
    """Get optional environment variable with default."""
    return os.getenv(name, default)


# Database Configuration - NO DEFAULTS for secrets
DATABASE_HOST = _optional_env("DATABASE_HOST", "localhost")
DATABASE_PORT = _optional_env("DATABASE_PORT", "5432")
DATABASE_NAME = _optional_env("DATABASE_NAME", "legal_templates_db")
DATABASE_USER = _optional_env("DATABASE_USER", "ag_admin")
DATABASE_PASSWORD = _required_env("DATABASE_PASSWORD")  # REQUIRED - no default

# vLLM/LLM Configuration
LLM_BASE_URL = _optional_env("LLM_BASE_URL", "http://localhost:8000/v1")
LLM_MODEL_NAME = _optional_env("LLM_MODEL_NAME", "qwen2.5-7b-instruct")
LLM_MOCK_MODE = _env_bool("LLM_MOCK_MODE", default=False)

# Vision Model Configuration (for image/PDF OCR + analysis)
LLM_VISION_MODEL = _optional_env("LLM_VISION_MODEL", "gemini-2.0-flash")
LLM_VISION_BASE_URL = _optional_env(
    "LLM_VISION_BASE_URL", "https://generativelanguage.googleapis.com/v1beta"
)
LLM_VISION_API_KEY = _optional_env("LLM_VISION_API_KEY", "")

# Agent Configuration
AGENT_MAX_TOOL_CALLS = int(_optional_env("AGENT_MAX_TOOL_CALLS", "5"))
AGENT_REACT_TIMEOUT = float(_optional_env("AGENT_REACT_TIMEOUT", "120"))

# Embedding Model Configuration
EMBEDDING_MODEL_NAME = _optional_env(
    "EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2"
)
EMBEDDING_DIMENSION = int(_optional_env("EMBEDDING_DIMENSION", "384"))

# PDF Generation Configuration
OUTPUT_DIR = _optional_env(
    "OUTPUT_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "output"),
)
PDF_ENABLED = _env_bool("PDF_ENABLED", default=False)

# Environment
ENVIRONMENT = _optional_env("ENVIRONMENT", "development")
IS_PRODUCTION = ENVIRONMENT == "production"

# API Configuration
API_HOST = _optional_env("API_HOST", "0.0.0.0")
API_PORT = int(_optional_env("API_PORT", "8000"))
CORS_ALLOWED_ORIGINS = _env_list("CORS_ALLOWED_ORIGINS", "")
LOG_LEVEL = _optional_env("LOG_LEVEL", "INFO").upper()

# Sentry Configuration
SENTRY_DSN = _optional_env("SENTRY_DSN", "")
SENTRY_TRACES_SAMPLE_RATE = float(_optional_env("SENTRY_TRACES_SAMPLE_RATE", "0.1" if IS_PRODUCTION else "1.0"))
SENTRY_PROFILES_SAMPLE_RATE = float(_optional_env("SENTRY_PROFILES_SAMPLE_RATE", "0.01" if IS_PRODUCTION else "1.0"))

# Supabase Auth Configuration - REQUIRED for production
SUPABASE_JWT_SECRET = _required_env("SUPABASE_JWT_SECRET")

# N8N Webhook Key - REQUIRED
N8N_WEBHOOK_KEY = _required_env("N8N_WEBHOOK_KEY")

# LLM Mock Mode
LLM_MOCK_MODE = _env_bool("LLM_MOCK_MODE", default=False)

# NeSL filing
NESL_MOCK_DELAY_SEC = float(_optional_env("NESL_MOCK_DELAY_SEC", "3"))
NESL_USE_MOCK = _env_bool("NESL_USE_MOCK", default=True)
NESL_API_BASE_URL = _optional_env("NESL_API_BASE_URL", "")
NESL_API_KEY = _optional_env("NESL_API_KEY", "")
NESL_CLIENT_ID = _optional_env("NESL_CLIENT_ID", "")
NESL_CLIENT_SECRET = _optional_env("NESL_CLIENT_SECRET", "")
NESL_REQUEST_TIMEOUT_SEC = float(_optional_env("NESL_REQUEST_TIMEOUT_SEC", "30"))

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN = _required_env("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = _optional_env("TELEGRAM_CHAT_ID", "")
TELEGRAM_WEBHOOK_SECRET = _optional_env("TELEGRAM_WEBHOOK_SECRET", "")
TELEGRAM_WEBHOOK_HOST = _optional_env("TELEGRAM_WEBHOOK_HOST", "")

# IGR Portal Configuration
IGR_PORTAL_USERNAME = _required_env("IGR_PORTAL_USERNAME")
IGR_PORTAL_PASSWORD = _required_env("IGR_PORTAL_PASSWORD")

# GRAS Portal Configuration
GRAS_PORTAL_URL = _optional_env("GRAS_PORTAL_URL", "https://gras.mahakosh.gov.in/echallan/")

# Zoho Mail Configuration (for Email Intake Agent)
ZOHO_EMAIL_USER = _optional_env("ZOHO_EMAIL_USER", "admin@advadiityagade.com")
ZOHO_EMAIL_PASS = _required_env("ZOHO_EMAIL_PASS")  # App Password - REQUIRED


def get_database_url():
    return f"postgresql://{DATABASE_USER}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}"


# Mock LLM responses for testing/CI without vLLM
MOCK_LLM_RESPONSES = {
    "aisha_intake": {
        "tenant_name": "Test Tenant",
        "landlord_name": "Test Landlord",
        "rent_amount": "25000",
        "property_address": "123 Test Street, Mumbai",
        "start_date": "2024-01-01",
        "end_date": "2025-01-01",
        "deposit_amount": "50000",
    },
    "drafter": "Generated legal document content for testing",
    "auditor": {"score": 90, "passed": True, "issues": []},
}

def get_mock_llm_response(agent_type: str) -> dict:
    """Get mock LLM response for testing."""
    return MOCK_LLM_RESPONSES.get(agent_type, {"success": True, "mock": True})