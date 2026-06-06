"""
Delta Engine — Security & JWT Validation
Validates Supabase JWTs on protected FastAPI routes.

Supports both legacy HS256 (JWT secret) and asymmetric signing keys (ES256/RS256)
via Supabase JWKS — required after migrating to JWT signing keys in the dashboard.
"""

from datetime import datetime, timezone
import time
from typing import Any, Tuple

import httpx
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, jwk, JWTError

from app.core.config import get_settings
from app.core.deps import get_supabase_admin

security_scheme = HTTPBearer()

_jwks_cache: dict[str, Any] = {"payload": None, "fetched_at": 0.0}
JWKS_TTL_SECONDS = 600


class AuthUser:
    """Authenticated user context extracted from JWT."""

    def __init__(self, user_id: str, email: str, role: str = "authenticated"):
        self.user_id = user_id
        self.email = email
        self.role = role

    def __repr__(self):
        return f"AuthUser(id={self.user_id}, email={self.email})"


def _issuer() -> str:
    return f"{get_settings().supabase_url.rstrip('/')}/auth/v1"


def _fetch_jwks() -> dict[str, Any]:
    global _jwks_cache
    now = time.time()
    if _jwks_cache["payload"] and now - _jwks_cache["fetched_at"] < JWKS_TTL_SECONDS:
        return _jwks_cache["payload"]

    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
    response = httpx.get(url, timeout=10.0)
    response.raise_for_status()
    payload = response.json()
    _jwks_cache = {"payload": payload, "fetched_at": now}
    return payload


def _resolve_signing_key(token: str) -> Tuple[Any, str]:
    header = jwt.get_unverified_header(token)
    alg = header.get("alg") or "HS256"

    if alg == "HS256":
        return get_settings().supabase_jwt_secret, alg

    kid = header.get("kid")
    jwks = _fetch_jwks()
    for key_data in jwks.get("keys", []):
        if kid is None or key_data.get("kid") == kid:
            return jwk.construct(key_data), key_data.get("alg", alg)

    raise JWTError(f"No matching JWK for alg={alg} kid={kid}")


def verify_jwt(token: str) -> dict:
    """
    Verify and decode a Supabase JWT.
    Returns the decoded payload or raises HTTPException.
    """
    settings = get_settings()
    issuer = _issuer()

    try:
        key, alg = _resolve_signing_key(token)
        payload = jwt.decode(
            token,
            key,
            algorithms=[alg],
            audience="authenticated",
            issuer=issuer,
        )
    except JWTError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid authentication token: {str(e)}",
        )

    exp = payload.get("exp")
    if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(
        tz=timezone.utc
    ):
        raise HTTPException(status_code=401, detail="Token has expired")

    return payload


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security_scheme),
) -> AuthUser:
    """
    FastAPI dependency: extracts and validates the current user from JWT.
    Use as: current_user: AuthUser = Depends(get_current_user)
    """
    payload = verify_jwt(credentials.credentials)

    user_id = payload.get("sub")
    email = payload.get("email", "")
    role = payload.get("role", "authenticated")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: no user ID")

    return AuthUser(user_id=user_id, email=email, role=role)


async def require_admin(
    current_user: AuthUser = Depends(get_current_user),
) -> AuthUser:
    """Ensure the current user has admin privileges (tc_users.subscription_plan = admin)."""
    sb = get_supabase_admin()
    row = (
        sb.table("tc_users")
        .select("subscription_plan")
        .eq("id", current_user.user_id)
        .single()
        .execute()
    ).data
    if not row or row.get("subscription_plan") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
