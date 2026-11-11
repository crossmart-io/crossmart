# Etsy

Crossmart connects to Etsy through Etsy's **Open API v3** (`https://api.etsy.com/v3`) with OAuth
2.0 and PKCE. The merchant types their Etsy shop name on the Channels page and signs in on Etsy.
Crossmart reads the shop and its shipping and processing profiles, the merchant saves a listing
setup, and products are published as Etsy listings with their variations, images and stock.
Crossmart reads the shop's receipts to move stock, and sends stock back to the listings. See
[ADR 0021](../decisions/0021-etsy-connector.md).

**Status: in development.** The connector is built from Etsy's documentation and tested against
recorded fixtures only; it has not yet run against a live Etsy app. Until the instance has an
Etsy app (`ETSY_API_KEY` and `ETSY_SHARED_SECRET`), Etsy cannot be connected: starting a
connection answers `503` ("Etsy is not configured on this Crossmart instance").

| Capability         | What it does on Etsy                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `publish_listings` | Draft listing, images, inventory (one product per variant), then active (see Publishing) |
| `update_price`     | Each SKU's offering price, through the listing's inventory                               |
| `provide_taxonomy` | Seller taxonomy categories matched to the title; `Materials` as the item specific        |
| `fetch_orders`     | `getShopReceipts` changed since the last poll (see Orders)                               |
| `update_inventory` | Each SKU's offering quantity, through the listing's inventory (see Stock)                |

## What Crossmart uses

|            |                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------- |
| Sign-in    | `https://www.etsy.com/oauth/connect` with `code_challenge` (S256) and `state`                   |
| Tokens     | `POST https://api.etsy.com/v3/public/oauth/token`, form-encoded, `client_id` = keystring        |
| Every call | `x-api-key: {keystring}:{shared secret}` and `Authorization: Bearer {token}`                    |
| Shop       | `GET /v3/application/users/me` (shop id), `GET /shops/{shop_id}`                                |
| Profiles   | `GET /shops/{shop_id}/shipping-profiles`, `GET /shops/{shop_id}/readiness-state-definitions`    |
| Listings   | `POST /shops/{shop_id}/listings` (`createDraftListing`), `PATCH …/listings/{listing_id}`        |
| Inventory  | `GET` and `PUT /listings/{listing_id}/inventory` (`updateListingInventory`, JSON)               |
| Images     | `GET /listings/{listing_id}/images`, `POST` and `DELETE /shops/{shop_id}/listings/{id}/images…` |
| Categories | `GET /seller-taxonomy/nodes`                                                                    |
| Orders     | `GET /shops/{shop_id}/receipts`, `GET /shops/{shop_id}/receipts/{receipt_id}`                   |
| Callback   | `{API_PUBLIC_URL}/api/v1/channels/etsy/oauth/callback`                                          |
| Disconnect | Etsy has no endpoint that revokes a token. Disconnecting deletes the credentials in Crossmart.  |

Listing writes (`createDraftListing`, `updateListing`) are form-encoded, as Etsy's spec defines
them; `tags` and `materials` are comma-separated. Inventory writes are JSON. Image uploads are
`multipart/form-data`.

### Scopes

`listings_r listings_w shops_r transactions_r`, all required. Etsy lists the granted scopes in
its token response, and a connection granted fewer is refused. Crossmart never deletes listings
(`listings_d` is not asked for) and never writes receipts (`transactions_w`).

## Sign-in (OAuth 2.0 with PKCE)

Etsy requires PKCE on every authorization. The authorize URL carries `response_type=code`,
`client_id` (the keystring), `redirect_uri`, `scope`, `state`, `code_challenge` and
`code_challenge_method=S256`; the code exchange sends `grant_type=authorization_code`,
`client_id`, `redirect_uri`, `code` and `code_verifier`. Etsy's token endpoint takes no client
secret.

**The verifier never travels.** Crossmart's signed OAuth state is readable in URLs, so it does
not carry the verifier. Each connection's verifier is the HMAC-SHA256 of the state's nonce under
a key derived (HKDF) from `BETTER_AUTH_SECRET`, 43 base64url characters. The callback verifies
the state (signature, expiry, single use, same signed-in user and the same browser through the
nonce cookie) and derives the same verifier. Whoever sees the redirect URL, with its code and
state, still cannot redeem the code.

Access tokens last one hour. Refresh tokens last 90 days and **rotate**: every refresh returns a
new refresh token and Crossmart stores it, dated 90 days ahead. When Etsy answers
`invalid_grant`, the connection needs to be connected again. Etsy's access tokens start with the
user id (`12345678.…`); Crossmart does not rely on that.

## Account model

The account handle is the **shop name**, lower-cased (Etsy shop names are 4 to 20 letters or
digits). After sign-in Crossmart reads `getMe` for the shop id and `getShop`, and refuses the
connection (`invalid_account`) when the signed-in user's shop is not the one the merchant named,
or when they have no shop. The connection's `externalAccountId` is the **shop id**, and its name
is the shop name.

## What is stored

- **Credentials**, sealed like every channel's: access token, rotating refresh token and expiries.
- **Settings** (`settings.account`, validated by the connector): `shopId`, `shopName`, `userId`,
  `currencyCode`, `shopUrl`, `profiles` (the `{ id, name }` lists of shipping and processing
  profiles; deleted shipping profiles are left out) and `listingSetup` (below). Nothing else of
  the shop (such as the owner's login name or policies) is kept.
- **Per listing:** `Listing.externalId` is the Etsy listing id; each `ListingVariant.externalId`
  is the variant's SKU on Etsy and its `externalInventoryId` is `{listingId}:{sku}`.
  `Listing.channelCategoryId` / `channelCategoryName` hold the seller taxonomy category.

## Listing setup

Etsy requires, for every physical listing, who made it, when, whether it is a supply, a shipping
profile and a processing profile (`readiness_state_id`). The merchant saves them once per
connection (`PUT …/channel-connections/:id/etsy/listing-setup`, permission `channels:manage`):

| Field                 | Values                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `whoMade`             | `i_did`, `someone_else`, `collective`                                                       |
| `whenMade`            | `made_to_order`, `2020_2026`, `2010_2019`, … `before_1700` (Etsy's `when_made` values)      |
| `isSupply`            | `true` for craft supplies, `false` for finished products                                    |
| `shippingProfileId`   | One of the shop's shipping profiles. Null uses the shop's only one, when it has exactly one |
| `processingProfileId` | One of the shop's processing profiles, the same way                                         |

The merchant creates profiles on Etsy; **Refresh shop** (`POST …/etsy/shop/refresh`) reads the
shop and its profiles again and keeps the setup. Until the setup resolves, the connection's
`publishReadiness` lists what is missing: `item_details`, `shipping_profile`,
`processing_profile` (new `PublishRequirement` values), or `account_settings` when the shop was
never read.

## Publishing

1. **Checks before Etsy.** The listing setup, at least one `https` image, and option names for
   products with several variants (at most three options). Missing ones fail the listing without
   a retry, naming the requirement.
2. **Category.** The listing's stored category, or the best seller taxonomy match for its title
   (Etsy has no suggestion endpoint: categories are matched by the words of their names, the
   leaf's own name counting most, plurals folded). No match asks the merchant for a category.
   Each process keeps the taxonomy for six hours.
3. **Draft.** `createDraftListing` with title, description, tags, materials, `taxonomy_id`,
   `who_made`, `when_made`, `is_supply`, `shipping_profile_id`, `readiness_state_id`,
   `type=physical`, the total quantity (at least 1) and the lowest variant price.
4. **Images.** Etsy takes image files, not links. Each of the first 20 `https` images is
   downloaded (see Images) and uploaded with `uploadListingImage` at its position (`rank`, with
   `overwrite=true` and its alt text, at most 500 characters).
5. **Inventory.** `updateListingInventory` with one product per variant, keyed by its SKU, and
   one offering each: price, quantity (the shown stock; untracked variants list 1) and the
   processing profile. A product with several variants varies by Etsy's custom variation
   properties, one per option (`513`, `514`, `516`, named after the option), which set the price,
   quantity and SKU; a third one sends `max_variations_supported=3`.
6. **Activate.** `updateListing` with `state=active` for an active product. An inactive product
   stays a draft.

Updates edit the listing in place (`updateListing` with the same fields, without quantity and
price), upload images only when they changed (and delete Etsy images past the product's last),
write the inventory again, and set the state: an active product's draft, inactive or expired
listing is activated; a product that is no longer active has its listing deactivated. A
`sold_out` listing is left to Etsy, as activating it renews it. **Ending a listing** deactivates
it (`state=inactive`); it is never deleted, and publishing again reactivates it. A listing that
no longer exists on Etsy fails the update with a message to publish it again.

Etsy charges a listing fee when a listing is published or renewed (Etsy's fee policy).
Crossmart only activates drafts, inactive and expired listings of active products.

### Content

| Rule        | Value                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| Title       | At most 140 characters; letters, numbers, punctuation, math symbols, spaces, ™ © ®; `% : & +` once each     |
| Description | Plain text (Crossmart converts the HTML); Etsy states no limit; Crossmart writes up to 5,000                |
| Tags        | The product's tags: at most 13, at most 20 characters, letters, numbers, spaces, `-` `'` (not first), ™ © ® |
| Materials   | The `Materials` item specific: letters, numbers and spaces                                                  |
| Variations  | Option values without parentheses                                                                           |
| Images      | At most 20                                                                                                  |

A product's item condition (ADR 0029) is not sent: Etsy's Open API v3 has no condition field
(vintage items are told apart by `when_made` in the listing setup).

Characters Etsy refuses are removed, repeated tags (ignoring case) dropped, and long titles and
tags cut on whole characters. `contentLimits` declares the title, tag and description limits for
content generation, which writes for Etsy with its own guidance.

### SKUs

A variant keeps the SKU it was first listed with. A new variant uses its catalog SKU when it is
letters, digits, `-` and `_`, at most 32 characters, and unique in the product; otherwise its
SKU is `CM` followed by the first 30 hex digits of the variant id.

### Images

Product images are links; Etsy needs files. `HttpsImageFetcher` downloads them in the worker:

- `https` only, no redirects followed, at most 20 MB, 30 seconds, and the response must be an
  `image/*`.
- **Never a private address.** The host's addresses are checked as the socket connects (so DNS
  rebinding cannot pass the check and then connect elsewhere), and IP literals before: loopback,
  private, link-local (cloud metadata), carrier-grade NAT, multicast and reserved ranges are
  refused. Image URLs come from merchants and agents, and an uploaded image becomes visible on
  Etsy, so this guard is what stops the worker from fetching internal resources.
- An image that cannot be used fails the listing with the `images` requirement; an unreachable
  host is retried. Errors never name the URL.

Self-hosted instances that serve uploads from `http://localhost` cannot list those images on
Etsy (nor on eBay); use a public `https` storage URL.

## Stock

When Crossmart's stock of a listed variant changes, the inventory queue sends its quantity to
Etsy. Etsy replaces a listing's whole inventory on every write, so for each listing Crossmart
reads it (`getListingInventory`), sets each SKU's offering quantity, and writes everything back
with the property and value ids Etsy returned, only when a quantity differs. An Etsy sale's own
echo therefore costs one read and no write. A SKU the listing does not have, or a listing Etsy
refuses, is reported on the listing with Etsy's reason; rate limits and outages fail the job,
which the queue retries.

**Prices** go the same way: each SKU's offering price is set through the inventory.
Compare-at prices are not sent; Etsy sales are Etsy promotions.

## Orders

Orders are Etsy **receipts**, read with `transactions_r`:

- **Polling:** `getShopReceipts` with `min_last_modified` (the poll's start, in epoch seconds),
  `sort_on=updated`, `sort_order=asc`, `limit=100` and `offset`; the cursor is the next offset
  until it reaches the receipts' `count`.
- **Mapping:** the order number is the `receipt_id`; placed and updated from
  `created_timestamp` / `updated_timestamp`; cancelled when `status` is `canceled`; the total is
  `grandtotal` minus the receipt's `refunds` in the same currency, never below zero.
- **Lines** are the receipt's transactions: `transaction_id`, `title`, `quantity`, the unit
  `price`, and the `sku`, which matches the variant Crossmart listed. A line is shipped when it
  has a `shipped_timestamp` or the receipt `is_shipped`.
- **No buyer data.** The schema drops everything else at parse time: the buyer's name,
  address, email, user id, messages and gift notes never leave the HTTP layer.

## API errors

| Etsy answers                 | Crossmart reports      | Retried |
| ---------------------------- | ---------------------- | ------- |
| 401                          | `credentials_rejected` | No      |
| 429                          | `rate_limited`         | Yes     |
| 5xx, or a body it can't read | `channel_unavailable`  | Yes     |
| Other 4xx                    | `request_rejected`     | No      |

Etsy's errors are `{ "error": "…" }`; a rejection carries that message (at most 300
characters), never the body or a token. Etsy meters calls **per app** (queries per second and
per day; `429` with `retry-after`). The connector declares one app-wide bucket of 5 calls,
refilled at 5 per second, until the app's real quota is known.

## Activating Etsy (operator steps)

1. Sign in at [etsy.com/developers](https://www.etsy.com/developers/your-apps) and **create an
   app** (Etsy reviews new apps; personal access may be granted before commercial access).
2. Register the **callback URL** exactly, case and trailing slash included:
   `{API_PUBLIC_URL}/api/v1/channels/etsy/oauth/callback`, for example
   `https://api.crossmart.io/api/v1/channels/etsy/oauth/callback`. It must be `https`.
3. Copy the app's **keystring** to `ETSY_API_KEY` and its **shared secret** to
   `ETSY_SHARED_SECRET`, on the API and the worker. Set `CREDENTIALS_MASTER_KEY` too. Never
   commit the secret.
4. Deploy. Etsy is available when both values are set; until then the API refuses to start an
   Etsy connection with `503`, and the web app keeps showing Etsy as in development.
5. Check the app's rate limits in the developer portal and raise the connector's bucket
   (`ETSY_API_BUCKET_*`) if the quota allows.
6. Connect a test shop: create a shipping profile and a processing profile on Etsy, connect,
   save the listing setup, and publish one product. Verify the facts marked as unverified in
   ADR 0021.

## Not yet

Etsy category attributes (listing properties) beyond materials, per-listing item details,
personalization, digital listings, return policies, shop sections, processing profiles per
variant, tracking (`createReceiptShipment` needs Etsy's approval), webhooks, and importing an
existing Etsy catalog.
