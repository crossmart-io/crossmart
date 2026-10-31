# ADR 0001: Crossmart is a listing hub, not a store

- Status: Accepted
- Date: 2026-10-31

## Context

Merchants and agencies need one place to manage listings across marketplaces. Competing with Shopify or other storefronts is not the goal.

## Decision

Crossmart is a classic SaaS with a monthly subscription, aimed at merchants and agencies. Shopify is treated as one more channel. Catalog modes: Native and Import (Crossmart owns the data afterwards). Gateway mode (an external store stays the owner) comes later. There is no field-level ownership. Each listing holds base content plus per-channel overrides.

## Consequences

There is a single source of truth and no sync conflicts. After import, the source store becomes a destination channel, and merchants edit products in Crossmart.
