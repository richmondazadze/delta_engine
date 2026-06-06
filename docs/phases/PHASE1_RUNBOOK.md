# Phase 1 — MT5 engine proof (local YAML)

Run on **Windows** with MetaTrader 5 installed and algorithmic trading enabled.

## Prerequisites

1. Copy config templates:
   ```powershell
   cd worker\config
   copy accounts.yaml.example accounts.yaml
   copy copiers.yaml.example copiers.yaml
   copy symbol_map.yaml.example symbol_map.yaml
   ```
2. Edit `accounts.yaml` with demo master + follower (exact server name from MT5 login dialog).
3. Activate venv: `cd worker; .\venv\Scripts\Activate.ps1`

## Validate config (no MT5)

```powershell
python scripts\00_validate_config.py
```

## Pathway

| Step | Command | Pass criteria |
|------|---------|---------------|
| 1 | `python scripts\01_connect_account.py -a master-1` | Health JSON, no auth error |
| 2 | `python scripts\02_confirm_connected.py -a master-1` | Balance + symbol probe |
| 3 | `python scripts\03_register_master.py` | Master listed |
| 4 | `python scripts\04_register_followers.py` | All followers connect |
| 5 | Open trade on master manually | — |
| 6 | `python scripts\06_detect_master_trade.py` | `POSITION_OPENED` in console |
| 7 | `python scripts\09_run_copier_loop.py` | Follower mirrors open/close/SL/TP |
| 8 | `python scripts\10_soak_test.py` | Set `SOAK_HOURS=1` for short run |

## Audit

Check `worker/logs/execution_events.jsonl` for `copied`, `failed`, `skipped_*`, `duplicate_ignored`.

## Done gate

- [ ] Master trade copies to follower within expected latency
- [ ] Close on master closes follower
- [ ] SL/TP modify copies when enabled in `copiers.yaml`
- [ ] No duplicate opens for same master ticket
- [ ] JSONL audit trail complete
