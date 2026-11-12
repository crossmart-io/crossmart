# Changelog

All notable changes to `crossmart/crossmart-php` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow the policy in
[sdks/RELEASING.md](https://github.com/crossmart-io/crossmart/blob/main/sdks/RELEASING.md).

## [Unreleased]

### Added

- Connecting a channel with the credentials it issued (Falabella):
  `POST /workspaces/{workspaceId}/channel-connections/credentials` with `ConnectWithCredentialsDto`
  (`credentials` is a `FalabellaCredentialsDto`), answering `ConnectedChannelDto`, or 422
  `CredentialsRejectedErrorDto`. New `falabella` channel type, `FalabellaCountry` enum,
  `falabella` settings on `ChannelConnectionDto`, and the `credentials_rejected` connect failure.
- `exemption` on `AgentProposalSubmissionDto` (enum `AgentApprovalExemption`, `new_draft`): set
  with `apply_directly` when the workspace approves agents' changes but the call needs none, such
  as `create_product` for a new draft.
- A new account's next steps: `GET /workspaces/{workspaceId}/getting-started`
  (`GettingStartedDto`, `GettingStartedStepDto`, `StoreConnectLinkDto`, `GettingStartedStep`,
  `GettingStartedStepState`, `GettingStartedStepOwner`), the counts of products, stores and live
  listings, and the steps to a first listing with who takes each.
- Item condition, marking a product sold and the attention summary (ADR 0029): `condition`
  (`ProductCondition`) on products, `POST /workspaces/{workspaceId}/products/{productId}/mark-sold`
  (`ProductSaleDto`), `GET /workspaces/{workspaceId}/attention` (`AttentionSummaryDto`,
  `AttentionStoreReason`) and the `product_marked_sold` activity action.
- Agent Worker (ADR 0026): conversations under
  `/workspaces/{workspaceId}/agent-worker/conversations` (list, create, read, delete, cancel), and
  the `messages` and `decision` routes, which answer with server-sent events
  (`AgentWorkerStreamEventDto`); read them with an event-stream reader, not as JSON. New enums
  for its turns, actions and events, the `agent_worker:use` permission and the `agent_worker` AI
  feature.
- `PATCH /workspaces/{workspaceId}/products/{productId}` edits only a product's title and/or
  description; `PATCH /workspaces/{workspaceId}/products/{productId}/variants/{variantId}` changes
  only one variant's price and/or compare-at price; and
  `GET /workspaces/{workspaceId}/inventory-items/{inventoryItemId}` reads one variant's stock.
- The Ask channel `agent_worker`.
- Ask Crossmart conversations and escalations: `conversationId` and `channel` on a question,
  and `conversationId`, `turnId` and `escalation` on the answer; `POST /ask/escalations` to hand
  a conversation to a person and `GET /ask/escalations/{escalationId}` to read the reply; and the
  types `AskChannel`, `AskEscalationReason`, `AskEscalationStatus`. `platformAdmin` on `/me`, and
  the platform admins' `/admin/ask` routes (404 for everyone else).

- Billing types from the API: `BillingInterval`, `SubscriptionAccessState`, plans with prices,
  the organization's billing status, and the `subscription_inactive` error code. Where billing
  is on (Crossmart Cloud), a write to a read-only organization answers 402 with that code:
  reading still works, and a billing admin of the organization renews the subscription.

- `cancelAt` on the billing status and on the subscription access: when a scheduled cancellation
  ends the subscription (during a trial, the trial end, with nothing charged), or null when it
  renews.

- `Crossmart\Webhook\WebhookSignature::verify()` checks a webhook delivery's `Crossmart-Signature`
  header against the raw body (HMAC-SHA256, constant-time, five-minute tolerance, secret rotation)
  and returns a `WebhookEvent`. It throws `WebhookSignatureException` when the delivery cannot be
  trusted.

### Changed

- The SDK is licensed under [MIT](LICENSE), copyright YIOT LLC, instead of AGPL-3.0-only.

## [0.1.0] - not yet released

### Added

- The first release of the PHP SDK: products, inventory, stores, listings, orders, reports, AI
  content and suggestions, plus every other operation through `$client->api`, generated from the
  API's OpenAPI document. PSR-18 HTTP, cursor pagination, typed exceptions and retries.
