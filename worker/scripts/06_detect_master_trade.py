"""Step 6: Poll master account and print state-diff signals (Ctrl+C to stop)."""

import argparse
import time

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from engine.account_session import AccountSession
from engine.config_loader import get_master_accounts, load_accounts
from engine.state_diff import StateDiffEngine


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--master", "-m", help="Master account id")
    parser.add_argument("--interval-ms", type=int, default=500)
    args = parser.parse_args()

    accounts = load_accounts()
    masters = get_master_accounts(accounts)
    if args.master:
        masters = [m for m in accounts if m.id == args.master and m.role == "master"]
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

    diff = StateDiffEngine(cfg.id)
    diff.bootstrap(session.connector.get_open_positions())
    print(f"Watching master {cfg.id} — open/close/modify trades in MT5 (Ctrl+C to stop)\n")

    try:
        while True:
            signals = diff.diff(session.connector.get_open_positions())
            for s in signals:
                print(
                    f"[{time.strftime('%H:%M:%S')}] {s.event_type.upper()} "
                    f"ticket={s.ticket} {s.symbol} {s.side} vol={s.volume} sl={s.sl} tp={s.tp}"
                )
            time.sleep(args.interval_ms / 1000.0)
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        session.disconnect()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
