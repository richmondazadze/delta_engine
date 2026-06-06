# CopyMorphic / Delta Engine — How to run scripts

Windows + PowerShell assumed. Repo root: `delta_engine/`.

## 0. One-time setup

```powershell
# Repo root .env — copy from .env.example and fill Supabase + WORKER_API_KEY + ENCRYPTION_KEY
copy .env.example .env

# Worker venv
cd worker
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Worker YAML (Phase 1 local)
cd config
copy accounts.example.yaml accounts.yaml
copy copiers.example.yaml copiers.yaml
copy symbol_map.example.yaml symbol_map.yaml
# Edit accounts.yaml with demo master + follower credentials
```

```powershell
# Backend venv (from repo root)
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

```powershell
# Frontend
cd frontend
npm install
```

**Always activate the worker venv before running any `worker/scripts/*.py` command** — otherwise you get `ModuleNotFoundError` (e.g. `structlog`).

```powershell
cd worker
.\venv\Scripts\Activate.ps1   # prompt should show (venv)
python scripts\...
```

---

## Dashboard-linked account test (MT5 / DXtrade)

Accounts created in the UI are **not** in `config/accounts.yaml`. Use script **14** (backend must be running):

```powershell
cd worker
.\venv\Scripts\Activate.ps1
# WORKER_USER_ID in repo .env must match the dashboard user who owns the account
python scripts\14_test_linked_account.py --account <uuid-from-accounts-page>
```

Script **02** only works for IDs listed in `worker/config/accounts.yaml` (Phase 1 YAML workflow).

**MT5 broker presets:** Dashboard **Link Account → MT5 → pick broker** (Moneta, FTMO, Exness). Terminal path is auto-detected from `Program Files`. API: `GET /api/integrations/mt5-brokers`.

**Moneta / MT5 IPC timeout (-10005):**

1. Open the **broker's** MT5 app (not Exness/generic) once before testing.
2. In MT5: **Tools → Options → Community → enable "Python integration"**, restart MT5.
3. Server name must match MT5 exactly (e.g. `MonetaMarkets-Demo`, not `MonetaMarkets - Demo`).
4. Quick manual test from repo (Windows, backend venv):

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -c "from app.services.mt5_connection import test_mt5_login; r=test_mt5_login('LOGIN','PASSWORD','MonetaMarkets-Demo', terminal_path=r'C:\Program Files\Moneta Markets MT5 Terminal\terminal64.exe'); print(r)"
```

To process queued connection tests without the copier loop:

```powershell
cd worker
.\venv\Scripts\Activate.ps1
python scripts\15_poll_worker_commands.py
```

**Full local stack test (automated):**

```powershell
cd worker
.\venv\Scripts\Activate.ps1
python scripts\17_local_full_test.py              # API + unit tests
python scripts\17_local_full_test.py --with-mt5   # includes MT5 connect + copy test
python scripts\17_local_full_test.py --with-mt5 --email you@example.com --password '...'  # + JWT API routes
```

---

## 1. Start services

**Terminal A — API**

```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health: http://localhost:8000/health

**Terminal B — Dashboard**

```powershell
cd frontend
npm run dev
```

App: http://localhost:3000

---

## 2. Phase 1 — MT5 local (YAML)

```powershell
cd worker
.\venv\Scripts\Activate.ps1
$env:DELTA_CONFIG_SOURCE = "yaml"

python scripts\00_validate_config.py
python scripts\01_connect_account.py -a master-1
python scripts\02_confirm_connected.py -a master-1
python scripts\03_register_master.py
python scripts\04_register_followers.py
# Open a trade on master in MT5, then:
python scripts\06_detect_master_trade.py
python scripts\09_run_copier_loop.py
# Short soak:
$env:SOAK_HOURS = "1"
python scripts\10_soak_test.py
```

Audit: `worker/logs/execution_events.jsonl`

---

## 3. Phase 2 — API mode + Supabase

With API running and `.env` configured:

```powershell
cd worker
.\venv\Scripts\Activate.ps1
python scripts\11_seed_supabase.py
```

Set in repo `.env`:

```
DELTA_CONFIG_SOURCE=api
WORKER_USER_ID=<printed user id>
WORKER_API_KEY=<same as backend>
API_URL=http://localhost:8000
```

```powershell
python scripts\12_test_api_mode.py --skip-mt5
# Full test (needs MT5):
python scripts\12_test_api_mode.py
```

---

## 4. Dashboard flow (Phase 3)

1. Register / login at http://localhost:3000/register
2. **Accounts** → link MT5 (or DXtrade — see below)
3. **Copier Links** → create master → follower
4. Set `WORKER_USER_ID` in repo `.env` to **your** dashboard user id (same email as login). Wrong id = worker loads another user's copiers or none.
5. Verify config: `python scripts\16_print_runtime_config.py`
6. Start worker: `python scripts\09_run_copier_loop.py` (leave running; Ctrl+C to stop)
7. Trade on the **master** account in MT5 → follower should mirror within ~1s

**Copy not happening?**

| Check | Fix |
|-------|-----|
| Worker not running | Dashboard links alone do not copy — run `09_run_copier_loop.py` |
| Wrong `WORKER_USER_ID` | Must match Supabase user for `azadzerichmond@gmail.com` (see script 16) |
| Trade on follower by mistake | Copies trigger from **master** positions only |
| Exness master + Moneta follower | Supported (multi-terminal switch); both terminals must be installed |
| Master + multiple followers (e.g. Moneta + second Exness) | One copier loop; worker switches login/terminal per follower — no need to stop copier to link/test another account |
| Duplicate follower trades | Worker dedupes multiple copier rows → same follower. Do not use same-symbol position guards (blocks 2nd master trade on EURUSD). |
| 2nd+ master trade not copied to Moneta | Was caused by `_follower_has_copy` (fixed) or `max_signal_age_ms` (default 3s) expiring during multi-terminal fan-out (timestamp refresh added). |
| FTMO / DXtrade copy | Link **platform DXtrade** for web accounts or **platform MT5** + broker FTMO for desktop. Worker supports MT5↔MT5, MT5↔DXtrade, DXtrade↔MT5, DXtrade↔DXtrade. Restart copier after new links (or wait ~60s for config reload). |
| Test connection while copier runs | Queued on worker when healthy; worker restores master login after test |
| Algo trading off | MT5 → Tools → Options → Expert Advisors → allow algorithmic trading |
| No logs | Open `worker/logs/execution_events.jsonl` or dashboard **Forensic Logs** |

Account actions (API):

- `POST /api/accounts/{id}/test-connection`
- `POST /api/accounts/{id}/start-session`
- `POST /api/accounts/{id}/stop-session`

---

## 5. DXtrade account linking (FTMO and other firms)

Use the dashboard: **Accounts → Link Account → DXtrade → FTMO** (or another firm preset).

Presets API: `GET http://localhost:8000/api/integrations/dxtrade-firms`

Per-broker REST root (examples):

| Broker   | Base URL                    |
|----------|-----------------------------|
| FTMO     | `https://dxtrade.ftmo.com`  |
| Eightcap | `https://trader.dx-eightcap.com` |

See [`AUTH_AND_TESTING.md`](AUTH_AND_TESTING.md) for Supabase auth + FTMO demo test steps.

In the dashboard or via API:

| Field            | Value                          |
|------------------|--------------------------------|
| `platform`       | `dxtrade`                      |
| `account_number` | DXtrade **username**           |
| `broker_server`  | **domain** (e.g. `default`)    |
| `password`       | Account password               |
| `api_base_url`   | Broker REST root (HTTPS)       |

Or set `DXTRADE_API_BASE_URL` in `.env` and omit per-account URL.

Test connection uses session token auth (`POST /login`, header `DXAPI {token}`). See [`docs/integrations/dxtrade/README.md`](integrations/dxtrade/README.md).

---

## 6. Useful checks

```powershell
# Config only
python scripts\00_validate_config.py

# Worker unit tests
python -m pytest tests/test_state_diff.py -q
```

Supabase MCP (from Cursor): `list_tables`, `list_migrations`, `execute_sql` for ad-hoc queries.
