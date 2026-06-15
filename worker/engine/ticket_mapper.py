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
    follower_ticket: int | str
    symbol: str
    side: str
    volume: float | None = None


class TicketMapper:
    def __init__(self):
        # (copier_id, master_ticket) -> TicketLink
        self._links: Dict[Tuple[str, int], TicketLink] = {}
        # (follower_account_id, master_ticket) -> prevents duplicate opens across copier rows
        self._follower_links: Dict[Tuple[str, int], TicketLink] = {}

    def has(self, copier_id: str, master_ticket: int) -> bool:
        return (copier_id, master_ticket) in self._links

    def has_for_follower(self, follower_account_id: str, master_ticket: int) -> bool:
        return (follower_account_id, master_ticket) in self._follower_links

    def add(
        self,
        copier_id: str,
        master_ticket: int,
        follower_ticket: int | str,
        symbol: str,
        side: str,
        *,
        follower_account_id: str | None = None,
        volume: float | None = None,
    ) -> None:
        link = TicketLink(
            copier_id=copier_id,
            master_ticket=master_ticket,
            follower_ticket=follower_ticket,
            symbol=symbol,
            side=side,
            volume=volume,
        )
        self._links[(copier_id, master_ticket)] = link
        if follower_account_id:
            self._follower_links[(follower_account_id, master_ticket)] = link

    def get(self, copier_id: str, master_ticket: int) -> Optional[TicketLink]:
        return self._links.get((copier_id, master_ticket))

    def remove(
        self,
        copier_id: str,
        master_ticket: int,
        *,
        follower_account_id: str | None = None,
    ) -> None:
        self._links.pop((copier_id, master_ticket), None)
        if follower_account_id:
            self._follower_links.pop((follower_account_id, master_ticket), None)
