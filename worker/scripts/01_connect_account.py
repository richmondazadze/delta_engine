"""Step 1: Connect to a single MT5 account from config."""

import argparse
import json

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    import MetaTrader5 as mt5  # noqa: F401
except ImportError:
    print("ERROR: MetaTrader5 is not installed in this Python environment.")
    print(f"  Python used: {sys.executable}")
    print("  Fix: from worker folder run:")
    print("    .\\venv\\Scripts\\Activate.ps1")
    print("    pip install -r requirements.txt")
    print("  Or: .\\run.ps1 scripts\\01_connect_account.py -a master-1")
    raise SystemExit(1)

from engine.config_loader import get_account, load_accounts
from engine.account_session import AccountSession


def main():
    parser = argparse.ArgumentParser(description="Connect one account from accounts.yaml")
    parser.add_argument("--account", "-a", required=True, help="Account id (e.g. master-1)")
    args = parser.parse_args()

    accounts = load_accounts()
    cfg = get_account(accounts, args.account)
    session = AccountSession(
        account_id=cfg.id,
        label=cfg.label,
        role=cfg.role,
        login=cfg.login,
        password=cfg.password,
        server=cfg.server,
        terminal_path=cfg.terminal_path,
    )

    print(f"Connecting {cfg.id} ({cfg.label})...")
    if not session.connect():
        print("FAILED: Could not connect. Is MT5 installed and running?")
        return 1

    print(json.dumps(session.get_health(), indent=2, default=str))
    session.disconnect()
    print("Disconnected.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
