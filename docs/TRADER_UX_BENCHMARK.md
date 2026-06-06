# Trader UX benchmark — CopyMorphic vs TradersConnect

Use this checklist when comparing our **trader-facing** home dashboard to TradersConnect (or similar copy platforms). The goal is a product a **non-technical trader** understands in under 30 seconds — not an engineer’s control panel.

Send a screenshot of TradersConnect’s home dashboard and score each row: **They do better** / **We match** / **We do better** / **N/A**.

---

## 1. First impression (home / dashboard)

| # | Question | What “good” looks like | CopyMorphic today |
|---|----------|------------------------|-------------------|
| 1.1 | Can a new user tell what the product does in one headline? | Plain benefit: “Copy trades from one account to another” | Welcome + “copy dashboard” copy on zero state |
| 1.2 | Is the primary action obvious? | One dominant CTA: link account or start copying | “Link your first account” / “New copy setup” |
| 1.3 | Is technical jargon avoided above the fold? | No “worker”, “node”, “latency”, “E2E” on home | Mostly yes; header still shows “Copy service online/offline” |
| 1.4 | Does the page feel “alive” without being noisy? | Subtle live indicator, recent trades, balances | KPI grid + recent copies + pipeline cards |
| 1.5 | Is there a guided setup path? | Checklist or wizard with 3–5 steps | “Get set up” checklist on home |

---

## 2. Language & labels (non-technical audience)

| # | Avoid (technical) | Prefer (trader) | CopyMorphic status |
|---|-------------------|-----------------|-------------------|
| 2.1 | Worker, node, session | Copy service, connection | Renamed in header/KPI; admin still uses worker terms |
| 2.2 | Master node / follower node | Master account / your account | Logs filter updated; some “master/follower” remains in copier setup |
| 2.3 | Event type, copier link | What happened / setup name | Copy log columns simplified |
| 2.4 | Latency, E2E, switch ms | Speed, “Copied in X ms” | Home activity + copy log use friendlier speed |
| 2.5 | Executed / rejected / skipped_risk | Copied / Failed / Skipped (risk limit) | Status badges use “Executed”; drawer may still show raw codes |
| 2.6 | Broker return code | Hidden in details, not main table | Removed from copy log main columns |

---

## 3. Information hierarchy

| # | Question | TradersConnect pattern (typical) | CopyMorphic |
|---|----------|----------------------------------|-------------|
| 3.1 | What is shown first? | Today’s P&amp;L or copy count, then active links | Copies today, equity change, active setups, connected accounts |
| 3.2 | Are accounts visible at a glance? | Cards with broker logo, balance, status | Account balance cards with platform badge |
| 3.3 | Are copy relationships visible? | Master → follower with ON/OFF state | Pipeline cards with health badge |
| 3.4 | Is recent activity scannable? | Short sentences, time, symbol | Message + “Copied in X ms” |
| 3.5 | Is deep detail one click away? | Expand row or side panel | Forensic drawer on copy log row click |

---

## 4. Navigation & mental model

| # | Item | Ideal for traders | CopyMorphic nav |
|---|------|-------------------|-----------------|
| 4.1 | Home | Dashboard summary | `/dashboard` — “Home” |
| 4.2 | Accounts | Link / manage brokers | `/accounts` |
| 4.3 | Copying | Setups, enable/disable | `/copiers` — “Copiers” (could be “Copy setups”) |
| 4.4 | History | Trade copy log | `/logs` — “Copy log” |
| 4.5 | Settings | Profile, billing, risk | `/settings` |
| 4.6 | Admin / ops | **Separate** from trader UI | `/admin/*` operations console (not in main menu) |

---

## 5. Visual & interaction patterns to compare in screenshot

When you share the TradersConnect home screenshot, note specifically:

1. **Hero / top strip** — Do they use a greeting, account switcher, or global status pill?
2. **KPI cards** — How many metrics? Icons? Color for up/down P&amp;L?
3. **Copy link cards** — Toggle on card vs separate page? Master/follower naming?
4. **Empty states** — Illustration vs text-only? Single CTA?
5. **Broker branding** — Logos on every account row?
6. **Mobile** — Is their dashboard responsive? (CopyMorphic is desktop-first today.)
7. **Alerts** — Banner for disconnected account vs subtle badge?
8. **Speed / performance** — Do they show copy speed to traders at all?

---

## 6. Gaps to close after screenshot review

Likely improvements once we see TradersConnect:

- [ ] Rename “Copiers” → “Copy setups” in sidebar if their label is clearer
- [ ] Add today P&amp;L as primary KPI if they lead with money, not copy count
- [ ] On-card enable/disable toggle for copy links
- [ ] Connection warning banner when any account disconnected
- [ ] Simpler copier creation wizard (fewer risk/technical fields on first setup)
- [ ] Hide forensic fields (ticket IDs, hash) until “Advanced details” in drawer
- [ ] Tooltips for “Master” / “Follower” on first visit only

---

## 7. Super-admin vs trader (intentional split)

| Surface | Audience | Purpose |
|---------|----------|---------|
| `/dashboard`, `/accounts`, … | Paying traders | Copy trades, see balances, history |
| `/admin/overview`, … | Platform operator (`subscription_plan=admin`) | Users, workers, global executions, system health |

Operators reach the console via **Operations console** in the trader sidebar footer — not mixed into normal menu items.

---

## How to use this doc

1. Paste or attach a TradersConnect home dashboard screenshot in chat.
2. Walk sections 1–5 and mark **They do better** where applicable.
3. We prioritize section 6 items that appear in their screenshot but not in ours.

Last updated: after super-admin split + trader copy pass (Copy log, Copy service labels, operations console).
