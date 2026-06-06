"""
Delta Engine — Internal Worker API (service-to-service)
POST /internal/workers/register, heartbeat, session-started, session-failed
POST /internal/execution-events
"""

import os
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from app.core.config import get_settings
from app.core.deps import get_supabase_admin
from app.models.worker import (
    WorkerRegister,
    WorkerHeartbeat,
    SessionStarted,
    SessionFailed,
    WorkerNodeResponse,
)
from app.models.execution import ExecutionEventCreate, ExecutionEventResponse
from pydantic import BaseModel
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/internal", tags=["Internal — Workers"])


def verify_worker_key(x_worker_key: str = Header(..., alias="X-Worker-Key")) -> None:
    expected = get_settings().worker_api_key
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
    now = datetime.now(timezone.utc).isoformat()

    existing = (
        sb.table("worker_sessions")
        .select("id")
        .eq("trading_account_id", payload.trading_account_id)
        .in_("session_status", ["starting", "running", "reconnecting"])
        .execute()
    )

    session_data = {
        "worker_node_id": payload.worker_id,
        "session_status": "running",
        "terminal_path": payload.terminal_path,
        "process_id": payload.process_id,
        "last_heartbeat_at": now,
    }

    if existing.data:
        sb.table("worker_sessions").update(session_data).eq(
            "id", existing.data[0]["id"]
        ).execute()
    else:
        sb.table("worker_sessions").insert(
            {
                **session_data,
                "trading_account_id": payload.trading_account_id,
                "started_at": now,
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


class ExecutionEventBatch(BaseModel):
    events: list[ExecutionEventCreate]


@router.post("/execution-events/batch", status_code=201)
async def create_execution_events_batch(
    payload: ExecutionEventBatch,
    user_id: str = Header(..., alias="X-User-Id"),
    _: None = Depends(verify_worker_key),
):
    """Workers log execution events in batches to keep the copy hot path fast."""
    if not payload.events:
        return {"inserted": 0, "events": []}
    sb = get_supabase_admin()
    rows = []
    for item in payload.events:
        data = item.model_dump()
        data["user_id"] = user_id
        rows.append(data)
    result = sb.table("execution_events").insert(rows).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to log events")
    return {"inserted": len(result.data), "events": result.data}


class CommandComplete(BaseModel):
    success: bool = True
    result: dict = {}
    error: Optional[str] = None


@router.get("/worker-commands")
async def list_pending_commands(
    user_id: str = Header(..., alias="X-User-Id"),
    _: None = Depends(verify_worker_key),
):
    sb = get_supabase_admin()
    result = (
        sb.table("worker_commands")
        .select("*")
        .eq("user_id", user_id)
        .eq("status", "pending")
        .order("created_at")
        .limit(20)
        .execute()
    )
    return {"commands": result.data or []}


@router.post("/worker-commands/{command_id}/complete")
async def complete_worker_command(
    command_id: str,
    payload: CommandComplete,
    _: None = Depends(verify_worker_key),
):
    sb = get_supabase_admin()
    cmd_row = (
        sb.table("worker_commands")
        .select("command_type, trading_account_id")
        .eq("id", command_id)
        .single()
        .execute()
    ).data

    sb.table("worker_commands").update(
        {
            "status": "completed" if payload.success else "failed",
            "result": payload.result,
            "error_message": payload.error,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("id", command_id).execute()

    if cmd_row and cmd_row.get("command_type") == "test_connection":
        account_id = cmd_row["trading_account_id"]
        result = payload.result or {}
        if payload.success:
            sb.table("trading_accounts").update(
                {
                    "connection_status": "connected",
                    "last_error": None,
                    "balance": result.get("balance"),
                    "equity": result.get("equity"),
                    "currency": result.get("currency"),
                }
            ).eq("id", account_id).execute()
        else:
            sb.table("trading_accounts").update(
                {
                    "connection_status": result.get("connection_status", "auth_failed"),
                    "last_error": payload.error or result.get("message"),
                }
            ).eq("id", account_id).execute()

    return {"status": "ok"}


class AccountBalanceUpdate(BaseModel):
    trading_account_id: str
    balance: float | None = None
    equity: float | None = None
    currency: str | None = None
    connection_status: str | None = None


class AccountBalancesBatch(BaseModel):
    user_id: str
    accounts: list[AccountBalanceUpdate]


@router.post("/account-balances")
async def update_account_balances(
    payload: AccountBalancesBatch,
    _: None = Depends(verify_worker_key),
):
    """Worker pushes fresh balance/equity readings for dashboard live sync."""
    from app.services.equity_snapshots import ensure_daily_snapshot

    sb = get_supabase_admin()
    now = datetime.now(timezone.utc).isoformat()

    for row in payload.accounts:
        update: dict = {"last_balance_sync_at": now}
        if row.balance is not None:
            update["balance"] = row.balance
        if row.equity is not None:
            update["equity"] = row.equity
        if row.currency:
            update["currency"] = row.currency
        if row.connection_status:
            update["connection_status"] = row.connection_status
            if row.connection_status == "connected":
                update["last_error"] = None
                update["last_connected_at"] = now

        sb.table("trading_accounts").update(update).eq(
            "id", row.trading_account_id
        ).eq("user_id", payload.user_id).execute()

        if row.equity is not None or row.balance is not None:
            ensure_daily_snapshot(
                sb,
                user_id=payload.user_id,
                account_id=row.trading_account_id,
                equity=row.equity,
                balance=row.balance,
                currency=row.currency,
            )

    return {"status": "ok", "updated": len(payload.accounts)}
