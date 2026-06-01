"""
Phase 2 — Seed Supabase from local worker YAML via FastAPI internal API.

Usage (backend must be running on API_URL):
  python scripts/11_seed_supabase.py
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import httpx
import yaml

from engine.env_loader import load_worker_env


def _load_yaml(name: str) -> dict:
    config_dir = os.environ.get("DELTA_CONFIG_DIR")
    if config_dir:
        path = os.path.join(config_dir, name)
    else:
        path = os.path.join(os.path.dirname(__file__), "..", "config", name)
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def main() -> None:
    load_worker_env()
    api_url = os.environ.get("API_URL", "http://localhost:8000").rstrip("/")
    worker_key = os.environ.get("WORKER_API_KEY")
    if not worker_key:
        raise SystemExit("WORKER_API_KEY missing from .env")

    accounts_yaml = _load_yaml("accounts.yaml")
    copiers_yaml = _load_yaml("copiers.yaml")
    symbols_yaml = _load_yaml("symbol_map.yaml")

    payload = {
        "email": os.environ.get("WORKER_DEV_EMAIL", "dev@deltaengine.local"),
        "password": os.environ.get("WORKER_DEV_PASSWORD", "dev-password-change-me"),
        "full_name": os.environ.get("WORKER_DEV_NAME", "Dev Trader"),
        "accounts": [
            {
                "yaml_id": row["id"],
                "label": row.get("label", row["id"]),
                "role": row["role"],
                "login": int(row["login"]),
                "password": str(row["password"]),
                "server": row["server"],
                "terminal_path": row.get("terminal_path"),
                "enabled": row.get("enabled", True),
            }
            for row in accounts_yaml.get("accounts", [])
        ],
        "copiers": [
            {
                "yaml_id": row["id"],
                "master_yaml_id": row["master_id"],
                "follower_yaml_id": row["follower_id"],
                "enabled": row.get("enabled", True),
                "risk_mode": row.get("risk_mode", "multiplier"),
                "multiplier": float(row.get("multiplier", 1.0)),
                "fixed_lot_size": float(row.get("fixed_lot_size", 0.01)),
                "copy_sl": row.get("copy_sl", True),
                "copy_tp": row.get("copy_tp", True),
                "copy_closes": row.get("copy_closes", True),
                "copy_modifications": row.get("copy_modifications", True),
                "max_signal_age_ms": int(row.get("max_signal_age_ms", 3000)),
            }
            for row in copiers_yaml.get("copiers", [])
        ],
        "symbol_mappings": [
            {
                "master_symbol": row["master_symbol"],
                "follower_symbol": row["follower_symbol"],
            }
            for row in symbols_yaml.get("mappings", [])
        ],
    }

    print(f"Seeding Supabase via {api_url}/internal/dev/seed-config ...")
    with httpx.Client(timeout=60.0) as client:
        response = client.post(
            f"{api_url}/internal/dev/seed-config",
            headers={"X-Worker-Key": worker_key},
            json=payload,
        )
        response.raise_for_status()
        data = response.json()

    user_id = data["user_id"]
    print("Seed complete.")
    print(f"  user_id: {user_id}")
    print(f"  email:   {data['email']}")
    print(f"  accounts: {data['account_ids']}")
    print(f"  copiers:  {data['copier_ids']}")
    print("")
    print("Add to your root .env:")
    print(f"  WORKER_USER_ID={user_id}")
    print("  DELTA_CONFIG_SOURCE=api")


if __name__ == "__main__":
    main()
