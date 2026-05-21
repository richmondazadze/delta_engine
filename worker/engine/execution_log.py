"""
Local JSONL execution log for dev (before Supabase integration).
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

WORKER_ROOT = Path(__file__).resolve().parent.parent
LOG_DIR = WORKER_ROOT / "logs"
LOG_FILE = LOG_DIR / "execution_events.jsonl"


def append_event(event: Dict[str, Any]) -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    row = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **event,
    }
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(row, default=str) + "\n")
