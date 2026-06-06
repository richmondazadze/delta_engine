"""
DXtrade prop-firm / broker presets — each firm has its own API host and default domain.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class DXtradeFirmPreset:
    slug: str
    name: str
    api_base_url: str
    default_domain: str = "default"
    login_path: str = "/login"
    verified: bool = False
    notes: Optional[str] = None
    trader_url: Optional[str] = None


DXTRADE_FIRM_PRESETS: list[DXtradeFirmPreset] = [
    DXtradeFirmPreset(
        slug="ftmo",
        name="FTMO",
        api_base_url="https://dxtrade.ftmo.com",
        default_domain="default",
        verified=True,
        notes="FTMO DXtrade (web). For FTMO MetaTrader 5, link platform MT5 and select broker FTMO (MT5).",
        trader_url="https://dxtrade.ftmo.com",
    ),
    DXtradeFirmPreset(
        slug="lark",
        name="Lark Funding",
        api_base_url="https://trade.gooeytrade.com",
        default_domain="default",
        verified=False,
        trader_url="https://trade.gooeytrade.com",
    ),
    DXtradeFirmPreset(
        slug="eightcap",
        name="Eightcap",
        api_base_url="https://trader.dx-eightcap.com",
        default_domain="default",
        verified=False,
    ),
    DXtradeFirmPreset(
        slug="funded_trading_plus",
        name="Funded Trading Plus",
        api_base_url="https://dxtrade.fundedtradingplus.com",
        default_domain="default",
        verified=False,
        notes="Confirm API host with FTP support — URL may differ.",
    ),
    DXtradeFirmPreset(
        slug="blueberry",
        name="Blueberry Funded",
        api_base_url="https://dxtrade.blueberryfunded.com",
        default_domain="default",
        verified=False,
        notes="Confirm API host with broker — URL may differ.",
    ),
    DXtradeFirmPreset(
        slug="fxify",
        name="FXIFY",
        api_base_url="https://dxtrade.fxify.com",
        default_domain="default",
        verified=False,
        notes="Confirm API host with FXIFY — URL may differ.",
    ),
    DXtradeFirmPreset(
        slug="alpha_capital",
        name="Alpha Capital Group",
        api_base_url="https://dxtrade.alphacapitalgroup.uk",
        default_domain="default",
        verified=False,
        notes="Confirm API host with firm — URL may differ.",
    ),
    DXtradeFirmPreset(
        slug="custom",
        name="Other (custom API URL)",
        api_base_url="",
        default_domain="default",
        verified=False,
        notes="Enter the REST root from your broker (trader site origin, no path).",
    ),
]


def get_firm(slug: str) -> Optional[DXtradeFirmPreset]:
    for firm in DXTRADE_FIRM_PRESETS:
        if firm.slug == slug:
            return firm
    return None
