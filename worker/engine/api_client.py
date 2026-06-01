"""
HTTP client for Delta Engine FastAPI control plane (Phase 2).
"""

from __future__ import annotations

import os
import socket
import threading
import time
from typing import Any, Optional

import httpx
import structlog

from engine.env_loader import load_worker_env

logger = structlog.get_logger()


class ControlApiClient:
    def __init__(self) -> None:
        load_worker_env()
        self.base_url = os.environ.get("API_URL", "http://localhost:8000").rstrip("/")
        self.worker_key = os.environ.get("WORKER_API_KEY", "")
        self.user_id = os.environ.get("WORKER_USER_ID", "")
        self.worker_name = os.environ.get("WORKER_NAME", "worker-local-01")
        self.worker_region = os.environ.get("WORKER_REGION", "local")
        self.worker_capacity = int(os.environ.get("WORKER_CAPACITY", "5"))
        self.worker_id: Optional[str] = None
        self._heartbeat_thread: Optional[threading.Thread] = None
        self._heartbeat_stop = threading.Event()

    @property
    def enabled(self) -> bool:
        return bool(self.worker_key and self.user_id)

    def _headers(self, *, include_user: bool = True) -> dict[str, str]:
        headers = {"X-Worker-Key": self.worker_key}
        if include_user and self.user_id:
            headers["X-User-Id"] = self.user_id
        return headers

    def _request(
        self,
        method: str,
        path: str,
        *,
        json: Optional[dict[str, Any]] = None,
        include_user: bool = True,
    ) -> httpx.Response:
        url = f"{self.base_url}{path}"
        with httpx.Client(timeout=30.0) as client:
            response = client.request(
                method,
                url,
                headers=self._headers(include_user=include_user),
                json=json,
            )
        response.raise_for_status()
        return response

    def fetch_runtime_config(self) -> dict[str, Any]:
        response = self._request("GET", "/internal/runtime-config")
        return response.json()

    def post_execution_event(self, payload: dict[str, Any]) -> None:
        self._request("POST", "/internal/execution-events", json=payload)

    def register_worker(self) -> str:
        payload = {
            "worker_name": self.worker_name,
            "region": self.worker_region,
            "host_identifier": socket.gethostname(),
            "capacity": self.worker_capacity,
            "metadata": {"phase": "2", "config_source": "api"},
        }
        response = self._request(
            "POST",
            "/internal/workers/register",
            json=payload,
            include_user=False,
        )
        data = response.json()
        self.worker_id = data["id"]
        logger.info("worker_registered", worker_id=self.worker_id, name=self.worker_name)
        return self.worker_id

    def send_heartbeat(self) -> None:
        if not self.worker_id:
            return
        self._request(
            "POST",
            "/internal/workers/heartbeat",
            json={
                "worker_id": self.worker_id,
                "active_sessions": 1,
                "metadata": {"status": "running"},
            },
            include_user=False,
        )

    def start_heartbeat_loop(self) -> None:
        if not self.worker_id or self._heartbeat_thread:
            return

        interval = int(os.environ.get("WORKER_HEARTBEAT_INTERVAL_SECONDS", "30"))

        def _loop() -> None:
            while not self._heartbeat_stop.wait(interval):
                try:
                    self.send_heartbeat()
                except Exception as exc:
                    logger.warning("worker_heartbeat_failed", error=str(exc))

        self._heartbeat_thread = threading.Thread(
            target=_loop, name="worker-heartbeat", daemon=True
        )
        self._heartbeat_thread.start()

    def stop_heartbeat_loop(self) -> None:
        self._heartbeat_stop.set()


_client: Optional[ControlApiClient] = None


def get_api_client() -> ControlApiClient:
    global _client
    if _client is None:
        _client = ControlApiClient()
    return _client
