import asyncio
import logging
import os
import secrets
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import sentry_sdk
import uvicorn
from fastapi import (
    Depends,
    FastAPI,
    Header,
    HTTPException,
    Request,
    status as fastapi_status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from aisha_core import ensure_tables
from auth import AuthContext, oauth_router, require_permission
from circuit_breaker import breakers
from controller_agent import UnifiedController
from hitl_queue import hitl_queue
from integrations.nesl import shutdown_nesl_client
from nesl_client import NeslClient
from noi_agent import noi_agent
from payment.router import router as payment_router
from playground import playground_router, session_manager as _playground_sm
from utils.conversation_service import conversation_service
from voice.voice_api import router as voice_router
from workforce import workforce_router

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")
IS_PRODUCTION = ENVIRONMENT == "production"

# 1. Sentry Initialization
SENTRY_DSN = os.environ.get("SENTRY_DSN", "")
if SENTRY_DSN:
    _default_traces = 0.1 if IS_PRODUCTION else 1.0
    _default_profiles = 0.01 if IS_PRODUCTION else 1.0
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=float(
            os.environ.get("SENTRY_TRACES_SAMPLE_RATE", _default_traces)
        ),
        profiles_sample_rate=float(
            os.environ.get("SENTRY_PROFILES_SAMPLE_RATE", _default_profiles)
        ),
        environment=ENVIRONMENT,
    )

# 2. FastAPI Application Instance
app = FastAPI(
    title="AG Associates - Luxor9 LegalOS API",
    version="2.0.0",
    description="Deterministic Multi-Agent Legal Infrastructure",
)

# 3. CORS Configuration
origins = [
    "http://localhost:3000",
    "https://luxor9-legalos.vercel.app",
]
_extra = os.environ.get("CORS_EXTRA_ORIGINS", "")
if _extra:
    origins.extend([o.strip() for o in _extra.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.on_event("startup")
async def _startup_store():
    ensure_tables()


@app.post("/webhooks/whatsapp", tags=["Ingestion"])
async def whatsapp_webhook(
    payload: Dict[str, Any],
    x_api_key: Optional[str] = Header(default=None, alias="x-api-key"),
):
    _verify_n8n_key(x_api_key)
    raw_input = payload.get("message", "").strip()
    sender = payload.get("sender", "whatsapp_user")
    org_id = payload.get("org_id")
    try:
        from agents import process_rental_request

        result = await asyncio.to_thread(
            process_rental_request, raw_input, sender, org_id
        )
        return result
    except Exception as e:
        logger.error(f"WhatsApp Webhook error: {e}")
        return {"success": False, "error": str(e)}


def _verify_n8n_key(x_api_key: Optional[str]):
    N8N_WEBHOOK_KEY = os.environ.get("N8N_WEBHOOK_KEY")
    if not N8N_WEBHOOK_KEY:
        raise HTTPException(
            status_code=fastapi_status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="webhook auth not configured",
        )
    if not x_api_key or not secrets.compare_digest(x_api_key, N8N_WEBHOOK_KEY):
        raise HTTPException(
            status_code=fastapi_status.HTTP_401_UNAUTHORIZED, detail="invalid api key"
        )


@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


class AgreementRequest(BaseModel):
    message: str
    sender: str = "api_user"
    org_id: Optional[str] = None


class WorkflowResponse(BaseModel):
    success: bool
    error: Optional[str] = None
    document_path: Optional[str] = None
    audit_passed: bool = False
    extracted_data: Optional[Dict[str, Any]] = None


@app.post("/api/generate-agreement", response_model=WorkflowResponse, tags=["AI"])
async def generate_agreement(
    request: AgreementRequest,
    auth: AuthContext = Depends(require_permission("case.intake")),
):
    try:
        from agents import process_rental_request

        result = await asyncio.to_thread(
            process_rental_request, request.message, request.sender, request.org_id
        )
        return WorkflowResponse(**result)
    except Exception as e:
        return WorkflowResponse(success=False, error=str(e))


@app.get("/dashboard/status", tags=["Dashboard"])
async def dashboard_status(
    auth: AuthContext = Depends(require_permission("dashboard.view")),
):
    import psycopg2
    from config import get_database_url

    template_count = 0
    try:
        with psycopg2.connect(get_database_url()) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM legal_templates")
                row = cur.fetchone()
                template_count = row[0] if row else 0
    except Exception:
        pass
    return {
        "total_templates": template_count,
        "active_agents": 3,
        "system_status": "operational",
        "recent_activities": [
            {
                "action": "AISHA_INTAKE",
                "timestamp": "2025-01-15T10:30:00Z",
                "details": "Processed new rental agreement request",
            },
            {
                "action": "DRAFT_COMPLETE",
                "timestamp": "2025-01-15T10:31:00Z",
                "details": "Generated legal document #1024",
            },
            {
                "action": "AUDIT_PASSED",
                "timestamp": "2025-01-15T10:32:00Z",
                "details": "Quality check passed with score 92",
            },
        ],
    }


@app.get("/templates", tags=["Dashboard"])
async def list_templates(
    auth: AuthContext = Depends(require_permission("dashboard.view")),
    template_type: Optional[str] = None,
    language: Optional[str] = None,
):
    import psycopg2
    from config import get_database_url

    templates = []
    try:
        with psycopg2.connect(get_database_url()) as conn:
            with conn.cursor() as cur:
                query = "SELECT id, title, template_type, jurisdiction, language FROM legal_templates WHERE 1=1"
                params = []
                if template_type:
                    query += " AND template_type = %s"
                    params.append(template_type)
                if language:
                    query += " AND language = %s"
                    params.append(language)
                cur.execute(query, params)
                columns = [desc[0] for desc in cur.description]
                for row in cur.fetchall():
                    templates.append(dict(zip(columns, row)))
    except Exception:
        pass
    return templates


class ChatRequest(BaseModel):
    message: str


@app.post("/api/aisha/chat/{conversation_id}", tags=["Aisha"])
async def aisha_chat(
    conversation_id: str,
    request: ChatRequest,
    auth: AuthContext = Depends(require_permission("ai.chat")),
):
    try:
        response = await conversation_service.handle_message(
            conversation_id=conversation_id,
            message=request.message,
            user_id=auth.user_id,
        )
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/aisha/chat/{conversation_id}/stream", tags=["Aisha"])
async def aisha_chat_stream(
    conversation_id: str, auth: AuthContext = Depends(require_permission("ai.chat"))
):
    return StreamingResponse(
        conversation_service.stream_response(conversation_id, auth.user_id),
        media_type="text/event-stream",
    )


class UnifiedChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


unified_controller = UnifiedController()


@app.post("/api/unified/chat", tags=["AI"])
async def unified_chat(
    request: UnifiedChatRequest,
    auth: AuthContext = Depends(require_permission("ai.chat")),
):
    try:
        result = await unified_controller.handle_request(
            user_input=request.message, conversation_id=request.conversation_id
        )
        return result
    except Exception as e:
        logger.error(f"Unified Controller error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


_nesl_client = None


def _get_nesl_client() -> NeslClient:
    global _nesl_client
    if _nesl_client is None:
        _nesl_client = NeslClient()
    return _nesl_client


class NeslExecuteResponse(BaseModel):
    success: bool
    transaction_id: Optional[str] = None
    filing_reference: Optional[str] = None
    message: Optional[str] = None
    error: Optional[str] = None
    mode: Optional[str] = None


@app.post("/api/nesl/execute", tags=["NeSL"])
async def nesl_execute(
    request: Request, auth: AuthContext = Depends(require_permission("nesl.execute"))
):
    try:
        client = _get_nesl_client()
        case_id = None
        doc_type = "INTIMATION_MORTGAGE"
        try:
            body = await request.json()
            if isinstance(body, dict):
                case_id = body.get("case_id") or case_id
                doc_type = body.get("document_type") or doc_type
        except Exception:
            pass
        result = await client.execute(case_id=case_id, document_type=doc_type)
        return NeslExecuteResponse(
            success=result.get("success", False),
            transaction_id=result.get("transaction_id"),
            filing_reference=result.get("filing_reference"),
            message=result.get("message"),
            error=result.get("error"),
            mode=result.get("mode", "mock"),
        )
    except Exception as e:
        logger.error(f"NeSL execution error: {e}")
        return NeslExecuteResponse(success=False, error=str(e))


class NOIWorkflowRequest(BaseModel):
    case_id: str = Field(..., description="Case ID to process")
    action: str = Field(
        ...,
        description="Action: generate_challan, verify_docs, file_noi, acknowledge, status",
    )
    acknowledgment_number: Optional[str] = Field(
        None, description="Required for acknowledge action"
    )


class NOIWorkflowResponse(BaseModel):
    success: bool
    error: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class NOIWebhookPayload(BaseModel):
    case_id: str
    noi_status: str = Field(..., description="New NOI status")
    notes: Optional[str] = None
    acknowledgment_number: Optional[str] = None


class NOISeedRequest(BaseModel):
    case_id: Optional[str] = Field(None, description="Optional custom case ID")
    borrower_name: Optional[str] = Field(None, description="Borrower name")
    bank_name: Optional[str] = Field(None, description="Bank name")
    loan_amount: Optional[str] = Field(None, description="Loan amount")


@app.post("/api/noi/seed", tags=["NOI"])
async def noi_seed(
    request: NOISeedRequest,
    auth: AuthContext = Depends(require_permission("noi.initiate")),
):
    try:
        case_data = request.model_dump(exclude_none=True)
        case_id = await noi_agent.seed_test_case(case_data)
        return NOIWorkflowResponse(
            success=True, data={"case_id": case_id, "noi_status": "DOCUMENTS_RECEIVED"}
        )
    except Exception as e:
        return NOIWorkflowResponse(success=False, error=str(e))


@app.post("/api/noi/workflow", tags=["NOI"])
async def noi_workflow(
    request: NOIWorkflowRequest,
    auth: AuthContext = Depends(require_permission("noi.initiate")),
):
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
    try:
        valid_statuses = [
            "CHALLAN_PAID",
            "NOI_DROP_RECEIVED",
            "RECTIFY",
            "MISMATCH",
            "REJECTED",
        ]
        if payload.noi_status not in valid_statuses:
            return NOIWorkflowResponse(success=False, error="Invalid status")
        success = await noi_agent.update_noi_status(
            case_id=payload.case_id,
            new_status=payload.noi_status,
            notes=payload.notes,
            force=True,
        )
        if not success:
            return NOIWorkflowResponse(success=False, error="Failed to update status")
        return NOIWorkflowResponse(
            success=True,
            data={"case_id": payload.case_id, "status": payload.noi_status},
        )
    except Exception as e:
        logger.error(f"NOI webhook error: {e}")
        return NOIWorkflowResponse(success=False, error=str(e))


@app.get("/api/hitl/tasks", tags=["HITL"])
async def hitl_list_tasks(auth: AuthContext = Depends(require_permission("hitl.view"))):
    tasks = await hitl_queue.list_pending()
    return {"success": True, "tasks": tasks, "count": len(tasks)}


class HITLClaimRequest(BaseModel):
    claimed_by: str = Field(default="admin", description="Who is claiming the task")


@app.post("/api/hitl/tasks/{task_id}/claim", tags=["HITL"])
async def hitl_claim_task(
    task_id: str,
    req: HITLClaimRequest,
    auth: AuthContext = Depends(require_permission("hitl.manage")),
):
    task = await hitl_queue.claim_task(task_id, req.claimed_by)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found or already claimed")
    return {"success": True, "task": task}


class HITLCompleteRequest(BaseModel):
    notes: str = Field(default="", description="Resolution notes")


@app.post("/api/hitl/tasks/{task_id}/complete", tags=["HITL"])
async def hitl_complete_task(
    task_id: str,
    req: HITLCompleteRequest,
    auth: AuthContext = Depends(require_permission("hitl.manage")),
):
    task = await hitl_queue.complete_task(task_id, req.notes)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"success": True, "task": task}


@app.get("/api/circuit-breakers", tags=["HITL"])
async def circuit_breaker_status(
    auth: AuthContext = Depends(require_permission("hitl.view")),
):
    results = {}
    for name, breaker in breakers.items():
        results[name] = await breaker.status()
    return {"success": True, "breakers": results}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
