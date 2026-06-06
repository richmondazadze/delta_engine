"""
Delta Engine — Copier API Routes
POST /api/copiers, GET /api/copiers, GET /api/copiers/:id,
PATCH /api/copiers/:id, DELETE /api/copiers/:id,
POST /api/copiers/:id/enable, POST /api/copiers/:id/disable
"""

from fastapi import APIRouter, Depends, HTTPException
from app.core.security import AuthUser, get_current_user
from app.core.deps import get_supabase_admin
from app.models.copier import (
    CopierCreate,
    CopierUpdate,
    CopierResponse,
    CopierListResponse,
)
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/api/copiers", tags=["Copiers"])


def _queue_worker_reload(sb, user_id: str, master_account_id: str) -> None:
    """Tell the copy worker to refresh copier enable/disable state immediately."""
    sb.table("worker_commands").insert(
        {
            "user_id": user_id,
            "trading_account_id": master_account_id,
            "command_type": "reload_config",
            "status": "pending",
            "payload": {},
        }
    ).execute()


@router.post("", response_model=CopierResponse, status_code=201)
async def create_copier(
    payload: CopierCreate,
    current_user: AuthUser = Depends(get_current_user),
):
    """Create a master-to-follower copier relation."""
    sb = get_supabase_admin()

    # Verify both accounts belong to the user
    for account_id, role in [
        (payload.master_account_id, "master"),
        (payload.follower_account_id, "follower"),
    ]:
        check = (
            sb.table("trading_accounts")
            .select("id")
            .eq("id", account_id)
            .eq("user_id", current_user.user_id)
            .execute()
        )
        if not check.data:
            raise HTTPException(
                status_code=404,
                detail=f"{role.capitalize()} account not found or not owned by you",
            )

    master_row = (
        sb.table("trading_accounts")
        .select("platform, api_base_url, terminal_path, is_enabled")
        .eq("id", payload.master_account_id)
        .single()
        .execute()
    ).data
    follower_row = (
        sb.table("trading_accounts")
        .select("platform, api_base_url, terminal_path, is_enabled")
        .eq("id", payload.follower_account_id)
        .single()
        .execute()
    ).data

    from app.services.platform_capabilities import validate_copier_pair

    errors, warnings = validate_copier_pair(master_row, follower_row)
    if errors:
        raise HTTPException(status_code=400, detail=" ".join(errors))
    for msg in warnings:
        logger.info("copier_pair_warning", message=msg, user_id=current_user.user_id)

    # Check follower limit
    user_profile = (
        sb.table("tc_users")
        .select("follower_limit")
        .eq("id", current_user.user_id)
        .single()
        .execute()
    )
    follower_limit = user_profile.data.get("follower_limit", 1)

    existing_copiers = (
        sb.table("copier_relations")
        .select("id", count="exact")
        .eq("user_id", current_user.user_id)
        .execute()
    )
    if existing_copiers.count >= follower_limit:
        raise HTTPException(
            status_code=403,
            detail=f"Copier relation limit reached ({follower_limit}). Upgrade your plan.",
        )

    data = {
        "user_id": current_user.user_id,
        "master_account_id": payload.master_account_id,
        "follower_account_id": payload.follower_account_id,
        "label": payload.label,
        "risk_mode": payload.risk_mode.value,
        "multiplier": payload.multiplier,
        "fixed_lot_size": payload.fixed_lot_size,
        "copy_sl": payload.copy_sl,
        "copy_tp": payload.copy_tp,
        "copy_closes": payload.copy_closes,
        "copy_modifications": payload.copy_modifications,
        "max_signal_age_ms": payload.max_signal_age_ms,
    }

    result = sb.table("copier_relations").insert(data).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create copier relation")

    logger.info(
        "copier_created",
        user_id=current_user.user_id,
        copier_id=result.data[0]["id"],
        master=payload.master_account_id,
        follower=payload.follower_account_id,
    )

    return CopierResponse(**result.data[0])


@router.get("", response_model=CopierListResponse)
async def list_copiers(
    current_user: AuthUser = Depends(get_current_user),
):
    """List all copier relations for the current user."""
    sb = get_supabase_admin()

    result = (
        sb.table("copier_relations")
        .select("*", count="exact")
        .eq("user_id", current_user.user_id)
        .order("created_at", desc=True)
        .execute()
    )

    return CopierListResponse(
        copiers=[CopierResponse(**row) for row in result.data],
        total=result.count or len(result.data),
    )


@router.get("/{copier_id}", response_model=CopierResponse)
async def get_copier(
    copier_id: str,
    current_user: AuthUser = Depends(get_current_user),
):
    """Get a single copier relation."""
    sb = get_supabase_admin()

    result = (
        sb.table("copier_relations")
        .select("*")
        .eq("id", copier_id)
        .eq("user_id", current_user.user_id)
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Copier relation not found")

    return CopierResponse(**result.data)


@router.patch("/{copier_id}", response_model=CopierResponse)
async def update_copier(
    copier_id: str,
    payload: CopierUpdate,
    current_user: AuthUser = Depends(get_current_user),
):
    """Update a copier relation configuration."""
    sb = get_supabase_admin()

    update_data = payload.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Convert enum to string value if present
    if "risk_mode" in update_data:
        update_data["risk_mode"] = update_data["risk_mode"].value

    result = (
        sb.table("copier_relations")
        .update(update_data)
        .eq("id", copier_id)
        .eq("user_id", current_user.user_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Copier relation not found")

    logger.info(
        "copier_updated",
        user_id=current_user.user_id,
        copier_id=copier_id,
        fields=list(update_data.keys()),
    )

    return CopierResponse(**result.data[0])


@router.delete("/{copier_id}", status_code=204)
async def delete_copier(
    copier_id: str,
    current_user: AuthUser = Depends(get_current_user),
):
    """Delete a copier relation."""
    sb = get_supabase_admin()

    existing = (
        sb.table("copier_relations")
        .select("id")
        .eq("id", copier_id)
        .eq("user_id", current_user.user_id)
        .execute()
    )

    if not existing.data:
        raise HTTPException(status_code=404, detail="Copier relation not found")

    sb.table("copier_relations").delete().eq("id", copier_id).execute()

    logger.info(
        "copier_deleted",
        user_id=current_user.user_id,
        copier_id=copier_id,
    )


@router.post("/{copier_id}/enable", response_model=CopierResponse)
async def enable_copier(
    copier_id: str,
    current_user: AuthUser = Depends(get_current_user),
):
    """Enable a copier relation."""
    sb = get_supabase_admin()

    result = (
        sb.table("copier_relations")
        .update({"is_enabled": True})
        .eq("id", copier_id)
        .eq("user_id", current_user.user_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Copier relation not found")

    row = result.data[0]
    _queue_worker_reload(sb, current_user.user_id, row["master_account_id"])
    logger.info("copier_enabled", copier_id=copier_id)
    return CopierResponse(**row)


@router.post("/{copier_id}/disable", response_model=CopierResponse)
async def disable_copier(
    copier_id: str,
    current_user: AuthUser = Depends(get_current_user),
):
    """Disable a copier relation."""
    sb = get_supabase_admin()

    result = (
        sb.table("copier_relations")
        .update({"is_enabled": False})
        .eq("id", copier_id)
        .eq("user_id", current_user.user_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Copier relation not found")

    row = result.data[0]
    _queue_worker_reload(sb, current_user.user_id, row["master_account_id"])
    logger.info("copier_disabled", copier_id=copier_id)
    return CopierResponse(**row)
