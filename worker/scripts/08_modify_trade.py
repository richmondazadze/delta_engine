"""Utility: Modify Stop Loss (SL) and Take Profit (TP) for a specific MT5 ticket on a given account."""

import argparse
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    import MetaTrader5 as mt5
except ImportError:
    mt5 = None

from engine.account_session import AccountSession
from engine.config_loader import get_account, load_accounts


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--account", "-a", required=True, help="Account id (e.g., master-1)")
    parser.add_argument("--ticket", "-t", type=int, required=True, help="MT5 Position Ticket Number")
    parser.add_argument("--sl", type=float, default=0.0, help="New Stop Loss price")
    parser.add_argument("--tp", type=float, default=0.0, help="New Take Profit price")
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

    if not session.connect():
        return 1

    if mt5 is None:
        print("MetaTrader5 not available (Windows + MT5 required)")
        return 1

    print(f"Modifying position {args.ticket} on {args.account} (login={cfg.login}) with SL={args.sl}, TP={args.tp}...")
    result = session.connector.modify_position(args.ticket, sl=args.sl, tp=args.tp)
    session.disconnect()

    if result and result.get("retcode") == mt5.TRADE_RETCODE_DONE:
        print(f"SUCCESS: Ticket {args.ticket} modified.")
        return 0
    print(f"FAILED: {result}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
