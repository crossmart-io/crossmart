# ADR 0008: Channel rollout order and credential model

- Status: Accepted
- Date: 2026-10-31

## Context

Marketplace API approvals vary from instant (Shopify) to weeks (Amazon SP-API, with a security assessment and 2026 developer fees).

## Decision

Order: Shopify, eBay, Google Merchant and Etsy, then Amazon (apply immediately), then Walmart, TikTok, Mirakl and feed channels. In the cloud, Crossmart-owned OAuth apps are used. Self-hosters bring their own app credentials or seller-provided keys.

## Consequences

The connector SDK supports both OAuth-app and seller-credential strategies. Approved cloud apps are a key reason to pay for the hosted version.
