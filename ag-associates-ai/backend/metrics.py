"""Prometheus metrics for ag-associates-ai."""

import os
from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry, generate_latest
from typing import Optional

# Create custom registry
registry = CollectorRegistry()

# HTTP Metrics
http_requests_total = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"],
    registry=registry,
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"],
    registry=registry,
)

# Agent Metrics
agent_actions_total = Counter(
    "agent_actions_total",
    "Total agent actions",
    ["agent", "action", "status"],
    registry=registry,
)

agent_action_duration_seconds = Histogram(
    "agent_action_duration_seconds",
    "Agent action latency in seconds",
    ["agent", "action"],
    registry=registry,
)

# LLM Metrics
llm_calls_total = Counter(
    "llm_calls_total",
    "Total LLM API calls",
    ["agent", "model", "status"],
    registry=registry,
)

llm_tokens_total = Counter(
    "llm_tokens_total",
    "Total LLM tokens used",
    ["agent", "model", "type"],  # type: input, output
    registry=registry,
)

llm_call_duration_seconds = Histogram(
    "llm_call_duration_seconds",
    "LLM API call latency in seconds",
    ["agent", "model"],
    registry=registry,
)

# RPA Metrics
rpa_actions_total = Counter(
    "rpa_actions_total",
    "Total RPA actions",
    ["portal", "action", "status"],
    registry=registry,
)

rpa_action_duration_seconds = Histogram(
    "rpa_action_duration_seconds",
    "RPA action latency in seconds",
    ["portal", "action"],
    registry=registry,
)

# Workflow Metrics
workflow_transitions_total = Counter(
    "workflow_transitions_total",
    "Total workflow state transitions",
    ["workflow", "from_state", "to_state"],
    registry=registry,
)

workflow_cases_active = Gauge(
    "workflow_cases_active",
    "Number of active cases per workflow",
    ["workflow"],
    registry=registry,
)

# Database Metrics
db_queries_total = Counter(
    "db_queries_total",
    "Total database queries",
    ["query_type", "status"],
    registry=registry,
)

db_query_duration_seconds = Histogram(
    "db_query_duration_seconds",
    "Database query latency in seconds",
    ["query_type"],
    registry=registry,
)

db_pool_connections = Gauge(
    "db_pool_connections",
    "Database pool connections",
    ["state"],  # state: active, idle
    registry=registry,
)

# Redis Metrics
redis_operations_total = Counter(
    "redis_operations_total",
    "Total Redis operations",
    ["operation", "status"],
    registry=registry,
)

redis_queue_size = Gauge(
    "redis_queue_size",
    "Redis queue size",
    ["queue_name"],
    registry=registry,
)

# Circuit Breaker Metrics
circuit_breaker_state = Gauge(
    "circuit_breaker_state",
    "Circuit breaker state (0=closed, 1=half-open, 2=open)",
    ["breaker_name"],
    registry=registry,
)

circuit_breaker_failures_total = Counter(
    "circuit_breaker_failures_total",
    "Total circuit breaker failures",
    ["breaker_name"],
    registry=registry,
)

# HITL Queue Metrics
hitl_tasks_pending = Gauge(
    "hitl_tasks_pending",
    "Number of pending HITL tasks",
    ["portal"],
    registry=registry,
)

hitl_tasks_completed_total = Counter(
    "hitl_tasks_completed_total",
    "Total HITL tasks completed",
    ["portal"],
    registry=registry,
)

# Cache Metrics
cache_hits_total = Counter(
    "cache_hits_total",
    "Total cache hits",
    ["cache_name"],
    registry=registry,
)

cache_misses_total = Counter(
    "cache_misses_total",
    "Total cache misses",
    ["cache_name"],
    registry=registry,
)

# Error Metrics
errors_total = Counter(
    "errors_total",
    "Total errors",
    ["component", "error_type"],
    registry=registry,
)

# System Metrics
system_info = Gauge(
    "system_info",
    "System information",
    ["version", "environment"],
    registry=registry,
)

# Initialize system info
system_info.labels(version="2.0.0", environment=os.environ.get("ENVIRONMENT", "development")).set(1)


def record_http_request(method: str, endpoint: str, status_code: int, duration: float):
    """Record HTTP request metrics."""
    http_requests_total.labels(method=method, endpoint=endpoint, status=str(status_code)).inc()
    http_request_duration_seconds.labels(method=method, endpoint=endpoint).observe(duration)


def record_agent_action(agent: str, action: str, success: bool, duration: float):
    """Record agent action metrics."""
    agent_actions_total.labels(agent=agent, action=action, status="success" if success else "failure").inc()
    agent_action_duration_seconds.labels(agent=agent, action=action).observe(duration)


def record_llm_call(agent: str, model: str, success: bool, tokens_in: int, tokens_out: int, duration: float):
    """Record LLM call metrics."""
    llm_calls_total.labels(agent=agent, model=model, status="success" if success else "failure").inc()
    llm_tokens_total.labels(agent=agent, model=model, type="input").inc(tokens_in)
    llm_tokens_total.labels(agent=agent, model=model, type="output").inc(tokens_out)
    llm_call_duration_seconds.labels(agent=agent, model=model).observe(duration)


def record_rpa_action(portal: str, action: str, success: bool, duration: float):
    """Record RPA action metrics."""
    rpa_actions_total.labels(portal=portal, action=action, status="success" if success else "failure").inc()
    rpa_action_duration_seconds.labels(portal=portal, action=action).observe(duration)


def record_workflow_transition(workflow: str, from_state: str, to_state: str):
    """Record workflow transition metrics."""
    workflow_transitions_total.labels(workflow=workflow, from_state=from_state, to_state=to_state).inc()


def record_db_query(query_type: str, success: bool, duration: float):
    """Record database query metrics."""
    db_queries_total.labels(query_type=query_type, status="success" if success else "failure").inc()
    db_query_duration_seconds.labels(query_type=query_type).observe(duration)


def record_redis_operation(operation: str, success: bool):
    """Record Redis operation metrics."""
    redis_operations_total.labels(operation=operation, status="success" if success else "failure").inc()


def record_circuit_breaker_state(breaker_name: str, state: str):
    """Record circuit breaker state (0=closed, 1=half-open, 2=open)."""
    state_map = {"closed": 0, "half_open": 1, "open": 2}
    circuit_breaker_state.labels(breaker_name=breaker_name).set(state_map.get(state, 0))


def record_circuit_breaker_failure(breaker_name: str):
    """Record circuit breaker failure."""
    circuit_breaker_failures_total.labels(breaker_name=breaker_name).inc()


def record_hitl_task(portal: str, pending: int, completed: bool = False):
    """Record HITL task metrics."""
    hitl_tasks_pending.labels(portal=portal).set(pending)
    if completed:
        hitl_tasks_completed_total.labels(portal=portal).inc()


def record_cache_hit(cache_name: str):
    """Record cache hit."""
    cache_hits_total.labels(cache_name=cache_name).inc()


def record_cache_miss(cache_name: str):
    """Record cache miss."""
    cache_misses_total.labels(cache_name=cache_name).inc()


def record_error(component: str, error_type: str):
    """Record error metrics."""
    errors_total.labels(component=component, error_type=error_type).inc()


def get_metrics() -> bytes:
    """Get Prometheus metrics in text format."""
    return generate_latest(registry)


class MetricsMiddleware:
    """ASGI middleware for automatic metrics collection."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        import time
        start_time = time.time()

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                duration = time.time() - start_time
                record_http_request(
                    method=scope["method"],
                    endpoint=scope["path"],
                    status_code=message["status"],
                    duration=duration,
                )
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        except Exception as e:
            duration = time.time() - start_time
            record_http_request(
                method=scope["method"],
                endpoint=scope["path"],
                status_code=500,
                duration=duration,
            )
            record_error("http", type(e).__name__)
            raise