"""
Stale worker session detection (Phase 5).
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.core.deps import get_supabase_admin

HEARTBEAT_TTL_SECONDS = 120


def expire_stale_sessions() -> int:
    sb = get_supabase_admin()
    cutoff = (datetime.now(timezone.utc) - timedelta(seconds=HEARTBEAT_TTL_SECONDS)).isoformat()

    stale = (
        sb.table("worker_sessions")
        .select("id, trading_account_id")
        .in_("session_status", ["starting", "running", "reconnecting"])
        .lt("last_heartbeat_at", cutoff)
        .execute()
    )

    count = 0
    for row in stale.data or []:
        sb.table("worker_sessions").update(
            {
                "session_status": "failed",
                "last_error": "Heartbeat TTL exceeded",
                "stopped_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("id", row["id"]).execute()
        sb.table("trading_accounts").update({"connection_status": "disconnected"}).eq(
            "id", row["trading_account_id"]
        ).execute()
        count += 1

    return count
