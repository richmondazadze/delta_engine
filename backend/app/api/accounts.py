"""
Delta Engine — Account API Routes
POST /api/accounts, GET /api/accounts, GET /api/accounts/:id,
PATCH /api/accounts/:id, DELETE /api/accounts/:id,
POST /api/accounts/:id/test-connection, POST /api/accounts/:id/start-session,
POST /api/accounts/:id/stop-session
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.core.security import AuthUser, get_current_user
from app.core.deps import get_supabase_admin
from app.core.encryption import encrypt_password
from app.models.account import (
    AccountCreate,
    AccountUpdate,
    AccountResponse,
    AccountListResponse,
)
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/api/accounts", tags=["Accounts"])


@router.post("", response_model=AccountResponse, status_code=201)
async def create_account(
    payload: AccountCreate,
    current_user: AuthUser = Depends(get_current_user),
):
    """Add a new trading account. Password is encrypted before storage."""
    sb = get_supabase_admin()

    # Check account limit
    existing = (
        sb.table("trading_accounts")
        .select("id", count="exact")
        .eq("user_id", current_user.user_id)
        .execute()
    )
    user_profile = (
        sb.table("tc_users")
        .select("account_limit")
        .eq("id", current_user.user_id)
        .single()
        .execute()
    )
    account_limit = user_profile.data.get("account_limit", 2)

    if existing.count >= account_limit:
        raise HTTPException(
            status_code=403,
            detail=f"Account limit reached ({account_limit}). Upgrade your plan to add more accounts.",
        )

    # Encrypt the broker password
    encrypted_pw = encrypt_password(payload.password)

    from app.services.broker_server import normalize_broker_server

    data = {
        "user_id": current_user.user_id,
        "platform": payload.platform.value,
        "account_number": payload.account_number.strip(),
        "broker_server": normalize_broker_server(payload.broker_server),
        "encrypted_password": encrypted_pw,
        "account_label": payload.account_label,
    }
    if payload.api_base_url:
        data["api_base_url"] = payload.api_base_url.rstrip("/")

    metadata: dict = {}
    if payload.firm_slug:
        from app.data.dxtrade_firms import get_firm

        firm = get_firm(payload.firm_slug)
        if firm:
            metadata["firm_slug"] = firm.slug
            metadata["firm_name"] = firm.name
            if not data.get("api_base_url") and firm.api_base_url:
                data["api_base_url"] = firm.api_base_url.rstrip("/")
            if payload.platform.value == "dxtrade" and not payload.broker_server.strip():
                data["broker_server"] = firm.default_domain
        else:
            metadata["firm_slug"] = payload.firm_slug

    if payload.platform.value == "mt5":
        from app.data.mt5_brokers import get_broker
        from app.services.terminal_discovery import resolve_for_account

        broker_slug = payload.broker_slug
        broker = get_broker(broker_slug) if broker_slug else None
        if broker and broker.default_server and not payload.broker_server.strip():
            data["broker_server"] = broker.default_server

        terminal_path, matched_broker = resolve_for_account(
            broker_slug=broker_slug,
            broker_server=data["broker_server"],
            terminal_path=payload.terminal_path,
        )
        if terminal_path:
            data["terminal_path"] = terminal_path
        active_broker = broker or matched_broker
        if active_broker:
            metadata["broker_slug"] = active_broker.slug
            metadata["broker_name"] = active_broker.name
        elif broker_slug:
            metadata["broker_slug"] = broker_slug

    if payload.platform.value == "dxtrade":
        if not data.get("api_base_url"):
            raise HTTPException(
                status_code=400,
                detail="api_base_url is required for DXtrade (select a firm or enter custom URL).",
            )
        if not data.get("broker_server"):
            data["broker_server"] = "default"

    if metadata:
        data["account_metadata"] = metadata

    result = sb.table("trading_accounts").insert(data).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create account")

    logger.info(
        "account_created",
        user_id=current_user.user_id,
        account_id=result.data[0]["id"],
        platform=payload.platform.value,
    )

    return AccountResponse(**result.data[0])


@router.get("", response_model=AccountListResponse)
async def list_accounts(
    current_user: AuthUser = Depends(get_current_user),
    platform: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    """List all trading accounts for the current user."""
    sb = get_supabase_admin()

    query = (
        sb.table("trading_accounts")
        .select("*", count="exact")
        .eq("user_id", current_user.user_id)
        .order("created_at", desc=True)
    )

    if platform:
        query = query.eq("platform", platform)
    if status:
        query = query.eq("connection_status", status)

    result = query.execute()

    return AccountListResponse(
        accounts=[AccountResponse(**row) for row in result.data],
        total=result.count or len(result.data),
    )


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(
    account_id: str,
    current_user: AuthUser = Depends(get_current_user),
):
    """Get a single trading account by ID."""
    sb = get_supabase_admin()

    result = (
        sb.table("trading_accounts")
        .select("*")
        .eq("id", account_id)
        .eq("user_id", current_user.user_id)
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Account not found")

    return AccountResponse(**result.data)


@router.patch("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: str,
    payload: AccountUpdate,
    current_user: AuthUser = Depends(get_current_user),
):
    """Update a trading account (label, enabled status)."""
    sb = get_supabase_admin()

    update_data = payload.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        sb.table("trading_accounts")
        .update(update_data)
        .eq("id", account_id)
        .eq("user_id", current_user.user_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Account not found")

    logger.info(
        "account_updated",
        user_id=current_user.user_id,
        account_id=account_id,
        fields=list(update_data.keys()),
    )

    return AccountResponse(**result.data[0])


@router.delete("/{account_id}", status_code=204)
async def delete_account(
    account_id: str,
    current_user: AuthUser = Depends(get_current_user),
):
    """
    Delete a trading account.
    Stops worker sessions, clears execution-event account links, and cascades
    copier relations / risk profiles tied to this account.
    """
    from app.services.orchestrator import delete_trading_account

    try:
        delete_trading_account(account_id, current_user.user_id)
    except ValueError as exc:
        msg = str(exc)
        if msg == "Account not found":
            raise HTTPException(status_code=404, detail=msg) from exc
        logger.error(
            "account_delete_failed",
            user_id=current_user.user_id,
            account_id=account_id,
            error=msg,
        )
        raise HTTPException(status_code=500, detail=msg) from exc


@router.post("/{account_id}/test-connection")
async def test_connection(
    account_id: str,
    current_user: AuthUser = Depends(get_current_user),
):
    """
    Test connection to a broker account.
    In MVP, returns a placeholder — real implementation requires MT5 worker.
    """
    sb = get_supabase_admin()

    existing = (
        sb.table("trading_accounts")
        .select("id, platform, broker_server")
        .eq("id", account_id)
        .eq("user_id", current_user.user_id)
        .single()
        .execute()
    )

    if not existing.data:
        raise HTTPException(status_code=404, detail="Account not found")

    from app.services.orchestrator import test_account_connection

    return test_account_connection(account_id, current_user.user_id)


@router.post("/{account_id}/start-session")
async def start_session(
    account_id: str,
    current_user: AuthUser = Depends(get_current_user),
):
    """Start a worker session for this account."""
    from app.services.orchestrator import start_account_session

    return start_account_session(account_id, current_user.user_id)


@router.post("/{account_id}/stop-session")
async def stop_session(
    account_id: str,
    current_user: AuthUser = Depends(get_current_user),
):
    """Stop the worker session for this account."""
    from app.services.orchestrator import stop_account_session

    return stop_account_session(account_id, current_user.user_id)
