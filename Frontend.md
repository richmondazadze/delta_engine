# Delta Engine — Frontend Design Specification

**Document version:** 2.0  
**Product:** Delta Engine — Cloud-native MT5 trade copier SaaS  
**Audience:** Web designer, UI/UX designer, frontend developer (handoff before build)  
**Backend status:** FastAPI + Supabase live (Phase 2 complete)  
**MVP platform:** MT5 only (UI must support future platforms in labels/disabled states)  
**Canonical path:** `Frontend.md` (repo root)

---

## 1. Product context (for designers)

Delta Engine is a **managed trade copier** for serious multi-account traders (prop-firm, retail, signal providers). Users connect MT5 accounts, define master → follower copy relationships, set risk rules, and monitor every copied trade in an audit log.

**Core user promise:** *“Connect accounts, set rules, copy trades safely — with full transparency.”*

**What this UI is NOT:**
- Not a charting/trading terminal (no candlesticks, no order entry in v1)
- Not a generic AI SaaS landing page
- Not a social network or signal marketplace (future)

**What this UI IS:**
- A **control center** + **audit trail**
- Dark, professional, minimal — like infrastructure software traders trust
- Status-driven (connected / copying / locked / failed) with clear badges and tables

---

## 2. Design principles

| Principle | Implementation guidance |
|-----------|-------------------------|
| **Dark-mode first** | Default theme is dark; light mode optional later |
| **Minimalist** | Generous whitespace, no decorative gradients or glassmorphism overload |
| **Trust through logs** | Execution log is a hero surface — readable, filterable, precise |
| **Status clarity** | Every account and copier has an obvious state badge |
| **No clutter** | One primary action per screen; secondary actions in menus |
| **Trading-native** | Monospace for tickets/IDs; tabular numbers for lots/prices |
| **Security visible** | Never show broker passwords after creation; explain encryption briefly |

**Tone:** Confident, calm, technical — not hype, not “crypto bro,” not playful.

**Reference mood (not copies):** Professional fintech dashboards, prop-firm portals, infrastructure monitoring tools.

---

## 3. Design system foundation

### 3.1 Color tokens (suggested starting point — designer to refine)

| Token | Usage |
|-------|--------|
| `bg-app` | Main app background (near-black, e.g. `#0a0a0b`) |
| `bg-surface` | Cards, panels (e.g. `#111113`) |
| `bg-elevated` | Modals, dropdowns (e.g. `#18181b`) |
| `border-subtle` | Dividers, table borders |
| `text-primary` | Headings, primary labels |
| `text-secondary` | Descriptions, metadata |
| `text-muted` | Timestamps, helper text |
| `accent` | Primary buttons, active nav (restrained — one accent, not rainbow) |
| `success` | Connected, copy success |
| `warning` | Disconnected, skipped_slippage |
| `danger` | Failed, locked, auth_failed |
| `info` | Pending, informational |

### 3.2 Typography

| Role | Font guidance |
|------|----------------|
| UI / body | Clean sans-serif (Inter, Geist, or similar) |
| Tickets, account numbers, codes | Monospace tabular (JetBrains Mono, Geist Mono) |
| Page titles | Semibold, 24–32px |
| Section titles | Medium, 16–18px |
| Table data | 13–14px, readable density |

### 3.3 Spacing & layout

- **App shell:** Fixed left sidebar (240px desktop) + top bar (56–64px)
- **Content max-width:** 1280px for forms; full-width for log tables
- **Grid:** 12-column on desktop; stack on mobile
- **Border radius:** Small (4–8px) — sharp, not bubbly
- **Table row height:** 44–52px for scanability

### 3.4 Core components (design once, reuse everywhere)

Design specs needed for each:

1. **Button** — primary, secondary, ghost, destructive; loading state
2. **Input** — text, password, number, select, multi-select (tags for symbols)
3. **Toggle / switch** — enable copier, copy SL/TP flags
4. **Badge / status pill** — see Section 4 (status vocabulary)
5. **Card** — account card, stat card, copier card
6. **Data table** — sortable headers, row hover, empty state, pagination
7. **Modal / dialog** — confirm delete, add account
8. **Toast / alert** — success, error (top-right stack)
9. **Skeleton loaders** — tables and cards
10. **Empty state** — illustration optional; always include CTA
11. **Tabs** — account detail sections, settings
12. **Tooltip** — icon-only actions (explain slippage guard, etc.)
13. **Breadcrumb** — optional on nested pages
14. **Progress / spinner** — connection test, session start
15. **Banner** — account locked, plan limit reached, worker offline

---

## 4. Status vocabulary (badges — design all variants)

Designers must create a **consistent badge set** for these enums (color + icon + label):

### 4.1 Account connection status (`connection_status`)

| Value | Badge label | Suggested color |
|-------|-------------|-----------------|
| `connected` | Connected | Green |
| `disconnected` | Disconnected | Gray |
| `auth_failed` | Auth failed | Red |
| `terminal_unavailable` | Terminal unavailable | Orange |
| `broker_unavailable` | Broker unavailable | Orange |
| `disabled` | Disabled | Gray muted |
| `locked` | Locked | Red |

### 4.2 Copier state

| State | Condition | Badge |
|-------|-----------|-------|
| Active | `is_enabled` true + master connected | **Copying** (green) |
| Paused | `is_enabled` false | **Paused** (gray) |
| Blocked | Risk lock on follower account | **Locked** (red) |

### 4.3 Execution event status (`status`)

| Value | Label | Color |
|-------|-------|-------|
| `success` | Success | Green |
| `closed` | Closed | Blue |
| `modified` | Modified | Blue |
| `failed` | Failed | Red |
| `rejected` | Rejected | Red |
| `skipped_risk` | Skipped (risk) | Orange |
| `skipped_slippage` | Skipped (slippage) | Orange |
| `duplicate_ignored` | Duplicate ignored | Gray |
| `partial` | Partial fill | Yellow |
| `pending` | Pending | Gray |

### 4.4 Event types (`event_type`) — table column, not always badge

`position_opened`, `position_closed`, `sl_modified`, `tp_modified`, `volume_changed`

### 4.5 Platform labels (`platform`)

`MT5` (active), `MT4`, `cTrader`, `DXTrade`, `MatchTrader`, `TradeLocker`, `NinjaTrader`, `TradingView` — non-MT5 shown as **Coming soon** (disabled in dropdowns)

### 4.6 Risk lock state

| State | UI |
|-------|-----|
| Unlocked | Normal |
| Locked | Red banner on account + copiers using that account; **Unlock** button (if API allows) |

---

## 5. Information architecture (sitemap)

```
PUBLIC
├── /                          Landing
├── /pricing                   Pricing
├── /login                     Login
├── /register                  Register
├── /forgot-password           Forgot password
└── /reset-password            Reset password (email link)

AUTHENTICATED APP  (/app/* or root after login — designer to pick)
├── /dashboard                 Overview
├── /accounts                  Account list
├── /accounts/new              Add account
├── /accounts/[id]             Account detail
├── /copiers                   Copier list
├── /copiers/new               Create copier
├── /copiers/[id]              Copier detail / edit
├── /symbol-mappings           Symbol map list (MVP optional)
├── /symbol-mappings/new       Add mapping
├── /risk                      Risk profiles list
├── /risk/[accountId]          Risk settings per account
├── /logs                      Execution logs (primary audit view)
├── /logs/[id]                 Single event detail
├── /analytics                 Analytics (MVP basic)
├── /settings                  User settings
├── /settings/billing          Billing (future — stub in MVP)
└── /support                   Help / support

ADMIN (future — subscription_plan = admin)
├── /admin/users
├── /admin/accounts
├── /admin/workers
├── /admin/failed-executions
├── /admin/health
└── /admin/billing
```

**MVP designer priority (Phase 3 dashboard):**  
Login → Register → Dashboard → Accounts → Add Account → Copiers → Create Copier → Execution Logs → Settings

**Phase 3b:** Risk settings, Symbol mappings, Analytics basic  
**Phase 4:** Public landing, Pricing, Billing, Admin

---

## 6. Global app shell (authenticated)

Every authenticated page shares this chrome.

### 6.1 Left sidebar navigation

| Nav item | Icon suggestion | Route | Badge optional |
|----------|-----------------|-------|----------------|
| Overview | Grid / home | `/dashboard` | — |
| Accounts | Wallet / server | `/accounts` | Count of disconnected |
| Copiers | Arrows / copy | `/copiers` | Count active |
| Execution logs | List / scroll | `/logs` | Failed count (24h) |
| Risk | Shield | `/risk` | Locked count |
| Analytics | Chart | `/analytics` | — |
| Settings | Gear | `/settings` | — |

**Footer of sidebar:**
- User email (truncated)
- Plan name (e.g. “Free” / “Pro”)
- Log out link

**Collapsed sidebar (tablet):** Icon-only + tooltips

### 6.2 Top bar

| Element | Position | Behavior |
|---------|----------|----------|
| Page title | Left | Dynamic per route |
| Breadcrumb | Below title (optional) | Accounts > Demo Master |
| Global search | Center (future) | Search logs by ticket — defer MVP |
| **Copy status indicator** | Right | “Worker online” / “No active session” dot |
| Notifications bell | Right | Future — show empty disabled in MVP |
| User avatar menu | Right | Settings, Billing, Log out |

### 6.3 Global banners (conditional)

Show at top of content area when applicable:

1. **Plan limit** — “Account limit reached (2/2). Upgrade to add more.”
2. **Risk lockout** — “Account Demo Follower locked: daily loss limit hit.”
3. **Worker offline** — “Copy engine not connected. Trades will not copy until worker is running.”
4. **Email unverified** — If Supabase email not confirmed

---

## 7. Public pages (full spec)

### 7.1 Landing page `/`

**Purpose:** Convert visitors; explain managed cloud copier vs VPS/EA setup.

**Sections (top to bottom):**

1. **Navbar**
   - Logo “Delta Engine”
   - Links: Features, Pricing, Docs (future), Login
   - CTA button: **Get started**

2. **Hero**
   - Headline: e.g. “Copy trades across MT5 accounts — in the cloud.”
   - Subhead: reliability, risk controls, audit logs (one sentence)
   - Primary CTA: **Start free**
   - Secondary CTA: **View pricing**
   - Hero visual: abstract diagram (master → engine → followers) — NOT stock AI art

3. **Social proof strip** (optional MVP)
   - “Built for prop-firm & multi-account traders”

4. **Features grid (3–4 cards)**
   - Cloud-hosted copying
   - Risk-first (daily loss lockout)
   - Full execution audit trail
   - Symbol mapping across brokers

5. **How it works (3 steps)**
   - Connect accounts → Create copier → Monitor logs

6. **Comparison strip**
   - vs local VPS + EA (complexity, uptime)

7. **Pricing teaser**
   - Link to full pricing page

8. **Footer**
   - Product, Legal (Privacy, Terms — placeholders), Contact, Status

**UI elements:** Navbar, buttons, feature cards, step numbers, footer columns.

**MVP note:** Can ship simplified hero + CTA to login only; designer still spec full page for later.

---

### 7.2 Pricing page `/pricing`

**Purpose:** Show tier limits; drive upgrade (billing backend future).

**Elements:**

1. **Page header** — “Simple pricing for serious copiers”
2. **Toggle** — Monthly / Annual (annual can show “Coming soon”)
3. **Four plan cards:**

| Plan | Price | Limits (from PRD) |
|------|-------|-------------------|
| Starter | $19/mo | 1 master, 2 followers |
| Pro | $49/mo | 1 master, 10 followers |
| Scale | $99/mo | 3 masters, 30 followers |
| Elite | $149/mo | Higher limits, dedicated worker |

Each card includes:
- Plan name
- Price
- Account/follower limits
- Feature bullet list (logs, risk, symbol map)
- CTA: **Subscribe** (disabled “Coming soon” in MVP) or **Current plan**

4. **FAQ accordion** — billing, security, MT5 support
5. **Enterprise / Signal provider** — “Contact us” link

---

### 7.3 Login `/login`

**Elements:**

- Logo + “Sign in to Delta Engine”
- Email input
- Password input
- **Sign in** button (loading state)
- Link: Forgot password?
- Link: Create account
- Error alert area (invalid credentials)
- Optional: “Remember this device” (future)

**No social login in MVP.**

---

### 7.4 Register `/register`

**Elements:**

- Full name (optional)
- Email
- Password + confirm password
- Password strength hint (min 8 chars)
- Checkbox: Terms of Service + Privacy Policy (links)
- **Create account** button
- Link: Already have an account?
- Success state: “Check your email to confirm” (if email confirmation enabled)

---

### 7.5 Forgot password `/forgot-password`

**Elements:**

- Email input
- **Send reset link** button
- Back to login link
- Success message (always show generic “If account exists, email sent”)

---

### 7.6 Reset password `/reset-password`

**Elements:**

- New password
- Confirm password
- **Reset password** button
- Invalid/expired token error state

---

## 8. Authenticated pages (full spec)

---

### 8.1 Dashboard overview `/dashboard`

**Purpose:** At-a-glance health — am I copying safely?

**Layout:** 2-row grid of stat cards + two columns below.

#### Row 1 — Stat cards (4)

| Card | Metric | Subtext | Click → |
|------|--------|---------|---------|
| Accounts | Total / connected count | “2 connected, 0 errors” | `/accounts` |
| Active copiers | Enabled copiers count | “1 copying” | `/copiers` |
| Trades copied (24h) | Count from logs API | vs yesterday (future) | `/logs` |
| Avg latency (24h) | ms from logs | “Last 24 hours” | `/logs` |

#### Row 2 — Two panels

**Left: Recent execution events (table, 5 rows)**
- Columns: Time, Event, Symbol, Status, Latency
- Link: **View all logs**

**Right: Account health (list)**
- Each row: Label, platform badge, connection badge, balance/equity if available
- Link: **Manage accounts**

#### Row 3 — Alerts panel (if any)

- Failed copies last 24h
- Locked accounts
- Disconnected accounts

**Empty state (new user):**
- Illustration optional
- “Get started in 3 steps”
- CTAs: **Add account** → **Create copier** → **View logs**

**UI elements:** Stat cards, mini table, account list rows, alert cards, empty state.

---

### 8.2 Accounts list `/accounts`

**Purpose:** Manage all trading accounts.

#### Page header
- Title: **Trading accounts**
- Subtitle: “Connect MT5 demo or live accounts. Passwords are encrypted.”
- Primary button: **+ Add account**
- Secondary: Refresh (icon)

#### Filter bar
- Platform dropdown (MT5 default; others disabled “Soon”)
- Connection status multi-filter
- Search by label or account number

#### Account cards or table (designer choice — PRD says “sharp account cards”)

**Recommended: card grid on desktop, table on mobile**

**Each account card must show:**

| Element | Source field |
|---------|--------------|
| Account label | `account_label` |
| Platform badge | `platform` (MT5) |
| Connection status badge | `connection_status` |
| Account number (mono) | `account_number` |
| Broker server | `broker_server` |
| Balance / equity | `balance`, `equity`, `currency` |
| Last connected | `last_connected_at` relative time |
| Last error (if any) | `last_error` truncated, red |
| Enabled toggle | `is_enabled` |
| Overflow menu | View, Edit label, Test connection, Start session, Stop session, Delete |

**Card footer actions:**
- **Test connection** (may show “Pending backend” tooltip in MVP if worker not wired)
- **View details**

#### Empty state
- “No accounts yet”
- CTA: **Add your first account**

#### Plan limit banner
- When at `account_limit` from user profile: disable Add button + upgrade CTA

**UI elements:** Cards/table, filters, badges, toggles, kebab menu, pagination if >20.

---

### 8.3 Add account `/accounts/new`

**Purpose:** Create trading account; password sent once to API.

**Layout:** Single column form, max-width 560px.

#### Form fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Account label | Text | No | e.g. “Exness Demo Master” |
| Platform | Select | Yes | MT5 only enabled |
| Account number | Text | Yes | Numeric login |
| Broker server | Text | Yes | Exact MT5 server string |
| Password | Password + show toggle | Yes | Helper: “Encrypted with AES-256; never shown again” |
| Terminal path | Text | No | Advanced collapsible — Windows path to terminal64.exe |

#### Footer actions
- **Cancel** → back to list
- **Save account** (primary)

#### Success
- Toast: “Account added”
- Redirect to `/accounts/[id]` or list

#### Validation errors
- Inline under fields + summary alert

**Security callout box:** Icon + short text about encryption and never storing plaintext in browser.

---

### 8.4 Account detail `/accounts/[id]`

**Purpose:** Deep view on one account.

#### Header
- Account label (editable inline or Edit button)
- Platform + connection badges
- Enable/disable toggle

#### Tab: Overview

| Section | Content |
|---------|---------|
| Connection | Status, last connected, last error |
| Account info | Number, server, mode (hedging/netting), leverage |
| Balance | Balance, equity, currency (large numbers) |
| Actions row | Test connection, Start session, Stop session (see MVP states below) |

**MVP button states:**
- `Test connection` — enabled; may return “queued” until worker wired
- `Start session` / `Stop session` — show with tooltip “Requires worker orchestrator” if not live

#### Tab: Copiers using this account
- Table: copiers where this account is master or follower
- Link to copier detail

#### Tab: Risk (link to `/risk/[accountId]`)
- Summary of risk profile or “No risk profile — **Create one**”

#### Tab: Recent logs
- Filtered execution events for this account (last 20)

#### Danger zone (bottom)
- **Delete account** (destructive button)
- Modal confirm: “This disables copiers using this account.”

---

### 8.5 Copiers list `/copiers`

**Purpose:** Manage master → follower copy links.

#### Page header
- Title: **Copiers**
- Subtitle: “Link a master account to one or more followers.”
- Primary: **+ Create copier**

#### Filter bar
- Enabled / disabled
- Search by label

#### Copier table (primary layout — relational data)

| Column | Content |
|--------|---------|
| Label | `label` or auto “Master → Follower” |
| Master | Account label + number (link) |
| Follower | Account label + number (link) |
| Lot mode | `risk_mode` + value (e.g. “Multiplier 1.0x”) |
| Copy rules | Icons: SL, TP, Close, Modify (checkmarks) |
| Status | Enabled badge + copying indicator |
| Signal age | `max_signal_age_ms` e.g. “3000ms” |
| Actions | Enable/Disable, Edit, Delete |

#### Row expand (optional)
- Show full copy settings without navigating away

#### Empty state
- “No copiers configured”
- CTA: **Create copier** + mini diagram master → follower

---

### 8.6 Create copier `/copiers/new`

**Purpose:** Define new copy relationship.

**Layout:** Two-column on desktop — form left, summary preview right.

#### Section 1 — Accounts

| Field | Type | Notes |
|-------|------|-------|
| Label | Text | Optional friendly name |
| Master account | Select | Only user’s enabled accounts |
| Follower account | Select | Must differ from master; validation error if same |

**Preview panel:** Shows selected master/follower cards with connection status.

#### Section 2 — Lot sizing

| Field | Type | Notes |
|-------|------|-------|
| Risk mode | Radio | Multiplier (default), Fixed lot; Equity ratio / Risk % disabled “Soon” |
| Multiplier | Number stepper | 0.01–100, shown when multiplier mode |
| Fixed lot size | Number | Shown when fixed lot mode |

#### Section 3 — Copy behavior (toggles)

| Toggle | Default | Label |
|--------|---------|-------|
| `copy_sl` | On | Copy stop loss |
| `copy_tp` | On | Copy take profit |
| `copy_closes` | On | Copy closes |
| `copy_modifications` | On | Copy SL/TP modifications |

#### Section 4 — Execution (advanced collapsible)

| Field | Default | Helper tooltip |
|-------|---------|----------------|
| Max signal age (ms) | 3000 | “Skip copy if signal older than this — protects against stale trades in cloud setup” |

#### Footer
- **Cancel**
- **Create copier**

#### Follower limit banner
- When at plan follower limit — disable create + upgrade CTA

---

### 8.7 Copier detail `/copiers/[id]`

**Purpose:** View/edit one copier.

#### Header
- Label
- Enable/disable toggle (prominent)
- Status: Copying / Paused / Blocked (risk)

#### Sections (editable form, same fields as create)

- Master/follower (read-only after create — or allow change with confirm modal)
- Lot sizing
- Copy toggles
- Max signal age

#### Stats row (MVP — from logs aggregation)
- Copies today: success / failed / skipped
- Avg latency

#### Linked symbol mappings
- Short list + **Manage mappings** link

#### Recent logs
- Last 20 events for this `copier_relation_id`

#### Actions
- **Save changes**
- **Delete copier** (confirm modal)

---

### 8.8 Symbol mappings `/symbol-mappings` (MVP optional — include in design)

**Purpose:** Map master symbols to follower symbols (e.g. XAUUSD → XAUUSDm).

#### Page header
- **Symbol mappings**
- **+ Add mapping**

#### Table columns

| Column | Field |
|--------|-------|
| Master account | Optional scope |
| Follower account | Optional scope |
| Master symbol | `master_symbol` |
| Follower symbol | `follower_symbol` |
| Active | toggle |
| Actions | Edit, Delete |

#### Add/edit modal
- Master account (optional — global if empty)
- Follower account (optional)
- Master symbol text
- Follower symbol text

**Empty state:** “No mappings — symbols copy as-is when empty.”

---

### 8.9 Risk profiles list `/risk`

**Purpose:** Per-account risk rules overview.

#### Page header
- **Risk settings**
- Subtitle: “Protect follower accounts from over-trading and drawdown.”

#### Table

| Column | Content |
|--------|---------|
| Account | Label + link |
| Daily loss limit | `max_daily_loss` or “—” |
| Daily loss used | `daily_loss_accumulated` progress bar |
| Max lot | `max_lot_per_trade` |
| Open positions cap | `max_open_positions` |
| Lock status | Locked badge + reason |
| Actions | Edit, Unlock (if locked), Flatten (future) |

---

### 8.10 Risk settings detail `/risk/[accountId]`

**Purpose:** Configure all PRD risk checks for one account.

**Layout:** Form sections with save per section or global save.

#### Section — Loss limits

| Field | Type |
|-------|------|
| Max daily loss | Currency input |
| Max total loss | Currency input |
| Min equity stop | Currency input |

#### Section — Position limits

| Field | Type |
|-------|------|
| Max lot per trade | Number |
| Max open positions | Integer |
| Max trades per day | Integer |

#### Section — Symbol filters

| Field | Type |
|-------|------|
| Allowed symbols | Tag multi-input (empty = all) |
| Blocked symbols | Tag multi-input |

#### Section — Behavior flags

| Toggle | Label |
|--------|-------|
| Lock after loss | Stop copying after breach |
| Auto-flatten | Close all positions on breach |
| News pause | Disabled “Coming soon” |

#### Lockout panel (when `is_locked`)

- Red banner: `locked_reason`, `locked_at`
- **Unlock account** button
- **Flatten all positions** button (destructive, confirm modal)

#### Daily stats sidebar
- `daily_loss_accumulated`
- `daily_trades_count`
- `daily_reset_at`

---

### 8.11 Execution logs `/logs` ⭐ Primary audit page

**Purpose:** Trust-building audit trail — every copy attempt.

**Design priority:** This page should feel as polished as account overview.

#### Page header
- **Execution logs**
- Subtitle: “Every signal, every attempt, every result.”
- Export CSV button (future — disabled MVP ok)

#### Filter bar (sticky below header)

| Filter | Type |
|--------|------|
| Date range | Presets: 24h, 7d, 30d, custom |
| Status | Multi-select badges |
| Event type | Multi-select |
| Symbol | Text search |
| Copier | Dropdown |
| Account | Dropdown (master or follower) |

#### Main table

| Column | Field | Notes |
|--------|-------|-------|
| Time | `created_at` | Relative + hover absolute |
| Status | `status` | Badge |
| Event | `event_type` | Human label |
| Copier | resolve label | Link |
| Master ticket | `master_ticket` | Monospace |
| Follower ticket | `follower_ticket` | Monospace |
| Symbol | `symbol_master` → `symbol_follower` | Show arrow if different |
| Side | `side` | Buy/Sell pill |
| Lots | `requested_lot` / `executed_lot` | |
| Latency | `latency_ms` | Color: green <500, yellow <2000, red higher |
| Broker code | `broker_return_code` | Mono |
| Error | `error_message` | Truncate + tooltip |

#### Row click
- Opens log detail drawer or `/logs/[id]`

#### Pagination
- 50 per page default; load more or numbered pages

#### Empty state
- “No execution events yet — create a copier and run the worker.”

#### Real-time (future)
- Subtle “Live” dot when websocket connected; new rows animate in

---

### 8.12 Execution log detail `/logs/[id]` (or drawer)

**Purpose:** Forensic view of one event.

#### Header
- Status badge + event type + timestamp

#### Grid — Trade identifiers
- Master ticket, follower ticket, copier relation ID, account IDs

#### Grid — Trade details
- Symbols, side, lots, prices, slippage

#### Grid — Performance
- Latency ms, broker return code

#### Error panel (if failed/skipped)
- Full `error_message`
- Suggested action copy (e.g. slippage → “Increase max signal age or check worker latency”)

#### Raw payload (collapsible)
- JSON `raw_payload` in monospace block — for support/debug

#### Navigation
- Previous / next event in current filter

---

### 8.13 Analytics `/analytics` (MVP basic)

**Purpose:** High-level performance — not a full quant terminal.

#### Date range selector (7d / 30d)

#### Stat cards
- Copied trades count
- Successful executions
- Failed executions
- Average latency
- Average slippage (when available)

#### Charts (simple — designer spec layout)
1. **Executions over time** — stacked bar: success / failed / skipped
2. **Latency histogram** — simple bar chart
3. **Per-account table** — P&L placeholder “Coming soon” if not in API

**Future charts (wireframe grayed):** Equity curve, win rate, drawdown, symbol breakdown

---

### 8.14 Settings `/settings`

**Tabs:**

#### Tab — Profile
- Email (read-only)
- Full name (editable)
- Change password → redirect or modal

#### Tab — Notifications (future)
- Email on disconnect, lockout, failed execution — toggles disabled “Soon”

#### Tab — API keys (future)
- Public API section grayed out

#### Tab — Danger
- Delete account (Supabase user) — destructive

---

### 8.15 Billing `/settings/billing` (future — design now, ship later)

- Current plan card
- Usage meters: accounts used/limit, followers used/limit
- Payment method (Stripe)
- Invoice history table
- Upgrade/downgrade CTAs

**MVP:** Single card “Free plan” + **Upgrade** buttons disabled.

---

### 8.16 Support `/support`

- FAQ accordion (copy setup, MT5 requirements, security)
- Contact email link
- Link to documentation (future)
- System status link (future)

---

## 9. Admin pages (design for Phase 4 — not MVP build)

For designer completeness; use “Admin” visual language (accent border or separate nav).

### 9.1 Admin users `/admin/users`
- Table: email, plan, account count, created, suspend toggle

### 9.2 Admin accounts `/admin/accounts`
- Cross-user account list, connection status, no passwords

### 9.3 Admin worker nodes `/admin/workers`
- Table: worker name, region, status, capacity, active sessions, last heartbeat
- Detail: sessions list

### 9.4 Admin failed executions `/admin/failed-executions`
- Filtered log view across all users

### 9.5 Admin system health `/admin/health`
- API status, Supabase status, worker count online

### 9.6 Admin billing overview `/admin/billing`
- MRR placeholder, subscriber counts

---

## 10. Modals & dialogs (catalog)

Design each modal consistently (title, body, primary/secondary actions):

| Modal | Trigger | Content |
|-------|---------|---------|
| Delete account | Account detail | Warning + type account label to confirm |
| Delete copier | Copier detail | Warning |
| Disable copier | Toggle off | “Follower will stop receiving copies” |
| Unlock risk | Risk detail | Confirm unlock |
| Flatten positions | Risk detail | Strong warning + confirm |
| Test connection result | Test button | Success/fail message + broker code |
| Plan upgrade | Limit banners | Plan comparison mini |

---

## 11. Responsive behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop ≥1280px | Full sidebar + wide tables |
| Tablet 768–1279px | Collapsible sidebar; tables horizontal scroll |
| Mobile <768px | Bottom nav or hamburger; cards instead of wide tables; log detail full-screen drawer |

**Mobile priority pages:** Dashboard, Logs, Accounts list (traders check copy status on phone).

---

## 12. Accessibility & UX requirements

- WCAG AA contrast on all badge text
- Focus states on all interactive elements
- Form labels always visible (not placeholder-only)
- Error messages linked to inputs (`aria-describedby`)
- Tables: semantic headers; status not color-only (include text/icon)
- Loading: skeleton, not blank flash
- Destructive actions require confirmation

---

## 13. Copy & microcopy guidelines

| Context | Tone |
|---------|------|
| Errors | Plain English + what to do next |
| Security | Factual, brief — “Encrypted at rest” |
| Slippage skip | “Copy skipped — signal exceeded 3000ms age limit” |
| Empty states | Action-oriented |
| Marketing | Confident, no “AI-powered” fluff |

**Product name:** Always “Delta Engine” (not “DeltaEngine” in prose).

---

## 14. MVP vs future (designer deliverable checklist)

### Must design for MVP (development Phase 3a)

- [ ] Design system (colors, type, buttons, badges, tables, cards)
- [ ] App shell (sidebar + top bar)
- [ ] Login, Register, Forgot password
- [ ] Dashboard overview
- [ ] Accounts list, Add account, Account detail
- [ ] Copiers list, Create copier, Copier detail
- [ ] Execution logs list + detail/drawer
- [ ] Settings profile tab
- [ ] All status badges (Section 4)
- [ ] Empty states + loading skeletons
- [ ] Mobile layouts for Dashboard, Accounts, Logs

### Design now, build later

- [ ] Landing + Pricing
- [ ] Risk pages (full)
- [ ] Symbol mappings
- [ ] Analytics charts
- [ ] Billing
- [ ] Admin suite
- [ ] Notifications center

---

## 15. Designer deliverables expected

1. **Figma file** (or equivalent) with linked design system page
2. **All MVP screens** at desktop + mobile breakpoints
3. **Component library** — buttons, inputs, badges, tables, cards, modals
4. **Interactive prototype** — Login → Add account → Create copier → View logs
5. **Redlines** for spacing on execution log table and account cards
6. **Icon set** — line icons, consistent stroke (Lucide-style)
7. **Optional:** Light mode tokens (not required for v1)

---

## 16. API reference for designers (data fields)

Designers don’t call APIs, but fields must match UI labels.

| Screen | API endpoint |
|--------|--------------|
| Accounts | `GET/POST/PATCH/DELETE /api/accounts` |
| Copiers | `GET/POST/PATCH/DELETE /api/copiers`, enable/disable |
| Logs | `GET /api/execution-events` |
| Risk | `GET/POST/PATCH /api/risk-profiles`, unlock, flatten |
| Auth | Supabase Auth (email/password) |

**Never displayed:** `encrypted_password`, raw JWT, service keys.

---

## 17. User flows (for prototype)

### Flow A — First-time setup
Register → Dashboard empty → Add account → Create copier → View logs (empty) → User starts worker externally → Logs populate

### Flow B — Monitor copy
Dashboard → see failed count → Logs filtered by failed → Log detail → Adjust max signal age on copier

### Flow C — Risk lockout (future)
Dashboard alert banner → Risk page → See locked reason → Unlock or Flatten

### Flow D — Plan limit
Add account → blocked → Billing upgrade CTA

---

## 18. Open questions for product (designer can assume defaults)

| Question | MVP default |
|----------|-------------|
| App route prefix | `/dashboard` vs `/app/dashboard` — designer picks; dev will follow Figma URLs |
| Account role (master/follower) | Implicit via copier selection — no “role” field on account UI |
| Real-time logs | Polling OK for MVP; live badge optional |
| Logo | Wordmark “Delta Engine” + simple mark (triangle/delta motif suggested, not required) |

---

## 19. Frontend technical architecture (for designers + developers)

Understanding data flow helps designers know what is live vs placeholder.

```
Browser (Next.js)
  ├─ Supabase Auth (cookies) — login, session, JWT
  └─ FastAPI (Bearer JWT) — all business data
        └─ Supabase Postgres (service role) — accounts, copiers, logs
Worker (separate process, not in browser)
  └─ FastAPI internal API (X-Worker-Key) — runtime config, execution events
```

**Rules for UI:**
- Dashboard **never** reads broker passwords from API (field does not exist in responses).
- Dashboard **never** calls `/internal/*` routes (worker-only).
- All mutations that touch credentials go through `POST /api/accounts`, not Supabase client directly.
- Execution logs are **read-only** in UI (written by worker).

**Environment variables (designer awareness only):**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — auth
- `NEXT_PUBLIC_API_URL` — FastAPI base (e.g. `http://localhost:8000`)

---

## 20. Page wireframes (ASCII layout references)

Designers should translate these into high-fidelity frames. Dimensions are logical, not pixel-perfect.

### 20.1 App shell (desktop)

```
┌──────────────┬────────────────────────────────────────────────────────────┐
│ DELTA ENGINE │  Dashboard                              ● Worker online  👤 │
│              ├────────────────────────────────────────────────────────────┤
│ ◉ Overview   │  [ optional global alert banner                          ] │
│ ○ Accounts   │                                                            │
│ ○ Copiers    │                     PAGE CONTENT                           │
│ ○ Logs       │                                                            │
│ ○ Risk       │                                                            │
│ ○ Analytics  │                                                            │
│ ○ Settings   │                                                            │
│              │                                                            │
│──────────────│                                                            │
│ user@email   │                                                            │
│ Free plan    │                                                            │
│ Log out      │                                                            │
└──────────────┴────────────────────────────────────────────────────────────┘
     240px                              fluid (max 1280px forms / full tables)
```

### 20.2 Dashboard

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Accounts    │ │ Copiers     │ │ Copied 24h  │ │ Avg latency │
│ 2 / 2 conn  │ │ 1 active    │ │ 14          │ │ 464 ms      │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

┌───────────────────────────────┐ ┌───────────────────────────────┐
│ Recent execution events       │ │ Account health                │
│ time | event | sym | status   │ │ ● Demo Master    Connected    │
│ ...                           │ │ ● Demo Follower  Connected    │
│ [View all logs]               │ │ [Manage accounts]             │
└───────────────────────────────┘ └───────────────────────────────┘
```

### 20.3 Execution logs (hero page)

```
Execution logs                                    [ Export CSV (disabled) ]
Every signal, every attempt, every result.

┌─ Filters (sticky) ──────────────────────────────────────────────────────┐
│ [24h ▼] [Status ▼] [Event ▼] [Symbol____] [Copier ▼] [Account ▼] [Apply]│
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ Time     Status    Event      Master tk  Follower tk  Sym      Latency  │
│ 2m ago   Success   Opened     2795…      2795…       BTCUSDm  464ms    │
│ 5m ago   Skipped   Opened     2795…      —           BTCUSDm  13806ms  │
└─────────────────────────────────────────────────────────────────────────┘
                                        [< 1 2 3 >]  50 per page
```

### 20.4 Add account form

```
┌─ Add trading account ─────────────────────────────────────┐
│ 🔒 Passwords encrypted with AES-256-GCM. Never shown again.│
│                                                            │
│ Account label    [ Demo Master________________ ]           │
│ Platform         [ MT5 ▼                       ]           │
│ Account number   [ 436006434__________________ ]           │
│ Broker server    [ Exness-MT5Trial9___________ ]           │
│ Password         [ ••••••••••••  ] [👁]                    │
│ ▶ Advanced       Terminal path (optional)                  │
│                                                            │
│              [ Cancel ]  [ Save account ]                  │
└────────────────────────────────────────────────────────────┘
```

### 20.5 Create copier (two-column)

```
┌─ Form (60%) ──────────────────┐  ┌─ Preview (40%) ─────────────┐
│ Label [ Copier 1________ ]    │  │ Master: Demo Master         │
│ Master  [ Demo Master ▼  ]    │  │   ● Connected  MT5          │
│ Follower[ Demo Follower ▼]    │  │ Follower: Demo Follower     │
│                               │  │   ● Connected  MT5          │
│ Lot mode ◉ Multiplier ○ Fixed │  │                             │
│ Multiplier [ 1.0____ ]        │  │ Rules: SL TP Close Modify   │
│ Toggles: [✓] SL [✓] TP ...    │  │ Signal age: 3000ms          │
│ ▶ Advanced execution          │  │                             │
│                               │  │                             │
│ [ Cancel ] [ Create copier ]  │  │                             │
└───────────────────────────────┘  └─────────────────────────────┘
```

---

## 21. Form validation matrix (all inputs)

Design inline error states for each rule.

### 21.1 Auth forms

| Field | Rules | Error copy |
|-------|-------|------------|
| Email | Required, valid email | “Enter a valid email address.” |
| Password (login) | Required | “Password is required.” |
| Password (register) | Min 8 chars | “Password must be at least 8 characters.” |
| Confirm password | Must match | “Passwords do not match.” |
| Terms checkbox | Must be checked | “Accept the terms to continue.” |

### 21.2 Add account

| Field | Rules | Error copy |
|-------|-------|------------|
| Platform | Required | “Select a platform.” |
| Account number | Required, 1–64 chars | “Account number is required.” |
| Broker server | Required | “Broker server is required (exact MT5 server name).” |
| Password | Required | “Broker password is required.” |
| Terminal path | Optional, valid path format if filled | “Enter a valid Windows path.” |

### 21.3 Create / edit copier

| Field | Rules | Error copy |
|-------|-------|------------|
| Master account | Required | “Select a master account.” |
| Follower account | Required, ≠ master | “Follower must be different from master.” |
| Multiplier | 0.01–100 when multiplier mode | “Multiplier must be between 0.01 and 100.” |
| Fixed lot | 0.01–100 when fixed lot mode | “Fixed lot must be between 0.01 and 100.” |
| Max signal age | 100–30000 ms | “Signal age must be 100–30000 ms.” |

### 21.4 Risk profile

| Field | Rules | Error copy |
|-------|-------|------------|
| Max daily loss | ≥ 0 if set | “Must be zero or positive.” |
| Max lot per trade | 0.01–100 if set | “Invalid lot size.” |
| Max open positions | 1–500 | “Must be between 1 and 500.” |
| Symbol tags | Uppercase alphanumeric | “Invalid symbol format.” |

---

## 22. Page states catalog (loading, empty, error)

Every page needs **four states** designed: loading (skeleton), empty, populated, error.

| Page | Loading | Empty | Error |
|------|---------|-------|-------|
| Dashboard | Skeleton cards + table | Onboarding 3-step | “Could not load dashboard” + retry |
| Accounts | Card skeletons | “No accounts yet” + CTA | API unreachable banner |
| Account detail | Header skeleton | N/A (404 page) | Account not found |
| Copiers | Table skeleton | Diagram + CTA | Retry |
| Logs | Table skeleton | Worker hint copy | Retry |
| Log detail | Row skeleton | N/A | Event not found |
| Settings | Form skeleton | N/A | Save failed toast |

**404 page (authenticated):** “Page not found” + link to Dashboard.  
**403 page:** “You don’t have access.”  
**Session expired:** Redirect to login + toast “Session expired, sign in again.”

---

## 23. Sample mock data (for Figma prototypes)

Use realistic trading data — designers can copy verbatim.

### 23.1 User

```json
{
  "email": "trader@example.com",
  "full_name": "Alex Trader",
  "subscription_plan": "free",
  "account_limit": 2,
  "follower_limit": 1
}
```

### 23.2 Accounts

| Label | Platform | Number | Server | Status | Balance | Equity |
|-------|----------|--------|--------|--------|---------|--------|
| Demo Master | MT5 | 436006434 | Exness-MT5Trial9 | connected | 10,000.00 USD | 10,042.50 USD |
| Demo Follower | MT5 | 436006448 | Exness-MT5Trial9 | connected | 10,000.00 USD | 9,988.00 USD |

### 23.3 Copier

```json
{
  "label": "Master → Follower",
  "risk_mode": "multiplier",
  "multiplier": 1.0,
  "copy_sl": true,
  "copy_tp": true,
  "max_signal_age_ms": 3000,
  "is_enabled": true
}
```

### 23.4 Execution log rows

| Time | Status | Event | Master tk | Follower tk | Symbol | Side | Lot | Latency |
|------|--------|-------|-----------|-------------|--------|------|-----|---------|
| 2m ago | success | position_opened | 2795693957 | 2795693988 | BTCUSDm | buy | 0.01 | 464ms |
| 1h ago | skipped_slippage | position_opened | 2795693626 | — | BTCUSDm | buy | — | 13806ms |
| 3h ago | closed | position_closed | 2795670552 | 2795676482 | BTCUSDm | — | — | 271ms |
| 3h ago | modified | sl_modified | 2795671764 | 2795671783 | BTCUSDm | — | — | — |

---

## 24. Component specifications (detailed)

### 24.1 Button

| Variant | Use | Default | Hover | Disabled |
|---------|-----|---------|-------|----------|
| Primary | Main CTA | Accent fill | Darken 10% | 50% opacity |
| Secondary | Cancel, secondary | Border + transparent | bg-surface | — |
| Ghost | Table actions | Text only | bg subtle | — |
| Destructive | Delete | Red outline/fill | Darker red | — |

**Loading:** Spinner left of label; button disabled; width fixed (no layout shift).

### 24.2 Status badge

- Height: 22–24px; pill radius; padding 8px horizontal
- Always: icon (8px) + label text
- Never rely on color alone

### 24.3 Account card

```
┌─────────────────────────────────────┐
│ Demo Master              [MT5] [● Connected] │
│ #436006434 · Exness-MT5Trial9       │
│ Balance $10,000.00  Equity $10,042.50│
│ Last connected 5 minutes ago        │
│ [Enabled toggle]          [⋮ menu]   │
│ [Test connection]  [View details]   │
└─────────────────────────────────────┘
```

Min width: 320px; grid: 3 cols desktop, 2 tablet, 1 mobile.

### 24.4 Data table

- Sticky header on scroll
- Row hover: `bg-surface` highlight
- Sortable columns: chevron indicator
- Selected row (log detail open): left accent border
- Monospace columns: tickets, broker codes

### 24.5 Toast notifications

| Type | Duration | Example |
|------|----------|---------|
| Success | 4s auto-dismiss | “Account added” |
| Error | Manual dismiss | “Failed to save copier” |
| Info | 6s | “Connection test queued” |

Position: top-right stack; max 3 visible.

### 24.6 Log detail drawer

- Width: 480px desktop; full screen mobile
- Slide from right; overlay scrim 60% black
- Close: X button, Esc key, click scrim

---

## 25. Human-readable labels (execution log)

Map API enums to UI copy:

| `event_type` | Display label |
|--------------|---------------|
| `position_opened` | Position opened |
| `position_closed` | Position closed |
| `sl_modified` | Stop loss modified |
| `tp_modified` | Take profit modified |
| `volume_changed` | Volume changed |
| `api_mode_test` | System test |

| `side` | Display |
|--------|---------|
| `buy` | Buy (green pill) |
| `sell` | Sell (red pill) |

---

## 26. Plan limits UI mapping

From PRD billing tiers — show in Settings, Billing, and limit banners.

| Plan | Price | Accounts | Followers | Masters (implicit) |
|------|-------|----------|-----------|---------------------|
| Free (MVP default) | $0 | 2 | 1 | 1 |
| Starter | $19/mo | 2 | 2 | 1 |
| Pro | $49/mo | 11 | 10 | 1 |
| Scale | $99/mo | 33 | 30 | 3 |
| Elite | $149/mo | High | High | High |

**Usage meter component (Settings / Billing):**

```
Accounts     ████████░░  2 / 2
Followers    ██████████  1 / 1
```

When limit hit: primary action disabled + amber banner + “Upgrade plan” link.

---

## 27. Landing page copy blocks (designer-ready text)

### Hero
- **Headline:** Copy MT5 trades across accounts — managed in the cloud.
- **Subhead:** Connect master and follower accounts, set your rules, and monitor every copied trade with full execution logs and risk controls.
- **Primary CTA:** Start free
- **Secondary CTA:** See pricing

### Feature cards (titles + body)
1. **Cloud-native copying** — No VPS setup. No Expert Advisors to install. We run the execution infrastructure.
2. **Risk-first** — Daily loss limits, lockouts, and symbol filters help protect prop-firm and multi-account workflows.
3. **Transparent logs** — Every open, close, modify, skip, and failure is recorded with latency and broker codes.
4. **Cross-broker symbol mapping** — Copy between accounts even when symbol names differ.

### How it works
1. **Connect accounts** — Add MT5 demo or live accounts with encrypted credentials.
2. **Create a copier** — Pick master and follower, set lot multiplier or fixed size.
3. **Monitor execution** — Watch the audit log in real time. Adjust rules anytime.

### Footer columns
- **Product:** Features, Pricing, Docs, Changelog
- **Legal:** Privacy Policy, Terms of Service
- **Support:** Contact, Status

---

## 28. Auth screens layout spec

**Centered card layout** for all auth pages:
- Card width: 400px max
- Vertical center on viewport
- Background: subtle grid or gradient mesh (very subtle — do not distract)
- Logo above card
- Below card: secondary links

**States to design:**
- Default
- Submitting (button loading)
- Invalid credentials (shake optional — subtle)
- Email verification pending (register success)
- Reset email sent

---

## 29. Motion & animation guidelines

| Interaction | Motion |
|-------------|--------|
| Page transition | None or 150ms fade (subtle) |
| Modal open | 200ms scale 98%→100% + fade |
| Drawer open | 250ms slide from right |
| Toast enter | Slide down 200ms |
| Skeleton | Pulse 1.5s loop |
| Badge status change | Optional 300ms color crossfade |
| Table row insert (live logs) | Highlight fade 2s (future) |

**Avoid:** Bouncy springs, parallax, excessive motion (traders prefer stability).

---

## 30. Z-index scale

| Layer | z-index | Examples |
|-------|---------|----------|
| Base content | 0 | Page body |
| Sticky filters | 10 | Logs filter bar |
| Sidebar | 20 | Nav |
| Top bar | 30 | Header |
| Dropdown | 40 | Menus, selects |
| Drawer | 50 | Log detail |
| Modal | 60 | Confirm delete |
| Toast | 70 | Notifications |
| Tooltip | 80 | Help icons |

---

## 31. Icon inventory (Lucide-style line icons)

Designers should assign consistent icons for:

| Context | Icon name suggestion |
|---------|---------------------|
| Overview | `LayoutDashboard` |
| Accounts | `Wallet` or `Server` |
| Copiers | `Copy` or `GitBranch` |
| Logs | `ScrollText` |
| Risk | `Shield` |
| Analytics | `BarChart3` |
| Settings | `Settings` |
| Connected | `CheckCircle` |
| Disconnected | `Circle` |
| Failed | `XCircle` |
| Warning | `AlertTriangle` |
| Buy | `TrendingUp` |
| Sell | `TrendingDown` |
| Latency | `Timer` |
| Encrypt | `Lock` |
| Worker online | `Activity` (green dot) |
| Worker offline | `Activity` (gray dot) |
| Delete | `Trash2` |
| Edit | `Pencil` |
| External link | `ExternalLink` |
| Help | `HelpCircle` |

---

## 32. Page acceptance criteria (MVP — for design sign-off)

### Dashboard
- [ ] Shows 4 stat cards with real or placeholder metrics
- [ ] Recent logs table shows min 5 rows with status badges
- [ ] Empty state for new users with 3-step CTA
- [ ] Alert banner when accounts disconnected

### Accounts
- [ ] List shows all fields from Section 8.2
- [ ] Add form validates all required fields
- [ ] Password field has show/hide + security callout
- [ ] Delete confirms in modal
- [ ] Plan limit disables “Add account”

### Copiers
- [ ] Table shows copy rule icons (SL/TP/Close/Modify)
- [ ] Create form preview panel updates on selection
- [ ] Self-copy validation message shown
- [ ] Enable/disable toggle on list and detail

### Execution logs
- [ ] All columns from Section 8.11 present
- [ ] Latency color coding applied
- [ ] Filters sticky on scroll
- [ ] Row opens drawer with full detail + raw JSON
- [ ] Pagination designed

### Auth
- [ ] Login, register, forgot password, reset password
- [ ] All error states designed

---

## 33. API endpoint reference (complete — for dev handoff)

| Method | Endpoint | UI usage |
|--------|----------|----------|
| GET | `/health` | Status page / dev |
| POST | `/api/accounts` | Add account |
| GET | `/api/accounts` | Accounts list |
| GET | `/api/accounts/:id` | Account detail |
| PATCH | `/api/accounts/:id` | Update label, enabled |
| DELETE | `/api/accounts/:id` | Delete account |
| POST | `/api/accounts/:id/test-connection` | Test button → returns `pending` in MVP |
| POST | `/api/accounts/:id/start-session` | Start session (queued MVP) |
| POST | `/api/accounts/:id/stop-session` | Stop session |
| POST | `/api/copiers` | Create copier |
| GET | `/api/copiers` | Copiers list |
| GET | `/api/copiers/:id` | Copier detail |
| PATCH | `/api/copiers/:id` | Update settings |
| DELETE | `/api/copiers/:id` | Delete |
| POST | `/api/copiers/:id/enable` | Enable |
| POST | `/api/copiers/:id/disable` | Disable |
| GET | `/api/execution-events` | Logs list (filters: status, symbol, copier, pagination) |
| GET | `/api/execution-events/:id` | Log detail |
| POST | `/api/risk-profiles` | Create risk |
| GET | `/api/risk-profiles` | Risk list |
| PATCH | `/api/risk-profiles/:id` | Update risk |
| POST | `/api/risk-profiles/:id/unlock` | Unlock |
| POST | `/api/risk-profiles/:id/flatten` | Flatten (future) |

**Auth header:** `Authorization: Bearer <supabase_access_token>`

---

## 34. Keyboard shortcuts (optional MVP — design hint in Settings)

| Shortcut | Action |
|----------|--------|
| `G` then `D` | Go to Dashboard |
| `G` then `L` | Go to Logs |
| `G` then `A` | Go to Accounts |
| `/` | Focus log search (future) |
| `Esc` | Close drawer/modal |

---

## 35. SEO & meta (public pages only)

| Page | Title | Description |
|------|-------|-------------|
| Landing | Delta Engine — Cloud MT5 Trade Copier | Copy trades across MT5 accounts with risk controls and full audit logs. |
| Pricing | Pricing — Delta Engine | Simple plans for prop-firm and multi-account traders. |
| Login | Sign in — Delta Engine | — |

Open Graph image: dark branded 1200×630 with logo + tagline.

---

## 36. Related documents

| Document | Path |
|----------|------|
| Full product PRD | `Delta_Engine_Full_PRD.txt` |
| Backend API | `backend/app/api/` |
| Database schema | `supabase/migrations/` |
| Phase 2 worker integration | `README.md` |

---

*End of Frontend specification — v2.0*
