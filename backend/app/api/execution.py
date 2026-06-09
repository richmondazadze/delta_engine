"""
Delta Engine — Execution Events API
GET /api/execution-events, GET /api/execution-events/:id
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from app.core.security import AuthUser, get_current_user
from app.core.deps import get_supabase_admin
from app.models.execution import ExecutionEventResponse, ExecutionEventListResponse
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/api/execution-events", tags=["Execution Logs"])

STATUS_GROUPS: dict[str, list[str]] = {
    "executed": ["success", "closed", "partial", "modified"],
    "failed": ["failed", "rejected"],
    "skipped": ["skipped_risk", "skipped_slippage", "duplicate_ignored"],
    "pending": ["pending"],
}


def _parse_iso_datetime(value: str) -> datetime:
    normalized = value.replace("Z", "+00:00")
    dt = datetime.fromisoformat(normalized)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _resolve_status_filters(
    status: Optional[str],
    status_groups: Optional[str],
) -> Optional[list[str]]:
    if status_groups:
        selected = [g.strip() for g in status_groups.split(",") if g.strip()]
        merged: list[str] = []
        for group in selected:
            merged.extend(STATUS_GROUPS.get(group, []))
        if merged:
            return list(dict.fromkeys(merged))
    if status:
        return [status]
    return None


@router.get("", response_model=ExecutionEventListResponse)
async def list_execution_events(
    current_user: AuthUser = Depends(get_current_user),
    copier_relation_id: Optional[str] = Query(None),
    master_account_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    status_groups: Optional[str] = Query(
        None,
        description="Comma-separated UI groups: executed, failed, skipped, pending",
    ),
    symbol: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None, description="ISO8601 lower bound (inclusive)"),
    date_to: Optional[str] = Query(None, description="ISO8601 upper bound (inclusive)"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """List execution events for the current user."""
    sb = get_supabase_admin()

    query = (
        sb.table("execution_events")
        .select("*", count="exact")
        .eq("user_id", current_user.user_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
    )

    if copier_relation_id:
        query = query.eq("copier_relation_id", copier_relation_id)
    if master_account_id:
        query = query.eq("master_account_id", master_account_id)
    if symbol:
        needle = symbol.strip().upper()
        query = query.or_(
            f"symbol_master.ilike.%{needle}%,symbol_follower.ilike.%{needle}%"
        )

    statuses = _resolve_status_filters(status, status_groups)
    if statuses:
        if len(statuses) == 1:
            query = query.eq("status", statuses[0])
        else:
            query = query.in_("status", statuses)

    if date_from:
        query = query.gte("created_at", _parse_iso_datetime(date_from).isoformat())
    if date_to:
        query = query.lte("created_at", _parse_iso_datetime(date_to).isoformat())

    result = query.execute()

    page = (offset // limit) + 1 if limit else 1
    return ExecutionEventListResponse(
        events=[ExecutionEventResponse(**row) for row in result.data],
        total=result.count or len(result.data),
        page=page,
        per_page=limit,
    )


@router.get("/{event_id}", response_model=ExecutionEventResponse)
async def get_execution_event(
    event_id: str,
    current_user: AuthUser = Depends(get_current_user),
):
    """Get a single execution event."""
    sb = get_supabase_admin()

    result = (
        sb.table("execution_events")
        .select("*")
        .eq("id", event_id)
        .eq("user_id", current_user.user_id)
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Execution event not found")

    return ExecutionEventResponse(**result.data)
