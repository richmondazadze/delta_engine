"""
Platform copy/link capabilities — single source of truth for API validation and UI hints.

Users may link any supported platform; copier pairs are validated by capability,
not by broker brand (e.g. FTMO can be MT5 or DXtrade).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional


@dataclass(frozen=True)
class PlatformCapability:
    platform: str
    display_name: str
    link_account: bool
    copy_as_master: bool
    copy_as_follower: bool
    requires_terminal_path: bool = False
    requires_api_base_url: bool = False


PLATFORM_CAPABILITIES: dict[str, PlatformCapability] = {
    "mt5": PlatformCapability(
        platform="mt5",
        display_name="MetaTrader 5",
        link_account=True,
        copy_as_master=True,
        copy_as_follower=True,
        requires_terminal_path=True,
    ),
    "dxtrade": PlatformCapability(
        platform="dxtrade",
        display_name="DXtrade",
        link_account=True,
        copy_as_master=True,
        copy_as_follower=True,
        requires_api_base_url=True,
    ),
    "mt4": PlatformCapability(
        platform="mt4",
        display_name="MetaTrader 4",
        link_account=False,
        copy_as_master=False,
        copy_as_follower=False,
    ),
    "ctrader": PlatformCapability(
        platform="ctrader",
        display_name="cTrader",
        link_account=False,
        copy_as_master=False,
        copy_as_follower=False,
    ),
    "tradelocker": PlatformCapability(
        platform="tradelocker",
        display_name="TradeLocker",
        link_account=False,
        copy_as_master=False,
        copy_as_follower=False,
    ),
    "ninjatrader": PlatformCapability(
        platform="ninjatrader",
        display_name="NinjaTrader",
        link_account=False,
        copy_as_master=False,
        copy_as_follower=False,
    ),
}


def get_capability(platform: str) -> Optional[PlatformCapability]:
    return PLATFORM_CAPABILITIES.get(str(platform or "mt5").lower())


def capability_dict(cap: PlatformCapability) -> dict[str, Any]:
    return {
        "platform": cap.platform,
        "display_name": cap.display_name,
        "link_account": cap.link_account,
        "copy_as_master": cap.copy_as_master,
        "copy_as_follower": cap.copy_as_follower,
        "requires_terminal_path": cap.requires_terminal_path,
        "requires_api_base_url": cap.requires_api_base_url,
    }


def list_capabilities() -> list[dict[str, Any]]:
    return [capability_dict(c) for c in PLATFORM_CAPABILITIES.values()]


def validate_copier_pair(
    master_row: dict[str, Any],
    follower_row: dict[str, Any],
) -> tuple[list[str], list[str]]:
    """
    Returns (blocking_errors, warnings).
    blocking_errors → HTTP 400; warnings → stored in logs / optional UI hints.
    """
    errors: list[str] = []
    warnings: list[str] = []

    master_platform = str(master_row.get("platform") or "mt5").lower()
    follower_platform = str(follower_row.get("platform") or "mt5").lower()

    master_cap = get_capability(master_platform)
    follower_cap = get_capability(follower_platform)

    if not master_cap or not master_cap.copy_as_master:
        label = master_cap.display_name if master_cap else master_platform.upper()
        errors.append(
            f"{label} cannot be used as a copy master yet. "
            "Use MetaTrader 5 or DXtrade, or choose a different master account."
        )

    if not follower_cap or not follower_cap.copy_as_follower:
        label = follower_cap.display_name if follower_cap else follower_platform.upper()
        errors.append(
            f"{label} cannot be used as a copy follower yet. "
            "Use MetaTrader 5 or DXtrade, or choose a different follower account."
        )

    if master_cap and master_cap.requires_api_base_url and not master_row.get("api_base_url"):
        errors.append(
            "DXtrade master requires an API base URL — link the account with a firm preset "
            "or custom REST URL."
        )

    if follower_cap and follower_cap.requires_api_base_url and not follower_row.get("api_base_url"):
        errors.append(
            "DXtrade follower requires an API base URL — link the account with a firm preset "
            "or custom REST URL."
        )

    if master_cap and master_cap.requires_terminal_path and not master_row.get("terminal_path"):
        warnings.append(
            "MT5 master has no terminal path yet — run Test Connection on the worker PC "
            "before copying."
        )

    if follower_cap and follower_cap.requires_terminal_path and not follower_row.get(
        "terminal_path"
    ):
        warnings.append(
            "MT5 follower has no terminal path yet — run Test Connection on the worker PC "
            "before copying."
        )

    if master_platform != follower_platform:
        warnings.append(
            "Cross-platform copy (different master/follower platforms) may need symbol "
            "mappings and a higher Max Signal Age (e.g. 15000 ms)."
        )

    return errors, warnings
