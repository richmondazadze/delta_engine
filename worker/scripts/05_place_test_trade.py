"""Step 5: Place a test market order on master (or any) account."""

import argparse

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    import MetaTrader5 as mt5
except ImportError:
    mt5 = None

from engine.account_session import AccountSession
from engine.config_loader import get_account, get_master_accounts, load_accounts


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--account", "-a", help="Account id (default: first master)")
    parser.add_argument("--symbol", "-s", default="EURUSD")
    parser.add_argument("--volume", "-v", type=float, default=0.01)
    parser.add_argument("--side", choices=["buy", "sell"], default="buy")
    args = parser.parse_args()

    accounts = load_accounts()
    if args.account:
        cfg = get_account(accounts, args.account)
    else:
        masters = get_master_accounts(accounts)
        if not masters:
            print("ERROR: No master account")
            return 1
        cfg = masters[0]

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

    order_type = mt5.ORDER_TYPE_BUY if args.side == "buy" else mt5.ORDER_TYPE_SELL
    lot = session.connector.normalize_lot(args.symbol, args.volume)
    print(f"Placing {args.side} {lot} lots on {args.symbol}...")
    result = session.connector.place_market_order(
        args.symbol, order_type, lot or args.volume
    )
    session.disconnect()

    if result and result.get("retcode") == mt5.TRADE_RETCODE_DONE:
        print(f"SUCCESS ticket={result.get('order')} price={result.get('price')}")
        return 0
    print(f"FAILED: {result}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
