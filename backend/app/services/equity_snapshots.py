"""Daily equity open snapshots for dashboard P&L delta."""

from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any, Optional


def today_utc() -> date:
    return datetime.now(timezone.utc).date()


def ensure_daily_snapshot(
    sb,
    *,
    user_id: str,
    account_id: str,
    equity: Optional[float],
    balance: Optional[float],
    currency: Optional[str],
) -> None:
    snap_date = today_utc().isoformat()
    existing = (
        sb.table("account_equity_snapshots")
        .select("id")
        .eq("trading_account_id", account_id)
        .eq("snapshot_date", snap_date)
        .execute()
    )
    if existing.data:
        return
    sb.table("account_equity_snapshots").insert(
        {
            "user_id": user_id,
            "trading_account_id": account_id,
            "snapshot_date": snap_date,
            "equity_open": equity,
            "balance_open": balance,
            "currency": currency,
        }
    ).execute()


def load_snapshots_for_user(sb, user_id: str) -> dict[str, dict[str, Any]]:
    snap_date = today_utc().isoformat()
    rows = (
        sb.table("account_equity_snapshots")
        .select("trading_account_id, equity_open, balance_open, currency")
        .eq("user_id", user_id)
        .eq("snapshot_date", snap_date)
        .execute()
    ).data or []
    return {r["trading_account_id"]: r for r in rows}
