# ADR 0007: Inventory ledger and last-unit policies

- Status: Accepted
- Date: 2026-10-31

## Context

Marketplaces do not call merchants before checkout, so a pre-purchase lock is impossible except on AI checkout protocols.

## Decision

A single inventory ledger with atomic reservation on order ingestion, idempotent orders, webhooks plus polling, priority fan-out and reconciliation every 15 minutes. Defaults: buffer 0, low-stock lock at 2 or fewer units (primary channel only). Oversell incidents produce resolution suggestions. On AI checkout (ACP), reserve with a TTL before payment.

## Consequences

Inventory is the highest-priority queue. Each workspace needs a primary channel selected at onboarding.
