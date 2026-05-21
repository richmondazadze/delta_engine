"""
Delta Engine — Internal Worker API (service-to-service)
POST /internal/workers/register, heartbeat, session-started, session-failed
POST /internal/execution-events
"""

import os
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header
from app.core.deps import get_supabase_admin
from app.models.worker import (
    WorkerRegister,
    WorkerHeartbeat,
    SessionStarted,
    SessionFailed,
    WorkerNodeResponse,
)
from app.models.execution import ExecutionEventCreate, ExecutionEventResponse
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/internal", tags=["Internal — Workers"])


def verify_worker_key(x_worker_key: str = Header(..., alias="X-Worker-Key")) -> None:
    expected = os.environ.get("WORKER_API_KEY", "")
    if not expected or x_worker_key != expected:
        raise HTTPException(status_code=401, detail="Invalid worker API key")


@router.post("/workers/register", response_model=WorkerNodeResponse)
async def register_worker(
    payload: WorkerRegister,
    _: None = Depends(verify_worker_key),
):
    sb = get_supabase_admin()
    data = {
        "worker_name": payload.worker_name,
        "region": payload.region,
        "host_identifier": payload.host_identifier,
        "capacity": payload.capacity,
        "status": "online",
        "metadata": payload.metadata,
        "last_heartbeat_at": datetime.now(timezone.utc).isoformat(),
    }
    result = sb.table("worker_nodes").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to register worker")
    logger.info("worker_registered", worker_name=payload.worker_name)
    return WorkerNodeResponse(**result.data[0])


@router.post("/workers/heartbeat")
async def worker_heartbeat(
    payload: WorkerHeartbeat,
    _: None = Depends(verify_worker_key),
):
    sb = get_supabase_admin()
    sb.table("worker_nodes").update(
        {
            "active_sessions": payload.active_sessions,
            "last_heartbeat_at": datetime.now(timezone.utc).isoformat(),
            "status": "online",
            "metadata": payload.metadata,
        }
    ).eq("id", payload.worker_id).execute()
    return {"status": "ok"}


@router.post("/workers/session-started")
async def session_started(
    payload: SessionStarted,
    _: None = Depends(verify_worker_key),
):
    sb = get_supabase_admin()
    sb.table("worker_sessions").insert(
        {
            "worker_node_id": payload.worker_id,
            "trading_account_id": payload.trading_account_id,
            "session_status": "running",
            "terminal_path": payload.terminal_path,
            "process_id": payload.process_id,
            "last_heartbeat_at": datetime.now(timezone.utc).isoformat(),
        }
    ).execute()
    sb.table("trading_accounts").update({"connection_status": "connected"}).eq(
        "id", payload.trading_account_id
    ).execute()
    return {"status": "ok"}


@router.post("/workers/session-failed")
async def session_failed(
    payload: SessionFailed,
    _: None = Depends(verify_worker_key),
):
    sb = get_supabase_admin()
    sb.table("worker_sessions").update(
        {
            "session_status": "failed",
            "last_error": payload.error,
            "stopped_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("trading_account_id", payload.trading_account_id).execute()
    sb.table("trading_accounts").update(
        {"connection_status": "auth_failed", "last_error": payload.error}
    ).eq("id", payload.trading_account_id).execute()
    return {"status": "ok"}


@router.post("/execution-events", response_model=ExecutionEventResponse, status_code=201)
async def create_execution_event(
    payload: ExecutionEventCreate,
    user_id: str = Header(..., alias="X-User-Id"),
    _: None = Depends(verify_worker_key),
):
    """Workers log execution events (includes user_id header from session context)."""
    sb = get_supabase_admin()
    data = payload.model_dump()
    data["user_id"] = user_id
    result = sb.table("execution_events").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to log event")
    return ExecutionEventResponse(**result.data[0])
