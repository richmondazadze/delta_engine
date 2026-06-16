"""
Multi-master supervisor.

MetaTrader5's Python binding is a process-global singleton: one
``mt5.initialize()`` per process connects the whole module to a single
terminal. The terminal manager, API client, event batcher and terminal pool
are likewise process-wide. That makes it impossible to drive two master
accounts concurrently inside one process without constantly tearing down and
re-initializing the connection.

To run several masters at the same time we therefore launch one OS process per
master, each running the existing single-master ``CopierEngine.run(master_id=)``
with its own warm terminal connection, pool and ticket map. The supervisor
spawns, monitors and restarts those child processes.

Behaviour:
- 0 masters  -> run in-process so the engine emits its usual clear error.
- 1 master   -> run in-process (zero behaviour change vs. the old entrypoint).
- 2+ masters -> spawn one child process per master and supervise them.
"""

from __future__ import annotations

import multiprocessing as mp
import os
import sys
import time

import structlog

# Ensure the worker root is importable in spawned children that re-import this
# module by its qualified name (``engine.master_supervisor``).
_WORKER_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _WORKER_ROOT not in sys.path:
    sys.path.insert(0, _WORKER_ROOT)

from engine.config_loader import (  # noqa: E402
    AccountConfig,
    CopierConfig,
    dedupe_copiers_by_follower,
    get_account,
    get_copiers_for_master,
    load_accounts,
    load_copiers,
)
from engine.platform_capabilities import is_mt5  # noqa: E402
from engine.terminal_session_manager import normalize_terminal_path  # noqa: E402

logger = structlog.get_logger()

# Restart backoff for crashed master processes.
_RESTART_MIN_BACKOFF_S = 3.0
_RESTART_MAX_BACKOFF_S = 60.0
_MONITOR_INTERVAL_S = 5.0


def discover_active_masters() -> tuple[list[AccountConfig], list[AccountConfig], list[CopierConfig]]:
    """Return (active_masters, accounts, copiers).

    A master is "active" when it is enabled and has at least one enabled copier
    pointing at a distinct follower.
    """
    accounts = load_accounts()
    copiers = load_copiers()
    masters = [a for a in accounts if a.role == "master" and a.enabled]
    active: list[AccountConfig] = []
    for master in masters:
        owned = dedupe_copiers_by_follower(get_copiers_for_master(copiers, master.id))
        if owned:
            active.append(master)
    return active, accounts, copiers


def _terminal_paths_for_master(
    master: AccountConfig,
    accounts: list[AccountConfig],
    copiers: list[CopierConfig],
) -> set[str]:
    """All MT5 terminal paths a master's process will drive (master + followers)."""
    paths: set[str] = set()
    if is_mt5(master.platform) and master.terminal_path:
        paths.add(normalize_terminal_path(master.terminal_path))
    for copier in dedupe_copiers_by_follower(get_copiers_for_master(copiers, master.id)):
        try:
            follower = get_account(accounts, copier.follower_id)
        except KeyError:
            continue
        if is_mt5(follower.platform) and follower.terminal_path:
            paths.add(normalize_terminal_path(follower.terminal_path))
    return {p for p in paths if p}


def _warn_terminal_overlaps(
    masters: list[AccountConfig],
    accounts: list[AccountConfig],
    copiers: list[CopierConfig],
) -> None:
    """Warn when two masters would drive the same physical MT5 terminal.

    Two independent processes logging into the same terminal will fight over the
    single account-per-terminal connection. Distinct broker terminals per master
    group are safe; this only flags genuinely conflicting topologies.
    """
    owned: dict[str, set[str]] = {
        m.id: _terminal_paths_for_master(m, accounts, copiers) for m in masters
    }
    for i, a in enumerate(masters):
        for b in masters[i + 1 :]:
            shared = owned[a.id] & owned[b.id]
            if shared:
                logger.warning(
                    "master_terminal_overlap",
                    master_a=a.label or a.id,
                    master_b=b.label or b.id,
                    shared_terminals=sorted(shared),
                    hint=(
                        "Two masters drive the same MT5 terminal. Give each broker "
                        "its own terminal install/path to avoid login contention."
                    ),
                )


def _run_master_process(master_id: str, worker_name: str) -> None:
    """Child-process entrypoint: isolated engine for a single master.

    Runs in its own interpreter with a dedicated MT5 connection, terminal
    manager, API client and pool.
    """
    os.environ["WORKER_NAME"] = worker_name
    os.environ["WORKER_MASTER_ID"] = master_id

    from engine.env_loader import load_worker_env

    load_worker_env()
    # Re-assert after env load so a WORKER_NAME in .env can't clobber the suffix.
    os.environ["WORKER_NAME"] = worker_name

    from engine.copier_engine import CopierEngine

    try:
        CopierEngine().run(master_id=master_id)
    except KeyboardInterrupt:
        pass
    except Exception as exc:  # pragma: no cover - surfaced via exit code
        logger.error("master_process_crashed", master=master_id, error=str(exc), exc_info=True)
        raise


def _spawn(ctx, master: AccountConfig, base_name: str) -> mp.process.BaseProcess:
    worker_name = f"{base_name}:{master.label or master.id}"
    proc = ctx.Process(
        target=_run_master_process,
        args=(master.id, worker_name),
        name=worker_name,
        daemon=False,
    )
    proc.start()
    logger.info("master_process_started", master=master.id, label=master.label, pid=proc.pid)
    return proc


def run_all_masters() -> None:
    """Entrypoint used by the production copier loop."""
    active, accounts, copiers = discover_active_masters()

    from engine.copier_engine import CopierEngine

    always_isolate = os.environ.get("WORKER_ALWAYS_ISOLATE_MASTERS", "0") == "1"

    if len(active) <= 1 and not always_isolate:
        # 0 masters -> CopierEngine.run() raises the usual descriptive error.
        # 1 master  -> run in-process unless WORKER_ALWAYS_ISOLATE_MASTERS=1.
        master_id = active[0].id if active else None
        if master_id:
            logger.info("single_master_mode", master=master_id)
        CopierEngine().run(master_id=master_id)
        return

    logger.info(
        "multi_master_mode",
        masters=[{"id": m.id, "label": m.label} for m in active],
        count=len(active),
    )
    _warn_terminal_overlaps(active, accounts, copiers)

    base_name = os.environ.get("WORKER_NAME", "worker-local-01")
    ctx = mp.get_context("spawn")
    procs: dict[str, mp.process.BaseProcess] = {}
    backoff: dict[str, float] = {m.id: _RESTART_MIN_BACKOFF_S for m in active}
    next_restart_at: dict[str, float] = {m.id: 0.0 for m in active}
    by_id = {m.id: m for m in active}

    for master in active:
        procs[master.id] = _spawn(ctx, master, base_name)

    try:
        while True:
            time.sleep(_MONITOR_INTERVAL_S)
            now = time.time()
            for master_id, master in by_id.items():
                proc = procs.get(master_id)
                if proc is not None and proc.is_alive():
                    backoff[master_id] = _RESTART_MIN_BACKOFF_S
                    continue
                if proc is not None:
                    logger.error(
                        "master_process_died",
                        master=master_id,
                        exitcode=proc.exitcode,
                    )
                    next_restart_at[master_id] = now + backoff[master_id]
                    backoff[master_id] = min(
                        backoff[master_id] * 2, _RESTART_MAX_BACKOFF_S
                    )
                    procs[master_id] = None  # type: ignore[assignment]
                    continue
                if now >= next_restart_at[master_id]:
                    logger.info("master_process_restarting", master=master_id)
                    procs[master_id] = _spawn(ctx, master, base_name)
    except KeyboardInterrupt:
        logger.info("supervisor_stopping", masters=len(procs))
    finally:
        for proc in procs.values():
            if proc is not None and proc.is_alive():
                proc.terminate()
        for proc in procs.values():
            if proc is not None:
                proc.join(timeout=10)
        logger.info("supervisor_stopped")
