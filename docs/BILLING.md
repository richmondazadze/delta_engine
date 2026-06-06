# CopyMorphic billing (Stripe)

Pricing is modeled after [TradersConnect](https://tradersconnect.com/pricing) — **per linked account** for the copier, with optional flat add-ons — at **slightly lower** rates.

## Plans

| Plan | CopyMorphic | TradersConnect | Billing model |
|------|-------------|----------------|---------------|
| **Standard** | **$9** / account / month | $10 / account / month | Per linked trading account |
| **Premium** | **$14** / account / month | $15 / account / month | Per account + priority routing |
| **Analyzer** | **$27.99** / month | $29.99 / month | Flat add-on (portfolio analytics) |
| **Dedicated** | **$28** / month | $30 / month | Private worker (contact / future self-serve) |
| **Free** | $0 | No free trial at TC | 1 account, 1 copy link |

Annual billing (save ~35%) can be added in Stripe as separate yearly prices later.

## What you need to set up in Stripe

### 1. Stripe account

1. Create or open a [Stripe Dashboard](https://dashboard.stripe.com) account.
2. Stay in **Test mode** until launch; switch to Live when ready.

### 2. Create products & recurring prices

In **Products → Add product**, create:

| Product name | Price | Recurring | Env variable |
|--------------|-------|-----------|--------------|
| CopyMorphic Standard | **$9.00 USD** | Monthly | `STRIPE_PRICE_STANDARD` |
| CopyMorphic Premium | **$14.00 USD** | Monthly | `STRIPE_PRICE_PREMIUM` |
| CopyMorphic Analyzer | **$27.99 USD** | Monthly | `STRIPE_PRICE_ANALYZER` |
| CopyMorphic Dedicated | **$28.00 USD** | Monthly | `STRIPE_PRICE_DEDICATED` |

For **Standard** and **Premium**, enable **per-unit / quantity** pricing (Stripe treats subscription quantity as number of accounts).

Copy each **Price ID** (`price_...`) into repo root `.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STANDARD=price_...
STRIPE_PRICE_PREMIUM=price_...
STRIPE_PRICE_ANALYZER=price_...
STRIPE_PRICE_DEDICATED=price_...
```

Restart the FastAPI backend after changing env vars.

### 3. Webhook endpoint

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://<your-api-host>/api/billing/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

Local testing with Stripe CLI:

```powershell
stripe listen --forward-to localhost:8000/api/billing/webhook
# Use the printed whsec_... as STRIPE_WEBHOOK_SECRET locally
```

### 4. Customer portal (optional but recommended)

Stripe Dashboard → **Settings → Billing → Customer portal** — enable so users can update payment method, change quantity, or cancel.

The app exposes **Manage billing** via `POST /api/billing/portal`.

## How checkout works in the app

1. User picks **Standard** or **Premium** and **number of accounts** on `/settings/billing` or marketing `/pricing`.
2. `POST /api/billing/checkout` creates a Stripe Checkout Session with `quantity = account count`.
3. Optional **Analyzer** is a second line item on the same checkout.
4. Webhook syncs `tc_users`:
   - `subscription_plan` → `standard` | `premium` | …
   - `account_limit` & `follower_limit` → subscription quantity
   - `is_active_subscriber` → true

## API routes

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/billing/plans` | Public |
| POST | `/api/billing/checkout` | JWT |
| POST | `/api/billing/portal` | JWT |
| POST | `/api/billing/webhook` | Stripe signature |

## Still manual today

- **Dedicated** worker provisioning — billed in Stripe when configured; worker VPS assignment is ops/manual until cloud infra phase.
- **Quantity changes** when user adds accounts without updating subscription — prompt them to open the billing portal or increase quantity at checkout.

## Security

- Never put `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` in the frontend.
- Prefer a [restricted API key](https://docs.stripe.com/keys/restricted-api-keys) in production.
