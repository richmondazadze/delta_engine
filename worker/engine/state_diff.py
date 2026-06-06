"""
State-diff engine: compares MT5 position snapshots and emits TradeSignals.
"""

from __future__ import annotations

from typing import Dict, List, Optional

from engine.signal import PositionSnapshot, TradeSignal


class StateDiffEngine:
    def __init__(self, account_id: str):
        self.account_id = account_id
        self._snapshot: Dict[int, PositionSnapshot] = {}

    def bootstrap(self, positions: List[dict]) -> None:
        """Seed initial state without emitting events."""
        self._snapshot = {
            p["ticket"]: PositionSnapshot.from_mt5_position(p) for p in positions
        }

    def resync(self, positions: List[dict]) -> None:
        """Update snapshot after terminal reconnect — do not emit trade signals."""
        self.bootstrap(positions)

    def diff(
        self,
        positions: List[dict],
        *,
        suppress_closes: bool = False,
    ) -> List[TradeSignal]:
        current = {
            p["ticket"]: PositionSnapshot.from_mt5_position(p) for p in positions
        }
        events: List[TradeSignal] = []

        for ticket, snap in current.items():
            prev = self._snapshot.get(ticket)
            if prev is None:
                events.append(
                    TradeSignal(
                        event_type="position_opened",
                        account_id=self.account_id,
                        ticket=ticket,
                        symbol=snap.symbol,
                        side=snap.side,
                        volume=snap.volume,
                        open_price=snap.open_price,
                        sl=snap.sl or None,
                        tp=snap.tp or None,
                    )
                )
            else:
                if snap.sl != prev.sl:
                    events.append(
                        TradeSignal(
                            event_type="sl_modified",
                            account_id=self.account_id,
                            ticket=ticket,
                            symbol=snap.symbol,
                            side=snap.side,
                            volume=snap.volume,
                            sl=snap.sl or None,
                            tp=snap.tp or None,
                        )
                    )
                if snap.tp != prev.tp:
                    events.append(
                        TradeSignal(
                            event_type="tp_modified",
                            account_id=self.account_id,
                            ticket=ticket,
                            symbol=snap.symbol,
                            side=snap.side,
                            volume=snap.volume,
                            sl=snap.sl or None,
                            tp=snap.tp or None,
                        )
                    )
                if snap.volume != prev.volume:
                    events.append(
                        TradeSignal(
                            event_type="volume_changed",
                            account_id=self.account_id,
                            ticket=ticket,
                            symbol=snap.symbol,
                            side=snap.side,
                            volume=snap.volume,
                            open_price=snap.open_price,
                            sl=snap.sl or None,
                            tp=snap.tp or None,
                            previous_volume=prev.volume,
                        )
                    )

        if not suppress_closes:
            for ticket, prev in self._snapshot.items():
                if ticket not in current:
                    events.append(
                        TradeSignal(
                            event_type="position_closed",
                            account_id=self.account_id,
                            ticket=ticket,
                            symbol=prev.symbol,
                            side=prev.side,
                            volume=prev.volume,
                            open_price=prev.open_price,
                            sl=prev.sl or None,
                            tp=prev.tp or None,
                        )
                    )

        self._snapshot = current
        return events
