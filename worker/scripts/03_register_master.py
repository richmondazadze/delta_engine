"""Step 3: Validate and display registered master account(s)."""

import json

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from engine.config_loader import get_master_accounts, load_accounts


def main():
    masters = get_master_accounts(load_accounts())
    if not masters:
        print("ERROR: No enabled master in accounts.yaml (role: master)")
        return 1
    if len(masters) > 1:
        print("WARNING: Multiple masters defined; copier loop uses the first.")

    for m in masters:
        print(f"MASTER REGISTERED: {m.id} | {m.label} | login={m.login} | server={m.server}")

    print(json.dumps([{"id": m.id, "login": m.login, "server": m.server} for m in masters], indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
