"""Step 2: Confirm account connection (balance, login match, symbol probe)."""

import argparse
import json

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from engine.env_loader import load_worker_env
from engine.config_loader import get_account, load_accounts
from engine.account_session import AccountSession


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--account", "-a", required=True)
    parser.add_argument("--symbol", "-s", default="EURUSDm")
    args = parser.parse_args()

    try:
        cfg = get_account(load_accounts(), args.account)
    except KeyError:
        print(
            f"Account '{args.account}' not found in worker config.\n"
            "For dashboard-linked accounts, use:\n"
            "  python scripts\\14_test_linked_account.py --account <uuid>\n"
            "Requires WORKER_API_KEY + WORKER_USER_ID in .env (user must own the account)."
        )
        return 1
    session = AccountSession(
        account_id=cfg.id,
        label=cfg.label,
        role=cfg.role,
        login=cfg.login,
        password=cfg.password,
        server=cfg.server,
        terminal_path=cfg.terminal_path,
    )

    if not session.connect():
        print("FAILED: connect()")
        return 1

    ok, msg = session.confirm_connected(probe_symbol=args.symbol)
    health = session.get_health()
    session.disconnect()

    print(json.dumps({"confirmed": ok, "message": msg, "health": health}, indent=2, default=str))
    return 0 if ok else 1


if __name__ == "__main__":
    load_worker_env()
    raise SystemExit(main())
