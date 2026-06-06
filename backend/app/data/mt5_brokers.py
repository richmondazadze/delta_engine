"""
MT5 broker presets — maps broker → server hints and terminal install paths.

Each retail/prop broker ships its own MT5 build. The Python API must launch
the matching terminal64.exe or login fails (wrong IPC / wrong server list).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class MT5BrokerPreset:
    slug: str
    name: str
    default_server: str
    server_examples: tuple[str, ...]
    terminal_path_candidates: tuple[str, ...]
    path_search_terms: tuple[str, ...]
    verified: bool = False
    notes: Optional[str] = None


MT5_BROKER_PRESETS: list[MT5BrokerPreset] = [
    MT5BrokerPreset(
        slug="moneta_markets",
        name="Moneta Markets",
        default_server="MonetaMarkets-Demo",
        server_examples=("MonetaMarkets-Demo", "MonetaMarkets-Live"),
        terminal_path_candidates=(
            r"C:\Program Files\Moneta Markets MT5 Terminal\terminal64.exe",
        ),
        path_search_terms=("Moneta Markets", "MonetaMarkets"),
        verified=True,
        notes="Use the server name exactly as shown in your MT5 login dialog.",
    ),
    MT5BrokerPreset(
        slug="ftmo",
        name="FTMO (MT5)",
        default_server="FTMO-Demo",
        server_examples=("FTMO-Demo", "FTMO-Server", "FTMO-Demo2"),
        terminal_path_candidates=(
            r"C:\Program Files\FTMO Global Markets MT5 Terminal\terminal64.exe",
            r"C:\Program Files\FTMO MetaTrader 5\terminal64.exe",
        ),
        path_search_terms=("FTMO",),
        verified=True,
        notes="FTMO also offers DXtrade (web) — pick platform DXtrade when linking that account.",
    ),
    MT5BrokerPreset(
        slug="exness",
        name="Exness",
        default_server="Exness-MT5Trial9",
        server_examples=("Exness-MT5Trial9", "Exness-MT5Real9"),
        terminal_path_candidates=(
            r"C:\Program Files\MetaTrader 5 EXNESS\terminal64.exe",
        ),
        path_search_terms=("EXNESS", "Exness"),
        verified=True,
    ),
    MT5BrokerPreset(
        slug="generic",
        name="MetaQuotes (generic)",
        default_server="",
        server_examples=(),
        terminal_path_candidates=(
            r"C:\Program Files\MetaTrader 5\terminal64.exe",
        ),
        path_search_terms=("MetaTrader 5",),
        verified=False,
        notes="Official MetaQuotes build — only works if your broker supports it.",
    ),
    MT5BrokerPreset(
        slug="custom",
        name="Other broker (custom path)",
        default_server="",
        server_examples=(),
        terminal_path_candidates=(),
        path_search_terms=(),
        verified=False,
        notes="Enter server name and terminal path manually under Advanced.",
    ),
]


def get_broker(slug: str) -> Optional[MT5BrokerPreset]:
    for broker in MT5_BROKER_PRESETS:
        if broker.slug == slug:
            return broker
    return None


def match_broker_from_server(server: str) -> Optional[MT5BrokerPreset]:
    if not server:
        return None
    lower = server.lower()
    for broker in MT5_BROKER_PRESETS:
        if broker.slug == "custom":
            continue
        for hint in (broker.default_server, *broker.server_examples):
            if hint and hint.lower() in lower:
                return broker
        for term in broker.path_search_terms:
            if term.lower().replace(" ", "") in lower.replace(" ", ""):
                return broker
    return None
