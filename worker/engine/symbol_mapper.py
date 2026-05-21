"""
Symbol mapping between master and follower brokers.
"""

from __future__ import annotations

from typing import List

from engine.config_loader import SymbolMapping


class SymbolMapper:
    def __init__(self, mappings: List[SymbolMapping]):
        self._map = {m.master_symbol: m.follower_symbol for m in mappings}

    def map_symbol(self, master_symbol: str) -> str:
        return self._map.get(master_symbol, master_symbol)
