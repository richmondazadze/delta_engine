"""
DXtrade connection test for dashboard account linking.
"""

from __future__ import annotations

from typing import Optional

import structlog

from app.services.mt5_connection import ConnectionTestResult

logger = structlog.get_logger()


def test_dxtrade_login(
    username: str,
    password: str,
    domain: str,
    *,
    api_base_url: Optional[str] = None,
    account_id: Optional[str] = None,
    login_path: Optional[str] = None,
    firm_slug: Optional[str] = None,
) -> ConnectionTestResult:
    try:
        import sys
        from pathlib import Path

        worker_root = Path(__file__).resolve().parents[3] / "worker"
        if str(worker_root) not in sys.path:
            sys.path.insert(0, str(worker_root))

        from adapters.dxtrade_client import DXtradeClient, account_key, resolve_base_url
    except ImportError as exc:
        return ConnectionTestResult(
            success=False,
            connection_status="terminal_unavailable",
            message=f"DXtrade client unavailable: {exc}",
        )

    try:
        base = resolve_base_url(api_base_url=api_base_url, broker_server=domain if domain.startswith("http") else None)
    except ValueError as exc:
        return ConnectionTestResult(
            success=False,
            connection_status="broker_unavailable",
            message=str(exc),
        )

    path = login_path
    if not path and firm_slug:
        from app.data.dxtrade_firms import get_firm

        firm = get_firm(firm_slug)
        if firm:
            path = firm.login_path

    try:
        client = DXtradeClient(base, login_path=path or "/login")
        session = client.login(username, password, domain, account_id=account_id)
        key = account_id or account_key(domain, username)
        accounts = client.get_accounts()
        balance = None
        equity = None
        currency = None
        if accounts:
            first = accounts[0]
            balance = float(first.get("balance") or first.get("cashBalance") or 0)
            equity = float(first.get("equity") or balance or 0)
            currency = first.get("currency") or first.get("accountCurrency")

        logger.info(
            "dxtrade_test_ok",
            base=base,
            account_key=key,
            session_timeout=session.timeout_ms,
        )
        return ConnectionTestResult(
            success=True,
            message="DXtrade session established",
            balance=balance,
            equity=equity,
            currency=currency,
        )
    except Exception as exc:
        logger.warning("dxtrade_test_failed", error=str(exc))
        msg = str(exc)
        lower = msg.lower()
        if any(x in lower for x in ("401", "403", "unauthorized", "invalid password", "login failed")):
            status = "auth_failed"
        else:
            status = "broker_unavailable"
        return ConnectionTestResult(success=False, message=msg, connection_status=status)
