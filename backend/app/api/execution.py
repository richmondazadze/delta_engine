"""
Delta Engine — Execution Events API
GET /api/execution-events, GET /api/execution-events/:id
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.core.security import AuthUser, get_current_user
from app.core.deps import get_supabase_admin
from app.models.execution import ExecutionEventResponse, ExecutionEventListResponse
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/api/execution-events", tags=["Execution Logs"])


@router.get("", response_model=ExecutionEventListResponse)
async def list_execution_events(
    current_user: AuthUser = Depends(get_current_user),
    copier_relation_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    symbol: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
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
    if status:
        query = query.eq("status", status)
    if symbol:
        query = query.or_(
            f"symbol_master.eq.{symbol},symbol_follower.eq.{symbol}"
        )

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
