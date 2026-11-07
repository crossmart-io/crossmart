# Changelog

All notable changes to `@crossmart/sdk` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow the policy in
[sdks/RELEASING.md](https://github.com/crossmart-io/crossmart/blob/main/sdks/RELEASING.md).

## [Unreleased]

### Added

- Billing types from the API: `BillingInterval`, `SubscriptionAccessState`, plans with prices,
  the organization's billing status, and the `subscription_inactive` error code. Where billing
  is on (Crossmart Cloud), a write to a read-only organization answers 402 with that code:
  reading still works, and a billing admin of the organization renews the subscription.

- `verifyWebhookSignature` checks a webhook delivery's `Crossmart-Signature` header against the
  raw body (HMAC-SHA256, constant-time, five-minute tolerance, secret rotation) and returns the
  parsed `WebhookEvent`. It throws `WebhookSignatureError` when the delivery cannot be trusted.

## [0.1.0] - not yet released

### Added

- The first release of the TypeScript SDK: products, inventory, stores, listings, orders, reports,
  AI content and suggestions, typed from the API's OpenAPI spec, with cursor pagination, typed
  errors and retries.
