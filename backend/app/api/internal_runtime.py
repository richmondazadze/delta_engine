"""
Delta Engine — Internal runtime API for workers.
GET /internal/runtime-config — decrypted copier config for a user
POST /internal/dev/seed-config — dev-only: seed Supabase from YAML-shaped payload
"""

from __future__ import annotations

import os
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException
import structlog

from app.api.internal_workers import verify_worker_key
from app.core.config import get_settings
from app.core.deps import get_supabase_admin
from app.core.encryption import decrypt_password, encrypt_password
from app.models.runtime import (
    RuntimeAccount,
    RuntimeConfigResponse,
    RuntimeCopier,
    RuntimeSymbolMapping,
    SeedConfigRequest,
    SeedConfigResponse,
)

logger = structlog.get_logger()
router = APIRouter(prefix="/internal", tags=["Internal — Runtime"])


def _derive_account_roles(copiers: list[dict[str, Any]]) -> dict[str, str]:
    roles: dict[str, str] = {}
    for row in copiers:
        master_id = row["master_account_id"]
        follower_id = row["follower_account_id"]
        if master_id not in roles:
            roles[master_id] = "master"
        if follower_id not in roles:
            roles[follower_id] = "follower"
    return roles


@router.get("/runtime-config", response_model=RuntimeConfigResponse)
async def get_runtime_config(
    user_id: str = Header(..., alias="X-User-Id"),
    _: None = Depends(verify_worker_key),
):
    """Return enabled accounts, copiers, and symbol mappings for worker execution."""
    sb = get_supabase_admin()

    copier_rows = (
        sb.table("copier_relations")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_enabled", True)
        .execute()
    ).data or []

    if not copier_rows:
        raise HTTPException(
            status_code=404,
            detail="No enabled copier relations for this user",
        )

    account_ids: set[str] = set()
    for row in copier_rows:
        account_ids.add(row["master_account_id"])
        account_ids.add(row["follower_account_id"])

    account_rows = (
        sb.table("trading_accounts")
        .select("*")
        .eq("user_id", user_id)
        .in_("id", list(account_ids))
        .eq("is_enabled", True)
        .execute()
    ).data or []

    if not account_rows:
        raise HTTPException(status_code=404, detail="No enabled trading accounts found")

    roles = _derive_account_roles(copier_rows)

    accounts: list[RuntimeAccount] = []
    for row in account_rows:
        accounts.append(
            RuntimeAccount(
                id=row["id"],
                label=row.get("account_label") or row["account_number"],
                role=roles.get(row["id"], "follower"),
                login=int(row["account_number"]),
                password=decrypt_password(row["encrypted_password"]),
                server=row["broker_server"],
                terminal_path=row.get("terminal_path"),
                enabled=row.get("is_enabled", True),
            )
        )

    copiers = [
        RuntimeCopier(
            id=row["id"],
            master_id=row["master_account_id"],
            follower_id=row["follower_account_id"],
            enabled=row.get("is_enabled", True),
            risk_mode=row.get("risk_mode", "multiplier"),
            multiplier=float(row.get("multiplier", 1.0)),
            fixed_lot_size=float(row.get("fixed_lot_size", 0.01)),
            copy_sl=row.get("copy_sl", True),
            copy_tp=row.get("copy_tp", True),
            copy_closes=row.get("copy_closes", True),
            copy_modifications=row.get("copy_modifications", True),
            max_signal_age_ms=int(row.get("max_signal_age_ms", 3000)),
        )
        for row in copier_rows
    ]

    mapping_rows = (
        sb.table("symbol_mappings")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_active", True)
        .execute()
    ).data or []

    symbol_mappings = [
        RuntimeSymbolMapping(
            master_symbol=row["master_symbol"],
            follower_symbol=row["follower_symbol"],
            master_account_id=row.get("master_account_id"),
            follower_account_id=row.get("follower_account_id"),
        )
        for row in mapping_rows
    ]

    return RuntimeConfigResponse(
        user_id=user_id,
        accounts=accounts,
        copiers=copiers,
        symbol_mappings=symbol_mappings,
    )


@router.post("/dev/seed-config", response_model=SeedConfigResponse)
async def seed_dev_config(
    payload: SeedConfigRequest,
    _: None = Depends(verify_worker_key),
):
    """
    Dev-only: create auth user + trading accounts + copiers from YAML-shaped data.
    Idempotent on (user, platform, account_number, broker_server) and copier pairs.
    """
    settings = get_settings()
    if settings.is_production:
        raise HTTPException(status_code=403, detail="Seed endpoint disabled in production")

    sb = get_supabase_admin()
    user_id = _ensure_dev_user(sb, payload.email, payload.password, payload.full_name)

    account_ids: dict[str, str] = {}
    for acc in payload.accounts:
        if not acc.enabled:
            continue

        existing = (
            sb.table("trading_accounts")
            .select("id")
            .eq("user_id", user_id)
            .eq("platform", "mt5")
            .eq("account_number", str(acc.login))
            .eq("broker_server", acc.server)
            .execute()
        )
        if existing.data:
            account_ids[acc.yaml_id] = existing.data[0]["id"]
            sb.table("trading_accounts").update(
                {
                    "account_label": acc.label,
                    "encrypted_password": encrypt_password(acc.password),
                    "terminal_path": acc.terminal_path,
                    "is_enabled": acc.enabled,
                }
            ).eq("id", existing.data[0]["id"]).execute()
            continue

        inserted = (
            sb.table("trading_accounts")
            .insert(
                {
                    "user_id": user_id,
                    "platform": "mt5",
                    "account_number": str(acc.login),
                    "broker_server": acc.server,
                    "encrypted_password": encrypt_password(acc.password),
                    "account_label": acc.label,
                    "terminal_path": acc.terminal_path,
                    "is_enabled": acc.enabled,
                }
            )
            .execute()
        )
        if not inserted.data:
            raise HTTPException(status_code=500, detail=f"Failed to seed account {acc.yaml_id}")
        account_ids[acc.yaml_id] = inserted.data[0]["id"]

    copier_ids: dict[str, str] = {}
    for copier in payload.copiers:
        if not copier.enabled:
            continue

        master_id = account_ids.get(copier.master_yaml_id)
        follower_id = account_ids.get(copier.follower_yaml_id)
        if not master_id or not follower_id:
            raise HTTPException(
                status_code=400,
                detail=f"Copier {copier.yaml_id} references unknown account ids",
            )

        existing = (
            sb.table("copier_relations")
            .select("id")
            .eq("master_account_id", master_id)
            .eq("follower_account_id", follower_id)
            .execute()
        )
        copier_data = {
            "user_id": user_id,
            "master_account_id": master_id,
            "follower_account_id": follower_id,
            "label": copier.yaml_id,
            "risk_mode": copier.risk_mode,
            "multiplier": copier.multiplier,
            "fixed_lot_size": copier.fixed_lot_size,
            "copy_sl": copier.copy_sl,
            "copy_tp": copier.copy_tp,
            "copy_closes": copier.copy_closes,
            "copy_modifications": copier.copy_modifications,
            "max_signal_age_ms": copier.max_signal_age_ms,
            "is_enabled": copier.enabled,
        }
        if existing.data:
            copier_ids[copier.yaml_id] = existing.data[0]["id"]
            sb.table("copier_relations").update(copier_data).eq(
                "id", existing.data[0]["id"]
            ).execute()
        else:
            inserted = sb.table("copier_relations").insert(copier_data).execute()
            if not inserted.data:
                raise HTTPException(status_code=500, detail=f"Failed to seed copier {copier.yaml_id}")
            copier_ids[copier.yaml_id] = inserted.data[0]["id"]

    for mapping in payload.symbol_mappings:
        master_id = (
            account_ids.get(mapping.master_yaml_id) if mapping.master_yaml_id else None
        )
        follower_id = (
            account_ids.get(mapping.follower_yaml_id)
            if mapping.follower_yaml_id
            else None
        )

        existing = (
            sb.table("symbol_mappings")
            .select("id")
            .eq("user_id", user_id)
            .eq("master_symbol", mapping.master_symbol)
        )
        if master_id:
            existing = existing.eq("master_account_id", master_id)
        if follower_id:
            existing = existing.eq("follower_account_id", follower_id)
        existing = existing.execute()

        mapping_data = {
            "user_id": user_id,
            "master_account_id": master_id,
            "follower_account_id": follower_id,
            "master_symbol": mapping.master_symbol,
            "follower_symbol": mapping.follower_symbol,
            "is_active": True,
        }
        if existing.data:
            sb.table("symbol_mappings").update(mapping_data).eq(
                "id", existing.data[0]["id"]
            ).execute()
        else:
            sb.table("symbol_mappings").insert(mapping_data).execute()

    logger.info("dev_config_seeded", user_id=user_id, email=payload.email)
    return SeedConfigResponse(
        user_id=user_id,
        email=payload.email,
        account_ids=account_ids,
        copier_ids=copier_ids,
    )


def _ensure_dev_user(sb, email: str, password: str, full_name: str) -> str:
    existing = sb.table("tc_users").select("id").eq("email", email).execute()
    if existing.data:
        return existing.data[0]["id"]

    created = sb.auth.admin.create_user(
        {
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"full_name": full_name},
        }
    )
    user_id = created.user.id

    sb.table("tc_users").update(
        {
            "full_name": full_name,
            "account_limit": 10,
            "follower_limit": 10,
        }
    ).eq("id", user_id).execute()

    return user_id
