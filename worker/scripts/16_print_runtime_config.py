#!/usr/bin/env python3
"""Print runtime config from API (verify WORKER_USER_ID matches dashboard user)."""

from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from engine.env_loader import load_worker_env
from engine.config_loader import load_accounts, load_copiers, get_config_source


def main() -> int:
    load_worker_env()
    source = get_config_source()
    print(f"DELTA_CONFIG_SOURCE={source}")
    print(f"WORKER_USER_ID={os.environ.get('WORKER_USER_ID', '')}")
    print(f"API_URL={os.environ.get('API_URL', '')}")

    if source != "api":
        print("\nSet DELTA_CONFIG_SOURCE=api in repo .env to use dashboard copiers.")
        return 1

    try:
        accounts = load_accounts()
        copiers = load_copiers()
    except Exception as exc:
        print(f"\nFAILED: {exc}")
        print("Check: backend running, WORKER_API_KEY set, WORKER_USER_ID = your Supabase user id.")
        return 1

    print(f"\nAccounts ({len(accounts)}):")
    for a in accounts:
        print(
            f"  {a.id[:8]}… {a.role:8} login={a.login} server={a.server} "
            f"terminal={a.terminal_path or 'auto'}"
        )

    print(f"\nCopiers ({len(copiers)}):")
    for c in copiers:
        print(
            f"  {c.id[:8]}… master={c.master_id[:8]}… "
            f"follower={c.follower_id[:8]}… enabled={c.enabled}"
        )

    paths = {a.terminal_path for a in accounts if a.terminal_path}
    if len(paths) > 1:
        print("\nNote: Multiple MT5 terminal paths — copier will switch terminals per copy.")

    print("\nStart copying: python scripts\\09_run_copier_loop.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
