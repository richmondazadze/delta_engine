"""
Delta Engine — Execution Event Pydantic Models
Request/response schemas for the trade audit trail.
"""

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field
from enum import Enum


class ExecutionStatus(str, Enum):
    pending = "pending"
    success = "success"
    failed = "failed"
    rejected = "rejected"
    skipped_risk = "skipped_risk"
    skipped_slippage = "skipped_slippage"
    duplicate_ignored = "duplicate_ignored"
    partial = "partial"
    closed = "closed"
    modified = "modified"


# ---- Request Models ----

class ExecutionEventCreate(BaseModel):
    """Create an execution event (internal — from workers)."""
    copier_relation_id: Optional[str] = None
    master_account_id: Optional[str] = None
    follower_account_id: Optional[str] = None
    event_type: str
    master_ticket: Optional[str] = None
    follower_ticket: Optional[str] = None
    symbol_master: Optional[str] = None
    symbol_follower: Optional[str] = None
    side: Optional[str] = None
    requested_lot: Optional[float] = None
    executed_lot: Optional[float] = None
    requested_price: Optional[float] = None
    executed_price: Optional[float] = None
    slippage_points: Optional[float] = None
    latency_ms: Optional[int] = None
    switch_ms: Optional[int] = None
    order_ms: Optional[int] = None
    e2e_ms: Optional[int] = None
    status: ExecutionStatus
    broker_return_code: Optional[str] = None
    error_message: Optional[str] = None
    raw_payload: Optional[dict[str, Any]] = None


# ---- Response Models ----

class ExecutionEventResponse(BaseModel):
    """Execution event response."""
    id: str
    user_id: str
    copier_relation_id: Optional[str] = None
    master_account_id: Optional[str] = None
    follower_account_id: Optional[str] = None
    event_type: str
    master_ticket: Optional[str] = None
    follower_ticket: Optional[str] = None
    symbol_master: Optional[str] = None
    symbol_follower: Optional[str] = None
    side: Optional[str] = None
    requested_lot: Optional[float] = None
    executed_lot: Optional[float] = None
    requested_price: Optional[float] = None
    executed_price: Optional[float] = None
    slippage_points: Optional[float] = None
    latency_ms: Optional[int] = None
    switch_ms: Optional[int] = None
    order_ms: Optional[int] = None
    e2e_ms: Optional[int] = None
    status: ExecutionStatus
    broker_return_code: Optional[str] = None
    error_message: Optional[str] = None
    raw_payload: Optional[dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ExecutionEventListResponse(BaseModel):
    """List of execution events with pagination."""
    events: list[ExecutionEventResponse]
    total: int
    page: int = 1
    per_page: int = 50


# ---- Query Filters ----

class ExecutionEventFilters(BaseModel):
    """Filters for querying execution events."""
    account_id: Optional[str] = None
    copier_relation_id: Optional[str] = None
    symbol: Optional[str] = None
    status: Optional[ExecutionStatus] = None
    event_type: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=50, ge=1, le=200)
