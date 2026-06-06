#!/usr/bin/env python3
"""Test a dashboard-linked account by ID (loads creds from API, runs MT5 or DXtrade login)."""

from __future__ import annotations

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from engine.env_loader import load_worker_env
from engine.api_client import get_api_client
from engine.account_session import AccountSession


def main() -> int:
    load_worker_env()
    p = argparse.ArgumentParser(
        description="Test connection for an account linked in the dashboard"
    )
    p.add_argument("--account", "-a", required=True, help="Trading account UUID")
    args = p.parse_args()

    client = get_api_client()
    if not client.enabled:
        print("Set WORKER_API_KEY and WORKER_USER_ID in repo root .env")
        print("WORKER_USER_ID must match the dashboard user who owns the account.")
        return 1

    try:
        row = client.fetch_trading_account(args.account)
    except Exception as exc:
        print(f"FAILED: could not load account from API — {exc}")
        print("Ensure backend is running and WORKER_USER_ID matches the account owner.")
        return 1

    platform = str(row.get("platform") or "mt5")

    if platform == "dxtrade":
        from adapters.dxtrade_client import DXtradeClient, account_key, resolve_base_url

        base = resolve_base_url(api_base_url=row.get("api_base_url"))
        dx = DXtradeClient(base)
        session = dx.login(
            row["login"],
            row["password"],
            row["server"],
        )
        key = account_key(row["server"], row["login"])
        accounts = dx.get_accounts()
        print(
            json.dumps(
                {
                    "ok": True,
                    "platform": platform,
                    "base": base,
                    "account": key,
                    "timeout_ms": session.timeout_ms,
                    "accounts": len(accounts),
                },
                indent=2,
            )
        )
        return 0

    session = AccountSession(
        account_id=row["id"],
        label=row["label"],
        role=row.get("role") or "master",
        login=row["login"],
        password=row["password"],
        server=row["server"],
        terminal_path=row.get("terminal_path"),
    )

    if not session.connect():
        print("FAILED: connect()")
        return 1

    ok, msg = session.confirm_connected()
    health = session.get_health()
    session.disconnect()

    print(json.dumps({"confirmed": ok, "message": msg, "health": health}, indent=2, default=str))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
