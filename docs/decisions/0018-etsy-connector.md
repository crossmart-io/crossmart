# ADR 0018: Etsy connector

- Status: Accepted
- Date: 2026-11-06

## Context

Etsy is the next channel after Google Merchant Center (ADR 0008). Its Open API v3 needs an
app Etsy reviews, and the owner has no credentials yet. The connector is built from Etsy's
official documentation and OpenAPI spec (`https://www.etsy.com/openapi/generated/oas/3.0.0.json`)
and tested on fixtures in the spec's shapes, so it can be switched on once the app exists.

Etsy differs from the channels before it: OAuth requires PKCE and issues no client secret to
the token endpoint; refresh tokens rotate; every call also carries an `x-api-key`; listing
writes are form-encoded; images are uploaded as files; a listing's inventory is replaced as a
whole on each write; and physical listings need shop-level choices (who made the item, when,
supplies, shipping and processing profiles).

## Decision

- **Open API v3 over plain HTTPS** through `HttpTransport` and `JsonApiClient`, which gains form
  and multipart bodies (additive). `EtsyApiClient` adds `x-api-key: {keystring}:{shared secret}`.
- **PKCE in the SDK and core.** `OAuthTokenEndpoint` gains public-client authentication
  (`client_id` only), the `code_verifier`, rotating refresh tokens and a documented refresh
  token lifetime. `OAuthAuthorizeRequest` and `OAuthCallback` carry an optional `codeVerifier`.
  Core derives it as the HMAC of the OAuth state's nonce under a key derived from the auth
  secret, so the verifier is never in the state (which is visible in URLs) and needs no storage;
  the state's signature, expiry, single use and browser binding (nonce cookie) are unchanged.
- **Account handle** is the shop name; the callback checks the signed-in user's shop is that
  shop. `externalAccountId` is the shop id.
- **Listing setup** (`who_made`, `when_made`, `is_supply`, shipping and processing profiles) is
  stored per connection like Google's listing setup and eBay's listing defaults, with a profile
  that resolves to the shop's only one when not chosen. New `PublishRequirement` values
  `item_details`, `shipping_profile` and `processing_profile` (additive; the column is text).
  `ChannelType.Etsy` already existed and is stored as text, so **no migration** is needed.
- **Publishing** creates a draft, uploads images, writes the inventory, then activates. Variants
  use Etsy's custom variation properties (513, 514, 516). Products are listed by SKU; a
  variant's `externalInventoryId` is `{listingId}:{sku}` so stock jobs find its listing. Ending a
  listing deactivates it; Crossmart never deletes Etsy listings.
- **Stock and prices** read the inventory, change the SKUs' offerings and write it back only when
  something differs, keeping Etsy's property and value ids.
- **Images** are downloaded by a new SDK `ImageFetcher`. `HttpsImageFetcher` refuses non-https
  links, redirects, non-images, files over 20 MB and every private or reserved address, checked
  at connect time to defeat DNS rebinding: image URLs are user input, and a downloaded file
  becomes public on Etsy.
- **Taxonomy:** Etsy has no category suggestion endpoint, so the seller taxonomy is matched to
  the title by words, cached per process. Crossmart writes one item specific, `Materials`;
  Etsy's category attributes (listing properties) are a later phase.
- **Orders** are receipts polled by `min_last_modified`, oldest change first; the schema keeps no
  buyer data.
- **Disabled until configured.** `ETSY_API_KEY` and `ETSY_SHARED_SECRET` are optional; without
  both, `isConfigured()` is false and starting a connection answers 503.

## Verified and unverified facts

Verified against Etsy's OpenAPI spec and guides (Authentication, Request Standards, Rate Limits,
Listings, Fulfillment) and Help Center articles: the endpoints, paths, parameters and
response fields used; PKCE S256 and the token request parameters; `x-api-key` as
`keystring:shared_secret`; 1-hour access and 90-day refresh tokens; the scopes; form-encoded
listing writes with comma-separated lists; custom variation property ids 513, 514 and 516 and
`max_variations_supported`; `readiness_state_id` required for physical listings; `when_made` and
`who_made` values; the title, tag and material character rules; title 140 characters, 13 tags of
20 characters, 20 images, alt text 500 characters; shop names of 4 to 20 letters or digits; no
token revocation endpoint.

Not verified, to check with the first live app:

- That refresh tokens rotate (Etsy's guide shows a new `refresh_token` in the refresh response;
  Crossmart keeps it) and that each refresh restarts the 90 days.
- SKU length: 32 characters is what developers observe Etsy enforce; the spec states no limit.
- Custom variation property values sent with empty `value_ids` (the spec marks `value_ids`
  required; Etsy's examples use known value ids).
- Whether Etsy accepts an enabled offering with quantity 0, and a listing whose offerings are
  all at 0.
- That a transaction's `price` is the unit price (the spec says "the price recorded the
  transaction").
- Which receipt refunds are final: the spec does not list `ShopRefund.status` values, so every
  refund on the receipt lowers its total.
- The image formats and file size Etsy accepts, and the app's real rate limits (the connector
  declares 5 calls per second app-wide).

## Consequences

Etsy can be enabled with two settings once Etsy approves the app. The SDK is now able to run
PKCE flows, form and multipart writes and safe image downloads, which later channels can reuse.
Each Etsy stock or price change costs a read and, when something changed, a write per listing.
Listing properties, tracking, digital listings and catalog import are not built.
