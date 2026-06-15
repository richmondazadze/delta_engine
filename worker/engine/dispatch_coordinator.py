"""
Build and apply parallel follower dispatch jobs.
"""

from __future__ import annotations

import atexit
import os
import time
from concurrent.futures import Future, ThreadPoolExecutor
from typing import TYPE_CHECKING, Any

import structlog

from engine.config_loader import AccountConfig, CopierConfig, get_account
from engine.execution_log import append_event
from engine.follower_executor import FollowerExecutor
from engine.platform_capabilities import is_dxtrade, is_mt5
from engine.terminal_session_manager import normalize_terminal_path

if TYPE_CHECKING:
    from engine.copier_engine import CopierEngine
    from engine.signal import TradeSignal

logger = structlog.get_logger()


def _account_dict(a: AccountConfig) -> dict[str, Any]:
    return {
        "id": a.id,
        "label": a.label,
        "role": a.role,
        "login": a.login,
        "password": a.password,
        "server": a.server,
        "terminal_path": a.terminal_path,
        "platform": a.platform,
        "api_base_url": a.api_base_url,
    }


def _copier_dict(c: CopierConfig) -> dict[str, Any]:
    return {
        "id": c.id,
        "master_id": c.master_id,
        "follower_id": c.follower_id,
        "enabled": c.enabled,
        "risk_mode": c.risk_mode,
        "multiplier": c.multiplier,
        "fixed_lot_size": c.fixed_lot_size,
        "copy_sl": c.copy_sl,
        "copy_tp": c.copy_tp,
        "copy_closes": c.copy_closes,
        "copy_modifications": c.copy_modifications,
        "max_signal_age_ms": c.max_signal_age_ms,
    }


def _signal_dict(signal: "TradeSignal", master_id: str) -> dict[str, Any]:
    return {
        "event_type": signal.event_type,
        "account_id": master_id,
        "ticket": signal.ticket,
        "symbol": signal.symbol,
        "side": signal.side,
        "volume": signal.volume,
        "open_price": signal.open_price,
        "sl": signal.sl,
        "tp": signal.tp,
        "timestamp_ms": signal.timestamp_ms,
    }


def dispatch_to_followers(
    engine: "CopierEngine",
    signal: "TradeSignal",
    copier_list: list[CopierConfig],
    master_cfg: AccountConfig,
    master_session,
) -> None:
    detected_at_ms = int(time.time() * 1000)
    signal.timestamp_ms = detected_at_ms
    dispatch_t0 = time.perf_counter()

    pool_mt5: list[CopierConfig] = []
    fallback_mt5: list[CopierConfig] = []
    dxtrade: list[CopierConfig] = []

    for copier in engine._sort_copiers_for_dispatch(copier_list, master_cfg):
        follower_cfg = get_account(engine.accounts, copier.follower_id)
        if is_dxtrade(follower_cfg.platform):
            dxtrade.append(copier)
            continue
        if not is_mt5(follower_cfg.platform):
            continue
        if engine._terminal_pool.has(follower_cfg.terminal_path):
            pool_mt5.append(copier)
        else:
            fallback_mt5.append(copier)

    symbol_mappings = engine._symbol_mappings_cache

    futures: list[tuple[CopierConfig, Future]] = []
    for copier in pool_mt5:
        follower_cfg = get_account(engine.accounts, copier.follower_id)
        link = engine.ticket_mapper.get(copier.id, signal.ticket)
        risk_profile = (
            engine.risk_engine.profile_for(follower_cfg.id)
            if engine.risk_engine
            else None
        )
        job = {
            "terminal_path": follower_cfg.terminal_path,
            "follower": _account_dict(follower_cfg),
            "copier": _copier_dict(copier),
            "signal": _signal_dict(signal, master_cfg.id),
            "symbol_mappings": symbol_mappings,
            "detected_at_ms": detected_at_ms,
            "follower_ticket_for_close": link.follower_ticket if link else None,
            "link_symbol": link.symbol if link else None,
            "link_side": link.side if link else None,
            "link_volume": link.volume if link else None,
            "risk_profile": risk_profile,
        }
        fut = engine._terminal_pool.submit(follower_cfg.terminal_path, job)
        if fut:
            futures.append((copier, fut))
        else:
            fallback_mt5.append(copier)

    def _run_dx(copier: CopierConfig) -> None:
        from engine.dxtrade_follower_executor import DXtradeFollowerExecutor

        follower_cfg = get_account(engine.accounts, copier.follower_id)
        executor = DXtradeFollowerExecutor(
            follower_cfg,
            engine.symbol_mapper,
            engine.ticket_mapper,
            risk_engine=engine.risk_engine,
        )
        signal.refresh_timestamp()
        executor.handle(signal, copier)

    # DXtrade followers run over HTTP in a shared bounded thread pool and never
    # touch the MT5 terminal; results are applied via callbacks (non-blocking).
    if dxtrade:
        dx_executor = _get_dx_executor()
        for c in dxtrade:
            dx_fut = dx_executor.submit(_run_dx, c)
            dx_fut.add_done_callback(_make_dx_callback(c))

    for copier in fallback_mt5:
        follower_cfg = get_account(engine.accounts, copier.follower_id)
        follower_session = engine._sessions.get(follower_cfg.id)
        if not follower_session:
            logger.error("follower_session_missing", follower=follower_cfg.id)
            continue
        t_sw = time.perf_counter()
        if not engine._switch_to(follower_session):
            logger.error("follower_login_failed", follower=follower_cfg.id, copier=copier.id)
            continue
        switch_ms = int((time.perf_counter() - t_sw) * 1000)
        signal.refresh_timestamp()
        executor = FollowerExecutor(
            follower_session,
            engine.symbol_mapper,
            engine.ticket_mapper,
            risk_engine=engine.risk_engine,
            switch_ms=switch_ms,
            detected_at_ms=detected_at_ms,
        )
        executor.handle(signal, copier)

    # Restore the master login immediately after the in-parent fallback switch
    # so the next master poll isn't delayed. Pool/DXtrade followers run in
    # separate processes/connections and never touch the master terminal.
    if fallback_mt5 and master_session and is_mt5(master_cfg.platform):
        engine._switch_to(master_session)

    # Pool results are applied asynchronously via callbacks so a slow
    # cross-terminal broker never stalls master-change detection. Out-of-order
    # link application is covered by FollowerExecutor's self-healing resolver,
    # which scans broker positions by the master-ticket comment tag.
    for copier, fut in futures:
        fut.add_done_callback(
            _make_pool_callback(engine, copier, signal, detected_at_ms)
        )

    logger.info(
        "dispatch_complete",
        event_type=signal.event_type,
        ticket=signal.ticket,
        pool=len(pool_mt5),
        fallback=len(fallback_mt5),
        dxtrade=len(dxtrade),
        wall_ms=int((time.perf_counter() - dispatch_t0) * 1000),
    )


# Shared, bounded executor for DXtrade (HTTP) follower dispatch. Reused across
# signals so an SL/TP storm doesn't spawn a fresh pool per event.
_DX_EXECUTOR: ThreadPoolExecutor | None = None


def _get_dx_executor() -> ThreadPoolExecutor:
    global _DX_EXECUTOR
    if _DX_EXECUTOR is None:
        workers = int(os.environ.get("WORKER_DX_DISPATCH_WORKERS", "8"))
        _DX_EXECUTOR = ThreadPoolExecutor(
            max_workers=max(1, workers), thread_name_prefix="dx-dispatch"
        )
        atexit.register(
            lambda: _DX_EXECUTOR.shutdown(wait=False) if _DX_EXECUTOR else None
        )
    return _DX_EXECUTOR


def _make_pool_callback(
    engine: "CopierEngine",
    copier: CopierConfig,
    signal: "TradeSignal",
    detected_at_ms: int,
):
    """Apply an isolated MT5 pool worker's result when its future completes."""

    def _cb(fut: Future) -> None:
        try:
            result = fut.result()
            _apply_isolated_result(engine, result)
        except Exception as exc:  # noqa: BLE001 - isolate dispatch failures
            logger.error("isolated_copy_failed", copier=copier.id, error=str(exc))
            try:
                append_event(
                    {
                        "status": "failed",
                        "copier_id": copier.id,
                        "event_type": signal.event_type,
                        "master_ticket": signal.ticket,
                        "error_message": str(exc),
                        "e2e_ms": max(0, int(time.time() * 1000) - detected_at_ms),
                    }
                )
            except Exception:  # noqa: BLE001 - never let logging crash a callback
                pass

    return _cb


def _make_dx_callback(copier: CopierConfig):
    def _cb(fut: Future) -> None:
        try:
            fut.result()
        except Exception as exc:  # noqa: BLE001 - isolate dispatch failures
            logger.error("dxtrade_copy_failed", copier=copier.id, error=str(exc))

    return _cb


def _apply_isolated_result(engine: "CopierEngine", result: dict[str, Any]) -> None:
    for ev in result.get("events") or []:
        append_event(ev)
    link = result.get("ticket_link")
    if link:
        engine.ticket_mapper.add(
            link["copier_id"],
            int(link["master_ticket"]),
            link["follower_ticket"],
            link["symbol"],
            link["side"],
            follower_account_id=link.get("follower_account_id"),
            volume=link.get("volume"),
        )
    rem = result.get("ticket_remove")
    if rem:
        engine.ticket_mapper.remove(
            rem["copier_id"],
            int(rem["master_ticket"]),
            follower_account_id=rem.get("follower_account_id"),
        )

