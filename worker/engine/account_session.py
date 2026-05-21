"""
Account session: connect, confirm health, and manage MT5 login lifecycle.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, Optional

import structlog

from engine.mt5_connector import MT5Connector

logger = structlog.get_logger()


class ConnectionStatus(str, Enum):
    connected = "connected"
    disconnected = "disconnected"
    auth_failed = "auth_failed"
    terminal_unavailable = "terminal_unavailable"
    broker_unavailable = "broker_unavailable"
    disabled = "disabled"
    locked = "locked"


@dataclass
class AccountSession:
    account_id: str
    label: str
    role: str
    login: int
    password: str
    server: str
    terminal_path: Optional[str] = None

    def __post_init__(self):
        self._connector = MT5Connector(
            login=self.login,
            password=self.password,
            server=self.server,
            terminal_path=self.terminal_path,
        )
        self._initialized = False

    @property
    def connector(self) -> MT5Connector:
        return self._connector

    def connect(self, terminal_already_running: bool = False) -> bool:
        if not self._initialized and not terminal_already_running:
            if not self._connector.initialize():
                return False
        self._initialized = True
        if not self._connector.login_account():
            return False
        return True

    def switch_login(self) -> bool:
        """Re-login on an already-initialized terminal (multi-account dev mode)."""
        if not self._initialized:
            return self.connect()
        return self._connector.login_account()

    def mark_terminal_ready(self) -> None:
        """Mark session as sharing an already-initialized MT5 terminal."""
        self._initialized = True

    def disconnect(self) -> None:
        if self._initialized:
            self._connector.shutdown()
            self._initialized = False

    def is_connected(self) -> bool:
        return self._connector.connected and self._connector.get_account_info() is not None

    def get_health(self) -> Dict[str, Any]:
        info = self._connector.get_account_info()
        if info is None:
            err = self._connector.last_error()
            status = ConnectionStatus.auth_failed
            if err and err[0] == -10004:
                status = ConnectionStatus.terminal_unavailable
            return {
                "account_id": self.account_id,
                "label": self.label,
                "role": self.role,
                "status": status.value,
                "login": self.login,
                "server": self.server,
                "connected": False,
                "last_error": err,
            }

        return {
            "account_id": self.account_id,
            "label": self.label,
            "role": self.role,
            "status": ConnectionStatus.connected.value,
            "login": info.get("login"),
            "server": info.get("server"),
            "name": info.get("name"),
            "balance": info.get("balance"),
            "equity": info.get("equity"),
            "currency": info.get("currency"),
            "leverage": info.get("leverage"),
            "connected": True,
            "last_error": None,
        }

    def confirm_connected(self, probe_symbol: str = "EURUSD") -> tuple[bool, str]:
        health = self.get_health()
        if not health.get("connected"):
            return False, f"Not connected: {health.get('last_error')}"

        if int(health.get("login", 0)) != self.login:
            return False, f"Login mismatch: expected {self.login}, got {health.get('login')}"

        sym = self._connector.get_symbol_info(probe_symbol)
        if sym is None:
            return False, f"Cannot load symbol {probe_symbol} (market data unavailable)"

        return True, "Connection confirmed"
