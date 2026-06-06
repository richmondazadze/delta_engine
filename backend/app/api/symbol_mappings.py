"""
Symbol mappings — cross-broker symbol translation for copier pairs.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.deps import get_supabase_admin
from app.core.security import AuthUser, get_current_user

router = APIRouter(prefix="/api/symbol-mappings", tags=["Symbol mappings"])


class SymbolMappingCreate(BaseModel):
    master_account_id: Optional[str] = None
    follower_account_id: Optional[str] = None
    master_symbol: str = Field(..., min_length=1, max_length=50)
    follower_symbol: str = Field(..., min_length=1, max_length=50)


class SymbolMappingUpdate(BaseModel):
    master_symbol: Optional[str] = Field(None, min_length=1, max_length=50)
    follower_symbol: Optional[str] = Field(None, min_length=1, max_length=50)
    is_active: Optional[bool] = None


class SymbolMappingResponse(BaseModel):
    id: str
    user_id: str
    master_account_id: Optional[str] = None
    follower_account_id: Optional[str] = None
    master_symbol: str
    follower_symbol: str
    is_active: bool
    created_at: str


class SymbolMappingListResponse(BaseModel):
    mappings: list[SymbolMappingResponse]
    total: int


def _verify_accounts(sb, user_id: str, master_id: str | None, follower_id: str | None) -> None:
    for account_id in (master_id, follower_id):
        if not account_id:
            continue
        row = (
            sb.table("trading_accounts")
            .select("id")
            .eq("id", account_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        if not row.data:
            raise HTTPException(status_code=400, detail=f"Account not found: {account_id}")


@router.get("", response_model=SymbolMappingListResponse)
async def list_symbol_mappings(current_user: AuthUser = Depends(get_current_user)):
    sb = get_supabase_admin()
    result = (
        sb.table("symbol_mappings")
        .select("*")
        .eq("user_id", current_user.user_id)
        .order("created_at", desc=True)
        .execute()
    )
    rows = result.data or []
    return SymbolMappingListResponse(
        mappings=[SymbolMappingResponse(**row) for row in rows],
        total=len(rows),
    )


@router.post("", response_model=SymbolMappingResponse, status_code=201)
async def create_symbol_mapping(
    body: SymbolMappingCreate,
    current_user: AuthUser = Depends(get_current_user),
):
    sb = get_supabase_admin()
    _verify_accounts(
        sb, current_user.user_id, body.master_account_id, body.follower_account_id
    )
    payload = {
        "user_id": current_user.user_id,
        "master_account_id": body.master_account_id,
        "follower_account_id": body.follower_account_id,
        "master_symbol": body.master_symbol.strip().upper(),
        "follower_symbol": body.follower_symbol.strip().upper(),
        "is_active": True,
    }
    try:
        result = sb.table("symbol_mappings").insert(payload).execute()
    except Exception as exc:
        msg = str(exc)
        if "duplicate" in msg.lower() or "unique" in msg.lower():
            raise HTTPException(
                status_code=409,
                detail="This symbol mapping already exists for that account pair.",
            ) from exc
        raise HTTPException(status_code=500, detail=msg) from exc
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create mapping")
    return SymbolMappingResponse(**result.data[0])


@router.patch("/{mapping_id}", response_model=SymbolMappingResponse)
async def update_symbol_mapping(
    mapping_id: str,
    body: SymbolMappingUpdate,
    current_user: AuthUser = Depends(get_current_user),
):
    sb = get_supabase_admin()
    existing = (
        sb.table("symbol_mappings")
        .select("*")
        .eq("id", mapping_id)
        .eq("user_id", current_user.user_id)
        .maybe_single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Mapping not found")

    patch: dict = {}
    if body.master_symbol is not None:
        patch["master_symbol"] = body.master_symbol.strip().upper()
    if body.follower_symbol is not None:
        patch["follower_symbol"] = body.follower_symbol.strip().upper()
    if body.is_active is not None:
        patch["is_active"] = body.is_active
    if not patch:
        return SymbolMappingResponse(**existing.data)

    result = (
        sb.table("symbol_mappings")
        .update(patch)
        .eq("id", mapping_id)
        .eq("user_id", current_user.user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Update failed")
    return SymbolMappingResponse(**result.data[0])


@router.delete("/{mapping_id}", status_code=204)
async def delete_symbol_mapping(
    mapping_id: str,
    current_user: AuthUser = Depends(get_current_user),
):
    sb = get_supabase_admin()
    result = (
        sb.table("symbol_mappings")
        .delete()
        .eq("id", mapping_id)
        .eq("user_id", current_user.user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Mapping not found")
