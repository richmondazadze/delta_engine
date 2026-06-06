"""
Delta Engine — Worker runtime config models (internal API).
"""

from typing import Optional

from pydantic import BaseModel, Field


class RuntimeAccount(BaseModel):
    id: str
    label: str
    role: str
    login: str
    password: str
    server: str
    terminal_path: Optional[str] = None
    api_base_url: Optional[str] = None
    platform: str = "mt5"
    enabled: bool = True


class RuntimeCopier(BaseModel):
    id: str
    master_id: str
    follower_id: str
    enabled: bool = True
    risk_mode: str = "multiplier"
    multiplier: float = 1.0
    fixed_lot_size: float = 0.01
    copy_sl: bool = True
    copy_tp: bool = True
    copy_closes: bool = True
    copy_modifications: bool = True
    max_signal_age_ms: int = 3000


class RuntimeSymbolMapping(BaseModel):
    master_symbol: str
    follower_symbol: str
    master_account_id: Optional[str] = None
    follower_account_id: Optional[str] = None


class RuntimeConfigResponse(BaseModel):
    user_id: str
    accounts: list[RuntimeAccount]
    copiers: list[RuntimeCopier]
    symbol_mappings: list[RuntimeSymbolMapping]
    risk_profiles: list["RuntimeRiskProfile"] = Field(default_factory=list)


class RuntimeRiskProfile(BaseModel):
    id: str
    account_id: str
    max_daily_loss: Optional[float] = None
    max_total_loss: Optional[float] = None
    min_equity: Optional[float] = None
    max_lot_per_trade: Optional[float] = None
    max_open_positions: Optional[int] = None
    max_trades_per_day: Optional[int] = None
    allowed_symbols: Optional[list[str]] = None
    blocked_symbols: Optional[list[str]] = None
    is_locked: bool = False
    locked_reason: Optional[str] = None
    daily_loss_accumulated: float = 0.0
    daily_trades_count: int = 0


RuntimeConfigResponse.model_rebuild()


class SeedAccountInput(BaseModel):
    yaml_id: str
    label: str
    role: str
    login: int
    password: str
    server: str
    terminal_path: Optional[str] = None
    enabled: bool = True


class SeedCopierInput(BaseModel):
    yaml_id: str
    master_yaml_id: str
    follower_yaml_id: str
    enabled: bool = True
    risk_mode: str = "multiplier"
    multiplier: float = 1.0
    fixed_lot_size: float = 0.01
    copy_sl: bool = True
    copy_tp: bool = True
    copy_closes: bool = True
    copy_modifications: bool = True
    max_signal_age_ms: int = 3000


class SeedSymbolMappingInput(BaseModel):
    master_symbol: str
    follower_symbol: str
    master_yaml_id: Optional[str] = None
    follower_yaml_id: Optional[str] = None


class SeedConfigRequest(BaseModel):
    email: str = Field(default="dev@deltaengine.local")
    password: str = Field(default="dev-password-change-me")
    full_name: str = Field(default="Dev Trader")
    accounts: list[SeedAccountInput]
    copiers: list[SeedCopierInput]
    symbol_mappings: list[SeedSymbolMappingInput] = Field(default_factory=list)


class SeedConfigResponse(BaseModel):
    user_id: str
    email: str
    account_ids: dict[str, str]
    copier_ids: dict[str, str]
