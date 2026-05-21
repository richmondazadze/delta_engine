"""
Delta Engine — Security & JWT Validation
Validates Supabase JWTs on protected FastAPI routes.
"""

from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import get_settings

# Bearer token extractor
security_scheme = HTTPBearer()


class AuthUser:
    """Authenticated user context extracted from JWT."""

    def __init__(self, user_id: str, email: str, role: str = "authenticated"):
        self.user_id = user_id
        self.email = email
        self.role = role

    def __repr__(self):
        return f"AuthUser(id={self.user_id}, email={self.email})"


def verify_jwt(token: str) -> dict:
    """
    Verify and decode a Supabase JWT.
    Returns the decoded payload or raises HTTPException.
    """
    settings = get_settings()

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid authentication token: {str(e)}",
        )

    # Check expiration
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
    """
    FastAPI dependency: ensures the current user has admin privileges.
    """
    # In production, check against database role or Supabase custom claims
    if current_user.role != "service_role":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
