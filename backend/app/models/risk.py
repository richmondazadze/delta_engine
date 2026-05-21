"""
Delta Engine — Risk Profile Pydantic Models
Request/response schemas for per-account risk rules.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ---- Request Models ----

class RiskProfileCreate(BaseModel):
    """Create a risk profile for a trading account."""
    account_id: str
    max_daily_loss: Optional[float] = Field(None, ge=0)
    max_total_loss: Optional[float] = Field(None, ge=0)
    min_equity: Optional[float] = Field(None, ge=0)
    max_lot_per_trade: Optional[float] = Field(None, ge=0.01, le=100.0)
    max_open_positions: int = Field(default=10, ge=1, le=500)
    max_trades_per_day: Optional[int] = Field(None, ge=1, le=1000)
    allowed_symbols: Optional[list[str]] = None
    blocked_symbols: Optional[list[str]] = None
    news_pause_enabled: bool = False
    lock_after_loss: bool = True
    auto_flatten_enabled: bool = True


class RiskProfileUpdate(BaseModel):
    """Update a risk profile."""
    max_daily_loss: Optional[float] = Field(None, ge=0)
    max_total_loss: Optional[float] = Field(None, ge=0)
    min_equity: Optional[float] = Field(None, ge=0)
    max_lot_per_trade: Optional[float] = Field(None, ge=0.01, le=100.0)
    max_open_positions: Optional[int] = Field(None, ge=1, le=500)
    max_trades_per_day: Optional[int] = Field(None, ge=1, le=1000)
    allowed_symbols: Optional[list[str]] = None
    blocked_symbols: Optional[list[str]] = None
    news_pause_enabled: Optional[bool] = None
    lock_after_loss: Optional[bool] = None
    auto_flatten_enabled: Optional[bool] = None


# ---- Response Models ----

class RiskProfileResponse(BaseModel):
    """Risk profile response."""
    id: str
    user_id: str
    account_id: str
    max_daily_loss: Optional[float] = None
    max_total_loss: Optional[float] = None
    min_equity: Optional[float] = None
    max_lot_per_trade: Optional[float] = None
    max_open_positions: int = 10
    max_trades_per_day: Optional[int] = None
    allowed_symbols: Optional[list[str]] = None
    blocked_symbols: Optional[list[str]] = None
    news_pause_enabled: bool = False
    lock_after_loss: bool = True
    auto_flatten_enabled: bool = True
    is_locked: bool = False
    locked_reason: Optional[str] = None
    locked_at: Optional[datetime] = None
    daily_loss_accumulated: float = 0.0
    daily_trades_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class RiskProfileListResponse(BaseModel):
    """List of risk profiles."""
    profiles: list[RiskProfileResponse]
    total: int
