"""
Public integration metadata (DXtrade firms, etc.).
"""

from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel

from app.data.dxtrade_firms import DXTRADE_FIRM_PRESETS
from app.data.mt5_brokers import MT5_BROKER_PRESETS, get_broker
from app.services.platform_capabilities import list_capabilities
from app.services.terminal_discovery import list_installed_terminals, resolve_terminal_path

router = APIRouter(prefix="/api/integrations", tags=["Integrations"])


class DXtradeFirmResponse(BaseModel):
    slug: str
    name: str
    api_base_url: str
    default_domain: str
    login_path: str
    verified: bool
    notes: str | None = None
    trader_url: str | None = None


class DXtradeFirmsListResponse(BaseModel):
    firms: list[DXtradeFirmResponse]


class MT5BrokerResponse(BaseModel):
    slug: str
    name: str
    default_server: str
    server_examples: list[str]
    terminal_path: str | None = None
    terminal_installed: bool = False
    verified: bool
    notes: str | None = None
    recommended_vps_regions: list[str] = []
    latency_notes: str | None = None


class MT5BrokersListResponse(BaseModel):
    brokers: list[MT5BrokerResponse]
    installed_terminals: list[dict[str, str]] = []


class PlatformCapabilityResponse(BaseModel):
    platform: str
    display_name: str
    link_account: bool
    copy_as_master: bool
    copy_as_follower: bool
    requires_terminal_path: bool
    requires_api_base_url: bool


class PlatformCapabilitiesListResponse(BaseModel):
    platforms: list[PlatformCapabilityResponse]


@router.get("/platform-capabilities", response_model=PlatformCapabilitiesListResponse)
async def list_platform_capabilities():
    """Which platforms can be linked and used in copier master/follower roles."""
    return PlatformCapabilitiesListResponse(
        platforms=[PlatformCapabilityResponse(**row) for row in list_capabilities()]
    )


@router.get("/dxtrade-firms", response_model=DXtradeFirmsListResponse)
async def list_dxtrade_firms():
    """Prop firms / brokers that use DXtrade — preset API hosts and domains."""
    return DXtradeFirmsListResponse(
        firms=[
            DXtradeFirmResponse(
                slug=f.slug,
                name=f.name,
                api_base_url=f.api_base_url,
                default_domain=f.default_domain,
                login_path=f.login_path,
                verified=f.verified,
                notes=f.notes,
                trader_url=f.trader_url,
            )
            for f in DXTRADE_FIRM_PRESETS
        ]
    )


@router.get("/mt5-brokers", response_model=MT5BrokersListResponse)
async def list_mt5_brokers():
    """MT5 brokers with auto-detected terminal paths on this host."""
    installed = list_installed_terminals()
    brokers: list[MT5BrokerResponse] = []
    for b in MT5_BROKER_PRESETS:
        path = resolve_terminal_path(get_broker(b.slug))
        brokers.append(
            MT5BrokerResponse(
                slug=b.slug,
                name=b.name,
                default_server=b.default_server,
                server_examples=list(b.server_examples),
                terminal_path=path,
                terminal_installed=bool(path and Path(path).is_file()),
                verified=b.verified,
                notes=b.notes,
                recommended_vps_regions=list(b.recommended_vps_regions),
                latency_notes=b.latency_notes,
            )
        )
    return MT5BrokersListResponse(brokers=brokers, installed_terminals=installed)
