# ADR 0024: Billing through a provider, read-only when unpaid

- Status: Accepted
- Date: 2026-11-07
- Builds on: plans as data and `EntitlementService` ([ADR 0015](0015-plans-and-entitlements.md)),
  the plan lineup ([ADR 0020](0020-plan-lineup.md)), sandbox accounts
  ([ADR 0019](0019-agent-access.md)).

## Context

Crossmart Cloud sells five plans by active listings (ADR 0020): Starter, Pro, Growth and Scale
online, monthly or annually, and Enterprise by contacting sales. There is no free Cloud plan and
no fee on sales. A first subscription starts with a 7-day trial that needs a card and is charged
on day 8. An organization that does not pay becomes read-only. Self-hosting is free and must run
exactly as before, with no billing at all.

Plans and limits are already data (`plans`, `plan_versions`, `plan_features`), and every
organization has an `organization_subscriptions` row pointing at its plan version, with empty
provider fields left for billing. Limits are reported but not enforced
(`ENTITLEMENTS_ENFORCED=false`), because nobody could upgrade yet.

## Decision

**1. A provider behind an interface.** `libs/core/src/billing` talks to an abstract
`BillingProvider`: find prices by lookup key, create a customer, a checkout session and a portal
session, read a subscription, and verify a webhook. `StripeBillingProvider` implements it with the
official `stripe` package; `DisabledBillingProvider` is used when `BILLING_DRIVER=none` (the
default), and tests use a fake. Crossmart never sees a card: checkout, card changes, plan changes,
cancellation and invoices happen on Stripe's hosted Checkout and Customer Portal.

**2. Billing is per organization and optional.** `BILLING_DRIVER=stripe` with `STRIPE_SECRET_KEY`
turns it on; `STRIPE_WEBHOOK_SECRET` lets the webhook endpoint accept events. Without them nothing
is billed, every price list is empty and the billing routes that would charge answer 404.

**3. Prices live at the provider.** Each plan price has a lookup key,
`crossmart_<plan code>_<monthly|annual>`, such as `crossmart_starter_monthly`. The API reads the
prices by lookup key (cached ten minutes), so no amount is written in code. A plan with no price
is not self-serve: Enterprise is sold through `BILLING_SALES_EMAIL`. `pnpm billing:sync-stripe`
creates the products, the prices from `tools/billing/plan-prices.json`, and a Customer Portal
configuration that lets customers switch between them. A changed amount becomes a new price that
takes over the lookup key; subscriptions on the old one keep it.

**4. The subscription row is the source of truth for entitlements.** Migration
`20261116100000_billing` adds the billing interval, the trial end, `cancel_at_period_end`, when the
subscription became past due, the statuses `INCOMPLETE`, `UNPAID` and `PAUSED`, a unique index on
the provider customer id, and `billing_webhook_events`. Webhooks move the row to the plan version
the subscription's price names: the latest version of a new plan, or the version the organization
already has when the plan is the same (grandfathering, ADR 0015). `EntitlementService` reads the
plan from that row, so limits follow at once. The customer id stays on the subscription row
(`external_customer_id`), which ADR 0015 reserved for it and which is one per organization.

**5. Webhooks are verified, idempotent and reconciled.** `POST /api/v1/billing/webhooks/stripe`
verifies the signature over the raw body (400 otherwise), records the event id in
`billing_webhook_events` before handling it (a redelivery is skipped; a failure removes the record
so Stripe's retry runs again), and then reads the subscription from Stripe rather than trusting
the event's copy, so late or out-of-order events cannot leave an old state. Handled events:
`checkout.session.completed`, `customer.subscription.created`, `.updated`, `.deleted`,
`.trial_will_end`, `invoice.paid` and `invoice.payment_failed`. An older subscription that ended
cannot undo a newer live one.

**6. Read-only, not locked out.** `SubscriptionAccessPolicy` gives each organization an access
state. Trialing, active, past due within `BILLING_PAST_DUE_GRACE_DAYS` (default 7), and
organizations from before billing keep full access. Never subscribed, past due after the grace
period, canceled, unpaid and paused are read-only: every `GET` works, and the global
`SubscriptionWriteGuard` refuses other methods on workspace routes with **402** and
`code: subscription_inactive`, after the workspace guard so only members learn of it. The message
tells people and agents to ask an owner or admin of the organization to fix it in Settings,
Billing. Routes that remove access or data stay open (`@AllowedWhileReadOnly()`): revoking API
keys, agents and invitations, removing members, leaving, deleting webhook endpoints, disconnecting
stores and deleting the workspace. Creating a workspace checks it too. There is no automatic
overage: plan limits keep answering `plan_limit_reached`.

**7. Enforcement needs both switches.** Read-only applies only when billing is on **and**
`ENTITLEMENTS_ENFORCED=true`. `ENTITLEMENTS_ENFORCED` is already the one switch that turns
commercial limits from reported into refused; tying read-only to it too means Cloud can ship
checkout first, watch organizations subscribe, and then turn enforcement on for limits and
payment together. Self-hosting never enables billing, so neither applies there. The access state
is still computed and shown while enforcement is off, so the web app can show trial and payment
banners.

**8. Existing organizations are grandfathered by default.** The migration changes no rows. Every
organization from before billing has status `ACTIVE` and no provider subscription, which reads as
legacy access: full access, indefinitely, until it chooses a plan. `BILLING_LEGACY_ACCESS_UNTIL`
(an ISO date) ends that: after it, a legacy organization without a subscription is read-only.
Organizations created once billing is on start `INCOMPLETE` (and must check out before writing,
once enforced). A subscription row created lazily for an organization that has none reads as
legacy, so no path locks anyone out on deploy.

**9. Sandboxes cannot pay.** Checkout calls `assertSandboxAllowsInOrganization` with the new
`SandboxRestriction.Subscribe`: an unclaimed sandbox (ADR 0019) answers 403
`sandbox_claim_required`. An unclaimed sandbox is also exempt from read-only: the sandbox rules
already restrict it, and its owner chooses a plan after claiming it.

**10. Who may manage billing.** The new `billing:manage` permission (owners and admins, like
`billing:view`) starts checkout and opens the portal. Billing routes need a signed-in person:
API keys and agents never reach them, and agents get no billing scope.

**11. Add-ons later, without a redesign.** The +1,000 listings add-on and AI credit packs will be
more subscription items with lookup keys of their own (`crossmart_addon_<name>_<interval>`). The
sync already picks the plan item by its lookup key and ignores other items. They will be stored
as rows of extra grants per organization that `OrganizationPlanService` adds on top of the plan
version; neither the table nor the UI is built yet.

## Consequences

- New endpoints under `/api/v1`: `GET /billing/plans` (public), `GET
/organizations/{id}/billing`, `POST /organizations/{id}/billing/checkout-sessions`, `POST
/organizations/{id}/billing/portal-sessions`, and `GET /workspaces/{id}/billing-access` for
  every member and agent. 402 responses that documented `PlanLimitErrorDto` now document either
  that or `SubscriptionInactiveErrorDto`.
- Background work (order ingestion, inventory sync, reconciliation) keeps running for a read-only
  organization; only requests are refused. Stopping it would let stores oversell.
- The Stripe webhook endpoint must use the API version the `stripe` package pins
  (`2026-09-30.endive` for 23.x), since event payloads change shape between versions.
- Prices are in USD only. Stripe Tax is off unless `STRIPE_AUTOMATIC_TAX=true`.
