# Phase 5 — Production worker fabric (minimal)

## Components

- **API:** FastAPI container on port 8000 (see `backend/Dockerfile`, `docs/DEPLOY.md`)
- **Workers:** Windows VM(s) with MT5 + `09_run_copier_loop.py` or supervised service
- **Orchestrator:** `backend/app/services/orchestrator.py` — session rows, worker node capacity
- **Stale sessions:** `expire_stale_sessions()` on each `GET /api/users/me` (120s heartbeat TTL)
- **Billing:** Stripe per-account plans — see `docs/BILLING.md`

## Worker lifecycle

1. Dashboard `POST /api/accounts/:id/start-session` → `worker_sessions` row (`starting`/`running`)
2. Worker registers via `POST /internal/workers/register`
3. On MT5 connect → `POST /internal/workers/session-started`
4. Heartbeat every 30s (`WORKER_HEARTBEAT_INTERVAL_SECONDS`)
5. Flatten → `worker_commands` queue → worker poll in copier loop

## Deploy checklist

- [x] Apply migrations through **017** (verified via Supabase MCP on `delta_engine` project)
- [ ] Set `WORKER_API_KEY`, `ENCRYPTION_KEY`, Supabase keys on production API
- [ ] Configure Stripe products + webhook (`docs/BILLING.md`)
- [ ] One worker node row auto-created on register
- [ ] Process supervisor (NSSM / Task Scheduler) restarts worker on crash
- [ ] Structured logs shipped from `worker/logs/`
- [ ] Frontend on Vercel + API behind TLS (`docs/DEPLOY.md`)

## Beta topology (recommended until worker pool is wired)

One Windows VPS per customer (or cohort), single `WORKER_USER_ID`, supervised copier loop.
Worker does not yet consume `worker_sessions` rows — session API is for future multi-node assignment.
