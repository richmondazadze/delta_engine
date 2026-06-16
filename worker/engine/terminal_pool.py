"""
One subprocess worker per MT5 follower account — parallel copies without login switching.

Each follower gets a dedicated warm MT5 connection in its own process, even when
multiple followers share the same broker terminal executable path. This removes
the serial mt5.login() fallback that previously blocked the master poll loop.
"""

from __future__ import annotations

import os
from concurrent.futures import Future, ProcessPoolExecutor
from typing import Any

import structlog

from engine.isolated_mt5_worker import _init_pool_worker, run_isolated_copy_job
from engine.terminal_session_manager import normalize_terminal_path

logger = structlog.get_logger()


class TerminalPool:
    """Pool keyed by follower ``account_id`` → one warm worker subprocess each."""

    def __init__(self, account_paths: dict[str, str]) -> None:
        self._enabled = os.environ.get("WORKER_PARALLEL_TERMINALS", "1") == "1"
        self._executors: dict[str, ProcessPoolExecutor] = {}
        self._paths: dict[str, str] = {}
        for account_id, raw_path in account_paths.items():
            path = normalize_terminal_path(raw_path)
            if not account_id or not path:
                continue
            self._paths[account_id] = path
            if not self._enabled:
                continue
            if account_id in self._executors:
                continue
            self._executors[account_id] = ProcessPoolExecutor(
                max_workers=1,
                initializer=_init_pool_worker,
                initargs=(account_id, path),
            )
            logger.info(
                "terminal_pool_worker_started",
                account_id=account_id,
                path=path,
            )

    def has(self, account_id: str | None) -> bool:
        if not account_id:
            return False
        return account_id in self._executors

    def path_for(self, account_id: str) -> str:
        return self._paths.get(account_id, "")

    def submit(self, account_id: str | None, job: dict[str, Any]) -> Future | None:
        if not account_id or account_id not in self._executors:
            return None
        return self._executors[account_id].submit(run_isolated_copy_job, job)

    def shutdown(self) -> None:
        for account_id, ex in self._executors.items():
            try:
                ex.shutdown(wait=True, cancel_futures=False)
            except Exception as exc:
                logger.warning(
                    "terminal_pool_shutdown_error",
                    account_id=account_id,
                    error=str(exc),
                )
        self._executors.clear()
        self._paths.clear()
