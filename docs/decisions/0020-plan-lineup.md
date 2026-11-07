# ADR 0020: The Crossmart Cloud plan lineup, priced by active listings

- Status: Accepted
- Date: 2026-11-06
- Supersedes: the plans seeded by ADR 0015 (Free, Starter, Growth, Agency, with Enterprise as
  custom) and the earlier two-plan lineup for Cloud billing (Starter $29, Growth $129). Plans as
  data, the entitlement service (ADR 0015) and the billing mechanics stay as decided there.

## Context

The first lineups were a starting point. Research into competitors showed two things:

- The tools merchants compare us with price by listings or products in tiers, with **no fee on
  sales** (LitCommerce, Channable). A percentage of sales is what merchants dislike most about
  channel connectors, and it makes the bill unpredictable.
- **$29 a month is the market's entry point.** Two plans at $29 and $129 left a gap that
  competitors fill with tiers in between, and stopped at 10,000 listings, where larger catalogs
  and agencies start.

## Decision

Five plans for Crossmart Cloud. The billing metric is **active listings**: a product live in a
store is one listing, so a product in three stores is three.

| Plan       | Monthly           | Annual (per month) | Active listings | Stores    | Workspaces | Members   | AI credits / month |
| ---------- | ----------------- | ------------------ | --------------: | --------- | ---------: | --------- | -----------------: |
| Starter    | $29               | $23                |           1,000 | 3         |          1 | 2         |                300 |
| Pro        | $59               | $47                |           3,000 | 5         |          1 | 5         |              1,500 |
| Growth     | $129              | $103               |          10,000 | 10        |          2 | 10        |              5,000 |
| Scale      | $299              | $239               |          50,000 | unlimited |          5 | 25        |             20,000 |
| Enterprise | from $999, custom | custom             |           100K+ | unlimited |  unlimited | unlimited |             custom |

- **No fee on sales or orders, and no automatic overage charges.** At a limit, new publishing
  stops and the merchant is asked to upgrade.
- **Annual billing is about 20% off.**
- **Add-ons:** +1,000 active listings for $10 a month, and AI credit packs. They are recorded here
  and sold through billing. They are not modelled yet.
- **Every plan includes everything else:** all channels, the API, MCP, the SDKs and AI agents
  (`autonomous_agents` is on in every plan). Sync speed is not a plan lever.
- **No Agency plan.** Agencies use workspaces, which Growth and above include.
- **Unchanged:** there is no free Cloud plan, a 7-day trial needs a card, and an unpaid
  organization is read-only. Self-hosting is free under AGPL and runs with no billing and no
  limits (`ENTITLEMENTS_ENFORCED` stays off by default).

Not part of the published lineup, and chosen to keep the earlier proportions:

- **API keys:** Starter 5, Pro 10, Growth 25, Scale 100, Enterprise unlimited.
- **Your own AI key** (`bring_your_own_key`): Scale and Enterprise, as Agency had it.
- **Enterprise floor:** version 1 of Enterprise grants 100,000 listings and 20,000 AI credits a
  month, with everything else unlimited. A contract with other numbers gets its own plan version.

### In the data

Migration `20261110120000_plan_lineup` changes data only. Starter and Growth get version 2, and
version 1 is left as it is. Pro, Scale and Enterprise are added. Starter becomes the default plan
for new organizations. Free and Agency become inactive: they are no longer offered, and they are
kept for the organizations on them. The subscription API reports this as `plan.offered`.

Prices, monthly and annual, are not stored with plans. Billing owns them: each
Stripe price is found by the plan `code`. Enterprise has no self-serve price, and it is sold by
contacting us.

## Consequences

- Organizations created before this change stay on the version they had (grandfathering, ADR 0015).
  That is Free for every organization so far. While limits are not enforced and billing has not
  shipped, nothing changes for them except that their plan reads as no longer offered. When billing
  ships, they choose a plan through checkout, like any organization without a paid subscription.
- New organizations start on Starter version 2. Without enforcement it only decides what the plan
  page shows.
- The marketing site's pricing page is the public copy of this table, and must change with it.
- Still to build, with billing: annual prices, the listings add-on and AI credit packs, which will
  raise an organization's limits on top of its plan version.
