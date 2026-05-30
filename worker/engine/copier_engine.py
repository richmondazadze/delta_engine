"""
Copier engine: poll master account(s), emit signals, copy to followers.

Dev mode uses one MT5 terminal and switches login between master and follower.
"""

from __future__ import annotations

import os
import time
from typing import Dict, List

import structlog

from engine.account_session import AccountSession
from engine.config_loader import (
    AccountConfig,
    CopierConfig,
    get_account,
    get_copiers_for_master,
    load_accounts,
    load_copiers,
    load_symbol_mappings,
)
from engine.follower_executor import FollowerExecutor
from engine.state_diff import StateDiffEngine
from engine.symbol_mapper import SymbolMapper
from engine.ticket_mapper import TicketMapper

logger = structlog.get_logger()


class CopierEngine:
    def __init__(
        self,
        poll_interval_ms: int | None = None,
    ):
        self.poll_interval_ms = poll_interval_ms or int(
            os.environ.get("WORKER_POLL_INTERVAL_MS", "500")
        )
        self.accounts = load_accounts()
        self.copiers = load_copiers()
        self.symbol_mapper = SymbolMapper(load_symbol_mappings())
        self.ticket_mapper = TicketMapper()
        self._sessions: Dict[str, AccountSession] = {
            a.id: AccountSession(
                account_id=a.id,
                label=a.label,
                role=a.role,
                login=a.login,
                password=a.password,
                server=a.server,
                terminal_path=a.terminal_path,
            )
            for a in self.accounts
            if a.enabled
        }

    def run(self, master_id: str | None = None) -> None:
        masters = [
            a for a in self.accounts if a.role == "master" and a.enabled
        ]
        if master_id:
            masters = [a for a in masters if a.id == master_id]
        if not masters:
            raise RuntimeError("No enabled master account in config/accounts.yaml")

        if len(masters) > 1:
            logger.warning("multiple_masters_using_first", master_id=masters[0].id)

        master_cfg = masters[0]
        master_session = self._sessions[master_cfg.id]
        copier_list = get_copiers_for_master(self.copiers, master_cfg.id)
        if not copier_list:
            raise RuntimeError(f"No enabled copiers for master {master_cfg.id}")

        logger.info(
            "copier_engine_start",
            master=master_cfg.id,
            copiers=[c.id for c in copier_list],
            poll_ms=self.poll_interval_ms,
        )

        if not master_session.connect():
            raise RuntimeError(f"Failed to connect master {master_cfg.id}")

        # All accounts share one terminal process in dev mode
        for sid, session in self._sessions.items():
            if sid != master_cfg.id:
                session.mark_terminal_ready()

        diff = StateDiffEngine(master_cfg.id)
        diff.bootstrap(master_session.connector.get_open_positions())

        try:
            while True:
                if not master_session.switch_login():
                    logger.error("master_relogin_failed")
                    time.sleep(2)
                    continue

                positions = master_session.connector.get_open_positions()
                signals = diff.diff(positions)

                for signal in signals:
                    logger.info(
                        "signal_detected",
                        event_type=signal.event_type,
                        ticket=signal.ticket,
                        symbol=signal.symbol,
                    )
                    self._dispatch_to_followers(
                        signal, copier_list, master_session
                    )

                time.sleep(self.poll_interval_ms / 1000.0)
        except KeyboardInterrupt:
            logger.info("copier_engine_stopped")
        finally:
            master_session.disconnect()

    def _dispatch_to_followers(
        self,
        signal,
        copier_list: List[CopierConfig],
        master_session: AccountSession,
    ) -> None:
        for copier in copier_list:
            follower_cfg = get_account(self.accounts, copier.follower_id)
            follower_session = self._sessions[follower_cfg.id]

            # Switch terminal login to follower
            if not follower_session.switch_login():
                logger.error(
                    "follower_login_failed",
                    follower=follower_cfg.id,
                    copier=copier.id,
                )
                master_session.switch_login()
                continue

            executor = FollowerExecutor(
                follower_session, self.symbol_mapper, self.ticket_mapper
            )
            executor.handle(signal, copier)

            # Return to master for next poll
            master_session.switch_login()
