# CopyMorphic — Frontend

Next.js 15 dashboard for CopyMorphic. Built from the Stark Light design system.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **Supabase Auth** (`@supabase/ssr`) — login/session cookies
- **FastAPI** — all business data via Bearer JWT (`NEXT_PUBLIC_API_URL`)

## Setup

1. Install dependencies (requires Node.js 18+):

```bash
cd frontend
npm install
```

2. Create `frontend/.env.local` (copy from repo root `.env`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Start the backend (`uvicorn` on port 8000), then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Dev login

Use the seeded dev user from Phase 2 (`dev@deltaengine.local`) or register a new account via `/register`.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Public landing page (Option A: always visible; logged-in users see "Go to dashboard") |
| `/login`, `/register` | Supabase auth |
| `/dashboard` | Command control overview |
| `/accounts`, `/accounts/new`, `/accounts/[id]` | Trading accounts |
| `/copiers`, `/copiers/new`, `/copiers/[id]` | Copier links |
| `/logs` | Forensic execution ledger + drawer |
| `/risk`, `/risk/[accountId]` | Risk engineering |
| `/settings` | Plan, engine, security |

## Public assets

Static files in `public/`:

| File | Purpose |
|------|---------|
| `favicon.svg` | Browser tab icon |
| `logo.svg` | Full wordmark (auth pages) |
| `logo-mark.svg` | Sidebar mark |
| `apple-touch-icon.svg` | Home screen / PWA icon |
| `site.webmanifest` | Web app manifest |
| `robots.txt` | Crawler rules for auth vs app routes |

Branding constants live in `src/lib/brand.ts`.

## Design source

UI tokens and components live in:

- `src/app/globals.css` — design system CSS
- `src/components/ui/` — shared primitives
- `src/components/pages/` — page views

Branding: **CopyMorphic** (Stark Light design system).

## Production build

```bash
npm run build
npm start
```

Ensure `API_CORS_ORIGINS` on the backend includes your frontend origin.
