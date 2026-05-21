# Delta Engine — MT5 Worker

Python engine for MetaTrader 5: connect, detect trades, copy to followers.

**Must run on Windows** with MT5 terminal installed.

## Setup

From repo root:

```powershell
..\setup.ps1
```

Edit `config/accounts.yaml` with your demo credentials.

**Important:** Use the **worker** venv, not the backend venv. Backend Python does not include `MetaTrader5`.

```powershell
cd worker
.\venv\Scripts\Activate.ps1   # prompt should show worker\venv
where python                  # must point to worker\venv\Scripts\python.exe
```

Or run without activating:

```powershell
.\run.ps1 scripts\01_connect_account.py -a master-1
```

## Pathway (run in order)

```powershell
cd worker
.\venv\Scripts\Activate.ps1

python scripts\01_connect_account.py -a master-1
python scripts\02_confirm_connected.py -a master-1
python scripts\03_register_master.py
python scripts\04_register_followers.py
python scripts\06_detect_master_trade.py    # open a trade in MT5 to test
python scripts\09_run_copier_loop.py        # full copy loop
```

## Engine modules

| Module | Role |
|--------|------|
| `mt5_connector.py` | MT5 API wrapper |
| `account_session.py` | Connect, health, confirm |
| `state_diff.py` | Position change detection |
| `signal.py` | Normalized `TradeSignal` |
| `lot_sizer.py` | Fixed / multiplier lots |
| `symbol_mapper.py` | Master → follower symbols |
| `ticket_mapper.py` | Master/follower ticket map |
| `follower_executor.py` | Execute copy actions |
| `copier_engine.py` | Main poll + dispatch loop |
| `execution_log.py` | Local JSONL audit log |

## Logs

`logs/execution_events.jsonl` — dev execution audit (before Supabase).

## Legacy tests

Original interactive tests still work:

- `tests/test_connect_mt5.py`
- `tests/test_place_order.py`
- `tests/test_close_order.py`
- `tests/test_detect_positions.py`
