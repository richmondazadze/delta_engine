"""Tests for platform capability validation."""

from app.services.platform_capabilities import validate_copier_pair


def test_mt5_to_dxtrade_allowed():
    errors, _ = validate_copier_pair(
        {"platform": "mt5", "terminal_path": r"C:\mt5\terminal64.exe"},
        {"platform": "dxtrade", "api_base_url": "https://dxtrade.ftmo.com"},
    )
    assert errors == []


def test_dxtrade_master_allowed():
    errors, _ = validate_copier_pair(
        {"platform": "dxtrade", "api_base_url": "https://dxtrade.ftmo.com"},
        {"platform": "mt5", "terminal_path": r"C:\mt5\terminal64.exe"},
    )
    assert errors == []


def test_dxtrade_without_url_blocked():
    errors, _ = validate_copier_pair(
        {"platform": "mt5", "terminal_path": r"C:\x\terminal64.exe"},
        {"platform": "dxtrade"},
    )
    assert any("API base URL" in e for e in errors)


def test_mt4_not_supported():
    errors, _ = validate_copier_pair(
        {"platform": "mt4"},
        {"platform": "mt5", "terminal_path": r"C:\x\terminal64.exe"},
    )
    assert any("master" in e.lower() for e in errors)
