"""Aggregated dashboard summary for trader-facing home screen."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from app.services.equity_snapshots import load_snapshots_for_user, today_utc
from app.services.orchestrator import get_worker_health


def _today_start_iso() -> str:
    start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    return start.isoformat()


def build_dashboard_summary(sb, user_id: str) -> dict[str, Any]:
    health = get_worker_health()
    today_start = _today_start_iso()

    accounts = (
        sb.table("trading_accounts")
        .select(
            "id, account_label, account_number, platform, connection_status, "
            "balance, equity, currency, is_enabled, last_balance_sync_at, last_connected_at"
        )
        .eq("user_id", user_id)
        .eq("is_enabled", True)
        .execute()
    ).data or []

    copiers = (
        sb.table("copier_relations")
        .select(
            "id, label, master_account_id, follower_account_id, is_enabled, "
            "risk_mode, multiplier, fixed_lot_size"
        )
        .eq("user_id", user_id)
        .execute()
    ).data or []

    events = (
        sb.table("execution_events")
        .select(
            "id, status, event_type, copier_relation_id, master_account_id, "
            "follower_account_id, symbol_master, side, created_at, latency_ms, "
            "e2e_ms, error_message"
        )
        .eq("user_id", user_id)
        .gte("created_at", today_start)
        .order("created_at", desc=True)
        .limit(500)
        .execute()
    ).data or []

    snapshots = load_snapshots_for_user(sb, user_id)

    today_copies = sum(
        1 for e in events if e.get("event_type") == "position_opened" and e.get("status") == "success"
    )
    today_closed = sum(
        1
        for e in events
        if e.get("event_type") == "position_closed" and e.get("status") == "closed"
    )
    today_failed = sum(
        1 for e in events if e.get("status") in ("failed", "rejected")
    )

    copy_attempts = today_copies + today_failed
    copy_success_rate: Optional[float] = None
    if copy_attempts > 0:
        copy_success_rate = round((today_copies / copy_attempts) * 100, 2)

    latencies = [
        int(e["e2e_ms"] if e.get("e2e_ms") is not None else e["latency_ms"])
        for e in events
        if e.get("e2e_ms") is not None or e.get("latency_ms") is not None
    ]
    avg_latency_ms: Optional[int] = None
    if latencies:
        avg_latency_ms = round(sum(latencies) / len(latencies))

    total_equity = 0.0
    total_equity_open = 0.0
    has_equity = False
    account_rows: list[dict[str, Any]] = []

    for row in accounts:
        equity = float(row["equity"]) if row.get("equity") is not None else None
        balance = float(row["balance"]) if row.get("balance") is not None else None
        snap = snapshots.get(row["id"], {})
        equity_open = (
            float(snap["equity_open"])
            if snap.get("equity_open") is not None
            else equity
        )
        daily_change: Optional[float] = None
        if equity is not None and equity_open is not None:
            daily_change = round(equity - equity_open, 2)
            total_equity += equity
            total_equity_open += equity_open
            has_equity = True

        master_of = [c for c in copiers if c["master_account_id"] == row["id"]]
        follower_of = [c for c in copiers if c["follower_account_id"] == row["id"]]
        if master_of:
            role = "master"
        elif follower_of:
            role = "follower"
        else:
            role = "standalone"

        account_rows.append(
            {
                "id": row["id"],
                "label": row.get("account_label") or row["account_number"],
                "account_number": row["account_number"],
                "platform": row.get("platform", "mt5"),
                "connection_status": row.get("connection_status", "disconnected"),
                "balance": balance,
                "equity": equity,
                "currency": row.get("currency"),
                "role": role,
                "daily_equity_change": daily_change,
                "last_balance_sync_at": row.get("last_balance_sync_at")
                or row.get("last_connected_at"),
            }
        )

    last_by_copier: dict[str, dict] = {}
    for e in events:
        cid = e.get("copier_relation_id")
        if cid and cid not in last_by_copier:
            last_by_copier[cid] = e

    pipeline_rows: list[dict[str, Any]] = []
    for c in copiers:
        last = last_by_copier.get(c["id"])
        pipeline_rows.append(
            {
                "copier_id": c["id"],
                "label": c.get("label") or "Copy setup",
                "master_account_id": c["master_account_id"],
                "follower_account_id": c["follower_account_id"],
                "is_enabled": c.get("is_enabled", True),
                "allocation": (
                    f"{float(c.get('multiplier', 1)):.2f}x"
                    if c.get("risk_mode") == "multiplier"
                    else f"{float(c.get('fixed_lot_size', 0.01)):.2f} lots"
                ),
                "last_event_at": last.get("created_at") if last else None,
                "last_status": last.get("status") if last else None,
                "last_symbol": last.get("symbol_master") if last else None,
                "last_event_type": last.get("event_type") if last else None,
                "last_error_message": last.get("error_message") if last else None,
                "health": _pipeline_health(c, last, health.get("healthy", False)),
            }
        )

    onboarding = {
        "has_accounts": len(accounts) >= 1,
        "has_two_accounts": len(accounts) >= 2,
        "has_copier": len(copiers) >= 1,
        "has_active_copier": any(c.get("is_enabled") for c in copiers),
        "worker_healthy": health.get("healthy", False),
        "has_copy_today": today_copies > 0 or today_closed > 0,
    }
    onboarding["complete"] = all(
        [
            onboarding["has_accounts"],
            onboarding["has_two_accounts"],
            onboarding["has_copier"],
            onboarding["has_active_copier"],
            onboarding["worker_healthy"],
        ]
    )

    recent_activity = [
        {
            "id": e["id"],
            "at": e["created_at"],
            "status": e.get("status"),
            "event_type": e.get("event_type"),
            "symbol": e.get("symbol_master"),
            "side": e.get("side"),
            "copier_id": e.get("copier_relation_id"),
            "master_account_id": e.get("master_account_id"),
            "follower_account_id": e.get("follower_account_id"),
            "latency_ms": e.get("latency_ms"),
            "message": _activity_message(e),
        }
        for e in events[:20]
    ]

    return {
        "as_of": datetime.now(timezone.utc).isoformat(),
        "worker_healthy": health.get("healthy", False),
        "online_workers": health.get("online_workers", 0),
        "today": {
            "copies": today_copies,
            "closed": today_closed,
            "failed": today_failed,
            "net_equity_change": round(total_equity - total_equity_open, 2)
            if has_equity
            else None,
            "total_equity": round(total_equity, 2) if has_equity else None,
            "equity_open": round(total_equity_open, 2) if has_equity else None,
            "copy_success_rate": copy_success_rate,
            "avg_latency_ms": avg_latency_ms,
        },
        "accounts": account_rows,
        "pipelines": pipeline_rows,
        "recent_activity": recent_activity,
        "onboarding": onboarding,
        "active_copiers": sum(1 for c in copiers if c.get("is_enabled")),
        "connected_accounts": sum(
            1 for a in accounts if a.get("connection_status") == "connected"
        ),
    }


def _pipeline_health(
    copier: dict,
    last_event: Optional[dict],
    worker_healthy: bool,
) -> str:
    if not copier.get("is_enabled"):
        return "paused"
    if not worker_healthy:
        return "worker_offline"
    if last_event and last_event.get("status") in ("failed", "rejected"):
        return "error"
    if last_event:
        return "active"
    return "idle"


def _activity_message(event: dict) -> str:
    symbol = event.get("symbol_master") or "—"
    side = (event.get("side") or "").capitalize()
    et = event.get("event_type") or ""
    status = event.get("status") or ""

    if et == "position_opened" and status == "success":
        return f"Copied {symbol} {side} to follower"
    if et == "position_opened" and status in ("failed", "rejected"):
        return f"Failed to copy {symbol} {side}"
    if et == "position_closed" and status == "closed":
        return f"Closed {symbol} on follower"
    if status == "skipped_slippage":
        return f"Skipped {symbol} (too slow)"
    if status == "skipped_risk":
        return f"Blocked {symbol} (risk limit)"
    if status == "duplicate_ignored":
        return f"Duplicate {symbol} ignored"
    return f"{et.replace('_', ' ')} · {status}"
