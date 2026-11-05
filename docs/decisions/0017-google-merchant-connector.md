# ADR 0017: Google Merchant Center connector

- Status: Accepted
- Date: 2026-11-05

## Context

Google Merchant Center is the next channel after eBay (see the channel roadmap). It needs no
marketplace approval and reuses the listing draft, pricing and override pipeline. Google's
current API is the Merchant API (`merchantapi.googleapis.com`, `v1`); the Content API for
Shopping is being retired. Unlike eBay and Shopify, Google sells nothing itself: offers point to
the merchant's own product pages, and every API call needs the calling Cloud project registered.

## Decision

- **Merchant API v1 over plain HTTPS**, through `HttpTransport` like every connector; no Google
  SDK. Sub-APIs used: `accounts`, `datasources`, `products`.
- **Account handle** is the Merchant Center account id the merchant types. Sign-in is Google's
  web-server OAuth flow with `access_type=offline` and `prompt=consent`, scope
  `https://www.googleapis.com/auth/content`. The callback checks that the signed-in user can read
  that account (`PERMISSION_DENIED_ACCOUNTS` becomes `invalid_account`).
- **Listing setup** is the merchant's choice of target country (currency and content language
  follow, from `GOOGLE_COUNTRY_MARKETS`) and a product page address template with `{handle}`.
  Google requires every offer to link to a page on the account's verified website. Saving the
  setup creates one primary **API data source** per country (feed label = country), which
  Crossmart publishes into. Publishing refuses until the setup is saved.
- **One offer per variant** (`productInputs:insert`, which replaces an existing offer), grouped by
  `itemGroupId` = the product id. The offer id is the merchant's SKU when it is usable and
  unique in the product, else the variant id; a published variant keeps its offer id (shared
  `assignVariantKeys` in the SDK, also used by eBay). The listing's external id is the product id.
- **Descriptions are plain text** (`descriptionToPlainText` in `libs/common`). A compare-at price
  above the price becomes Google's price, and the price its sale price.
- **Prices** are patched alone (`productInputs.patch`, mask `productAttributes.price,salePrice`).
- **Google has no hidden listings:** a product that is no longer active has its offers deleted.
- **`ChannelSession.settings`:** price updates and removals receive only a session, but need the
  data source and feed. Sessions now carry the connection's stored account settings, validated
  by the connector. This is additive; other connectors ignore it.
- **Developer registration:** Google requires each Cloud project to be registered once
  (`registerGcp`) against the operator's own production Merchant Center account with a verified
  website. It is an operator step, documented in `docs/channels/google-merchant.md`; until it is
  done every call fails, and Crossmart says so instead of a generic error.

## Consequences

The connector needs no approval beyond Google's OAuth app verification for production (Testing
mode refresh tokens expire after 7 days). Each country is its own data source, so a merchant
selling in several countries connects or reconfigures per country; multi-country targeting from
one connection can come later. Offer status and disapprovals (`products.get`
`productStatus.itemLevelIssues`), Google product categories and local inventory are not read yet.
