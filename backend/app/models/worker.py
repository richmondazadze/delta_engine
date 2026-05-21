"""
Delta Engine — Worker Pydantic Models
Internal schemas for worker registration, heartbeat, and session management.
"""

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


# ---- Request Models ----

class WorkerRegister(BaseModel):
    """Register a new worker node."""
    worker_name: str = Field(..., max_length=100)
    region: Optional[str] = Field(None, max_length=100)
    host_identifier: Optional[str] = Field(None, max_length=255)
    capacity: int = Field(default=1, ge=1, le=50)
    metadata: Optional[dict[str, Any]] = None


class WorkerHeartbeat(BaseModel):
    """Worker heartbeat — sent periodically to confirm liveness."""
    worker_id: str
    active_sessions: int = 0
    metadata: Optional[dict[str, Any]] = None


class SessionStarted(BaseModel):
    """Notify that a worker session has started for an account."""
    worker_id: str
    trading_account_id: str
    terminal_path: Optional[str] = None
    process_id: Optional[int] = None


class SessionFailed(BaseModel):
    """Notify that a worker session has failed."""
    worker_id: str
    trading_account_id: str
    error: str


# ---- Response Models ----

class WorkerNodeResponse(BaseModel):
    """Worker node response (admin only)."""
    id: str
    worker_name: str
    region: Optional[str] = None
    host_identifier: Optional[str] = None
    status: str = "offline"
    capacity: int = 1
    active_sessions: int = 0
    last_heartbeat_at: Optional[datetime] = None
    metadata: Optional[dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WorkerSessionResponse(BaseModel):
    """Worker session response (admin only)."""
    id: str
    worker_node_id: Optional[str] = None
    trading_account_id: str
    session_status: str = "starting"
    terminal_path: Optional[str] = None
    process_id: Optional[int] = None
    last_heartbeat_at: Optional[datetime] = None
    last_error: Optional[str] = None
    started_at: datetime
    stopped_at: Optional[datetime] = None

    class Config:
        from_attributes = True
