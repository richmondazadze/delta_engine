"""
Delta Engine — Copier Relation Pydantic Models
Request/response schemas for master-to-follower copy configuration.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, model_validator
from enum import Enum


class RiskMode(str, Enum):
    multiplier = "multiplier"
    fixed_lot = "fixed_lot"
    equity_ratio = "equity_ratio"
    risk_percent = "risk_percent"


# ---- Request Models ----

class CopierCreate(BaseModel):
    """Create a new master-to-follower copier relation."""
    master_account_id: str
    follower_account_id: str
    label: Optional[str] = Field(None, max_length=100)
    risk_mode: RiskMode = RiskMode.multiplier
    multiplier: float = Field(default=1.0, ge=0.01, le=100.0)
    fixed_lot_size: float = Field(default=0.01, ge=0.01, le=100.0)
    copy_sl: bool = True
    copy_tp: bool = True
    copy_closes: bool = True
    copy_modifications: bool = True
    max_signal_age_ms: int = Field(default=3000, ge=100, le=30000)

    @model_validator(mode="after")
    def validate_not_self_copy(self):
        if self.master_account_id == self.follower_account_id:
            raise ValueError("A master account cannot copy to itself")
        return self


class CopierUpdate(BaseModel):
    """Update an existing copier relation."""
    label: Optional[str] = Field(None, max_length=100)
    risk_mode: Optional[RiskMode] = None
    multiplier: Optional[float] = Field(None, ge=0.01, le=100.0)
    fixed_lot_size: Optional[float] = Field(None, ge=0.01, le=100.0)
    copy_sl: Optional[bool] = None
    copy_tp: Optional[bool] = None
    copy_closes: Optional[bool] = None
    copy_modifications: Optional[bool] = None
    max_signal_age_ms: Optional[int] = Field(None, ge=100, le=30000)


# ---- Response Models ----

class CopierResponse(BaseModel):
    """Copier relation response."""
    id: str
    user_id: str
    master_account_id: str
    follower_account_id: str
    label: Optional[str] = None
    risk_mode: RiskMode
    multiplier: float
    fixed_lot_size: float
    copy_sl: bool
    copy_tp: bool
    copy_closes: bool
    copy_modifications: bool
    max_signal_age_ms: int
    is_enabled: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CopierListResponse(BaseModel):
    """List of copier relations."""
    copiers: list[CopierResponse]
    total: int
