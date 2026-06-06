#!/usr/bin/env python3
"""Test DXtrade login (Phase 9). Requires DXTRADE_* env or CLI args."""

from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from engine.env_loader import load_worker_env
from adapters.dxtrade_client import DXtradeClient, account_key, resolve_base_url


def main() -> int:
    load_worker_env()
    p = argparse.ArgumentParser(description="Test DXtrade session login")
    p.add_argument("--username", default=os.environ.get("DXTRADE_USERNAME"))
    p.add_argument("--password", default=os.environ.get("DXTRADE_PASSWORD"))
    p.add_argument("--domain", default=os.environ.get("DXTRADE_DOMAIN", "default"))
    p.add_argument("--base-url", default=os.environ.get("DXTRADE_API_BASE_URL"))
    args = p.parse_args()

    if not args.username or not args.password:
        print("Set --username/--password or DXTRADE_USERNAME/DXTRADE_PASSWORD")
        return 1

    base = resolve_base_url(api_base_url=args.base_url)
    client = DXtradeClient(base)
    session = client.login(args.username, args.password, args.domain)
    key = account_key(args.domain, args.username)
    accounts = client.get_accounts()
    positions = client.get_open_positions(key)

    print("OK — session established")
    print(f"  base:    {base}")
    print(f"  account: {key}")
    print(f"  timeout: {session.timeout_ms} ms")
    print(f"  accounts: {len(accounts)}")
    print(f"  positions: {len(positions)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
