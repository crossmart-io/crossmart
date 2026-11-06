---
name: crossmart
description: >-
  Manage a seller's multichannel catalog with Crossmart: products, stock, store listings on
  Shopify, eBay and Google Merchant, and orders from every store. Use when the user wants to add or
  publish products, check why a listing failed or needs details, fix eBay categories or item
  specifics, retry a listing, adjust stock, check a store's setup, or read orders and sales, or
  mentions Crossmart. Works through the Crossmart MCP server (tools such as list_products,
  add_product_to_store, get_product_stores) and falls back to the Crossmart REST API.
license: AGPL-3.0-only
compatibility: >-
  Needs the Crossmart MCP server (https://mcp.crossmart.io/mcp) connected with a workspace API key,
  or network access to https://api.crossmart.io for the REST fallback.
metadata:
  homepage: https://crossmart.io
  source: https://github.com/crossmart-io/crossmart/tree/main/skills/crossmart
  version: '1.0.0'
---

# Crossmart

Crossmart keeps one catalog and one stock ledger for a seller and publishes them to every store
they connect (Shopify, eBay, Google Merchant). You work on one **workspace** (one business); the
API key decides which.

## Before you start

1. Check that the Crossmart MCP tools are available (for example `list_stores`). If they are not,
   help the seller connect them: see [references/setup.md](references/setup.md). Use the REST API
   ([references/rest-api.md](references/rest-api.md)) only when MCP is not an option.
2. Call `list_stores` once to learn the stores, their `id` (the `connectionId` other tools take)
   and whether each can publish.

## Safety rules (always)

- **Confirm before acting in bulk or destructively.** Before `replace_product`,
  `remove_product_from_store`, `save_item_specifics`, setting stock with mode `set`, or any change
  to more than one product, say exactly what will change and wait for a yes.
- **Never ask for marketplace passwords** (Shopify, eBay, Google). Stores are connected by the
  seller in the Crossmart dashboard (app.crossmart.io → Channels), never by you.
- **Keep API keys out of the chat.** Never ask the seller to paste a key into the conversation,
  never repeat or log one. Keys go into the MCP client's config or an environment variable.
- **Don't apply AI content on your own.** `generate_content` creates suggestions; a person approves
  them unless the seller explicitly asks you to approve a specific one.
- Report refusals as they come (`Crossmart refused (402): …`) and follow the hint in the message.

## Workflows

| The seller wants to…                                     | Read                                                                           |
| -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Connect a store, or know why a store can't publish       | [references/stores.md](references/stores.md)                                   |
| Add products, edit them, publish them to stores          | [references/products-and-publishing.md](references/products-and-publishing.md) |
| Know why a listing failed or "needs details", and fix it | [references/listing-states.md](references/listing-states.md)                   |
| Pick an eBay category or fill eBay item specifics        | [references/ebay.md](references/ebay.md)                                       |
| Receive, count or write off stock                        | [references/stock.md](references/stock.md)                                     |
| See orders, sales and stock reports                      | [references/orders-and-reports.md](references/orders-and-reports.md)           |

## Quick rules

- Publishing is asynchronous: a new listing shows `displayState` `publishing`, then `published` or
  `failed`. Check again with `get_product_stores` instead of assuming.
- On `needs_details` or `failed`, read `displayRequirement`, then `listing.missingRequirement`, then
  `displayReason`, and act on it (see [listing states](references/listing-states.md)); then
  `retry_store_listing`.
- `replace_product` saves the whole product: read it with `get_product` first and send every
  variant back with its `id`, or that variant is deleted.
- Money is a decimal string (`"19.90"`) in the workspace currency; ids are UUIDs from earlier
  calls. Never invent ids.
