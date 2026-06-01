"""
Load environment from repo root .env (shared with backend).
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

WORKER_ROOT = Path(__file__).resolve().parent.parent
REPO_ROOT = WORKER_ROOT.parent


def load_worker_env() -> None:
    root_env = REPO_ROOT / ".env"
    if root_env.exists():
        load_dotenv(root_env, override=False)
    worker_env = WORKER_ROOT / ".env"
    if worker_env.exists():
        load_dotenv(worker_env, override=True)
