"""
Run a single MT5 copy job in an isolated process (one terminal path per pool worker).
"""

from __future__ import annotations

import os
import time
from typing import Any

import structlog

logger = structlog.get_logger()

_POOL_TERMINAL_PATH: str = ""
_WARM_ACCOUNT_ID: str = ""
_WARM_SESSION = None
_WARM_VERIFIED_AT: float = 0.0
_WARM_SELECTED_SYMBOLS: set[str] = set()

# A pinned pool worker holds one warm MT5 connection to a single follower
# account. Re-verifying the login on every job costs an extra account_info()
# round-trip to a remote broker — wasteful during burst sequences (SL/TP
# storms, rapid closes). Trust the warm connection for a short window and only
# re-verify past the TTL, so connection death is still detected promptly.
_WARM_TTL_S: float = float(os.environ.get("WORKER_POOL_WARM_TTL_SECONDS", "5"))


def _init_pool_worker(terminal_path: str) -> None:
    global _POOL_TERMINAL_PATH, _WARM_ACCOUNT_ID, _WARM_SESSION, _WARM_VERIFIED_AT
    _POOL_TERMINAL_PATH = terminal_path or ""
    _WARM_ACCOUNT_ID = ""
    _WARM_SESSION = None
    _WARM_VERIFIED_AT = 0.0
    _WARM_SELECTED_SYMBOLS.clear()


def _prewarm_symbols(symbol_mappings: list[dict[str, Any]]) -> None:
    """Select mapped follower symbols in MarketWatch so ticks stream early.

    First trade on a cold symbol otherwise pays a symbol_select + tick wait.
    symbol_select is a local terminal call (no broker round-trip), so warming
    once per process is cheap and removes that stall from the hot path.
    """
    try:
        import MetaTrader5 as mt5
    except ImportError:
        return
    for m in symbol_mappings:
        sym = (m.get("follower_symbol") or "").strip()
        if not sym or sym in _WARM_SELECTED_SYMBOLS:
            continue
        try:
            mt5.symbol_select(sym, True)
        except Exception:
            pass
        _WARM_SELECTED_SYMBOLS.add(sym)


def _session_for_follower(follower: dict[str, Any], path: str):
    global _WARM_ACCOUNT_ID, _WARM_SESSION, _WARM_VERIFIED_AT
    from engine.account_session import AccountSession

    account_id = follower["id"]
    now = time.perf_counter()
    if _WARM_SESSION is not None and _WARM_ACCOUNT_ID == account_id:
        if (now - _WARM_VERIFIED_AT) < _WARM_TTL_S:
            # Warm and recently verified — skip the round-trip entirely.
            return _WARM_SESSION, 0
        if _WARM_SESSION.connect():
            _WARM_VERIFIED_AT = time.perf_counter()
            return _WARM_SESSION, 0
        # Connection went stale — fall through and rebuild it.

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
    _WARM_VERIFIED_AT = time.perf_counter()
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

    _prewarm_symbols(job.get("symbol_mappings") or [])

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
        # Seed with the FOLLOWER symbol/side/volume (not the master signal's),
        # so the modify/close fast paths build a valid request for this broker.
        ticket_mapper.add(
            copier.id,
            signal.ticket,
            ft,
            job.get("link_symbol") or signal.symbol,
            job.get("link_side") or signal.side,
            follower_account_id=follower["id"],
            volume=job.get("link_volume"),
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
