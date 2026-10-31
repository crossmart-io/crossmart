# ADR 0006: Two-way sync scope for the MVP

- Status: Accepted
- Date: 2026-10-31

## Context

Overselling and missing orders are the main reasons merchants churn from multichannel tools.

## Decision

The MVP covers listings, price, inventory (two-way), listing status and errors, order ingestion, and pushing tracking. Returns, refunds, messages and reviews come in phase 2. A WMS is out of scope.

## Consequences

The architecture must be event-driven, with webhook ingestion, polling fallback and priority queues.
