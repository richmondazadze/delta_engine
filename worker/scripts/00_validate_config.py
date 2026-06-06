#!/usr/bin/env python3
"""Validate worker YAML config without connecting to MT5."""

from __future__ import annotations

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# Phase 1 validation always uses local YAML — never the API control plane.
os.environ["DELTA_CONFIG_SOURCE"] = "yaml"

from engine.config_loader import load_accounts, load_copiers, load_symbol_mappings, get_copiers_for_master


def main() -> int:
    errors: list[str] = []
    accounts = load_accounts()
    copiers = load_copiers()
    mappings = load_symbol_mappings()

    masters = [a for a in accounts if a.role == "master" and a.enabled]
    followers = [a for a in accounts if a.role == "follower" and a.enabled]

    if not masters:
        errors.append("No enabled master account in accounts.yaml")
    if not followers:
        errors.append("No enabled follower account in accounts.yaml")

    for m in masters:
        links = get_copiers_for_master(copiers, m.id)
        if not links:
            errors.append(f"Master '{m.id}' has no enabled copier relations")

    for c in copiers:
        if not c.enabled:
            continue
        master_ids = {a.id for a in accounts}
        if c.master_id not in master_ids:
            errors.append(f"Copier '{c.id}' references unknown master '{c.master_id}'")
        if c.follower_id not in master_ids:
            errors.append(f"Copier '{c.id}' references unknown follower '{c.follower_id}'")

    print("Config summary")
    print(f"  accounts: {len(accounts)} ({len(masters)} masters, {len(followers)} followers)")
    print(f"  copiers:  {len([c for c in copiers if c.enabled])} enabled")
    print(f"  symbols:  {len(mappings)} mappings")

    if errors:
        print("\nValidation FAILED:")
        for e in errors:
            print(f"  - {e}")
        return 1

    print("\nValidation OK — proceed with 01_connect_account.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
