# DXtrade integration

Official portal: [DXtrade APIs](https://dx.trade/apis/) · [Developer portal](https://demo.dx.trade/developers/)

Register/admin API reference: [DxRegister spec](https://demo-xt.dx.trade/specs/dxRegister.html)

## Auth (session token)

```http
POST {API_BASE}/login
Content-Type: application/json

{
  "username": "<username>",
  "domain": "<domain>",
  "password": "<password>"
}
```

Response includes `sessionToken` and `timeout` (ms). Subsequent requests:

```http
Authorization: DXAPI <sessionToken>
```

Keep alive with `POST {API_BASE}/ping` before token expiry.

## Prop firm presets (API)

`GET http://localhost:8000/api/integrations/dxtrade-firms`

FTMO is marked **verified** for your demo testing. Other firms ship with placeholder hosts—confirm with support before production use.

| Slug | Firm | API base (preset) |
|------|------|-------------------|
| `ftmo` | FTMO | `https://dxtrade.ftmo.com` |
| `lark` | Lark Funding | `https://trade.gooeytrade.com` |
| `custom` | Other | You enter URL |

## CopyMorphic field mapping

| Dashboard / DB column | DXtrade meaning        |
|-----------------------|------------------------|
| `account_number`      | Username               |
| `broker_server`       | Domain                 |
| `password`            | Encrypted at rest      |
| `api_base_url`        | Broker REST root URL   |

Optional env fallback: `DXTRADE_API_BASE_URL`

## Code

| Component | Path |
|-----------|------|
| REST client | `worker/adapters/dxtrade_client.py` |
| Platform adapter | `worker/adapters/dxtrade_adapter.py` |
| Connection test | `backend/app/services/dxtrade_connection.py` |

## Broker base URLs (examples)

Set `api_base_url` on the account or `DXTRADE_API_BASE_URL` in `.env`:

- FTMO: `https://dxtrade.ftmo.com`
- Eightcap: `https://trader.dx-eightcap.com`
- Lark: `https://trade.gooeytrade.com`

Exact paths (`/login`, `/accounts/.../positions`) vary slightly by broker; the client tries common prefixes.

## Status

- Connection test and adapter scaffold: **implemented**
- Copier loop supports DXtrade as **master** or **follower** (REST). MT5↔DXtrade mixes need symbol mappings and adequate `max_signal_age_ms`.
- Marketing `platforms.ts`: keep `planned` until end-to-end copy is verified on your broker demo

## Test from API

```powershell
# After linking account in dashboard, with JWT:
curl -X POST http://localhost:8000/api/accounts/{id}/test-connection -H "Authorization: Bearer <token>"
```
