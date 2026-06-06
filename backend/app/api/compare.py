"""
Compare broker / prop-firm dataset (Phase 7).
"""

from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional

from app.core.deps import get_supabase_admin

router = APIRouter(prefix="/api/compare", tags=["Compare"])


class CompareProfile(BaseModel):
    id: str
    slug: str
    name: str
    platform: str
    category: str
    region: Optional[str] = None
    min_deposit: Optional[float] = None
    max_leverage: Optional[int] = None
    spread_from: Optional[float] = None
    copy_trading_supported: bool = True
    platforms_supported: list[str] = []
    rating: Optional[float] = None
    highlights: list[str] = []
    is_featured: bool = False


class CompareListResponse(BaseModel):
    profiles: list[CompareProfile]
    total: int


@router.get("", response_model=CompareListResponse)
async def list_compare_profiles(
    category: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
    featured_only: bool = Query(False),
):
    sb = get_supabase_admin()
    query = (
        sb.table("compare_broker_profiles")
        .select("*", count="exact")
        .eq("is_active", True)
        .order("is_featured", desc=True)
        .order("rating", desc=True)
    )
    if category:
        query = query.eq("category", category)
    if platform:
        query = query.eq("platform", platform)
    if featured_only:
        query = query.eq("is_featured", True)

    result = query.execute()
    profiles = [
        CompareProfile(
            id=row["id"],
            slug=row["slug"],
            name=row["name"],
            platform=row["platform"],
            category=row["category"],
            region=row.get("region"),
            min_deposit=float(row["min_deposit"]) if row.get("min_deposit") is not None else None,
            max_leverage=row.get("max_leverage"),
            spread_from=float(row["spread_from"]) if row.get("spread_from") is not None else None,
            copy_trading_supported=row.get("copy_trading_supported", True),
            platforms_supported=row.get("platforms_supported") or [],
            rating=float(row["rating"]) if row.get("rating") is not None else None,
            highlights=row.get("highlights") or [],
            is_featured=row.get("is_featured", False),
        )
        for row in result.data or []
    ]
    return CompareListResponse(profiles=profiles, total=result.count or len(profiles))
