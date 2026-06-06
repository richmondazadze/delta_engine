"""
Trader dashboard summary — live KPIs, pipelines, today's activity.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Any, Optional

from app.core.deps import get_supabase_admin
from app.core.security import AuthUser, get_current_user
from app.services.dashboard_service import build_dashboard_summary

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


class DashboardToday(BaseModel):
    copies: int
    closed: int
    failed: int
    net_equity_change: Optional[float] = None
    total_equity: Optional[float] = None


class DashboardOnboarding(BaseModel):
    has_accounts: bool
    has_two_accounts: bool
    has_copier: bool
    has_active_copier: bool
    worker_healthy: bool
    has_copy_today: bool
    complete: bool


class DashboardSummaryResponse(BaseModel):
    as_of: str
    worker_healthy: bool
    online_workers: int
    today: DashboardToday
    accounts: list[dict[str, Any]]
    pipelines: list[dict[str, Any]]
    recent_activity: list[dict[str, Any]]
    onboarding: DashboardOnboarding
    active_copiers: int
    connected_accounts: int


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    current_user: AuthUser = Depends(get_current_user),
):
    sb = get_supabase_admin()
    data = build_dashboard_summary(sb, current_user.user_id)
    return DashboardSummaryResponse(**data)
