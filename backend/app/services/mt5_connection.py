"""
MT5 connection test — runs on Windows hosts where MetaTrader5 package + terminal are available.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import structlog

logger = structlog.get_logger()


@dataclass
class ConnectionTestResult:
    success: bool
    message: str
    balance: Optional[float] = None
    equity: Optional[float] = None
    currency: Optional[str] = None
    connection_status: str = "auth_failed"


def test_mt5_login(
    login: str,
    password: str,
    server: str,
    terminal_path: Optional[str] = None,
    timeout_ms: int = 120_000,
) -> ConnectionTestResult:
    try:
        import MetaTrader5 as mt5
    except ImportError:
        return ConnectionTestResult(
            success=False,
            connection_status="terminal_unavailable",
            message=(
                "MetaTrader5 is not available on the API server. "
                "Install MT5 + the MetaTrader5 Python package on your worker machine, "
                "then run: python worker/scripts/02_confirm_connected.py --account <id>"
            ),
        )

    try:
        login_id = int(login)
    except ValueError:
        return ConnectionTestResult(
            success=False,
            connection_status="auth_failed",
            message=f"Invalid MT5 login number: {login}",
        )

    init_kwargs: dict = {
        "login": login_id,
        "password": password,
        "server": server,
        "timeout": timeout_ms,
    }
    if terminal_path:
        init_kwargs["path"] = terminal_path

    if not mt5.initialize(**init_kwargs):
        err = mt5.last_error()
        msg = f"MT5 initialize failed: {err}"
        if err and err[0] == -10005:
            msg += (
                ". Open your broker's MT5 terminal once, enable Tools → Options → "
                "Community → Python integration, then retry."
            )
        elif err and err[0] == -10004:
            msg += ". Check that the broker MT5 terminal is installed and the path is correct."
        return ConnectionTestResult(
            success=False,
            connection_status="terminal_unavailable",
            message=msg,
        )

    try:
        info = mt5.account_info()
        if info is None:
            err = mt5.last_error()
            return ConnectionTestResult(
                success=False,
                connection_status="auth_failed",
                message=f"Login failed: {err}",
            )

        if int(info.login) != login_id:
            return ConnectionTestResult(
                success=False,
                connection_status="auth_failed",
                message=(
                    f"Logged into account {info.login} on {info.server}, "
                    f"expected {login_id} on {server}."
                ),
            )

        return ConnectionTestResult(
            success=True,
            message="Connected successfully",
            balance=float(info.balance),
            equity=float(info.equity),
            currency=str(info.currency),
            connection_status="connected",
        )
    finally:
        mt5.shutdown()
