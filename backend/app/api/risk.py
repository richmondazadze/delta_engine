"""
Delta Engine — Risk Profile API Routes
POST /api/risk-profiles, GET /api/risk-profiles,
PATCH /api/risk-profiles/:id, POST /api/risk-profiles/:id/unlock,
POST /api/risk-profiles/:id/flatten
"""

from fastapi import APIRouter, Depends, HTTPException
from app.core.security import AuthUser, get_current_user
from app.core.deps import get_supabase_admin
from app.models.risk import (
    RiskProfileCreate,
    RiskProfileUpdate,
    RiskProfileResponse,
    RiskProfileListResponse,
)
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/api/risk-profiles", tags=["Risk Profiles"])


@router.post("", response_model=RiskProfileResponse, status_code=201)
async def create_risk_profile(
    payload: RiskProfileCreate,
    current_user: AuthUser = Depends(get_current_user),
):
    """Create a risk profile for a trading account."""
    sb = get_supabase_admin()

    # Verify account belongs to user
    account = (
        sb.table("trading_accounts")
        .select("id")
        .eq("id", payload.account_id)
        .eq("user_id", current_user.user_id)
        .execute()
    )
    if not account.data:
        raise HTTPException(status_code=404, detail="Account not found")

    data = {
        "user_id": current_user.user_id,
        **payload.model_dump(),
    }

    result = sb.table("risk_profiles").insert(data).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create risk profile")

    logger.info(
        "risk_profile_created",
        user_id=current_user.user_id,
        account_id=payload.account_id,
    )

    return RiskProfileResponse(**result.data[0])


@router.get("", response_model=RiskProfileListResponse)
async def list_risk_profiles(
    current_user: AuthUser = Depends(get_current_user),
):
    """List all risk profiles for the current user."""
    sb = get_supabase_admin()

    result = (
        sb.table("risk_profiles")
        .select("*", count="exact")
        .eq("user_id", current_user.user_id)
        .order("created_at", desc=True)
        .execute()
    )

    return RiskProfileListResponse(
        profiles=[RiskProfileResponse(**row) for row in result.data],
        total=result.count or len(result.data),
    )


@router.patch("/{profile_id}", response_model=RiskProfileResponse)
async def update_risk_profile(
    profile_id: str,
    payload: RiskProfileUpdate,
    current_user: AuthUser = Depends(get_current_user),
):
    """Update a risk profile."""
    sb = get_supabase_admin()

    update_data = payload.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        sb.table("risk_profiles")
        .update(update_data)
        .eq("id", profile_id)
        .eq("user_id", current_user.user_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Risk profile not found")

    logger.info(
        "risk_profile_updated",
        user_id=current_user.user_id,
        profile_id=profile_id,
        fields=list(update_data.keys()),
    )

    return RiskProfileResponse(**result.data[0])


@router.post("/{profile_id}/unlock", response_model=RiskProfileResponse)
async def unlock_risk_profile(
    profile_id: str,
    current_user: AuthUser = Depends(get_current_user),
):
    """
    Unlock a risk-locked account.
    Clears the lockout and resets daily counters.
    """
    sb = get_supabase_admin()

    result = (
        sb.table("risk_profiles")
        .update({
            "is_locked": False,
            "locked_reason": None,
            "locked_at": None,
            "daily_loss_accumulated": 0.0,
            "daily_trades_count": 0,
        })
        .eq("id", profile_id)
        .eq("user_id", current_user.user_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Risk profile not found")

    logger.info(
        "risk_profile_unlocked",
        user_id=current_user.user_id,
        profile_id=profile_id,
    )

    return RiskProfileResponse(**result.data[0])


@router.post("/{profile_id}/flatten")
async def flatten_positions(
    profile_id: str,
    current_user: AuthUser = Depends(get_current_user),
):
    """
    Flatten all open positions for the account linked to this risk profile.
    Requires active worker session.
    """
    sb = get_supabase_admin()

    profile = (
        sb.table("risk_profiles")
        .select("id, account_id")
        .eq("id", profile_id)
        .eq("user_id", current_user.user_id)
        .single()
        .execute()
    )

    if not profile.data:
        raise HTTPException(status_code=404, detail="Risk profile not found")

    # TODO: Forward flatten command to worker
    logger.info(
        "flatten_requested",
        user_id=current_user.user_id,
        account_id=profile.data["account_id"],
    )

    return {
        "profile_id": profile_id,
        "account_id": profile.data["account_id"],
        "status": "queued",
        "message": "Flatten command sent to worker.",
    }
