"""OpenTelemetry tracing configuration for ag-associates-ai."""

import os
from typing import Optional
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
from opentelemetry.exporter.prometheus import PrometheusMetricReader
from opentelemetry.metrics import set_meter_provider
from opentelemetry.sdk.metrics import MeterProvider

# Optional exporters
try:
    from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
    OTLP_AVAILABLE = True
except ImportError:
    OTLP_AVAILABLE = False

try:
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
    from opentelemetry.instrumentation.redis import RedisInstrumentor
    from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor
    INSTRUMENTATION_AVAILABLE = True
except ImportError:
    INSTRUMENTATION_AVAILABLE = False


def setup_tracing(
    service_name: str = "ag-associates-ai",
    service_version: str = "2.0.0",
    otlp_endpoint: Optional[str] = None,
) -> TracerProvider:
    """Configure OpenTelemetry tracing."""

    # Create resource
    resource = Resource.create({
        SERVICE_NAME: service_name,
        SERVICE_VERSION: service_version,
        "environment": os.environ.get("ENVIRONMENT", "development"),
    })

    # Create tracer provider
    provider = TracerProvider(resource=resource)

    # Add console exporter for development
    if os.environ.get("ENVIRONMENT") != "production":
        provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))

    # Add OTLP exporter if configured and available
    if otlp_endpoint and OTLP_AVAILABLE:
        otlp_exporter = OTLPSpanExporter(endpoint=otlp_endpoint)
        provider.add_span_processor(BatchSpanProcessor(otlp_exporter))

    # Set global tracer provider
    trace.set_tracer_provider(provider)

    return provider


def setup_metrics(
    service_name: str = "ag-associates-ai",
) -> MeterProvider:
    """Configure OpenTelemetry metrics with Prometheus exporter."""

    # Prometheus metric reader
    reader = PrometheusMetricReader()

    # Create meter provider
    provider = MeterProvider(
        metric_readers=[reader],
        resource=Resource.create({
            SERVICE_NAME: service_name,
            "environment": os.environ.get("ENVIRONMENT", "development"),
        }),
    )

    set_meter_provider(provider)
    return provider


def instrument_app(app, tracer_provider: Optional[TracerProvider] = None):
    """Instrument FastAPI app with OpenTelemetry."""

    if not INSTRUMENTATION_AVAILABLE:
        return

    # Instrument FastAPI
    FastAPIInstrumentor.instrument_app(
        app,
        tracer_provider=tracer_provider,
        excluded_urls="/health,/metrics,/health/deep",
    )

    # Instrument HTTPX
    HTTPXClientInstrumentor().instrument()

    # Instrument Redis
    RedisInstrumentor().instrument()

    # Instrument psycopg2
    Psycopg2Instrumentor().instrument()


def get_tracer(name: str) -> trace.Tracer:
    """Get a tracer instance."""
    return trace.get_tracer(name)


# Convenience functions for manual tracing
def trace_agent_action(agent_name: str, action: str):
    """Decorator/context manager for tracing agent actions."""
    tracer = get_tracer("agent")

    def decorator(func):
        import functools
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            with tracer.start_as_current_span(f"agent.{agent_name}.{action}") as span:
                span.set_attribute("agent.name", agent_name)
                span.set_attribute("agent.action", action)
                try:
                    result = await func(*args, **kwargs)
                    span.set_attribute("success", True)
                    return result
                except Exception as e:
                    span.set_attribute("success", False)
                    span.set_attribute("error", str(e))
                    span.record_exception(e)
                    raise

        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            with tracer.start_as_current_span(f"agent.{agent_name}.{action}") as span:
                span.set_attribute("agent.name", agent_name)
                span.set_attribute("agent.action", action)
                try:
                    result = func(*args, **kwargs)
                    span.set_attribute("success", True)
                    return result
                except Exception as e:
                    span.set_attribute("success", False)
                    span.set_attribute("error", str(e))
                    span.record_exception(e)
                    raise

        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator


def trace_rpa_action(portal: str, action: str):
    """Decorator/context manager for tracing RPA actions."""
    tracer = get_tracer("rpa")

    def decorator(func):
        import functools
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            with tracer.start_as_current_span(f"rpa.{portal}.{action}") as span:
                span.set_attribute("rpa.portal", portal)
                span.set_attribute("rpa.action", action)
                try:
                    result = await func(*args, **kwargs)
                    span.set_attribute("success", True)
                    return result
                except Exception as e:
                    span.set_attribute("success", False)
                    span.set_attribute("error", str(e))
                    span.record_exception(e)
                    raise
        return async_wrapper
    return decorator


def trace_llm_call(agent: str, model: str):
    """Decorator/context manager for tracing LLM calls."""
    tracer = get_tracer("llm")

    def decorator(func):
        import functools
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            with tracer.start_as_current_span(f"llm.{agent}.{model}") as span:
                span.set_attribute("llm.agent", agent)
                span.set_attribute("llm.model", model)
                try:
                    result = await func(*args, **kwargs)
                    span.set_attribute("success", True)
                    return result
                except Exception as e:
                    span.set_attribute("success", False)
                    span.set_attribute("error", str(e))
                    span.record_exception(e)
                    raise
        return async_wrapper
    return decorator


def trace_workflow_transition(workflow: str):
    """Decorator/context manager for tracing workflow transitions."""
    tracer = get_tracer("workflow")

    def decorator(func):
        import functools
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            with tracer.start_as_current_span(f"workflow.{workflow}.transition") as span:
                span.set_attribute("workflow.name", workflow)
                try:
                    result = await func(*args, **kwargs)
                    span.set_attribute("success", True)
                    return result
                except Exception as e:
                    span.set_attribute("success", False)
                    span.set_attribute("error", str(e))
                    span.record_exception(e)
                    raise
        return async_wrapper
    return decorator


# Context managers for manual tracing
class TraceContext:
    """Context manager for manual span creation."""

    def __init__(self, name: str, attributes: dict = None):
        self.tracer = get_tracer("manual")
        self.name = name
        self.attributes = attributes or {}
        self.span = None

    def __enter__(self):
        self.span = self.tracer.start_span(self.name)
        for key, value in self.attributes.items():
            self.span.set_attribute(key, value)
        return self.span

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_val:
            self.span.set_attribute("success", False)
            self.span.set_attribute("error", str(exc_val))
            self.span.record_exception(exc_val)
        else:
            self.span.set_attribute("success", True)
        self.span.end()
        return False


def add_span_attributes(**attributes):
    """Add attributes to current span."""
    span = trace.get_current_span()
    if span:
        for key, value in attributes.items():
            span.set_attribute(key, value)


def record_exception(exc: Exception):
    """Record exception on current span."""
    span = trace.get_current_span()
    if span:
        span.record_exception(exc)
        span.set_attribute("success", False)
        span.set_attribute("error", str(exc))