"""
Maps master position tickets to follower tickets per copier relation.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional, Tuple


@dataclass
class TicketLink:
    copier_id: str
    master_ticket: int
    follower_ticket: int
    symbol: str
    side: str


class TicketMapper:
    def __init__(self):
        # (copier_id, master_ticket) -> TicketLink
        self._links: Dict[Tuple[str, int], TicketLink] = {}

    def has(self, copier_id: str, master_ticket: int) -> bool:
        return (copier_id, master_ticket) in self._links

    def add(
        self,
        copier_id: str,
        master_ticket: int,
        follower_ticket: int,
        symbol: str,
        side: str,
    ) -> None:
        self._links[(copier_id, master_ticket)] = TicketLink(
            copier_id=copier_id,
            master_ticket=master_ticket,
            follower_ticket=follower_ticket,
            symbol=symbol,
            side=side,
        )

    def get(self, copier_id: str, master_ticket: int) -> Optional[TicketLink]:
        return self._links.get((copier_id, master_ticket))

    def remove(self, copier_id: str, master_ticket: int) -> None:
        self._links.pop((copier_id, master_ticket), None)
