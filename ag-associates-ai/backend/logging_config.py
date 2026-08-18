"""Structured logging configuration for ag-associates-ai."""

import logging
import sys
import os
import json
from datetime import datetime
from typing import Any, Dict
from contextvars import ContextVar

import structlog

# Context variable for correlation ID
correlation_id_var: ContextVar[str] = ContextVar("correlation_id", default="")
request_id_var: ContextVar[str] = ContextVar("request_id", default="")


def get_correlation_id() -> str:
    """Get current correlation ID."""
    return correlation_id_var.get()


def set_correlation_id(cid: str) -> None:
    """Set correlation ID for current context."""
    correlation_id_var.set(cid)


def get_request_id() -> str:
    """Get current request ID."""
    return request_id_var.get()


def set_request_id(rid: str) -> None:
    """Set request ID for current context."""
    request_id_var.set(rid)


class CorrelationIdFilter(logging.Filter):
    """Add correlation ID to log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.correlation_id = get_correlation_id()
        record.request_id = get_request_id()
        return True


def setup_logging(log_level: str = "INFO", json_output: bool = True) -> None:
    """Configure structured logging with structlog."""

    # Standard library logging config
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format="%(message)s",
        stream=sys.stdout,
    )

    # Add correlation ID filter to root logger
    logging.getLogger().addFilter(CorrelationIdFilter())

    # Configure structlog
    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.format_exc_info,
    ]

    if json_output:
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer())

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.BoundLogger:
    """Get a structured logger instance."""
    return structlog.get_logger(name)


class RequestLoggingMiddleware:
    """ASGI middleware for request/response logging."""

    def __init__(self, app):
        self.app = app
        self.logger = get_logger("request")

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Generate request ID
        import uuid
        request_id = str(uuid.uuid4())
        set_request_id(request_id)

        # Extract correlation ID from headers
        correlation_id = ""
        for header_name, header_value in scope.get("headers", []):
            if header_name.decode() == "x-correlation-id":
                correlation_id = header_value.decode()
                break
        if not correlation_id:
            correlation_id = request_id
        set_correlation_id(correlation_id)

        # Log request start
        self.logger.info(
            "request_started",
            method=scope["method"],
            path=scope["path"],
            query_string=scope.get("query_string", b"").decode(),
            request_id=request_id,
            correlation_id=correlation_id,
        )

        start_time = datetime.utcnow()

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                duration = (datetime.utcnow() - start_time).total_seconds()
                self.logger.info(
                    "request_completed",
                    method=scope["method"],
                    path=scope["path"],
                    status_code=message["status"],
                    duration_seconds=duration,
                    request_id=request_id,
                    correlation_id=correlation_id,
                )
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        except Exception as e:
            duration = (datetime.utcnow() - start_time).total_seconds()
            self.logger.exception(
                "request_failed",
                method=scope["method"],
                path=scope["path"],
                error=str(e),
                duration_seconds=duration,
                request_id=request_id,
                correlation_id=correlation_id,
            )
            raise


# FastAPI-specific logging utilities
def log_request(request_id: str, method: str, path: str, **kwargs):
    """Log request details."""
    logger = get_logger("api.request")
    logger.info(
        "api_request",
        request_id=request_id,
        method=method,
        path=path,
        **kwargs,
    )


def log_response(request_id: str, status_code: int, duration: float, **kwargs):
    """Log response details."""
    logger = get_logger("api.response")
    logger.info(
        "api_response",
        request_id=request_id,
        status_code=status_code,
        duration_seconds=duration,
        **kwargs,
    )


def log_error(request_id: str, error: Exception, **kwargs):
    """Log error details."""
    logger = get_logger("api.error")
    logger.exception(
        "api_error",
        request_id=request_id,
        error_type=type(error).__name__,
        error_message=str(error),
        **kwargs,
    )


# Agent-specific logging
def log_agent_action(agent_name: str, action: str, **kwargs):
    """Log agent action."""
    logger = get_logger(f"agent.{agent_name}")
    logger.info(
        "agent_action",
        agent=agent_name,
        action=action,
        **kwargs,
    )


def log_rpa_action(portal: str, action: str, case_id: str, **kwargs):
    """Log RPA action."""
    logger = get_logger("rpa")
    logger.info(
        "rpa_action",
        portal=portal,
        action=action,
        case_id=case_id,
        **kwargs,
    )


def log_workflow_transition(workflow: str, case_id: str, from_state: str, to_state: str, **kwargs):
    """Log workflow state transition."""
    logger = get_logger("workflow")
    logger.info(
        "workflow_transition",
        workflow=workflow,
        case_id=case_id,
        from_state=from_state,
        to_state=to_state,
        **kwargs,
    )


def log_llm_call(agent: str, model: str, tokens_in: int, tokens_out: int, duration: float, **kwargs):
    """Log LLM API call."""
    logger = get_logger("llm")
    logger.info(
        "llm_call",
        agent=agent,
        model=model,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        duration_seconds=duration,
        **kwargs,
    )


def log_db_query(query: str, duration: float, rows: int = 0, **kwargs):
    """Log database query."""
    logger = get_logger("db")
    logger.debug(
        "db_query",
        query=query[:500],  # Truncate long queries
        duration_seconds=duration,
        rows_affected=rows,
        **kwargs,
    )