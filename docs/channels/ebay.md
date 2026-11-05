# eBay

Crossmart connects to eBay with the OAuth authorization code grant for user tokens. The
merchant picks an eBay marketplace (such as eBay US) on the Channels page and signs in on eBay.
eBay then redirects to the API, which stores the connection and sends the merchant back to the
Channels page.

Crossmart connects the account, reads its details and business policies, and publishes
listings through eBay's Sell Inventory API. The connector declares `publish_listings`,
`update_price` and `provide_taxonomy`. Stock sync, orders and webhooks come in later phases.

## What Crossmart uses

|            |                                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------- |
| Sign-in    | `{auth}/oauth2/authorize` with `client_id`, `response_type=code`, `redirect_uri` (the RuName), `scope`, `state`  |
| Tokens     | `POST {api}/identity/v1/oauth2/token` with HTTP Basic auth (`client_id:client_secret`)                           |
| Identity   | `GET {identity}/commerce/identity/v1/user/`: the account's `userId` and `username`                               |
| Policies   | `GET {api}/sell/account/v1/{fulfillment,payment,return}_policy?marketplace_id=…` (Account API)                   |
| Opt-in     | `POST {api}/sell/account/v1/program/opt_in` with `SELLING_POLICY_MANAGEMENT`                                     |
| Defaults   | `POST {api}/sell/account/v1/{fulfillment,payment,return}_policy` (Account API, "Create default policies")        |
| Listings   | `{api}/sell/inventory/v1`: `inventory_item`, `inventory_item_group`, `offer`, `location` (Inventory API)         |
| Categories | `GET {api}/commerce/taxonomy/v1/…/get_category_suggestions?q=…` (Taxonomy API, with the user token)              |
| Aspects    | `GET {api}/commerce/taxonomy/v1/category_tree/{tree}/get_item_aspects_for_category?category_id=…` (Taxonomy API) |
| Callback   | `{API_PUBLIC_URL}/api/v1/channels/ebay/oauth/callback`, registered with eBay as the RuName's accept URL          |
| Disconnect | eBay has no public endpoint that revokes a user token. Disconnecting deletes the credentials in Crossmart only.  |

### Environments

`EBAY_ENVIRONMENT` selects the hosts. The keyset must belong to the same environment.

| Environment         | `{auth}`                        | `{api}`                        | `{identity}`                    |
| ------------------- | ------------------------------- | ------------------------------ | ------------------------------- |
| `sandbox` (default) | `https://auth.sandbox.ebay.com` | `https://api.sandbox.ebay.com` | `https://apiz.sandbox.ebay.com` |
| `production`        | `https://auth.ebay.com`         | `https://api.ebay.com`         | `https://apiz.ebay.com`         |

### Scopes

All of these are required. eBay grants every requested scope or none, and its token response
does not list them, so a connection records the requested scopes as granted.

- `https://api.ebay.com/oauth/api_scope`
- `https://api.ebay.com/oauth/api_scope/sell.inventory`
- `https://api.ebay.com/oauth/api_scope/sell.account`
- `https://api.ebay.com/oauth/api_scope/sell.fulfillment`
- `https://api.ebay.com/oauth/api_scope/commerce.identity.readonly`

## Account model

The account handle is the **marketplace id** the merchant picks. Supported marketplaces:

| Marketplace | Site           | Currency | `Content-Language` | Listing pages     |
| ----------- | -------------- | -------- | ------------------ | ----------------- |
| `EBAY_US`   | eBay US        | USD      | `en-US`            | `www.ebay.com`    |
| `EBAY_GB`   | eBay UK        | GBP      | `en-GB`            | `www.ebay.co.uk`  |
| `EBAY_DE`   | eBay Germany   | EUR      | `de-DE`            | `www.ebay.de`     |
| `EBAY_AU`   | eBay Australia | AUD      | `en-AU`            | `www.ebay.com.au` |
| `EBAY_CA`   | eBay Canada    | CAD      | `en-CA`            | `www.ebay.ca`     |
| `EBAY_FR`   | eBay France    | EUR      | `fr-FR`            | `www.ebay.fr`     |
| `EBAY_IT`   | eBay Italy     | EUR      | `it-IT`            | `www.ebay.it`     |
| `EBAY_ES`   | eBay Spain     | EUR      | `es-ES`            | `www.ebay.es`     |

Crossmart does not know the eBay account before the merchant signs in. The marketplace travels
in the signed OAuth state, and the connector names the connection after sign-in:
`externalAccountId` is `{userId}:{marketplaceId}`, for example `nY4uWx2bQ1e:EBAY_US`. One eBay
account can connect several marketplaces, each as its own connection, and connecting the same
account and marketplace again updates the existing connection.

The connection is named `{username} · {site}`, for example `demo_seller · eBay US`. Prices for
the connection use the marketplace's currency.

## What is stored

- **Credentials**, sealed with envelope encryption like every channel's: the access token, the
  refresh token and both expiry times. They are never logged or returned by the API.
- **Settings** (`settings.account`, validated by the connector): `marketplaceId`,
  `currencyCode`, `username`, `userId`, `businessPoliciesEnabled`, and `policies`, the
  `{ id, name }` lists of the account's fulfillment, payment and return policies on the
  marketplace, and `listingDefaults` (below). `listingDefaults` is optional, so settings stored
  before it existed still parse. Connecting the account again, or refreshing its policies,
  replaces what the connector reads and keeps `listingDefaults`.
- **Per listing:** `Listing.externalId` is the eBay listing id, each `ListingVariant.externalId`
  is the variant's eBay SKU (`externalInventoryId` is null), and `Listing.channelCategoryId` /
  `channelCategoryName` hold the eBay category the listing is in. The item specifics the
  merchant sets are rows of `ListingItemSpecific` (`listing_item_specifics`): one per aspect
  name, with its values in order.

## Token refresh

User access tokens last 2 hours and refresh tokens about 18 months. Crossmart refreshes the
access token before it expires (`grant_type=refresh_token` with the same scopes). eBay does not
rotate the refresh token, so the stored one and its expiry are kept. When eBay answers
`invalid_grant` (the refresh token expired or the merchant revoked access), the connection
needs to be connected again.

## Business policies

Listing through eBay's Inventory API needs fulfillment, payment and return business policies.
An account that has not opted in to business policies gets an error from the Account API
(error `20403`, "not eligible for Business Policy"). Connecting still succeeds: the settings
record `businessPoliciesEnabled: false` with empty lists, and the web app tells the merchant
that business policies are off. The connection's Settings tab offers **Opt in to business
policies** (`POST …/channel-connections/:id/ebay/business-policies/opt-in`), which calls the
Account API's `opt_in` and reads the policies again. eBay can take a while to enable them, and
merchants create the policies themselves on eBay
([business policies](https://www.ebay.com/bp/manage)); **Refresh policies**
(`POST …/ebay/business-policies/refresh`) reads them again. Both keep the listing defaults.

### Default policies

The sandbox has no usable Seller Hub page for business policies, and new sellers often have
none, so the Listing defaults card offers **Create default policies**
(`POST …/ebay/business-policies/defaults`, permission `channels:manage`). It opts the account
in first when `businessPoliciesEnabled` is false, then creates one policy of each type on the
connection's marketplace, reads the policies again, chooses the three as the listing defaults
(the condition and ship-from are kept), and records `channel_default_policies_created`.

| Policy      | Name                          | Terms                                                                                                                                |
| ----------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Fulfillment | `Crossmart standard shipping` | `ALL_EXCLUDING_MOTORS_VEHICLES`, 3 business days handling, one domestic `FLAT_RATE` service, free (0.00 in the marketplace currency) |
| Payment     | `Crossmart payment`           | `immediatePay: true`; eBay manages payments, so no payment methods are sent                                                          |
| Return      | `Crossmart 30-day returns`    | Returns accepted within 30 days, `returnShippingCostPayer: BUYER`                                                                    |

The shipping service is the marketplace's standard one (eBay's `ShippingServiceCodeType`):

| Marketplace | Service                           |
| ----------- | --------------------------------- |
| `EBAY_US`   | `USPSPriority`                    |
| `EBAY_GB`   | `UK_RoyalMailSecondClassStandard` |
| `EBAY_DE`   | `DE_DHLPaket`                     |
| `EBAY_AU`   | `AU_StandardDelivery`             |

Other marketplaces (`EBAY_CA`, `EBAY_FR`, `EBAY_IT`, `EBAY_ES`) answer 422 before calling eBay:
the merchant creates a shipping policy on eBay and refreshes.

eBay refuses a policy that duplicates an existing one with error `20400` ("Invalid request.",
long message "This policy already exists") and parameters `DuplicateProfileName`,
`DuplicateProfileType` and `DuplicateProfileId`. Because `20400` is also eBay's generic invalid
request, Crossmart treats it as a duplicate only when those parameters are present. It then
uses `DuplicateProfileId`, or, without one, the policy of that type with the default name in
the account's lists. So running the action twice is harmless. eBay detects duplicates by
their terms too, so an equivalent policy under another name may be the one chosen. Any other
refusal answers 422 with eBay's message.

## Listing defaults

Every listing on a connection is sold under the merchant's **listing defaults**
(`PUT …/channel-connections/:id/ebay/listing-defaults`, permission `channels:manage`):

| Field                                                      | Meaning                                                                                                       |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `fulfillmentPolicyId`, `paymentPolicyId`, `returnPolicyId` | One of the account's policies. Null uses the account's only policy of that type, when it has exactly one.     |
| `condition`                                                | `NEW` by default; any Inventory API condition (`USED_EXCELLENT`, `FOR_PARTS_OR_NOT_WORKING`…).                |
| `location`                                                 | Ship-from `postalCode`, `country` (ISO 3166 alpha-2) and optional `city`.                                     |
| `merchantLocationKey`                                      | Set by Crossmart: saving a location creates the inventory location `crossmart-default` on eBay (`WAREHOUSE`). |

Saving a location calls `POST /location/crossmart-default`; when it exists (409, or error
`25803`), Crossmart updates its address with `update_location_details`, so saving twice is
harmless. Policy ids must be among the account's stored policies. A chosen policy that later
disappears from the account falls back to the only remaining one, or to none. The API returns
the resolved defaults, and `readyToList` says whether every policy and the location are set.

## Publishing

A content job publishes a product, or revises the listing eBay already holds. Calls carry
`Content-Language` from the marketplace. Before calling eBay, the connector checks the
listing defaults: a connection without policies fails the listing with "Choose shipping,
payment and return policies for this eBay connection." and one without a ship-from address
with "Set where items ship from in this eBay connection's listing defaults." Neither is retried.

1. **Category.** The listing's stored category, or eBay's top suggestion for the title
   (`get_default_category_tree_id` once per marketplace and process, then
   `get_category_suggestions`). An auto-picked category is saved on the listing, so updates
   stay in it and the merchant sees it in the listing override sheet, where they can search
   for another (`GET /products/:id/channels/:connectionId/category-suggestions?search=…`) and
   choose it (`PUT …/category`, which queues an update). Category names are stored with their
   ancestors: `Home & Garden > Kitchen > Mugs`. Before any write, the connector reads the
   category's aspects (below) and fails the listing, without retrying, when a required one has
   no value, naming every missing one: "eBay requires these item specifics in this category:
   Department. Add them in the listing’s item specifics." When the aspects cannot be read, the
   listing is sent anyway, and eBay's own message names a missing aspect.
2. **Inventory items.** `PUT /inventory_item/{sku}` per variant: title (cut to 80 characters
   on whole characters), description (HTML, the title when empty, at most 500,000), up to 24
   https image URLs, `condition`, `availability.shipToLocationAvailability.quantity` (the shown
   stock, never below 0; untracked variants list 1 unit), and `aspects`: `Brand` from the
   vendor (`Unbranded` without one), then the merchant's item specifics, which replace it, then
   the variant's option values (`Size: ["M"]`). The `brand` field follows the Brand item
   specific when there is one. A 12-digit barcode is sent as a UPC, a 13-digit one as an EAN.
3. **Groups.** A product with more than one variant is listed as one multi-variant listing
   through `PUT /inventory_item_group/{groupKey}`, with `variantSKUs` and
   `variesBy.specifications` built from the product's option names and values, and the
   product's aspects (Brand and the merchant's item specifics). The group key
   is `CM` followed by the product id's 32 hex digits.
4. **Offers.** One per SKU: `GET /offer?sku=…&marketplace_id=…` finds an existing offer, which
   is replaced with `PUT /offer/{offerId}`; otherwise `POST /offer` creates one (`FIXED_PRICE`,
   category, policies, `merchantLocationKey`, price in the marketplace currency). Prices arrive
   already converted by the connection's pricing; compare-at prices are not sent.
5. **Publish.** `POST /offer/{offerId}/publish` for one variant,
   `POST /offer/publish_by_inventory_item_group` for a group. Publishing again revises the
   live listing. The answer's `listingId` becomes the listing's `externalId`, and its URL is
   `https://{site}/itm/{listingId}` (`https://sandbox.ebay.com/itm/…` in the sandbox).

eBay has no hidden listings: publishing a product that is not active (or is hidden on the
store) is refused, and updating one ends its listing (it can be published again later).

### Item specifics

eBay calls them aspects: `Color`, `Material`, `Department`… Each leaf category has its own, and
some are required. The listing override sheet shows them once the listing has a category
(`GET /products/:id/channels/:connectionId/item-specifics`, permission `listings:edit`), and
the merchant saves values with `PUT …/item-specifics`, which replaces every value set before.

The API reads them with `get_item_aspects_for_category` on the marketplace's default tree and
keeps, per aspect, its localized name, `aspectConstraint.aspectRequired`, `aspectUsage`
(`RECOMMENDED` or `OPTIONAL`), `aspectMode` (`FREE_TEXT` or `SELECTION_ONLY`),
`itemToAspectCardinality` (`SINGLE` or `MULTI`), and the first 200 `aspectValues`. Values eBay
adds to those enumerations later read as optional, free text and single. Required aspects come
first, then recommended, then optional. Each process caches a category's aspects for six hours.

| Rule                | Value                                                               |
| ------------------- | ------------------------------------------------------------------- |
| Aspects per listing | At most 60                                                          |
| Name                | At most 40 characters (the Inventory API's limit)                   |
| Values per aspect   | At most 30 (eBay's limit for multi-value aspects)                   |
| Value               | At most 50 characters (the Inventory API's limit)                   |
| Normalization       | Names and values are trimmed; blank and repeated values are dropped |
| Removing a specific | Save it with no values                                              |
| Names given twice   | Refused (400), whatever their case                                  |

Precedence when publishing: the merchant's item specifics replace the ones Crossmart derives
(`Brand` from the vendor, or `Unbranded`). A specific named like one of the product's options
(`Size`) is ignored, because each variant's option value is its own aspect and a group varies
by it. Saving item specifics queues an update when eBay holds the listing, and retries the
publish when the last one failed. Crossmart does not check `SELECTION_ONLY` values against
eBay's list; eBay refuses a value it does not accept.

### SKUs

A variant keeps the SKU it was first listed with (its `ListingVariant.externalId`), so editing
the catalog SKU never orphans the eBay item. A new variant uses its catalog SKU when eBay
accepts it (letters, digits, `-` and `_`, at most 50 characters) and no other variant of the
product shares it; otherwise its SKU is `CM` followed by the variant id's 32 hex digits. eBay
SKUs are unique per seller account, so two products with the same catalog SKU would share an
eBay item: keep SKUs unique across the catalog.

### Offer ids

Crossmart does not store offer ids. Updates, price changes and delisting find each offer by SKU
with `GET /offer?sku=`. This costs one read per SKU but needs no schema change and cannot go
stale when an offer is recreated on eBay.

### Ending listings

Delisting withdraws the offers and keeps the inventory items, which are cheap and are reused if
the product is listed again: `POST /offer/{offerId}/withdraw` for one variant (only when the
offer is live), `POST /offer/withdraw_by_inventory_item_group` for a group. The connector needs
the listing's SKUs and product id for this, which core passes to `delist` as a
`ListingReference` (kept on delist jobs of deleted products too).

### Prices

Price-only syncs use `POST /bulk_update_price_quantity`, 25 SKUs per call, with the offers found
by SKU. A response that rejects some prices fails the sync with eBay's messages.

## API errors

| eBay answers                 | Crossmart reports      | Retried |
| ---------------------------- | ---------------------- | ------- |
| 401                          | `credentials_rejected` | No      |
| 429                          | `rate_limited`         | Yes     |
| 5xx, or a body it can't read | `channel_unavailable`  | Yes     |
| Other 4xx                    | `request_rejected`     | No      |

eBay errors look like `{ "errors": [{ "errorId", "message", "parameters" }] }`. A rejected
request's message is built from eBay's `message` fields only (without its "A user error has
occurred." prefix, falling back to the parameters when nothing is left), such as "eBay rejected
the request: The item specific Department is missing. Add Department to this listing…", so the
merchant sees which item specific to add. Messages never include tokens or whole response
bodies. In API requests (defaults, opt-in, category suggestions), a rejection answers 422, a
token eBay refuses 409, a rate limit 429 and an outage 502.

Rate limits: eBay meters Sell API calls per app per day and publishes no per-account burst
limit. The connector declares one per-connection bucket of 10 calls, refilled at 2 calls per
second, as a conservative default.

## App settings (eBay Developers Program)

1. Create a keyset in the [eBay Developers Program](https://developer.ebay.com/my/keys) for
   the environment you need. Put the App ID in `EBAY_CLIENT_ID` and the Cert ID in
   `EBAY_CLIENT_SECRET`. Set `CREDENTIALS_MASTER_KEY` as well.
2. Under **User Tokens**, add a redirect URL name (RuName). Set its **auth accepted URL** to
   the callback above, for example
   `https://api.example.com/api/v1/channels/ebay/oauth/callback`, and its **auth declined URL**
   to the same callback (Crossmart reports a callback without a code as declined). Enable
   OAuth for it. Put the RuName in `EBAY_RU_NAME`. eBay takes the RuName, not the URL, as the
   `redirect_uri` parameter.
3. Set `EBAY_ENVIRONMENT` to `sandbox` or `production`.

eBay is available on an instance only when the client id, secret and RuName are all set.

**Production keys** also require a marketplace account deletion notification endpoint: eBay
sends a notice when an eBay user asks for their data to be deleted, and the keyset is not
activated without one (or an exemption). Crossmart does not have this endpoint yet. It will be
added before eBay is offered in production.

## Next phases

- Stock sync (`update_inventory`) through `bulk_update_price_quantity`; today stock is sent
  only when a listing is published or updated.
- Item specifics per variant (beyond the option values), and value dependencies between
  aspects (`valueConstraints`, such as a model that depends on the brand).
- Variant-specific images (`aspectsImageVariesBy`), compare-at (strikethrough) prices, and
  moving a listing between single-variant and multi-variant shapes when variants are added or
  removed after publishing.
- Orders through the Fulfillment API, and notifications.
- The marketplace account deletion notification endpoint.
