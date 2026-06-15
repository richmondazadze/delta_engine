"""
Minimal worker orchestrator — session lifecycle and worker node assignment (Phases 3–5).
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

import structlog

from app.core.deps import get_supabase_admin
from app.core.encryption import decrypt_password
from app.services.mt5_connection import ConnectionTestResult, test_mt5_login

logger = structlog.get_logger()

ACTIVE_SESSION_STATUSES = ("starting", "running", "reconnecting")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_account(sb, account_id: str, user_id: str) -> dict[str, Any]:
    result = (
        sb.table("trading_accounts")
        .select("*")
        .eq("id", account_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise ValueError("Account not found")
    return result.data


def _pick_worker_node(sb) -> Optional[str]:
    nodes = (
        sb.table("worker_nodes")
        .select("id, capacity, active_sessions, status")
        .eq("status", "online")
        .order("active_sessions")
        .limit(5)
        .execute()
    )
    for node in nodes.data or []:
        cap = node.get("capacity") or 1
        active = node.get("active_sessions") or 0
        if active < cap:
            return node["id"]
    return None


def _prepare_mt5_row(row: dict[str, Any]) -> dict[str, Any]:
    """Ensure terminal_path is set from broker preset when missing."""
    from app.services.terminal_discovery import resolve_for_account

    meta = row.get("account_metadata") or {}
    from app.services.terminal_discovery import path_exists

    if row.get("terminal_path") and path_exists(row["terminal_path"]):
        return row

    path, broker = resolve_for_account(
        broker_slug=meta.get("broker_slug"),
        broker_server=row.get("broker_server", ""),
        terminal_path=row.get("terminal_path"),
    )
    if path:
        row = {**row, "terminal_path": path}
    if broker and not meta.get("broker_name"):
        meta = {**meta, "broker_slug": broker.slug, "broker_name": broker.name}
        row = {**row, "account_metadata": meta}
    return row


def _mt5_runtime_available() -> bool:
    try:
        import MetaTrader5  # noqa: F401

        return True
    except ImportError:
        return False


def _queue_test_connection(account_id: str, user_id: str, message: str) -> dict[str, Any]:
    sb = get_supabase_admin()
    sb.table("worker_commands").insert(
        {
            "user_id": user_id,
            "trading_account_id": account_id,
            "command_type": "test_connection",
            "status": "pending",
            "payload": {},
        }
    ).execute()
    sb.table("trading_accounts").update(
        {
            "connection_status": "disconnected",
            "last_error": message,
        }
    ).eq("id", account_id).execute()
    return {
        "account_id": account_id,
        "status": "queued",
        "message": message,
    }


def _apply_connection_result(
    sb,
    account_id: str,
    result: ConnectionTestResult,
) -> dict[str, Any]:
    if result.success:
        sb.table("trading_accounts").update(
            {
                "connection_status": "connected",
                "last_error": None,
                "balance": result.balance,
                "equity": result.equity,
                "currency": result.currency,
            }
        ).eq("id", account_id).execute()
        return {
            "account_id": account_id,
            "status": "connected",
            "message": result.message,
            "balance": result.balance,
            "equity": result.equity,
        }

    sb.table("trading_accounts").update(
        {
            "connection_status": result.connection_status,
            "last_error": result.message,
        }
    ).eq("id", account_id).execute()
    return {
        "account_id": account_id,
        "status": result.connection_status,
        "message": result.message,
    }


def test_account_connection(account_id: str, user_id: str) -> dict[str, Any]:
    sb = get_supabase_admin()
    row = _get_account(sb, account_id, user_id)

    platform = row.get("platform", "mt5")
    password = decrypt_password(row["encrypted_password"])

    if platform == "dxtrade":
        from app.services.dxtrade_connection import test_dxtrade_login

        meta = row.get("account_metadata") or {}
        result = test_dxtrade_login(
            username=row["account_number"],
            password=password,
            domain=row["broker_server"],
            api_base_url=row.get("api_base_url"),
            firm_slug=meta.get("firm_slug"),
        )
    elif platform == "mt5":
        row = _prepare_mt5_row(row)
        if row.get("terminal_path") != _get_account(sb, account_id, user_id).get("terminal_path"):
            sb.table("trading_accounts").update(
                {
                    "terminal_path": row.get("terminal_path"),
                    "account_metadata": row.get("account_metadata"),
                }
            ).eq("id", account_id).execute()

        if not row.get("terminal_path"):
            return _apply_connection_result(
                sb,
                account_id,
                ConnectionTestResult(
                    success=False,
                    connection_status="terminal_unavailable",
                    message=(
                        "Could not find your broker's MT5 terminal on this machine. "
                        "Install the broker's MT5 app, then link the account again and pick the correct broker."
                    ),
                ),
            )

        health = get_worker_health()
        if health.get("healthy"):
            return _queue_test_connection(
                account_id,
                user_id,
                "Test queued — the copy worker will verify this account on its next cycle (usually within a few seconds).",
            )

        if not _mt5_runtime_available():
            return _apply_connection_result(
                sb,
                account_id,
                ConnectionTestResult(
                    success=False,
                    connection_status="terminal_unavailable",
                    message=(
                        "Start the CopyMorphic worker on a Windows PC with your broker's MT5 installed, "
                        "then test again."
                    ),
                ),
            )

        result = test_mt5_login(
            login=row["account_number"],
            password=password,
            server=row["broker_server"],
            terminal_path=row.get("terminal_path"),
        )
    else:
        sb.table("trading_accounts").update(
            {
                "connection_status": "disconnected",
                "last_error": f"Connection test not implemented for {platform}",
            }
        ).eq("id", account_id).execute()
        return {
            "account_id": account_id,
            "status": "unsupported",
            "message": f"Platform '{platform}' is not yet supported for connection tests.",
        }

    return _apply_connection_result(sb, account_id, result)


def start_account_session(account_id: str, user_id: str) -> dict[str, Any]:
    sb = get_supabase_admin()
    row = _get_account(sb, account_id, user_id)

    existing = (
        sb.table("worker_sessions")
        .select("id, session_status")
        .eq("trading_account_id", account_id)
        .in_("session_status", list(ACTIVE_SESSION_STATUSES))
        .execute()
    )
    if existing.data:
        return {
            "account_id": account_id,
            "status": "running",
            "session_id": existing.data[0]["id"],
            "message": "Session already active.",
        }

    worker_id = _pick_worker_node(sb)
    session_data = {
        "trading_account_id": account_id,
        "session_status": "running" if worker_id else "starting",
        "terminal_path": row.get("terminal_path"),
        "started_at": _now_iso(),
        "last_heartbeat_at": _now_iso(),
    }
    if worker_id:
        session_data["worker_node_id"] = worker_id

    ins = sb.table("worker_sessions").insert(session_data).execute()
    session_id = ins.data[0]["id"] if ins.data else None

    sb.table("trading_accounts").update({"connection_status": "connected"}).eq(
        "id", account_id
    ).execute()

    if worker_id:
        node = (
            sb.table("worker_nodes")
            .select("active_sessions")
            .eq("id", worker_id)
            .single()
            .execute()
        )
        active = (node.data or {}).get("active_sessions") or 0
        sb.table("worker_nodes").update({"active_sessions": active + 1}).eq(
            "id", worker_id
        ).execute()

    return {
        "account_id": account_id,
        "status": "running",
        "session_id": session_id,
        "worker_id": worker_id,
        "message": "Worker session started.",
    }


def stop_account_session(account_id: str, user_id: str) -> dict[str, Any]:
    sb = get_supabase_admin()
    _get_account(sb, account_id, user_id)

    sessions = (
        sb.table("worker_sessions")
        .select("id, worker_node_id")
        .eq("trading_account_id", account_id)
        .in_("session_status", list(ACTIVE_SESSION_STATUSES))
        .execute()
    )

    for sess in sessions.data or []:
        sb.table("worker_sessions").update(
            {
                "session_status": "stopped",
                "stopped_at": _now_iso(),
            }
        ).eq("id", sess["id"]).execute()

        wid = sess.get("worker_node_id")
        if wid:
            node = (
                sb.table("worker_nodes")
                .select("active_sessions")
                .eq("id", wid)
                .single()
                .execute()
            )
            active = max(0, ((node.data or {}).get("active_sessions") or 1) - 1)
            sb.table("worker_nodes").update({"active_sessions": active}).eq(
                "id", wid
            ).execute()

    sb.table("trading_accounts").update({"connection_status": "disconnected"}).eq(
        "id", account_id
    ).execute()

    return {
        "account_id": account_id,
        "status": "stopped",
        "message": "Worker session stopped.",
    }


def queue_flatten(account_id: str, user_id: str) -> dict[str, Any]:
    sb = get_supabase_admin()
    _get_account(sb, account_id, user_id)

    sb.table("worker_commands").insert(
        {
            "user_id": user_id,
            "trading_account_id": account_id,
            "command_type": "flatten",
            "status": "pending",
            "payload": {},
        }
    ).execute()

    return {
        "account_id": account_id,
        "status": "queued",
        "message": "Flatten command queued for worker.",
    }


def delete_trading_account(account_id: str, user_id: str) -> None:
    """Stop sessions, detach audit history, and remove the trading account."""
    sb = get_supabase_admin()
    _get_account(sb, account_id, user_id)

    stop_account_session(account_id, user_id)

    sb.table("worker_commands").update({"status": "cancelled"}).eq(
        "trading_account_id", account_id
    ).eq("status", "pending").execute()

    sb.table("execution_events").update({"master_account_id": None}).eq(
        "master_account_id", account_id
    ).execute()
    sb.table("execution_events").update({"follower_account_id": None}).eq(
        "follower_account_id", account_id
    ).execute()

    deleted = (
        sb.table("trading_accounts")
        .delete()
        .eq("id", account_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not deleted.data:
        still = (
            sb.table("trading_accounts")
            .select("id")
            .eq("id", account_id)
            .eq("user_id", user_id)
            .execute()
        )
        if still.data:
            raise ValueError("Failed to delete account")

    logger.info("account_deleted", user_id=user_id, account_id=account_id)


WORKER_HEARTBEAT_TTL_SECONDS = 120


def _heartbeat_fresh(last_heartbeat_at: Optional[str]) -> bool:
    if not last_heartbeat_at:
        return False
    try:
        ts = datetime.fromisoformat(str(last_heartbeat_at).replace("Z", "+00:00"))
    except ValueError:
        return False
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    age = (datetime.now(timezone.utc) - ts).total_seconds()
    return age <= WORKER_HEARTBEAT_TTL_SECONDS


def get_worker_health() -> dict[str, Any]:
    sb = get_supabase_admin()
    nodes = (
        sb.table("worker_nodes")
        .select("id, worker_name, status, last_heartbeat_at, active_sessions, capacity")
        .order("last_heartbeat_at", desc=True)
        .limit(10)
        .execute()
    )
    node_rows = nodes.data or []

    # A node is only truly online if its process heartbeat is still fresh.
    # A crashed worker keeps status="online" but stops beating; treat it offline.
    online = [
        n
        for n in node_rows
        if n.get("status") == "online" and _heartbeat_fresh(n.get("last_heartbeat_at"))
    ]

    # Self-heal stale rows so the dashboard reflects reality.
    for n in node_rows:
        if n.get("status") == "online" and not _heartbeat_fresh(n.get("last_heartbeat_at")):
            try:
                sb.table("worker_nodes").update({"status": "offline"}).eq(
                    "id", n["id"]
                ).execute()
            except Exception:
                pass

    return {
        "online_workers": len(online),
        "workers": node_rows,
        "healthy": len(online) > 0,
    }
