# ADR 0030: Falabella connector and seller-credentials connections

- Status: Accepted
- Date: 2026-11-12

## Context

Falabella is the first channel of the Latin America push (Mercado Libre and Mirakl-based
marketplaces such as Liverpool follow). Its Seller Center API has no OAuth app: each Seller
Center user has an API key, and every request is signed with it. `ChannelAuthStrategy`
already named `SellerCredentials`, but no connector or connect flow implemented it. Mirakl and
Coupang work the same way, so the flow must be reusable.

The connector is built from the official reference at `developers.falabella.com` (read on
2026-11-12) and tested on fixtures copied from its examples. Nobody has run it against a live
seller account yet.

## Decision

**Seller-credentials connections (SDK and core, reusable).**

- `SellerCredentialsConnector` declares its `credentialFields` (key, `secret`, max length,
  allowed values) and `verifyCredentials(values)`, which makes a live call and returns the
  account id, the credentials and the account profile. The interface had no implementers, so it
  changed in place.
- `POST /api/v1/workspaces/{id}/channel-connections/credentials` takes
  `{ channel, credentials }`. The OpenAPI schema types `credentials` as `oneOf` the channels'
  credential DTOs, today `FalabellaCredentialsDto`.
- `SellerCredentialsService` checks the values against the connector's fields (400, naming
  fields, never values), refuses unclaimed sandboxes, verifies the keys, and stores the
  connection through `ConnectedAccountWriter` like an OAuth connection: plan quota, the
  secret sealed with envelope encryption, and activity logged.
- A refusal answers 422 with a `ConnectFailure` (new: `credentials_rejected`) and the channel's
  explanation. An outage answers 503. Pasting new keys for the same account updates the
  connection. Secrets never reach logs, settings, activity or responses; tests assert this.
- The secret travels as the credentials' `accessToken`, so sessions, sealing and disconnect
  work unchanged. Non-secret identifiers (Falabella's user id and seller id) live in the
  connection's settings.

**Falabella.**

- **Auth:** every call carries `Action`, `Format=XML`, `Timestamp`, `UserID`, `Version=1.0` and
  `Signature`, the HMAC-SHA256 hex digest of the sorted, RFC 3986-encoded query. A test
  reproduces the docs' verification example. The key is never sent. The User-Agent is
  `{SELLER_ID}/Node/{version}/CROSSMART/{FACL|FACO|FAPE}`.
- **Account:** the merchant pastes their seller id, user id (email), API key and country.
  `FeedCount` verifies them. `externalAccountId` is `{sellerId}:{operatorCode}`, so each
  country is its own connection.
- **Countries** are an enum keyed by operator code (`facl`, `faco`, `fape`). Each country maps
  to its User-Agent code, currency (CLP, COP, PEN) and time zone.
- **XML:** responses are read as XML, the format of every example in the docs. A small schema
  helper treats one-or-many and empty elements alike. Adds `fast-xml-parser` (MIT, no
  dependencies).
- **Taxonomy:** `GetCategoryTree`, cached per country, gives leaves named with their path.
  Suggestions put `GetCategorySuggestion`'s pick first, then word matches. Category attributes
  (`GetCategoryAttributes`) become item specifics. The package size and weight every product
  needs are added when a category does not list them, and so is the tax percentage Colombia
  requires.
- **Publishing:** one Falabella product per variant. Variants are grouped under the first
  variant's SKU as `ParentSku` where the category groups variations, and each variant is named
  with `Variation` where it does not. The publisher checks required attributes before any write
  and blocks with `item_specifics`. A variation attribute takes its value from the product
  option of the same name. Images go in a separate `Image` feed: https only, at most 8. A
  publish whose SKUs Falabella already holds updates them (`GetProducts`), so a retried publish
  never creates a product twice. Ending a listing sets its SKUs `inactive`; Crossmart never
  calls `ProductRemove`.
- **Feeds:** writes are asynchronous feeds. The connector polls `FeedStatus` every 5 seconds
  for up to a minute and fails the sync with Falabella's row errors (a feed can be `Finished`
  with failed rows). A feed still queued after that is taken as accepted. Feeds are rate
  limited per seller: 50 free, then one every 2 minutes. The connector declares a
  per-connection bucket of 500 units refilling 10 every 120 seconds, at 10 units per feed.
- **Prices:** `Price` is the price buyers pay. Compare-at prices are not sent, because a
  Falabella sale price (`SpecialPrice`) needs start and end dates Crossmart does not have.
- **Stock:** `ProductUpdate` with `Stock` in batches of 500. This writes the default
  warehouse. Row errors that name a SKU are reported per item. `readQuantities` uses
  `GetProducts`, which is not a feed, so reconciliation spends no feed on stock that did not
  drift.
- **Orders:** `GetOrders` sorted by `updatedat`, only `dropshipping` (orders Falabella ships
  from its own warehouse do not move the seller's stock), then `GetMultipleOrderItems` for the
  page. Each order item is one unit; a canceled item holds no stock. Seller Center times carry
  no zone and are read in the country's time zone.

**Mapping and missing data.**

| Crossmart                    | Falabella                                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title, description (HTML)    | `Name`, `Description` (escaped character data)                                                                                                                            |
| Vendor                       | `Brand`; `Genérico` when empty, as Falabella's docs advise                                                                                                                |
| Barcode                      | `ProductId`                                                                                                                                                               |
| Price, stock, product status | `BusinessUnit` `Price`, `Stock`, `Status` per country                                                                                                                     |
| Variant weight               | `PackageWeight` in kg, unless the merchant set one                                                                                                                        |
| Condition                    | `ConditionType`: new and new-other → `Nuevo`; refurbished → `Reacondicionado`; every other grade → `Usado`. The merchant can override it per listing                      |
| (none)                       | `PackageHeight`, `PackageWidth`, `PackageLength`, category attributes, Colombia's `TaxPercentage`: item specifics the merchant fills; publishing is blocked until they do |

The brand must exist in Falabella's brand list. An unknown brand comes back as a feed error
that names it. International sellers' `NameEn`/`NameCN` are not supported.

## Verified and unverified

**Verified in the official docs:** the host, the parameters, the signature (test vector), the
User-Agent format, the three countries, the actions and their XML request and response shapes,
the feed statuses and limits, at most 8 images, the order item statuses, and the `Genérico`
brand.

**Not verified, to check with a live seller account:**

- That the seller id in the User-Agent is checked (Falabella documents no way to read it).
- The `Content-Type` of writes. The docs' cURL and Java samples send
  `application/x-www-form-urlencoded` with the raw XML body, and Crossmart does the same.
- `ConditionType` values other than `Nuevo`.
- The time zone of Seller Center timestamps, and how fast feeds run in practice.
- Whether the `ErrorResponse` of a failed call comes with HTTP 200 or 4xx. Both are handled.

## Findings that differ from the plan

- **Mexico is not documented.** Only Chile, Colombia and Peru exist.
- **There is no staging host for sellers.** Falabella says it works only in production and
  suggests testing with low-value products marked as tests.
- **There is no separate API key step.** The key is a column of Mi cuenta → Usuarios. The
  seller id the User-Agent needs is a fourth pasted field.

## Consequences

- Falabella connects from Stores as an admin-only preview.
- Mirakl and Coupang need only their connector, their field list and a credentials DTO in the
  `oneOf`.

Not built yet:

- The `onFeedCompleted` webhook, or a sweep for feeds still queued after the wait.
- Multi-warehouse stock (`UpdateStock`, `GetOrders` v2).
- Sale prices.
- Order acknowledgement and shipping (`SetStatusToReadyToShip`).
- Content generation in Spanish.
- Catalog import from Falabella.
- Connection-level defaults for the package size.
