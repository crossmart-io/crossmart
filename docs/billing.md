# Billing

Crossmart Cloud sells its plans through Stripe ([ADR 0024](decisions/0024-billing.md)). Billing is
optional: a self-hosted Crossmart runs with `BILLING_DRIVER=none` (the default), bills nobody and
restricts nothing.

## How it works

- **Plans** are data (`plans`, `plan_versions`, `plan_features`). What each plan includes is read
  from there; what it costs is read from Stripe by **lookup key**, `crossmart_<plan>_<interval>`
  (`crossmart_growth_annual`). A plan without prices, such as Enterprise, is sold through
  `BILLING_SALES_EMAIL`.
- **Checkout.** An owner or admin (`billing:manage`) picks a plan and interval. The API creates the
  organization's Stripe customer the first time and answers a Stripe Checkout URL. The first
  subscription gets a `BILLING_TRIAL_DAYS` trial (7) with the card collected; it is charged when
  the trial ends.
- **Changes** (plan, interval, card, cancellation, invoices) happen in the Stripe Customer Portal.
- **Webhooks** keep `organization_subscriptions` in line with Stripe: status, interval, period,
  trial, cancellation, and the plan version the price names. Limits follow, since
  `EntitlementService` reads the plan from that row.
- **Read-only.** Without a subscription in good standing (never started, canceled, unpaid, paused,
  or past due longer than `BILLING_PAST_DUE_GRACE_DAYS`), writes to the organization's workspaces
  answer `402` with `code: subscription_inactive`. Reads always work. This applies only when billing
  is on **and** `ENTITLEMENTS_ENFORCED=true`.
- **Organizations from before billing** keep full access until they choose a plan, or until
  `BILLING_LEGACY_ACCESS_UNTIL` when it is set. New organizations must check out once enforcement
  is on. Unclaimed sandbox accounts cannot check out, and are not made read-only.

## API

| Method and path                                             | Who                      | What                                     |
| ----------------------------------------------------------- | ------------------------ | ---------------------------------------- |
| `GET /api/v1/billing/plans`                                 | anyone                   | Offered plans, what they include, prices |
| `GET /api/v1/organizations/{id}/billing`                    | `billing:view`           | Subscription, access state, trial offer  |
| `POST /api/v1/organizations/{id}/billing/checkout-sessions` | `billing:manage`         | `{ planCode, interval }` → Checkout URL  |
| `POST /api/v1/organizations/{id}/billing/portal-sessions`   | `billing:manage`         | Customer Portal URL                      |
| `GET /api/v1/workspaces/{id}/billing-access`                | any member, key or agent | Whether the workspace can be changed     |
| `POST /api/v1/billing/webhooks/stripe`                      | Stripe (signed)          | Billing events                           |

Usage against limits stays at `GET /api/v1/organizations/{id}/subscription`.

## Configuration

| Variable                         | Default              | Meaning                                                        |
| -------------------------------- | -------------------- | -------------------------------------------------------------- |
| `BILLING_DRIVER`                 | `none`               | `stripe` turns billing on                                      |
| `STRIPE_SECRET_KEY`              |                      | Required with `stripe`. Never logged                           |
| `STRIPE_WEBHOOK_SECRET`          |                      | The endpoint's signing secret; without it events are refused   |
| `STRIPE_PORTAL_CONFIGURATION_ID` | Stripe's default     | The portal configuration `billing:sync-stripe` creates         |
| `STRIPE_AUTOMATIC_TAX`           | `false`              | Stripe Tax at checkout (set Stripe Tax up first)               |
| `BILLING_TRIAL_DAYS`             | `7`                  | Trial of a first subscription; `0` for none                    |
| `BILLING_PAST_DUE_GRACE_DAYS`    | `7`                  | Full access after a failed payment, before read-only           |
| `BILLING_LEGACY_ACCESS_UNTIL`    | unset (for good)     | ISO date when organizations from before billing must subscribe |
| `BILLING_SALES_EMAIL`            | `hello@crossmart.io` | Where non-self-serve plans send people                         |
| `ENTITLEMENTS_ENFORCED`          | `false`              | With billing on, also turns read-only on                       |

## Setting up Stripe

1. **Products and prices.** With a test key in `.env`:

   ```bash
   pnpm billing:sync-stripe
   ```

   It reads the offered plans from the database and the amounts from
   `tools/billing/plan-prices.json` (minor units; annual is the yearly charge), and creates or
   updates a product per plan (`crossmart_plan_<code>`), its two prices, and a Customer Portal
   configuration. Run it again after changing prices: matching prices are left alone, a changed
   one gets a new price that takes over the lookup key. It refuses live keys unless run with
   `--live`. Set the printed `STRIPE_PORTAL_CONFIGURATION_ID`.

2. **Webhook endpoint.** In the Stripe dashboard (Developers → Webhooks), add
   `{API_PUBLIC_URL}/api/v1/billing/webhooks/stripe` with the API version the `stripe` package
   pins (`2026-09-30.endive`), and select:

   - `checkout.session.completed`
   - `customer.subscription.created`, `customer.subscription.updated`,
     `customer.subscription.deleted`, `customer.subscription.trial_will_end`
   - `invoice.paid`, `invoice.payment_failed`

   Put its signing secret in `STRIPE_WEBHOOK_SECRET`.

3. **Locally**, forward events with the Stripe CLI and use the secret it prints:

   ```bash
   stripe listen --forward-to localhost:3000/api/v1/billing/webhooks/stripe
   ```

## Tests

Unit tests run the real Stripe client against recorded fixtures
(`libs/core/src/billing/providers/stripe/__fixtures__`), with webhooks signed by Stripe's test
helper; nothing reaches the network. The e2e suite (`apps/api/test/billing.e2e-spec.ts`) replaces
the provider with `FakeBillingProvider`. Every e2e run starts with `BILLING_DRIVER=none`
(`vitest.config.e2e.ts`), whatever the local `.env` says.
