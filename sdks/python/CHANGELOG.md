# Changelog

All notable changes to the `crossmart` Python package are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow the policy in
[sdks/RELEASING.md](https://github.com/crossmart-io/crossmart/blob/main/sdks/RELEASING.md).

## [Unreleased]

### Added

- Ask Crossmart conversations and escalations: `conversationId` and `channel` on a question,
  and `conversationId`, `turnId` and `escalation` on the answer; `POST /ask/escalations` to hand
  a conversation to a person and `GET /ask/escalations/{escalationId}` to read the reply; and the
  types `AskChannel`, `AskEscalationReason`, `AskEscalationStatus`. `platformAdmin` on `/me`, and
  the platform admins' `/admin/ask` routes (404 for everyone else).

- Billing types from the API: `BillingInterval`, `SubscriptionAccessState`, plans with prices,
  the organization's billing status, and the `subscription_inactive` error code. Where billing
  is on (Crossmart Cloud), a write to a read-only organization answers 402 with that code:
  reading still works, and a billing admin of the organization renews the subscription.

- `cancel_at` on the billing status and on the subscription access: when a scheduled cancellation
  ends the subscription (during a trial, the trial end, with nothing charged), or null when it
  renews.

- `verify_webhook_signature` checks a webhook delivery's `Crossmart-Signature` header against the
  raw body (HMAC-SHA256, constant-time, five-minute tolerance, secret rotation) and returns the
  parsed `WebhookEvent`. It raises `WebhookSignatureError` when the delivery cannot be trusted.

### Changed

- The SDK is licensed under [MIT](LICENSE), copyright YIOT LLC, instead of AGPL-3.0-only.

## [0.1.0] - not yet released

### Added

- The first release of the Python SDK: synchronous and asynchronous clients for products,
  inventory, stores, listings, orders, reports, AI content and suggestions, generated from the
  API's OpenAPI document, with cursor pagination, typed exceptions and retries.
