# Delta Engine

Cloud-native MT5 trade copier — worker-first execution platform with SaaS control layer.

## Repository layout

| Path | Purpose |
|------|---------|
| `worker/` | **MT5 Python engine** — connect, detect, copy (run on Windows) |
| `worker/scripts/` | Step-by-step pathway scripts `01`–`10` |
| `worker/config/` | Local YAML config (`accounts.yaml`, `copiers.yaml`, `symbol_map.yaml`) |
| `backend/` | FastAPI control API (Supabase, accounts, copiers, risk, logs) |
| `supabase/migrations/` | PostgreSQL schema + RLS |
| `Delta_Engine_Full_PRD.txt` | Full product spec |

## Quick start (Windows)

### 1. One-time setup

From repo root in PowerShell:

```powershell
.\setup.ps1
```

This creates Python venvs, installs dependencies, copies config templates, and generates `.env` keys.

### 2. Configure MT5 accounts

Edit `worker/config/accounts.yaml`:

- **master-1** — demo account that leads trades  
- **follower-1** — demo account that receives copies  

Use the exact server name from MT5 (*File → Login to trade account*).

### 3. MT5 terminal

- Install [MetaTrader 5](https://www.metatrader5.com/)
- Enable **Allow algorithmic trading** (Tools → Options → Expert Advisors)
- Keep the terminal running (or let Python launch it)

### 4. Run the worker pathway

```powershell
cd worker
.\venv\Scripts\Activate.ps1

python scripts\01_connect_account.py -a master-1
python scripts\02_confirm_connected.py -a master-1
python scripts\03_register_master.py
python scripts\04_register_followers.py
python scripts\06_detect_master_trade.py
```

Open a trade on the **master** in MT5 — step 6 should print `POSITION_OPENED`.

### 5. Run the copier loop

```powershell
python scripts\09_run_copier_loop.py
```

Open/close/modify trades on the master; follower should mirror per `worker/config/copiers.yaml`.

Execution log (dev): `worker/logs/execution_events.jsonl`

## Pathway scripts

| Script | Purpose |
|--------|---------|
| `01_connect_account.py` | Connect one account |
| `02_confirm_connected.py` | Verify login, balance, symbol probe |
| `03_register_master.py` | List master config |
| `04_register_followers.py` | Test-connect all followers |
| `05_place_test_trade.py` | Place demo order |
| `06_detect_master_trade.py` | Poll master for state-diff events |
| `07_copy_trade_to_follower.py` | Copier loop |
| `08_copy_sl_tp_and_close.py` | Copier with SL/TP/close/modify |
| `09_run_copier_loop.py` | Continuous copier |
| `10_soak_test.py` | Long-run soak (`SOAK_HOURS` env) |

## Backend API (optional for worker-only dev)

1. Create a [Supabase](https://supabase.com) project  
2. Run SQL migrations in `supabase/migrations/` (001–009)  
3. Fill `SUPABASE_*` in root `.env`  
4. Start API:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

- Health: http://localhost:8000/health  
- Docs: http://localhost:8000/docs  

## Architecture note

- **Dev:** One MT5 terminal; Python switches login between master and follower.  
- **Production:** Many Windows worker VMs; one session per account; orchestrator assigns capacity (`worker_nodes`, `worker_sessions`).

## Requirements

- **Worker:** Windows 10+, Python 3.9–3.12, MT5 terminal  
- **Backend:** Python 3.11 or 3.12 (recommended), Supabase project  
- **Backend requires Python 3.12** — if you only have 3.14, run `py install 3.12` then `.\setup.ps1`  
- **Not supported for worker:** macOS/Linux native MT5 (Wine/Docker is experimental only)
