"""
Run a single MT5 copy job in an isolated process (one terminal path per pool worker).
"""

from __future__ import annotations

import time
from typing import Any

import structlog

logger = structlog.get_logger()

_POOL_TERMINAL_PATH: str = ""
_WARM_ACCOUNT_ID: str = ""
_WARM_SESSION = None


def _init_pool_worker(terminal_path: str) -> None:
    global _POOL_TERMINAL_PATH, _WARM_ACCOUNT_ID, _WARM_SESSION
    _POOL_TERMINAL_PATH = terminal_path or ""
    _WARM_ACCOUNT_ID = ""
    _WARM_SESSION = None


def _session_for_follower(follower: dict[str, Any], path: str):
    global _WARM_ACCOUNT_ID, _WARM_SESSION
    from engine.account_session import AccountSession

    account_id = follower["id"]
    if _WARM_SESSION is not None and _WARM_ACCOUNT_ID == account_id:
        _WARM_SESSION.connect()
        return _WARM_SESSION, 0

    session = AccountSession(
        account_id=account_id,
        label=follower.get("label", ""),
        role=follower.get("role", "follower"),
        login=str(follower["login"]),
        password=str(follower["password"]),
        server=str(follower["server"]),
        terminal_path=path,
        platform=follower.get("platform", "mt5"),
    )
    t_switch = time.perf_counter()
    if not session.connect():
        return None, int((time.perf_counter() - t_switch) * 1000)
    _WARM_SESSION = session
    _WARM_ACCOUNT_ID = account_id
    return session, int((time.perf_counter() - t_switch) * 1000)


def run_isolated_copy_job(job: dict[str, Any]) -> dict[str, Any]:
    """Execute one copy action on a dedicated terminal path process."""
    from engine.account_session import AccountSession
    from engine.config_loader import CopierConfig
    from engine.follower_executor import FollowerExecutor
    from engine.signal import TradeSignal
    from engine.symbol_mapper import SymbolMapper
    from engine.ticket_mapper import TicketMapper

    events: list[dict[str, Any]] = []

    def sink(event: dict[str, Any]) -> None:
        events.append(event)

    follower = job["follower"]
    path = job.get("terminal_path") or follower.get("terminal_path") or _POOL_TERMINAL_PATH

    session, switch_ms = _session_for_follower(follower, path)
    if session is None:
        return {
            "ok": False,
            "events": [
                {
                    "status": "failed",
                    "copier_id": job["copier"]["id"],
                    "event_type": job["signal"]["event_type"],
                    "error_message": "terminal_connect_failed",
                    "switch_ms": switch_ms,
                    "e2e_ms": _e2e(job),
                }
            ],
            "switch_ms": switch_ms,
        }

    signal = _signal_from_job(job)
    copier = CopierConfig(**job["copier"])
    from engine.config_loader import SymbolMapping

    maps = [
        SymbolMapping(
            master_symbol=m["master_symbol"],
            follower_symbol=m["follower_symbol"],
        )
        for m in (job.get("symbol_mappings") or [])
    ]
    symbol_mapper = SymbolMapper(maps)
    ticket_mapper = TicketMapper()

    ft = job.get("follower_ticket_for_close")
    if ft is not None:
        ticket_mapper.add(
            copier.id,
            signal.ticket,
            ft,
            signal.symbol,
            signal.side,
            follower_account_id=follower["id"],
        )

    risk_engine = None
    risk_profile = job.get("risk_profile")
    if risk_profile:
        from engine.risk_engine import RiskEngine

        risk_engine = RiskEngine({follower["id"]: risk_profile})

    executor = FollowerExecutor(
        session,
        symbol_mapper,
        ticket_mapper,
        risk_engine=risk_engine,
        event_sink=sink,
        switch_ms=switch_ms,
        detected_at_ms=job.get("detected_at_ms"),
    )
    ok = executor.handle(signal, copier)

    ticket_link = None
    ticket_remove = None
    link = ticket_mapper.get(copier.id, signal.ticket)
    if link and signal.event_type == "position_opened":
        ticket_link = {
            "copier_id": copier.id,
            "master_ticket": signal.ticket,
            "follower_ticket": link.follower_ticket,
            "symbol": link.symbol,
            "side": link.side,
            "follower_account_id": follower["id"],
        }
    if signal.event_type == "position_closed" and ok:
        ticket_remove = {
            "copier_id": copier.id,
            "master_ticket": signal.ticket,
            "follower_account_id": follower["id"],
        }

    for ev in events:
        ev.setdefault("switch_ms", switch_ms)
        ev.setdefault("e2e_ms", _e2e(job))

    return {
        "ok": ok,
        "events": events,
        "ticket_link": ticket_link,
        "ticket_remove": ticket_remove,
        "switch_ms": switch_ms,
    }


def _e2e(job: dict[str, Any]) -> int:
    detected = job.get("detected_at_ms") or 0
    if not detected:
        return 0
    return max(0, int(time.time() * 1000) - int(detected))


def _signal_from_job(job: dict[str, Any]) -> "TradeSignal":
    from engine.signal import TradeSignal

    s = job["signal"]
    return TradeSignal(
        event_type=s["event_type"],
        account_id=s.get("account_id", ""),
        ticket=int(s["ticket"]),
        symbol=s["symbol"],
        side=s["side"],
        volume=float(s["volume"]),
        open_price=s.get("open_price"),
        sl=s.get("sl"),
        tp=s.get("tp"),
        timestamp_ms=int(s.get("timestamp_ms") or job.get("detected_at_ms") or 0),
    )
