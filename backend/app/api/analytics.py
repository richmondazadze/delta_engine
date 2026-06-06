"""
Analyzer metrics from execution_events (Phase 7).
"""

from __future__ import annotations

from collections import Counter
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.core.deps import get_supabase_admin
from app.core.security import AuthUser, get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


class AnalyticsSummary(BaseModel):
    total_events: int
    copied: int
    failed: int
    skipped_risk: int
    skipped_slippage: int
    duplicate_ignored: int
    win_rate: float | None = None
    symbols: dict[str, int]
    recent_status_counts: dict[str, int]


@router.get("/summary", response_model=AnalyticsSummary)
async def analytics_summary(
    current_user: AuthUser = Depends(get_current_user),
    account_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
):
    sb = get_supabase_admin()
    query = (
        sb.table("execution_events")
        .select("status, symbol_master, event_type")
        .eq("user_id", current_user.user_id)
        .order("created_at", desc=True)
        .limit(5000)
    )
    if account_id:
        query = query.or_(
            f"master_account_id.eq.{account_id},follower_account_id.eq.{account_id}"
        )

    rows = query.execute().data or []
    status_counter = Counter(r.get("status") for r in rows)
    symbol_counter = Counter(
        r.get("symbol_master") for r in rows if r.get("symbol_master")
    )

    copied = status_counter.get("success", 0) + status_counter.get("closed", 0)
    failed = status_counter.get("failed", 0)
    decided = copied + failed
    win_rate = round(copied / decided * 100, 1) if decided else None

    return AnalyticsSummary(
        total_events=len(rows),
        copied=copied,
        failed=failed,
        skipped_risk=status_counter.get("skipped_risk", 0),
        skipped_slippage=status_counter.get("skipped_slippage", 0),
        duplicate_ignored=status_counter.get("duplicate_ignored", 0),
        win_rate=win_rate,
        symbols=dict(symbol_counter.most_common(10)),
        recent_status_counts=dict(status_counter),
    )
