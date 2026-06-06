# Phase 2 — API mode + Supabase

## Steps

1. Apply Supabase migrations `001`–`012`.
2. Start API: `cd backend && uvicorn app.main:app --reload --port 8000`
3. Seed YAML → Supabase:
   ```powershell
   cd worker
   .\venv\Scripts\python.exe scripts\11_seed_supabase.py
   ```
4. Set in repo `.env`:
   ```
   DELTA_CONFIG_SOURCE=api
   WORKER_USER_ID=<from seed output>
   WORKER_API_KEY=<matches backend>
   API_URL=http://localhost:8000
   ```
5. Run: `python scripts\12_test_api_mode.py --skip-mt5` (API only) or full test with MT5.

## Done gate

- `12_test_api_mode.py` passes
- `execution_events` rows visible in Supabase / dashboard logs
