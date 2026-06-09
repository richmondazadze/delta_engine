"""
Build and apply parallel follower dispatch jobs.
"""

from __future__ import annotations

import time
from concurrent.futures import Future, ThreadPoolExecutor, as_completed
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
        job = {
            "terminal_path": follower_cfg.terminal_path,
            "follower": _account_dict(follower_cfg),
            "copier": _copier_dict(copier),
            "signal": _signal_dict(signal, master_cfg.id),
            "symbol_mappings": symbol_mappings,
            "detected_at_ms": detected_at_ms,
            "follower_ticket_for_close": link.follower_ticket if link else None,
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

    dx_futures: list[Future] = []
    dx_pool: ThreadPoolExecutor | None = None
    if dxtrade:
        dx_pool = ThreadPoolExecutor(max_workers=min(4, len(dxtrade)))
        for c in dxtrade:
            dx_futures.append(dx_pool.submit(_run_dx, c))

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

    for copier, fut in futures:
        try:
            result = fut.result(timeout=120)
            _apply_isolated_result(engine, result)
        except Exception as exc:
            logger.error("isolated_copy_failed", copier=copier.id, error=str(exc))
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

    for fut in as_completed(dx_futures):
        try:
            fut.result()
        except Exception as exc:
            logger.error("dxtrade_copy_failed", error=str(exc))
    if dx_pool:
        dx_pool.shutdown(wait=False)

    if master_session and is_mt5(master_cfg.platform):
        engine._switch_to(master_session)

    logger.info(
        "dispatch_complete",
        event_type=signal.event_type,
        ticket=signal.ticket,
        pool=len(pool_mt5),
        fallback=len(fallback_mt5),
        dxtrade=len(dxtrade),
        wall_ms=int((time.perf_counter() - dispatch_t0) * 1000),
    )


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
        )
    rem = result.get("ticket_remove")
    if rem:
        engine.ticket_mapper.remove(
            rem["copier_id"],
            int(rem["master_ticket"]),
            follower_account_id=rem.get("follower_account_id"),
        )

