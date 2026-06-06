"""Normalize broker server strings to match MT5 login dialog values."""

from __future__ import annotations

import re


def normalize_broker_server(server: str) -> str:
    """Collapse spaces around hyphens, e.g. 'MonetaMarkets - Demo' -> 'MonetaMarkets-Demo'."""
    s = server.strip()
    if not s:
        return s
    return re.sub(r"\s*-\s*", "-", s)
