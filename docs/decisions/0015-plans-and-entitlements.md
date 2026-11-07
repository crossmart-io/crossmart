# ADR 0015: Plans as data, enforced by one entitlement service

- Status: Accepted. The seeded plans are superseded by [ADR 0020](0020-plan-lineup.md).
- Date: 2026-11-05

## Context

Pricing will change, and customers must keep what they bought when it does. Limits are
checked in many places (publishing, connecting channels, workspaces, members, API keys, later AI).
Billing is not built yet, so limits cannot block anyone in production until merchants can upgrade.

## Decision

- Plans are data: `plans` (code, name, active, default, sort order), `plan_versions`, and
  `plan_features` (one row per feature: enabled, and a limit where null is unlimited). A plan is
  changed by adding a version; versions organizations are on are never edited. Each organization
  has one `organization_subscriptions` row pointing at a plan version (grandfathering), with
  nullable billing provider ids for Stripe later. Free, Starter, Growth and Agency are seeded by a
  migration as a starting point; Enterprise is custom and not seeded.
- `Feature` (a string enum) names every limit and flag. A feature a version does not list is not
  included, so a migration adding a feature must give every existing version a row.
- `EntitlementService` answers every question (`limit`, `usage`, `check`, `assert`). Usage is
  counted from the data with one aggregate query per feature, never stored, so it cannot drift.
- A refused action is HTTP **402 Payment Required** with `code` (`plan_limit_reached`,
  `plan_feature_not_included`), `feature`, `limit`, `usage` and `requested`. We chose 402 over 403
  because the caller is allowed to do it and the plan is not: 403 stays reserved for permissions,
  so clients can tell "ask an admin" from "upgrade".
- `ENTITLEMENTS_ENFORCED` (default false) decides whether `assert` blocks. Limits and usage are
  computed and reported either way.

## Consequences

- Nothing outside `libs/core/src/entitlements` reads plan names or numbers.
- With enforcement off there is no cap on workspaces per organization (the old fixed cap of 25 is
  now the Agency plan's limit).
- Checks are count-then-write, so concurrent requests can pass a limit by a few. Limits are
  commercial, not safety bounds, so this is accepted.
