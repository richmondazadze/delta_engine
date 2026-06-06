"""
Stripe billing — Checkout, portal, webhooks.
Per-account pricing aligned with TradersConnect (slightly lower).
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.core.deps import get_supabase_admin
from app.core.security import AuthUser, get_current_user
from app.services.billing_service import (
    FREE_LIMITS,
    normalize_plan,
    price_id_for_plan,
    public_plan_catalog,
    sync_user_from_subscription,
)

router = APIRouter(prefix="/api/billing", tags=["Billing"])


class CheckoutResponse(BaseModel):
    url: str | None = None
    message: str | None = None


class PlanInfo(BaseModel):
    id: str
    name: str
    price_usd: float
    unit: str
    description: str
    features: list[str]
    configured: bool


class BillingPlansResponse(BaseModel):
    plans: list[PlanInfo]
    free_limits: dict[str, int]


class CheckoutRequest(BaseModel):
    plan: str = Field(default="standard", min_length=1, max_length=50)
    quantity: int = Field(default=1, ge=1, le=100)
    include_analyzer: bool = False


def _stripe():
    import stripe

    stripe.api_key = get_settings().stripe_secret_key
    return stripe


def _frontend_base() -> str:
    return get_settings().cors_origins[0].rstrip("/")


def _get_or_create_customer(sb, user_id: str, email: str) -> str:
    row = (
        sb.table("tc_users")
        .select("stripe_customer_id")
        .eq("id", user_id)
        .single()
        .execute()
    ).data
    customer_id = (row or {}).get("stripe_customer_id")
    if customer_id:
        return customer_id
    customer = _stripe().Customer.create(email=email)
    sb.table("tc_users").update({"stripe_customer_id": customer.id}).eq(
        "id", user_id
    ).execute()
    return customer.id


@router.get("/plans", response_model=BillingPlansResponse)
async def list_billing_plans():
    return BillingPlansResponse(
        plans=[PlanInfo(**p) for p in public_plan_catalog()],
        free_limits=FREE_LIMITS,
    )


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    body: CheckoutRequest,
    current_user: AuthUser = Depends(get_current_user),
):
    settings = get_settings()
    if not settings.stripe_secret_key:
        return CheckoutResponse(
            message="Stripe is not configured. Set STRIPE_SECRET_KEY in the API environment.",
        )

    plan = normalize_plan(body.plan)
    if plan not in ("standard", "premium", "analyzer", "dedicated"):
        raise HTTPException(status_code=400, detail=f"Invalid plan: {body.plan}")

    price_id = price_id_for_plan(plan)
    if not price_id:
        return CheckoutResponse(
            message=f"Stripe price not configured for plan '{plan}'. "
            f"Set STRIPE_PRICE_{plan.upper()} in .env — see docs/BILLING.md.",
        )

    sb = get_supabase_admin()
    user = (
        sb.table("tc_users")
        .select("email, stripe_customer_id")
        .eq("id", current_user.user_id)
        .single()
        .execute()
    ).data
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    customer_id = _get_or_create_customer(sb, current_user.user_id, user["email"])

    line_items: list[dict[str, Any]] = []
    if plan == "analyzer":
        line_items.append({"price": price_id, "quantity": 1})
    else:
        line_items.append({"price": price_id, "quantity": body.quantity})
        if body.include_analyzer:
            analyzer_price = price_id_for_plan("analyzer")
            if analyzer_price:
                line_items.append({"price": analyzer_price, "quantity": 1})

    session = _stripe().checkout.Session.create(
        customer=customer_id,
        mode="subscription",
        line_items=line_items,
        success_url=f"{_frontend_base()}/settings/billing?success=1",
        cancel_url=f"{_frontend_base()}/settings/billing?canceled=1",
        metadata={
            "user_id": current_user.user_id,
            "plan": plan,
            "quantity": str(body.quantity),
        },
        subscription_data={
            "metadata": {
                "user_id": current_user.user_id,
                "plan": plan,
            }
        },
    )
    return CheckoutResponse(url=session.url)


@router.post("/portal", response_model=CheckoutResponse)
async def billing_portal(current_user: AuthUser = Depends(get_current_user)):
    settings = get_settings()
    if not settings.stripe_secret_key:
        return CheckoutResponse(message="Stripe is not configured.")

    sb = get_supabase_admin()
    user = (
        sb.table("tc_users")
        .select("stripe_customer_id")
        .eq("id", current_user.user_id)
        .single()
        .execute()
    ).data
    if not user or not user.get("stripe_customer_id"):
        raise HTTPException(status_code=400, detail="No billing account on file")

    session = _stripe().billing_portal.Session.create(
        customer=user["stripe_customer_id"],
        return_url=f"{_frontend_base()}/settings/billing",
    )
    return CheckoutResponse(url=session.url)


@router.post("/webhook")
async def stripe_webhook(request: Request):
    settings = get_settings()
    if not settings.stripe_webhook_secret or not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Stripe webhooks not configured")

    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = _stripe().Webhook.construct_event(
            payload, sig, settings.stripe_webhook_secret
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    sb = get_supabase_admin()
    event_type = event["type"]
    data_object = event["data"]["object"]

    if event_type == "checkout.session.completed":
        user_id = (data_object.get("metadata") or {}).get("user_id")
        subscription_id = data_object.get("subscription")
        if user_id and subscription_id:
            subscription = _stripe().Subscription.retrieve(subscription_id)
            sync_user_from_subscription(sb, user_id, subscription)

    elif event_type in (
        "customer.subscription.updated",
        "customer.subscription.created",
    ):
        user_id = (data_object.get("metadata") or {}).get("user_id")
        if not user_id:
            customer_id = data_object.get("customer")
            match = (
                sb.table("tc_users")
                .select("id")
                .eq("stripe_customer_id", customer_id)
                .limit(1)
                .execute()
            )
            if match.data:
                user_id = match.data[0]["id"]
        if user_id:
            sync_user_from_subscription(sb, user_id, data_object)

    elif event_type == "customer.subscription.deleted":
        user_id = (data_object.get("metadata") or {}).get("user_id")
        if not user_id:
            customer_id = data_object.get("customer")
            match = (
                sb.table("tc_users")
                .select("id")
                .eq("stripe_customer_id", customer_id)
                .limit(1)
                .execute()
            )
            if match.data:
                user_id = match.data[0]["id"]
        if user_id:
            sb.table("tc_users").update(
                {
                    "subscription_plan": "free",
                    "is_active_subscriber": False,
                    "stripe_subscription_id": None,
                    **FREE_LIMITS,
                }
            ).eq("id", user_id).execute()

    return {"received": True}
