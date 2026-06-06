"""
User profile and plan limits.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.deps import get_supabase_admin
from app.core.security import AuthUser, get_current_user
from app.services.orchestrator import get_worker_health

router = APIRouter(prefix="/api/users", tags=["Users"])


class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str | None = None
    subscription_plan: str = "free"
    is_active_subscriber: bool = False
    account_limit: int = 2
    follower_limit: int = 1
    worker_healthy: bool = False
    online_workers: int = 0


@router.get("/me", response_model=UserProfileResponse)
async def get_me(current_user: AuthUser = Depends(get_current_user)):
    sb = get_supabase_admin()
    result = (
        sb.table("tc_users")
        .select(
            "id, email, full_name, subscription_plan, is_active_subscriber, account_limit, follower_limit"
        )
        .eq("id", current_user.user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="User profile not found")

    from app.services.session_maintenance import expire_stale_sessions

    expire_stale_sessions()
    health = get_worker_health()
    row = result.data
    return UserProfileResponse(
        id=row["id"],
        email=row["email"],
        full_name=row.get("full_name"),
        subscription_plan=row.get("subscription_plan") or "free",
        is_active_subscriber=bool(row.get("is_active_subscriber")),
        account_limit=int(row.get("account_limit") or 2),
        follower_limit=int(row.get("follower_limit") or 1),
        worker_healthy=health["healthy"],
        online_workers=health["online_workers"],
    )
