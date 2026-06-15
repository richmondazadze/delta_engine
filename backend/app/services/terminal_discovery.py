"""
Resolve MT5 terminal64.exe paths on Windows worker/API hosts.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from app.data.mt5_brokers import MT5BrokerPreset, get_broker, match_broker_from_server


def path_exists(path: str | None) -> bool:
    if not path:
        return False
    return Path(path).is_file()


def scan_program_files(search_terms: tuple[str, ...]) -> list[str]:
    """Find terminal64.exe under Program Files folders matching search terms."""
    if os.name != "nt":
        return []

    roots = [
        Path(r"C:\Program Files"),
        Path(r"C:\Program Files (x86)"),
    ]
    found: list[str] = []
    terms = [t.lower() for t in search_terms if t]

    for root in roots:
        if not root.exists():
            continue
        try:
            for child in root.iterdir():
                if not child.is_dir():
                    continue
                name_lower = child.name.lower()
                if terms and not any(t in name_lower for t in terms):
                    continue
                candidate = child / "terminal64.exe"
                if candidate.is_file():
                    found.append(str(candidate))
        except OSError:
            continue

    return found


def resolve_terminal_path(
    broker: MT5BrokerPreset | None,
    *,
    explicit: str | None = None,
) -> Optional[str]:
    if explicit and path_exists(explicit):
        return explicit

    if not broker:
        return None

    for candidate in broker.terminal_path_candidates:
        if path_exists(candidate):
            return candidate

    discovered = scan_program_files(broker.path_search_terms)
    if discovered:
        return discovered[0]

    # Return first candidate for error messages even if missing
    if broker.terminal_path_candidates:
        return broker.terminal_path_candidates[0]

    return None


def resolve_for_account(
    *,
    broker_slug: str | None,
    broker_server: str,
    terminal_path: str | None = None,
) -> tuple[Optional[str], Optional[MT5BrokerPreset]]:
    broker = get_broker(broker_slug) if broker_slug else None
    if not broker and broker_server:
        broker = match_broker_from_server(broker_server)

    path = resolve_terminal_path(broker, explicit=terminal_path)
    return path, broker


def list_installed_terminals() -> list[dict[str, str]]:
    """All terminal64.exe installs under Program Files (for diagnostics UI)."""
    if os.name != "nt":
        return []

    results: list[dict[str, str]] = []
    for root in (Path(r"C:\Program Files"), Path(r"C:\Program Files (x86)")):
        if not root.exists():
            continue
        try:
            for exe in root.glob("**/terminal64.exe"):
                posix = exe.as_posix()
                if any(
                    term in posix
                    for term in ("MetaTrader", "MT5", "FTMO", "Moneta", "EXNESS", "Fusion")
                ):
                    results.append(
                        {
                            "path": str(exe),
                            "folder": exe.parent.name,
                        }
                    )
        except OSError:
            continue
    return results
