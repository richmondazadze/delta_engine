"""
Admin dashboard aggregates — platform-wide stats for subscription_plan=admin users.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import structlog

logger = structlog.get_logger()

HEARTBEAT_ONLINE_SECONDS = 120


def _today_start() -> str:
    now = datetime.now(timezone.utc)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return start.isoformat()


def _online_cutoff() -> str:
    return (datetime.now(timezone.utc) - timedelta(seconds=HEARTBEAT_ONLINE_SECONDS)).isoformat()


def build_admin_overview(sb) -> dict[str, Any]:
    today = _today_start()
    online_cutoff = _online_cutoff()

    users_count = (
        sb.table("tc_users").select("id", count="exact").limit(1).execute()
    ).count or 0

    users_rows = (
        sb.table("tc_users")
        .select("id, email, subscription_plan, is_active_subscriber, created_at")
        .order("created_at", desc=True)
        .limit(80)
        .execute()
    ).data or []

    plan_rows = (
        sb.table("tc_users").select("subscription_plan").execute()
    ).data or []

    accounts_rows = (
        sb.table("trading_accounts")
        .select("id, connection_status, is_enabled, user_id")
        .execute()
    ).data or []

    copiers_rows = (
        sb.table("copier_relations")
        .select("id, is_enabled, user_id")
        .execute()
    ).data or []

    workers = (
        sb.table("worker_nodes")
        .select("*")
        .order("last_heartbeat_at", desc=True)
        .limit(50)
        .execute()
    ).data or []

    sessions = (
        sb.table("worker_sessions")
        .select(
            "id, session_status, trading_account_id, worker_node_id, "
            "last_heartbeat_at, last_error, started_at, stopped_at"
        )
        .order("started_at", desc=True)
        .limit(100)
        .execute()
    ).data or []

    events_today = (
        sb.table("execution_events")
        .select("id, status, e2e_ms, order_ms, switch_ms, created_at")
        .gte("created_at", today)
        .execute()
    ).data or []

    failed_recent = (
        sb.table("execution_events")
        .select(
            "id, user_id, event_type, status, master_ticket, follower_ticket, "
            "symbol_master, error_message, e2e_ms, order_ms, switch_ms, created_at"
        )
        .in_("status", ["failed", "rejected"])
        .order("created_at", desc=True)
        .limit(40)
        .execute()
    ).data or []

    recent_executions = (
        sb.table("execution_events")
        .select(
            "id, user_id, event_type, status, symbol_master, copier_relation_id, "
            "e2e_ms, order_ms, switch_ms, latency_ms, created_at"
        )
        .order("created_at", desc=True)
        .limit(60)
        .execute()
    ).data or []

    pending_commands = (
        sb.table("worker_commands")
        .select("id", count="exact")
        .eq("status", "pending")
        .execute()
    ).count or 0

    user_emails = {
        u["id"]: u.get("email")
        for u in (
            sb.table("tc_users").select("id, email").limit(500).execute()
        ).data
        or []
    }

    plan_counts: dict[str, int] = {}
    for u in plan_rows:
        plan = u.get("subscription_plan") or "free"
        plan_counts[plan] = plan_counts.get(plan, 0) + 1

    conn_counts: dict[str, int] = {}
    for a in accounts_rows:
        st = a.get("connection_status") or "disconnected"
        conn_counts[st] = conn_counts.get(st, 0) + 1

    copies_today = sum(1 for e in events_today if e.get("status") in ("success", "closed"))
    failed_today = sum(1 for e in events_today if e.get("status") in ("failed", "rejected"))

    e2e_samples = [
        int(e["e2e_ms"])
        for e in events_today
        if e.get("e2e_ms") is not None and e.get("status") in ("success", "closed")
    ]
    avg_e2e_ms = round(sum(e2e_samples) / len(e2e_samples)) if e2e_samples else None

    order_samples = [
        int(e["order_ms"])
        for e in events_today
        if e.get("order_ms") is not None and e.get("status") in ("success", "closed")
    ]
    avg_order_ms = round(sum(order_samples) / len(order_samples)) if order_samples else None
    switch_samples = [
        int(e["switch_ms"])
        for e in events_today
        if e.get("switch_ms") is not None and e.get("status") in ("success", "closed")
    ]
    avg_switch_ms = round(sum(switch_samples) / len(switch_samples)) if switch_samples else None

    online_workers = sum(
        1
        for w in workers
        if w.get("last_heartbeat_at")
        and w["last_heartbeat_at"] >= online_cutoff
        and w.get("status") != "offline"
    )

    active_sessions = sum(
        1 for s in sessions if s.get("session_status") in ("starting", "running", "reconnecting")
    )

    return {
        "as_of": datetime.now(timezone.utc).isoformat(),
        "stats": {
            "users_total": users_count,
            "users_by_plan": plan_counts,
            "accounts_total": len(accounts_rows),
            "accounts_connected": conn_counts.get("connected", 0),
            "accounts_by_status": conn_counts,
            "copiers_total": len(copiers_rows),
            "copiers_active": sum(1 for c in copiers_rows if c.get("is_enabled")),
            "copies_today": copies_today,
            "failed_today": failed_today,
            "avg_e2e_ms_today": avg_e2e_ms,
            "avg_order_ms_today": avg_order_ms,
            "avg_switch_ms_today": avg_switch_ms,
            "pending_commands": pending_commands,
            "online_workers": online_workers,
            "workers_total": len(workers),
            "active_sessions": active_sessions,
        },
        "users": [
            {
                "id": u["id"],
                "email": u.get("email"),
                "subscription_plan": u.get("subscription_plan") or "free",
                "is_active_subscriber": bool(u.get("is_active_subscriber")),
                "created_at": u.get("created_at"),
            }
            for u in users_rows
        ],
        "workers": [
            {
                "id": w["id"],
                "worker_name": w.get("worker_name"),
                "region": w.get("region"),
                "host_identifier": w.get("host_identifier"),
                "status": w.get("status"),
                "capacity": w.get("capacity"),
                "active_sessions": w.get("active_sessions"),
                "last_heartbeat_at": w.get("last_heartbeat_at"),
                "online": bool(
                    w.get("last_heartbeat_at") and w["last_heartbeat_at"] >= online_cutoff
                ),
            }
            for w in workers
        ],
        "sessions": sessions[:40],
        "failed_events": failed_recent,
        "recent_executions": [
            {
                **e,
                "user_email": user_emails.get(e.get("user_id")),
            }
            for e in recent_executions
        ],
        "user_emails": user_emails,
    }


def update_user_plan(sb, user_id: str, subscription_plan: str) -> dict[str, Any]:
    allowed = {
        "free",
        "standard",
        "premium",
        "analyzer",
        "dedicated",
        "admin",
        # legacy aliases
        "starter",
        "pro",
        "enterprise",
    }
    if subscription_plan not in allowed:
        raise ValueError(f"Invalid plan: {subscription_plan}")

    result = (
        sb.table("tc_users")
        .update({"subscription_plan": subscription_plan})
        .eq("id", user_id)
        .execute()
    )
    if not result.data:
        raise LookupError("User not found")
    row = result.data[0]
    return {
        "id": row["id"],
        "email": row.get("email"),
        "subscription_plan": row.get("subscription_plan"),
    }
