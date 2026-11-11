# ADR 0029: Item condition, marking a product sold, and one attention summary

- Status: Accepted
- Date: 2026-11-11
- Builds on: channels ([ADR 0008](0008-channels.md)), overselling ([ADR 0007](0007-overselling.md))
  and outside agents' approvals ([ADR 0028](0028-outside-agent-approvals.md)).

## Context

Crossmart now targets US resellers: secondhand, one-of-a-kind items. Three gaps stood out.

1. **Condition** was a store setting (eBay's listing defaults), so a store could only list
   everything as new or everything as used. A reseller grades each item.
2. **Selling elsewhere.** A one-of-a-kind item sold in person, or on a marketplace Crossmart does
   not manage, had to be removed from each store and its stock set to zero by hand, or it could
   sell twice.
3. **What needs me now** was spread over four pages (Channels, failed listings, Agent proposals,
   Suggestions), each counted by its own client call. Home and the sidebar badge need one number
   that always agrees with those pages.

## Decision

### 1. A condition per product

`products.condition` is a nullable Prisma enum `ProductCondition` (migration
`20261122100000_product_condition`, additive). Null keeps today's behaviour: each store's default.

| `ProductCondition` | Meaning                                        | eBay (Inventory API)       | Google Merchant   |
| ------------------ | ---------------------------------------------- | -------------------------- | ----------------- |
| `NEW`              | Unused, with tags or in its unopened packaging | `NEW`                      | `NEW`             |
| `NEW_OTHER`        | Unused, without tags or packaging, or open box | `NEW_OTHER`                | `USED`            |
| `NEW_WITH_DEFECTS` | Unused, with a flaw                            | `NEW_WITH_DEFECTS`         | `USED`            |
| `LIKE_NEW`         | Used once or twice, no visible wear            | `LIKE_NEW`                 | `USED`            |
| `REFURBISHED`      | Restored to working order                      | `SELLER_REFURBISHED`       | `REFURBISHED`     |
| `USED_EXCELLENT`   | Almost no signs of wear                        | `USED_EXCELLENT`           | `USED`            |
| `USED_VERY_GOOD`   | Light signs of wear                            | `USED_VERY_GOOD`           | `USED`            |
| `USED_GOOD`        | Visible wear that does not affect use          | `USED_GOOD`                | `USED`            |
| `USED_FAIR`        | Heavy wear or cosmetic damage, but working     | `USED_ACCEPTABLE`          | `USED`            |
| `FOR_PARTS`        | Does not work as intended                      | `FOR_PARTS_OR_NOT_WORKING` | `USED`            |
| _null_             | Not set                                        | the store's default        | `NEW` (as before) |

- The set follows eBay's grades, the richest of the channels, in the words resellers use (Poshmark,
  Mercari, Depop grade the same way). eBay names grades per category ("New with tags" is `NEW` in
  clothing, `NEW_OTHER` is "New without tags"); a category that does not take a grade refuses
  the listing with eBay's own message, as it did for the store default. `CERTIFIED_REFURBISHED`
  is not offered: it needs eBay's program.
- Google has three conditions and defines `new` as "brand new, in its original, unopened
  packaging", so new items without tags or packaging, or with defects, are sent as `used`.
- **Etsy** has no condition field in Open API v3 (vintage is `when_made`), so the condition is
  not sent. **Shopify** has no native condition either. Writing the Google & YouTube app's
  `mm-google-shopping.condition` metafield is possible later; it is not done now.
- Connectors do not depend on the database: they get `ListingDraft.condition` as their own
  `ItemCondition` enum (same values), mapped by `toItemCondition` in core.
- The API takes `condition` on create and replace. Left out of a replace (`PUT`), it is **kept**;
  `null` clears it. This keeps clients that predate the field from wiping it. The MCP tools
  `create_product` and `replace_product` take it too.

### 2. Mark as sold

`POST /api/v1/workspaces/{workspaceId}/products/{productId}/mark-sold` (permission
`products:edit`; MCP tool `mark_product_sold`, scope `catalog:write`, destructive, open-world,
idempotent):

1. Every tracked variant's available stock goes to 0 through the inventory ledger, reason `SOLD`
   (`StockLevelsService`), so every store gets the new quantity. Units held for open orders stay.
2. The product is removed by hand from every connected store that lists it or whose automatic rule
   would publish it (`StoreMembershipService.remove`): the same path as removing it from a store,
   so the listing is ended (`Delist`) or cleared when the channel never received it (`Withdraw`),
   and the rule cannot bring it back. Disconnected stores are skipped.
3. One `product_marked_sold` activity event, plus a `listing_removed` per store.

Calling it again finds no stock and no store, changes nothing and answers `alreadySold: true`.
The product's status is not changed. Selling it again means adding it back to its stores and
setting its stock.

Known limit: a store's hand-removed list holds up to 10,000 products, as for removing by hand.

### 3. One attention summary

`GET /api/v1/workspaces/{workspaceId}/attention?limit=5` (permission `workspace:view`) returns
`total` and four sections, each `{ count, items }` with up to `limit` (max 20) latest items:

- `stores`: `NEEDS_REAUTH` and `ERROR` stores, and disconnected stores with live listings.
- `listings`: `count` is failed listings, from the same query as the Channels page's
  `failedListings`; items are grouped per product and store with the latest error and
  `missingRequirement`.
- `proposals`: pending outside-agent proposals, from the Agent proposals query.
- `suggestions`: pending AI suggestions, from the Suggestions inbox query.

A section is null when the caller lacks the permission of its page (`channels:view` for stores and
listings, `suggestions:view` for proposals and suggestions), and adds nothing to `total`. Each
section runs a fixed number of queries on existing indexes. The web's Home and sidebar badge read
this endpoint instead of counting on their own.

## Consequences

- Resellers grade each item once and every store lists it in its own terms.
- An item sold off-platform comes off every store in one call, so it cannot sell twice.
- Home and the badge show the same numbers as the pages they link to.
- eBay's store-level default condition stays, as the fallback for products without one.
