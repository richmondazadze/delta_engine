"""
Load local dev configuration from YAML files in worker/config/.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

import yaml

WORKER_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CONFIG_DIR = WORKER_ROOT / "config"


def get_config_dir() -> Path:
    override = os.environ.get("DELTA_CONFIG_DIR")
    if override:
        return Path(override)
    return DEFAULT_CONFIG_DIR


def _load_yaml(name: str) -> dict[str, Any]:
    path = get_config_dir() / name
    if not path.exists():
        raise FileNotFoundError(
            f"Missing config file: {path}\n"
            f"Copy {name.replace('.yaml', '.example.yaml')} to {name} and fill in credentials."
        )
    with open(path, encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    return data


@dataclass
class AccountConfig:
    id: str
    label: str
    role: str
    login: int
    password: str
    server: str
    terminal_path: Optional[str] = None
    enabled: bool = True


@dataclass
class CopierConfig:
    id: str
    master_id: str
    follower_id: str
    enabled: bool = True
    risk_mode: str = "multiplier"
    multiplier: float = 1.0
    fixed_lot_size: float = 0.01
    copy_sl: bool = True
    copy_tp: bool = True
    copy_closes: bool = True
    copy_modifications: bool = True
    max_signal_age_ms: int = 3000


@dataclass
class SymbolMapping:
    master_symbol: str
    follower_symbol: str


def load_accounts() -> list[AccountConfig]:
    data = _load_yaml("accounts.yaml")
    accounts = []
    for row in data.get("accounts", []):
        accounts.append(
            AccountConfig(
                id=row["id"],
                label=row.get("label", row["id"]),
                role=row["role"],
                login=int(row["login"]),
                password=str(row["password"]),
                server=row["server"],
                terminal_path=row.get("terminal_path"),
                enabled=row.get("enabled", True),
            )
        )
    return accounts


def load_copiers() -> list[CopierConfig]:
    data = _load_yaml("copiers.yaml")
    copiers = []
    for row in data.get("copiers", []):
        copiers.append(
            CopierConfig(
                id=row["id"],
                master_id=row["master_id"],
                follower_id=row["follower_id"],
                enabled=row.get("enabled", True),
                risk_mode=row.get("risk_mode", "multiplier"),
                multiplier=float(row.get("multiplier", 1.0)),
                fixed_lot_size=float(row.get("fixed_lot_size", 0.01)),
                copy_sl=row.get("copy_sl", True),
                copy_tp=row.get("copy_tp", True),
                copy_closes=row.get("copy_closes", True),
                copy_modifications=row.get("copy_modifications", True),
                max_signal_age_ms=int(row.get("max_signal_age_ms", 3000)),
            )
        )
    return copiers


def load_symbol_mappings() -> list[SymbolMapping]:
    data = _load_yaml("symbol_map.yaml")
    mappings = []
    for row in data.get("mappings", []):
        mappings.append(
            SymbolMapping(
                master_symbol=row["master_symbol"],
                follower_symbol=row["follower_symbol"],
            )
        )
    return mappings


def get_account(accounts: list[AccountConfig], account_id: str) -> AccountConfig:
    for acc in accounts:
        if acc.id == account_id:
            return acc
    raise KeyError(f"Account not found: {account_id}")


def get_master_accounts(accounts: list[AccountConfig]) -> list[AccountConfig]:
    return [a for a in accounts if a.role == "master" and a.enabled]


def get_follower_accounts(accounts: list[AccountConfig]) -> list[AccountConfig]:
    return [a for a in accounts if a.role == "follower" and a.enabled]


def get_copiers_for_master(copiers: list[CopierConfig], master_id: str) -> list[CopierConfig]:
    return [
        c for c in copiers if c.master_id == master_id and c.enabled
    ]
