"""
One subprocess worker per MT5 terminal path — parallel cross-broker copies.
"""

from __future__ import annotations

import os
from concurrent.futures import ProcessPoolExecutor, Future
from typing import Any

import structlog

from engine.isolated_mt5_worker import _init_pool_worker, run_isolated_copy_job
from engine.terminal_session_manager import normalize_terminal_path

logger = structlog.get_logger()


class TerminalPool:
    def __init__(self, terminal_paths: list[str]) -> None:
        self._enabled = os.environ.get("WORKER_PARALLEL_TERMINALS", "1") == "1"
        self._executors: dict[str, ProcessPoolExecutor] = {}
        for raw in terminal_paths:
            path = normalize_terminal_path(raw)
            if not path or path in self._executors:
                continue
            if not self._enabled:
                continue
            self._executors[path] = ProcessPoolExecutor(
                max_workers=1,
                initializer=_init_pool_worker,
                initargs=(path,),
            )
            logger.info("terminal_pool_worker_started", path=path)

    def has(self, terminal_path: str | None) -> bool:
        path = normalize_terminal_path(terminal_path)
        return bool(path and path in self._executors)

    def submit(self, terminal_path: str | None, job: dict[str, Any]) -> Future | None:
        path = normalize_terminal_path(terminal_path)
        if not path or path not in self._executors:
            return None
        return self._executors[path].submit(run_isolated_copy_job, job)

    def shutdown(self) -> None:
        for path, ex in self._executors.items():
            try:
                ex.shutdown(wait=True, cancel_futures=False)
            except Exception as exc:
                logger.warning("terminal_pool_shutdown_error", path=path, error=str(exc))
        self._executors.clear()
