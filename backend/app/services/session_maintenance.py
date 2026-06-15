"""
Stale worker session detection (Phase 5).
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.core.deps import get_supabase_admin

HEARTBEAT_TTL_SECONDS = 120


def _live_worker_node_ids(sb, cutoff_iso: str) -> set[str]:
    """Worker nodes whose process heartbeat is still fresh.

    The worker refreshes its node heartbeat every ~30s but does not push a
    per-session heartbeat, so a running session's `last_heartbeat_at` stays
    fixed at session-start. Keying liveness off the node heartbeat prevents
    healthy accounts from flapping to "disconnected".
    """
    nodes = (
        sb.table("worker_nodes")
        .select("id, last_heartbeat_at")
        .gte("last_heartbeat_at", cutoff_iso)
        .execute()
    )
    return {n["id"] for n in (nodes.data or []) if n.get("id")}


def expire_stale_sessions() -> int:
    sb = get_supabase_admin()
    now = datetime.now(timezone.utc)
    cutoff = (now - timedelta(seconds=HEARTBEAT_TTL_SECONDS)).isoformat()

    stale = (
        sb.table("worker_sessions")
        .select("id, trading_account_id, worker_node_id")
        .in_("session_status", ["starting", "running", "reconnecting"])
        .lt("last_heartbeat_at", cutoff)
        .execute()
    )
    rows = stale.data or []
    if not rows:
        return 0

    live_nodes = _live_worker_node_ids(sb, cutoff)

    count = 0
    for row in rows:
        # Session heartbeat is stale, but if its worker node is still beating
        # the session is alive — skip it to avoid false disconnections.
        if row.get("worker_node_id") and row["worker_node_id"] in live_nodes:
            continue
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
