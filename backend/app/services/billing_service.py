"""
Stripe billing — TradersConnect-style per-account pricing (slightly below TC rates).

CopyMorphic pricing (vs TradersConnect):
  Standard copier:  $9/account/mo  (TC $10)
  Premium copier:   $14/account/mo (TC $15)
  Analyzer add-on:  $27.99/mo flat (TC $29.99)
  Dedicated infra:  $28/mo flat     (TC $30) — optional, contact / future self-serve
"""

from __future__ import annotations

from typing import Any

import structlog

from app.core.config import get_settings

logger = structlog.get_logger()

FREE_LIMITS = {"account_limit": 1, "follower_limit": 1}

PLAN_CATALOG: dict[str, dict[str, Any]] = {
    "free": {
        "name": "Free",
        "price_usd": 0,
        "unit": "workspace",
        "description": "Try CopyMorphic with one linked account.",
        "account_limit": 1,
        "follower_limit": 1,
        "features": [
            "1 linked account",
            "1 copy link",
            "Execution logs",
            "Basic risk controls",
        ],
    },
    "standard": {
        "name": "Standard",
        "price_usd": 9,
        "unit": "account",
        "description": "Cloud trade copying — pay per linked account.",
        "features": [
            "Pay per linked account",
            "Cross-platform copy (MT5, DXtrade)",
            "Equity protection & risk rules",
            "Copy log & performance stats",
            "Email support",
        ],
    },
    "premium": {
        "name": "Premium",
        "price_usd": 14,
        "unit": "account",
        "description": "Low-latency copy path with priority support.",
        "features": [
            "Everything in Standard",
            "Priority copy routing",
            "Faster worker polling",
            "Priority support",
        ],
    },
    "analyzer": {
        "name": "Analyzer",
        "price_usd": 27.99,
        "unit": "month",
        "description": "Portfolio analytics add-on (ROI, win rate, profit factor).",
        "features": [
            "Portfolio ROI",
            "Win / loss breakdown",
            "Profit factor & equity growth",
            "Symbol performance",
        ],
    },
    "dedicated": {
        "name": "Dedicated",
        "price_usd": 28,
        "unit": "month",
        "description": "Private worker IP & hardware (prop-firm friendly).",
        "features": [
            "Dedicated cloud worker",
            "Lowest latency routing",
            "Isolated credentials",
        ],
    },
}

# Legacy plan names still stored on some rows
LEGACY_PLAN_ALIASES = {
    "starter": "standard",
    "pro": "premium",
    "enterprise": "premium",
    "scale": "premium",
    "elite": "premium",
}


def normalize_plan(plan: str) -> str:
    p = (plan or "free").lower().strip()
    return LEGACY_PLAN_ALIASES.get(p, p)


def price_id_for_plan(plan: str) -> str | None:
    settings = get_settings()
    normalized = normalize_plan(plan)
    mapping = {
        "standard": settings.stripe_price_standard or settings.stripe_price_starter,
        "premium": settings.stripe_price_premium or settings.stripe_price_pro,
        "analyzer": settings.stripe_price_analyzer,
        "dedicated": settings.stripe_price_dedicated or settings.stripe_price_scale,
    }
    value = mapping.get(normalized, "")
    return value or None


def limits_for_plan(plan: str, quantity: int) -> dict[str, int]:
    normalized = normalize_plan(plan)
    qty = max(1, quantity)
    if normalized == "free":
        return dict(FREE_LIMITS)
    if normalized in ("standard", "premium", "dedicated"):
        return {"account_limit": qty, "follower_limit": qty}
    if normalized == "analyzer":
        return {}
    return {"account_limit": qty, "follower_limit": qty}


def plan_from_price_id(price_id: str) -> str | None:
    settings = get_settings()
    pairs = {
        settings.stripe_price_standard: "standard",
        settings.stripe_price_premium: "premium",
        settings.stripe_price_analyzer: "analyzer",
        settings.stripe_price_dedicated: "dedicated",
        settings.stripe_price_starter: "standard",
        settings.stripe_price_pro: "premium",
        settings.stripe_price_scale: "dedicated",
    }
    for pid, plan in pairs.items():
        if pid and pid == price_id:
            return plan
    return None


def sync_user_from_subscription(
    sb,
    user_id: str,
    subscription: dict[str, Any],
) -> None:
    """Apply Stripe subscription line items to tc_users limits and plan."""
    items = (subscription.get("items") or {}).get("data") or []
    primary_plan = "free"
    primary_qty = 1
    has_analyzer = False

    for item in items:
        price = item.get("price") or {}
        price_id = price.get("id") if isinstance(price, dict) else price
        plan = plan_from_price_id(str(price_id or ""))
        if not plan:
            continue
        qty = int(item.get("quantity") or 1)
        if plan == "analyzer":
            has_analyzer = True
            continue
        if plan in ("standard", "premium", "dedicated"):
            primary_plan = plan
            primary_qty = max(primary_qty, qty)

    limits = limits_for_plan(primary_plan, primary_qty)
    update: dict[str, Any] = {
        "subscription_plan": primary_plan,
        "is_active_subscriber": primary_plan != "free",
        "stripe_subscription_id": subscription.get("id"),
    }
    if limits:
        update.update(limits)
    if has_analyzer and primary_plan == "free":
        update["subscription_plan"] = "analyzer"

    sb.table("tc_users").update(update).eq("id", user_id).execute()
    logger.info(
        "billing_synced",
        user_id=user_id,
        plan=update.get("subscription_plan"),
        account_limit=update.get("account_limit"),
    )


def public_plan_catalog() -> list[dict[str, Any]]:
    """Plans exposed to dashboard / marketing (no Stripe IDs)."""
    order = ["standard", "premium", "analyzer"]
    out: list[dict[str, Any]] = []
    for key in order:
        meta = PLAN_CATALOG[key]
        out.append(
            {
                "id": key,
                "name": meta["name"],
                "price_usd": meta["price_usd"],
                "unit": meta["unit"],
                "description": meta["description"],
                "features": meta["features"],
                "configured": price_id_for_plan(key) is not None,
            }
        )
    return out
