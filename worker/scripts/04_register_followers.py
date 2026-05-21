"""Step 4: Validate followers and copier links; test-connect each follower."""

import json

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from engine.account_session import AccountSession
from engine.config_loader import (
    get_copiers_for_master,
    get_follower_accounts,
    get_master_accounts,
    load_accounts,
    load_copiers,
)


def main():
    accounts = load_accounts()
    copiers = load_copiers()
    masters = get_master_accounts(accounts)
    followers = get_follower_accounts(accounts)

    if not masters:
        print("ERROR: No master account")
        return 1
    if not followers:
        print("ERROR: No follower accounts")
        return 1

    master = masters[0]
    linked = get_copiers_for_master(copiers, master.id)
    print(f"Master: {master.id} | Followers: {len(followers)} | Copiers: {len(linked)}\n")

    results = []
    for f in followers:
        session = AccountSession(
            account_id=f.id,
            label=f.label,
            role=f.role,
            login=f.login,
            password=f.password,
            server=f.server,
            terminal_path=f.terminal_path,
        )
        ok = session.connect()
        health = session.get_health() if ok else {"status": "failed"}
        session.disconnect()
        copier_ids = [c.id for c in linked if c.follower_id == f.id]
        results.append(
            {
                "follower_id": f.id,
                "login": f.login,
                "connected": ok,
                "health": health,
                "copier_ids": copier_ids,
            }
        )
        status = "OK" if ok else "FAIL"
        print(f"  [{status}] {f.id} login={f.login} copiers={copier_ids}")

    print("\n" + json.dumps(results, indent=2, default=str))
    return 0 if all(r["connected"] for r in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
