"""
Admin API — platform overview for subscription_plan=admin users.
"""

from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.security import AuthUser, require_admin
from app.core.deps import get_supabase_admin
from app.services.admin_service import build_admin_overview, update_user_plan

router = APIRouter(prefix="/api/admin", tags=["Admin"])


class AdminStats(BaseModel):
    users_total: int
    users_by_plan: dict[str, int]
    accounts_total: int
    accounts_connected: int
    accounts_by_status: dict[str, int]
    copiers_total: int
    copiers_active: int
    copies_today: int
    failed_today: int
    avg_e2e_ms_today: Optional[int] = None
    avg_order_ms_today: Optional[int] = None
    avg_switch_ms_today: Optional[int] = None
    pending_commands: int = 0
    online_workers: int
    workers_total: int
    active_sessions: int


class AdminUserRow(BaseModel):
    id: str
    email: Optional[str] = None
    subscription_plan: str
    is_active_subscriber: bool
    created_at: Optional[str] = None


class AdminWorkerRow(BaseModel):
    id: str
    worker_name: Optional[str] = None
    region: Optional[str] = None
    host_identifier: Optional[str] = None
    status: Optional[str] = None
    capacity: Optional[int] = None
    active_sessions: Optional[int] = None
    last_heartbeat_at: Optional[str] = None
    online: bool = False


class AdminOverviewResponse(BaseModel):
    as_of: str
    stats: AdminStats
    users: list[AdminUserRow]
    workers: list[AdminWorkerRow]
    sessions: list[dict[str, Any]]
    failed_events: list[dict[str, Any]]
    recent_executions: list[dict[str, Any]] = Field(default_factory=list)
    user_emails: dict[str, Optional[str]] = Field(default_factory=dict)


class UserPlanUpdate(BaseModel):
    subscription_plan: str = Field(..., min_length=1, max_length=50)


@router.get("/overview", response_model=AdminOverviewResponse)
async def get_admin_overview(_: AuthUser = Depends(require_admin)):
    sb = get_supabase_admin()
    data = build_admin_overview(sb)
    return AdminOverviewResponse(**data)


@router.patch("/users/{user_id}/plan")
async def patch_user_plan(
    user_id: str,
    body: UserPlanUpdate,
    _: AuthUser = Depends(require_admin),
):
    sb = get_supabase_admin()
    try:
        return update_user_plan(sb, user_id, body.subscription_plan)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
