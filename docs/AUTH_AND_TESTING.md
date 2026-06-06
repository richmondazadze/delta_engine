# Auth, sessions, and real testing (FTMO DXtrade)

## Supabase Auth (dashboard app)

1. **Site URL** (Supabase → Authentication → URL configuration):
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`, `http://localhost:3000/**`

2. **Email sign-up** (for fastest local testing):
   - Authentication → Providers → Email: enable
   - Optional: disable **Confirm email** so `signUp` returns a session immediately

3. **Google OAuth** (optional):
   - Enable Google provider
   - Add OAuth client redirect: `https://<project-ref>.supabase.co/auth/v1/callback`

4. **`tc_users` row** is created automatically by trigger `on_auth_user_created` when a user registers.

## Local env

**`frontend/.env.local`:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Repo root `.env`** (backend + worker):

```env
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...   # must match project JWT secret
ENCRYPTION_KEY=...        # 64-char hex
WORKER_API_KEY=...
API_CORS_ORIGINS=http://localhost:3000
```

JWT secret: Supabase → Project Settings → API → JWT Secret.

## Run stack

```powershell
# Terminal 1 — API
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

## Test flow (FTMO DXtrade demo)

1. Open http://localhost:3000/register → create account → should land on `/dashboard`.
2. **Accounts → Link Account**
3. Platform: **DXtrade**
4. Prop firm: **FTMO** (preset `https://dxtrade.ftmo.com`, domain `default`)
5. Username / domain / password from your FTMO DXtrade demo
6. Save → on account card click **Test connection** (refresh icon flow in UI)
7. Or CLI:

```powershell
cd worker
$env:DXTRADE_API_BASE_URL = "https://dxtrade.ftmo.com"
$env:DXTRADE_USERNAME = "your_ftmo_user"
$env:DXTRADE_PASSWORD = "your_password"
$env:DXTRADE_DOMAIN = "default"
python scripts\13_test_dxtrade_connection.py
```

## Session behavior

- Middleware calls `supabase.auth.getUser()` on each request and refreshes cookies.
- Dashboard API calls use `Authorization: Bearer <access_token>` from `supabase.auth.getSession()`.
- If API returns 401, sign out and sign in again; verify `SUPABASE_JWT_SECRET` matches the project.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 from FastAPI | Project uses ES256 JWT signing keys — backend verifies via JWKS automatically. If still failing, sign out/in or check `SUPABASE_URL` matches the frontend project. Legacy HS256-only setups need `SUPABASE_JWT_SECRET` from Project Settings → API. |
| Redirect loop | Check Site URL / redirect allow list |
| `auth_callback` error on login | OAuth redirect URL mismatch |
| DXtrade login 404 | Firm may use different login path; check browser Network tab on manual login |
| No `tc_users` row | Re-register or insert manually linked to `auth.users.id` |
