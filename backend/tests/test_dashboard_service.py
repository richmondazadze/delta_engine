"""Dashboard summary aggregation tests."""

from unittest.mock import MagicMock, patch

from app.services.dashboard_service import (
    _activity_message,
    _pipeline_health,
    build_dashboard_summary,
)


def test_pipeline_health_states():
    copier = {"is_enabled": True}
    assert _pipeline_health(copier, None, True) == "idle"
    assert _pipeline_health(copier, {"status": "success"}, True) == "active"
    assert _pipeline_health(copier, {"status": "failed"}, True) == "error"
    assert _pipeline_health({"is_enabled": False}, None, True) == "paused"
    assert _pipeline_health(copier, None, False) == "worker_offline"


def test_activity_message_copy_success():
    msg = _activity_message(
        {
            "event_type": "position_opened",
            "status": "success",
            "symbol_master": "EURUSD",
            "side": "buy",
        }
    )
    assert "Copied EURUSD Buy" in msg


def test_build_dashboard_summary_empty():
    sb = MagicMock()
    sb.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []

    # Chain for multiple table calls
    def table_side(name):
        m = MagicMock()
        chain = m.select.return_value
        chain.eq.return_value = chain
        chain.gte.return_value = chain
        chain.order.return_value = chain
        chain.limit.return_value = chain
        chain.execute.return_value.data = []
        return m

    sb.table.side_effect = table_side

    with (
        patch(
            "app.services.dashboard_service.get_worker_health",
            return_value={"healthy": True, "online_workers": 1},
        ),
        patch(
            "app.services.dashboard_service.load_snapshots_for_user",
            return_value={},
        ),
    ):
        result = build_dashboard_summary(sb, "user-1")

    assert result["today"]["copies"] == 0
    assert result["worker_healthy"] is True
    assert result["onboarding"]["has_accounts"] is False
