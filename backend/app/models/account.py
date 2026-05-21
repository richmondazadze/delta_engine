"""
Delta Engine — Account Pydantic Models
Request/response schemas for trading account management.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from enum import Enum


class PlatformType(str, Enum):
    mt5 = "mt5"
    mt4 = "mt4"
    ctrader = "ctrader"
    dxtrade = "dxtrade"
    matchtrader = "matchtrader"
    tradelocker = "tradelocker"
    ninjatrader = "ninjatrader"
    tradingview = "tradingview"


class ConnectionStatus(str, Enum):
    connected = "connected"
    disconnected = "disconnected"
    auth_failed = "auth_failed"
    terminal_unavailable = "terminal_unavailable"
    broker_unavailable = "broker_unavailable"
    disabled = "disabled"
    locked = "locked"


class AccountMode(str, Enum):
    hedging = "hedging"
    netting = "netting"
    unknown = "unknown"


# ---- Request Models ----

class AccountCreate(BaseModel):
    """Create a new trading account."""
    platform: PlatformType = PlatformType.mt5
    account_number: str = Field(..., min_length=1, max_length=64)
    broker_server: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=1, description="Broker password — encrypted before storage")
    account_label: Optional[str] = Field(None, max_length=100)


class AccountUpdate(BaseModel):
    """Update an existing trading account."""
    account_label: Optional[str] = Field(None, max_length=100)
    is_enabled: Optional[bool] = None


# ---- Response Models ----

class AccountResponse(BaseModel):
    """Trading account response — never includes password."""
    id: str
    user_id: str
    platform: PlatformType
    account_number: str
    broker_server: str
    account_label: Optional[str] = None
    account_mode: AccountMode = AccountMode.unknown
    connection_status: ConnectionStatus = ConnectionStatus.disconnected
    balance: Optional[float] = None
    equity: Optional[float] = None
    currency: Optional[str] = None
    leverage: Optional[int] = None
    last_connected_at: Optional[datetime] = None
    last_error: Optional[str] = None
    is_enabled: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


class AccountListResponse(BaseModel):
    """List of trading accounts."""
    accounts: list[AccountResponse]
    total: int
