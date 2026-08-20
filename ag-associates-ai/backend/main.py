import os
import re
import json
import base64
import secrets
import importlib.util
from datetime import datetime, timezone
import redis.asyncio as aioredis

# Dynamic import to silence IDE warnings when module is not in the system path
sentry_sdk = None
if importlib.util.find_spec("sentry_sdk"):
    import sentry_sdk

from fastapi import FastAPI, Header, HTTPException, status, Response, Request, Depends, Cookie
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

from voice.voice_api import router as voice_router
from workforce import workforce_router
from auth import oauth_router, require_auth, require_permission, AuthContext
from playground import playground_router, session_manager as _playground_sm
from payment.router import router as payment_router
from controller_agent import UnifiedController
from agents.agent_init import init_agents
from aisha_core import handle_message as aisha_handle_message, ensure_tables
from conversation_store import resolve_user
from nesl_client import NeslClient
from noi_agent import noi_agent
from hitl_queue import hitl_queue
from circuit_breaker import breakers
from config import (
    ENVIRONMENT,
    IS_PRODUCTION,
    API_HOST,
    API_PORT,
    CORS_ALLOWED_ORIGINS,
    LOG_LEVEL,
    SENTRY_DSN,
    SENTRY_TRACES_SAMPLE_RATE,
    SENTRY_PROFILES_SAMPLE_RATE,
    N8N_WEBHOOK_KEY,
    LLM_MOCK_MODE,
    get_mock_llm_response,
)

# 1. Structured Logging Configuration (Must happen before FastAPI is initialized)
from logging_config import setup_logging, get_logger, RequestLoggingMiddleware

setup_logging(log_level=LOG_LEVEL, json_output=IS_PRODUCTION)
logger = get_logger(__name__)

# 2. Sentry Initialization (Must happen before FastAPI is initialized)
if SENTRY_DSN:
    _default_traces = 0.1 if IS_PRODUCTION else 1.0
    _default_profiles = 0.01 if IS_PRODUCTION else 1.0
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=float(os.environ.get("SENTRY_TRACES_SAMPLE_RATE", _default_traces)),
        profiles_sample_rate=float(os.environ.get("SENTRY_PROFILES_SAMPLE_RATE", _default_profiles)),
        environment=ENVIRONMENT,
    )

# 3. Scheduler (APScheduler) for periodic tasks
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

scheduler = AsyncIOScheduler()

def start_scheduler():
    """Start the background scheduler for periodic tasks."""
    if not scheduler.running:
        # Daily SLA checks at 9 AM IST
        scheduler.add_job(
            run_daily_sla_checks,
            CronTrigger(hour=9, minute=0, timezone="Asia/Kolkata"),
            id="daily_sla_checks",
            replace_existing=True,
        )
        
        # Hourly document status sync
        scheduler.add_job(
            sync_document_statuses,
            IntervalTrigger(hours=1),
            id="sync_document_statuses",
            replace_existing=True,
        )
        
        # Daily OTP cleanup (2 AM)
        scheduler.add_job(
            cleanup_expired_otps,
            CronTrigger(hour=2, minute=0, timezone="Asia/Kolkata"),
            id="cleanup_expired_otps",
            replace_existing=True,
        )
        
        # Weekly report generation (Monday 8 AM)
        scheduler.add_job(
            generate_weekly_reports,
            CronTrigger(day_of_week="mon", hour=8, minute=0, timezone="Asia/Kolkata"),
            id="weekly_reports",
            replace_existing=True,
        )
        
        scheduler.start()
        logger.info("Background scheduler started")

async def stop_scheduler():
    """Stop the background scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=True)
        logger.info("Background scheduler stopped")

# 3. CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS or ["http://localhost:3000", "https://luxor9-legalos.vercel.app"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 4. Request Logging Middleware (must be after CORS to capture all requests)
app.add_middleware(RequestLoggingMiddleware)

# 5. Metrics Middleware
from metrics import MetricsMiddleware
app.add_middleware(MetricsMiddleware)

app.include_router(voice_router)
app.include_router(workforce_router)
app.include_router(oauth_router)
app.include_router(playground_router)
app.include_router(payment_router)


@app.on_event("shutdown")
async def _shutdown_playground():
    await _playground_sm.shutdown()


@app.on_event("shutdown")
async def _shutdown_nesl():
    await shutdown_nesl_client()

# 4. Health Check Endpoint (For Vercel/Docker probing)
@app.on_event("startup")
async def _startup_store():
    # Initialize OpenTelemetry tracing
    try:
        from tracing import setup_tracing, setup_metrics, instrument_app
        tracer_provider = setup_tracing()
        setup_metrics()
        instrument_app(app, tracer_provider)
        logger.info("OpenTelemetry tracing initialized")
    except Exception as e:
        logger.warning("Failed to initialize OpenTelemetry tracing", error=str(e))

    # Start background scheduler
    start_scheduler()
    
    ensure_tables()
    await init_agents()


@app.on_event("shutdown")
async def _shutdown_scheduler():
    await stop_scheduler()


@app.on_event("shutdown")
async def _shutdown_playground():
    await _playground_sm.shutdown()


@app.on_event("shutdown")
async def _shutdown_nesl():
    await shutdown_nesl_client()


# Scheduler task functions
async def run_daily_sla_checks():
    """Run daily SLA checks for all active cases."""
    logger.info("Running daily SLA checks...")
    try:
        # Import here to avoid circular imports
        from sla import runSLACheck
        from database import get_organizations
        
        orgs = await get_organizations()
        for org in orgs:
            await runSLACheck(org.id)
        logger.info("Daily SLA checks completed")
    except Exception as e:
        logger.error(f"Daily SLA checks failed: {e}")

async def sync_document_statuses():
    """Sync document statuses from Supabase."""
    logger.info("Syncing document statuses...")
    try:
        # Import here to avoid circular imports
        from document_sync import sync_all_documents
        await sync_all_documents()
        logger.info("Document status sync completed")
    except Exception as e:
        logger.error(f"Document status sync failed: {e}")

async def cleanup_expired_otps():
    """Clean up expired OTPs from Redis."""
    logger.info("Cleaning up expired OTPs...")
    try:
        import redis.asyncio as redis
        import os
        
        REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
        r = redis.from_url(REDIS_URL)
        
        # Scan for OTP keys and delete expired ones
        async for key in r.scan_iter(match="otp:*"):
            ttl = await r.ttl(key)
            if ttl == -2:  # Key doesn't exist
                await r.delete(key)
            elif ttl == -1:  # Key exists but no expiry set
                await r.delete(key)
        
        # Clean up otp_waiting keys
        async for key in r.scan_iter(match="otp_waiting:*"):
            ttl = await r.ttl(key)
            if ttl <= 0:
                await r.delete(key)
        
        await r.close()
        logger.info("OTP cleanup completed")
    except Exception as e:
        logger.error(f"OTP cleanup failed: {e}")

async def generate_weekly_reports():
    """Generate weekly reports for all organizations."""
    logger.info("Generating weekly reports...")
    try:
        # Import here to avoid circular imports
        from reports import generate_weekly_report
        from database import get_organizations
        
        orgs = await get_organizations()
        for org in orgs:
            await generate_weekly_report(org.id)
        logger.info("Weekly reports generated")
    except Exception as e:
        logger.error(f"Weekly report generation failed: {e}")


# 5. Core Webhook Entrypoint for n8n (Asynchronous)


def _verify_n8n_key(
    x_api_key: Optional[str] = Header(default=None, alias="x-api-key"),
) -> None:
    if not N8N_WEBHOOK_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="webhook auth not configured",
        )
    if not x_api_key or not secrets.compare_digest(x_api_key, N8N_WEBHOOK_KEY):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid api key"
        )


@app.get("/health", tags=["System"])
async def health_check():
    """Returns 200 OK if the system is fully operational."""
    return {"status": "ok", "agent_pool": "ready", "version": "2.0.0", "mock_mode": LLM_MOCK_MODE}


@app.get("/health/deep", tags=["System"])
async def deep_health_check():
    """Deep health check - verifies all dependencies."""
    import httpx
    import redis.asyncio as aioredis
    from config import get_database_url

    checks = {
        "database": "unknown",
        "redis": "unknown",
        "vllm": "unknown",
        "supabase": "unknown",
        "nesl": "unknown",
    }

    # Check database
    try:
        import psycopg2
        conn = psycopg2.connect(get_database_url(), connect_timeout=5)
        conn.close()
        checks["database"] = "healthy"
    except Exception as e:
        checks["database"] = f"unhealthy: {str(e)[:100]}"

    # Check Redis
    try:
        r = aioredis.from_url(os.environ.get("REDIS_URL", "redis://localhost:6379"))
        await r.ping()
        await r.close()
        checks["redis"] = "healthy"
    except Exception as e:
        checks["redis"] = f"unhealthy: {str(e)[:100]}"

    # Check vLLM
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{LLM_BASE_URL}/models")
            if resp.status_code == 200:
                checks["vllm"] = "healthy"
            else:
                checks["vllm"] = f"unhealthy: HTTP {resp.status_code}"
    except Exception as e:
        checks["vllm"] = f"unhealthy: {str(e)[:100]}"

    # Check Supabase
    try:
        supabase_url = os.environ.get("SUPABASE_URL")
        supabase_anon_key = os.environ.get("SUPABASE_ANON_KEY")
        if supabase_url and supabase_anon_key:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{supabase_url}/rest/v1/",
                    headers={"apikey": supabase_anon_key, "Authorization": f"Bearer {supabase_anon_key}"}
                )
                if resp.status_code in (200, 401):  # 401 means auth works but unauthorized
                    checks["supabase"] = "healthy"
                else:
                    checks["supabase"] = f"unhealthy: HTTP {resp.status_code}"
        else:
            checks["supabase"] = "not_configured"
    except Exception as e:
        checks["supabase"] = f"unhealthy: {str(e)[:100]}"

    # Check NeSL (mock)
    try:
        if NESL_USE_MOCK:
            checks["nesl"] = "mock_mode"
        else:
            # Could add real NeSL check here
            checks["nesl"] = "not_verified"
    except Exception as e:
        checks["nesl"] = f"unhealthy: {str(e)[:100]}"

    all_healthy = all(v == "healthy" or v == "mock_mode" or v == "not_verified" for v in checks.values())

    return {
        "status": "healthy" if all_healthy else "degraded",
        "checks": checks,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/metrics", tags=["System"])
async def metrics_endpoint():
    """Prometheus metrics endpoint."""
    from fastapi.responses import Response
    from metrics import get_metrics
    return Response(content=get_metrics(), media_type="text/plain")


@app.post("/webhooks/whatsapp", tags=["Ingestion"])
async def whatsapp_webhook(
    payload: Dict[str, Any],
    x_api_key: Optional[str] = Header(default=None, alias="x-api-key"),
):
    """
    Entry point for n8n WhatsApp triggers — routes through unified Aisha.
    Expects payload with 'message', 'sender', and optional 'org_id' and 'conversation_id'.
    Requires authentication via x-api-key.
    """
    _verify_n8n_key(x_api_key)

    raw_input = payload.get("message", "").strip()
    sender = payload.get("sender", "whatsapp_user")
    conversation_id = payload.get("conversation_id")

    if not raw_input:
        raise HTTPException(status_code=400, detail="Missing 'message' in payload")

    import asyncio

    try:
        if LLM_MOCK_MODE:
            # Return mock response for testing
            mock_response = get_mock_llm_response("aisha_intake")
            return {"success": True, "data": mock_response, "mock": True}

        result = await asyncio.to_thread(
            aisha_handle_message,
            raw_input,
            platform="whatsapp",
            platform_identity=sender,
            display_name=payload.get("display_name"),
            conversation_id=conversation_id,
        )
        return result
    except Exception as e:
        logger.exception(f"Error in whatsapp_webhook: {str(e)}")
        return {
            "success": False,
            "error": "Internal server error during processing",
            "detail": str(e) if not IS_PRODUCTION else "An unexpected error occurred",
        }


class AgreementRequest(BaseModel):
    message: str
    sender: Optional[str] = "api_user"
    conversation_id: Optional[str] = None


@app.post("/api/generate-agreement", tags=["AI"])
async def generate_agreement(
    request: AgreementRequest,
    auth: AuthContext = Depends(require_permission("agreement.generate")),
    x_org_id: Optional[str] = Header(default=None, alias="X-Org-ID"),
    x_api_key: Optional[str] = Header(default=None, alias="x-api-key"),
):
    """
    Direct API entry for generating rental agreements — routes through unified Aisha.
    Uses X-Org-ID header for tenant isolation.
    Requires authentication via x-api-key.
    """
    _verify_n8n_key(x_api_key)

    import asyncio

    try:
        if LLM_MOCK_MODE:
            # Return mock response for testing
            mock_response = get_mock_llm_response("aisha_intake")
            return {"success": True, "data": mock_response, "mock": True}

        result = await asyncio.to_thread(
            aisha_handle_message,
            request.message,
            platform="web",
            platform_identity=request.sender,
            conversation_id=request.conversation_id,
        )
        return result
    except Exception as e:
        logger.exception(f"Error in generate_agreement: {str(e)}")
        return {
            "success": False,
            "error": "Internal server error during agreement generation",
            "detail": str(e) if not IS_PRODUCTION else "An unexpected error occurred",
        }


@app.post("/webhooks/n8n/intake", tags=["Ingestion"])
async def n8n_intake_webhook(
    payload: Dict[str, Any],
    x_api_key: Optional[str] = Header(default=None, alias="x-api-key"),
):
    """
    Stub webhook for n8n intake. Acknowledges receipt only — the LangGraph/CrewAI
    pipeline is not yet wired in here. Requires the X-Api-Key header to match
    N8N_WEBHOOK_KEY.
    """
    _verify_n8n_key(x_api_key)
    return {
        "status": "accepted",
        "message": "Payload received (pipeline dispatch not yet implemented)",
    }


# 6. Sentry Error Testing Endpoint (dev only)
if not IS_PRODUCTION:
    @app.get("/debug-sentry", tags=["System"])
    async def trigger_error():
        raise RuntimeError("Test error for Sentry")


# 7. API Documentation (Scalar) — conditionally mounted in dev
if not IS_PRODUCTION:
    try:
        from scalar_fastapi import get_scalar_api_reference

        @app.get("/docs", include_in_schema=False)
        async def scalar_html():
            return get_scalar_api_reference(
                openapi_url=app.openapi_url, title=app.title
            )
    except ImportError:
        pass


# ── Unified Aisha Voice/Chat ────────────────────────────────────────────────
# Removed global service role client (_SB). 
# Use per-request auth context via SupabaseAuth dependency instead.
# See auth.py for SupabaseAuth dependency that provides user JWT + org_id.

def _get_supabase_headers(user_jwt: str, org_id: Optional[str] = None) -> Dict[str, str]:
    """Build Supabase REST API headers using user JWT + anon key.
    
    For internal service-to-service calls, use anon key + X-Org-ID header.
    """
    supabase_anon_key = os.environ.get("SUPABASE_ANON_KEY", "")
    if not supabase_anon_key:
        raise RuntimeError("SUPABASE_ANON_KEY not configured")
    
    if user_jwt:
        return {
            "apikey": supabase_anon_key,
            "Authorization": f"Bearer {user_jwt}",
            "Content-Type": "application/json",
        }
    elif org_id:
        return {
            "apikey": supabase_anon_key,
            "Authorization": f"Bearer {supabase_anon_key}",
            "Content-Type": "application/json",
            "X-Org-ID": org_id,
        }
    else:
        return {
            "apikey": supabase_anon_key,
            "Authorization": f"Bearer {supabase_anon_key}",
            "Content-Type": "application/json",
        }

async def _supabase_request(
    method: str,
    path: str,
    user_jwt: Optional[str] = None,
    org_id: Optional[str] = None,
    json_data: Optional[Dict] = None,
    params: Optional[Dict] = None,
) -> httpx.Response:
    """Make authenticated Supabase REST API request."""
    supabase_url = os.environ.get("SUPABASE_URL")
    if not supabase_url:
        raise RuntimeError("SUPABASE_URL not configured")
    
    headers = _get_supabase_headers(user_jwt, org_id)
    
    async with httpx.AsyncClient() as client:
        resp = await client.request(
            method,
            f"{supabase_url}/rest/v1{path}",
            headers=headers,
            json=json_data,
            params=params,
        )
        resp.raise_for_status()
        return resp


# … (voice endpoints, supervisor, etc. would go here)
# Keeping the rest of the remote main.py including voice, supervisor endpoints, etc.

# NeSL Filing API
# ============================================================================

class NeslFilingRequest(BaseModel):
    document_id: Optional[str] = Field(None, description="Document UUID in our system")
    document_path: Optional[str] = Field(None, description="Path to document file")
    case_id: Optional[str] = Field(None, description="Ag-Platform case ID")
    org_id: Optional[str] = Field(None, description="Organization ID")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional filing metadata")


class NeslExecuteRequest(BaseModel):
    case_id: Optional[str] = Field(None, description="Case ID")
    document_type: Optional[str] = Field(
        "INTIMATION_MORTGAGE", description="Document type for NeSL"
    )


class NeslFilingResult(BaseModel):
    transaction_id: Optional[str] = None
    status: str
    provider: str
    filed_at: Optional[str] = None
    message: Optional[str] = None
    source: Optional[str] = None


class NeslExecuteResponse(BaseModel):
    success: bool
    transaction_id: Optional[str] = None
    filing_reference: Optional[str] = None
    message: Optional[str] = None
    error: Optional[str] = None
    mode: str = "mock"


# ── NeSL API Routes ─────────────────────────────────────────────────────────
@app.post("/api/nesl/file", response_model=NeslFilingResult, tags=["NeSL"])
async def nesl_file(
    request: NeslFilingRequest,
    auth: AuthContext = Depends(require_permission("nesl.file")),
):
    client = _get_nesl_client()
    return await client.file(request)


@app.post("/api/nesl/execute", response_model=NeslExecuteResponse, tags=["NeSL"])
async def nesl_execute(
    request: NeslExecuteRequest,
    auth: AuthContext = Depends(require_permission("nesl.file")),
):
    client = _get_nesl_client()
    case_id = request.case_id or "auto"
    doc_type = request.document_type
    try:
        body = await request.__dict__.get("request", Request).json() if hasattr(request, "request") else {}
        if isinstance(body, dict):
            case_id = body.get("case_id") or case_id
            doc_type = body.get("document_type") or doc_type
    except Exception:
        pass

    result = await client.execute(case_id=case_id, document_type=doc_type)
    return NeslExecuteResponse(
        success=result.success,
        transaction_id=result.transaction_id,
        filing_reference=result.filing_reference,
        message=result.message,
        error=result.error,
        mode=result.mode,
    )


# ============================================================================
# NOI WORKFLOW ENDPOINTS (Notice of Intimation)
# ============================================================================

class NOIWorkflowRequest(BaseModel):
    case_id: str = Field(..., description="Case ID to process")
    action: str = Field(..., description="Action: generate_challan, verify_docs, file_noi, acknowledge, status")
    acknowledgment_number: Optional[str] = Field(None, description="Required for acknowledge action")


class NOIWorkflowResponse(BaseModel):
    success: bool
    error: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class NOIWebhookPayload(BaseModel):
    case_id: str
    status: str = Field(..., description="New NOI status")
    notes: Optional[str] = None
    acknowledgment_number: Optional[str] = None


class NOISeedRequest(BaseModel):
    case_id: Optional[str] = Field(None, description="Optional custom case ID")
    borrower_name: Optional[str] = Field(None, description="Borrower name")
    bank_name: Optional[str] = Field(None, description="Bank name")
    loan_amount: Optional[str] = Field(None, description="Loan amount")


@app.post("/api/noi/seed", tags=["NOI"])
async def noi_seed(
    request: NOISeedRequest, auth: AuthContext = Depends(require_permission("noi.initiate"))
):
    """Seed a test case in the in-memory store (dev only, no Supabase needed)."""
    try:
        case_data = request.model_dump(exclude_none=True)
        case_id = await noi_agent.seed_test_case(case_data)
        return NOIWorkflowResponse(
            success=True,
            data={"case_id": case_id, "noi_status": "DOCUMENTS_RECEIVED"},
        )
    except Exception as e:
        return NOIWorkflowResponse(success=False, error=str(e))


@app.post("/api/noi/workflow", tags=["NOI"])
async def noi_workflow(
    request: NOIWorkflowRequest, auth: AuthContext = Depends(require_permission("noi.initiate"))
):
    """Trigger a NOI workflow action for a case.

    Actions:
    - generate_challan: Generate GRAS challan (0.3% stamp duty)
    - verify_docs: Verify documents against NOI checklist
    - file_noi: File NOI on IGR portal
    - acknowledge: Mark NOI as acknowledged
    - status: Get current NOI status
    """
    try:
        result = await noi_agent.run_workflow(
            case_id=request.case_id,
            action=request.action,
            acknowledgment_number=request.acknowledgment_number,
        )
        return NOIWorkflowResponse(success=result.get("success", False), data=result)
    except Exception as e:
        logger.error(f"NOI workflow error: {e}")
        return NOIWorkflowResponse(success=False, error=str(e))


@app.get("/api/noi/status/{case_id}", tags=["NOI"])
async def noi_status(
    case_id: str, auth: AuthContext = Depends(require_permission("noi.view_progress"))
):
    """Get current NOI status and workflow state for a case."""
    try:
        case = await noi_agent.get_case(case_id)
        if not case:
            return NOIWorkflowResponse(success=False, error=f"Case {case_id} not found")
        return NOIWorkflowResponse(
            success=True,
            data={
                "case_id": case_id,
                "borrower_name": case.get("borrower_name"),
                "bank_name": case.get("bank_name"),
                "loan_amount": case.get("loan_amount"),
                "noi_status": case.get("noi_status", "NOT_STARTED"),
                "grn_number": case.get("grn_number"),
                "acknowledgment_number": case.get("acknowledgment_number"),
            },
        )
    except Exception as e:
        logger.error(f"NOI status error: {e}")
        return NOIWorkflowResponse(success=False, error=str(e))


@app.post("/api/noi/webhook", tags=["NOI"])
async def noi_webhook(payload: NOIWebhookPayload):
    """External webhook for NOI status updates (payment confirmation, drop received)."""
    try:
        valid_statuses = [
            "CHALLAN_PAID",
            "NOI_DROP_RECEIVED",
            "RECTIFY",
            "MISMATCH",
            "REJECTED",
        ]
        if payload.status not in valid_statuses:
            return NOIWorkflowResponse(
                success=False,
                error=f"Invalid status '{payload.status}'. Valid: {', '.join(valid_statuses)}",
            )

        success = await noi_agent.update_noi_status(
            case_id=payload.case_id,
            new_status=payload.status,
            notes=payload.notes,
            force=True,
        )
        if not success:
            return NOIWorkflowResponse(success=False, error="Failed to update status")

        return NOIWorkflowResponse(
            success=True, data={"case_id": payload.case_id, "status": payload.status}
        )
    except Exception as e:
        logger.error(f"NOI webhook error: {e}")
        return NOIWorkflowResponse(success=False, error=str(e))


# ── HITL (Human-in-the-Loop) Queue API ─────────────────────────────────────


class HITLClaimRequest(BaseModel):
    claimed_by: str = Field(default="admin", description="Who is claiming the task")


class HITLCompleteRequest(BaseModel):
    notes: str = Field(default="", description="Resolution notes")


@app.get("/api/hitl/tasks", tags=["HITL"])
async def hitl_list_tasks(auth: AuthContext = Depends(require_permission("hitl.view"))):
    """List pending HITL tasks (circuit breaker fallbacks requiring human action)."""
    tasks = await hitl_queue.list_pending()
    return {"success": True, "tasks": tasks, "count": len(tasks)}


@app.post("/api/hitl/tasks/{task_id}/claim", tags=["HITL"])
async def hitl_claim_task(
    task_id: str,
    req: HITLClaimRequest,
    auth: AuthContext = Depends(require_permission("hitl.manage")),
):
    """Claim a HITL task for manual processing."""
    task = await hitl_queue.claim_task(task_id, req.claimed_by)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found or already claimed")
    return {"success": True, "task": task}


@app.post("/api/hitl/tasks/{task_id}/complete", tags=["HITL"])
async def hitl_complete_task(
    task_id: str,
    req: HITLCompleteRequest,
    auth: AuthContext = Depends(require_permission("hitl.manage")),
):
    """Mark a HITL task as completed."""
    task = await hitl_queue.complete_task(task_id, req.notes)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"success": True, "task": task}


@app.get("/api/circuit-breakers", tags=["HITL"])
async def circuit_breaker_status(
    auth: AuthContext = Depends(require_permission("hitl.view")),
):
    """Get status of all RPA circuit breakers."""
    results = {}
    for name, breaker in breakers.items():
        results[name] = await breaker.status()
    return {"success": True, "breakers": results}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=API_HOST, port=API_PORT, reload=not IS_PRODUCTION)