# Deploy & cloud infrastructure

Phase-by-phase guide after local dev is complete. Start with **Phase 1** (closed beta); expand as you validate copy reliability.

## Architecture (target)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Vercel     │────▶│  FastAPI     │────▶│  Supabase       │
│  Next.js    │     │  (API VPS)   │     │  Postgres + Auth│
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
                    ┌──────▼───────┐
                    │ Windows VPS  │
                    │ MT5 Worker   │
                    │ (per cluster)│
                    └──────────────┘
```

## Phase 1 — Closed beta

### Supabase (done if migrations applied)

Project: `delta_engine` (`wrjwkrhfasufpxlkmwtq`). Migrations **001–017** are applied.

Verify anytime:

```powershell
# Via Supabase MCP in Cursor: list_migrations
```

### Frontend → Vercel

1. Import GitHub repo; root directory **`frontend`**.
2. Environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` → production API URL (e.g. `https://api.copymorphic.com`)
3. Build command: `npm run build`
4. Add custom domain when ready.

`frontend/vercel.json` in repo sets framework defaults.

### Backend API → VPS or container

**Option A — Windows/Linux VPS + uvicorn**

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
# Set .env on server (see .env.example)
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Put **Caddy** or **nginx** in front with TLS. Set:

```env
API_ENV=production
API_DEBUG=false
API_CORS_ORIGINS=https://your-app.vercel.app,https://copymorphic.com
```

**Option B — Docker**

```powershell
docker build -f backend/Dockerfile -t copymorphic-api .
docker run -p 8000:8000 --env-file .env copymorphic-api
```

**Option C — Render (Native Python)**

1. **Root Directory:** `backend`
2. **Build:** `pip install -r requirements.txt`
3. **Start:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Python **3.12.8** is pinned via `backend/.python-version` (do not use 3.14 — `pydantic-core` has no wheels yet).
5. Set production env vars in Render dashboard (see `.env.example`; no `.env` file on the server).

### Worker → Windows VPS

One supervised worker per customer cohort (or per user for beta):

```powershell
cd worker
.\venv\Scripts\Activate.ps1
$env:DELTA_CONFIG_SOURCE="api"
$env:WORKER_USER_ID="<dashboard-user-uuid>"
$env:API_URL="https://api.copymorphic.com"
python scripts\09_run_copier_loop.py
```

Register as Windows service (NSSM / Task Scheduler). See `docs/phases/PHASE5_OPS_RUNBOOK.md`.

### Stripe webhook

Point to `https://<api-host>/api/billing/webhook` — see `docs/BILLING.md`.

## Phase 2 — CI

GitHub Actions workflow `.github/workflows/ci.yml` runs:

- Backend: `pytest`
- Worker: `pytest`
- Frontend: `npm ci && npm run build`

## Phase 3 — Scale

- Multiple `worker_nodes` with capacity; assign `worker_sessions` per account
- Dedicated VPS SKU mapped to `STRIPE_PRICE_DEDICATED`
- Log shipping (JSONL → observability stack)
- Staging Supabase branch for schema changes

## Checklist before first paying customer

- [ ] All migrations applied on prod Supabase
- [ ] `API_ENV=production`, `API_DEBUG=false`
- [ ] Stripe products + webhook configured
- [ ] Worker supervised + heartbeats visible in `/admin/overview`
- [ ] E2E: register → link accounts → copy → log entry
- [ ] Privacy & Terms pages live

## Files added for deploy

| File | Purpose |
|------|---------|
| `frontend/vercel.json` | Vercel project hints |
| `backend/Dockerfile` | Containerized API |
| `.github/workflows/ci.yml` | PR checks |
| `docs/BILLING.md` | Stripe setup |
| `docs/DEPLOY.md` | This guide |
