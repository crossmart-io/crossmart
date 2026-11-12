# ADR 0031: Mercado Libre connector

- Status: Accepted
- Date: 2026-11-12

## Context

Crossmart is expanding to Latin America: Mexico, Chile, Colombia and Peru first, then Brazil and
Argentina. Mercado Libre is the leading marketplace in all of them. Its local-site API needs an
app registered in DevCenter, which does not exist yet. As with Etsy (ADR 0021), the connector is
built from the official developer guides and tested on fixtures in the shape of their examples,
so it can be switched on once the app exists. It uses the existing OAuth app flow.

Mercado Libre differs from the channels before it:

- A seller belongs to one **site** (country), and signs in on that country's auth host.
- Refresh tokens are **single-use** and rotate on every refresh.
- Items come in **two models**. Sellers with the `user_product_seller` tag list under User
  Products: one item per variant, grouped by `family_name`, each with its own price, and items
  sent the older way are refused with a 400. Other sellers list one item with `variations`,
  which share one price. Mercado Libre planned to move every seller to User Products during
  2025, but test users stay on the older model until Mercado Libre enables them.
- **Notifications are unsigned**: no signature header or shared secret.
- Descriptions are plain text, sent after the item is created.

## Decision

- **`ChannelType.MercadoLibre = 'mercado_libre'`.** The channel column is text, so **no
  migration** is needed. The callback is `{API_PUBLIC_URL}/api/v1/channels/mercado_libre/oauth/callback`
  and notifications go to `{API_PUBLIC_URL}/api/v1/webhooks/mercado_libre`.
- **Sites like eBay marketplaces.** `MercadoLibreSiteId` (`MLM`, `MLC`, `MCO`, `MPE`, `MLA`,
  `MLB`) with each site's currency, currency decimals, label and auth origin in
  `MERCADOLIBRE_SITES`. The account handle is the site the merchant picks; the callback reads
  `GET /users/me` and refuses a seller of another site. `externalAccountId` is the user id. A
  site is added with one entry.
- **OAuth** through `OAuthTokenEndpoint`: client id and secret in the form body, rotating
  refresh tokens kept with a 6-month lifetime, PKCE S256 whenever Crossmart has a verifier
  (always, in core). Refreshes already run under the connection's credentials lock, so a
  single-use refresh token is never spent twice. Disconnecting revokes the grant.
- **Both item models.** The connection stores `userProductSeller` from `/users/me`. Publishing
  uses User Products for those sellers and one item with variations for others. A listing's
  variant keys tell the model it was published in (`{itemId}:{variationId}` for variations,
  the item id otherwise), so updates, stock, prices and delisting need no other state. A User
  Products publish that fails part way closes the items it created.
- **Attributes by name.** The category's attributes (`/categories/{id}/attributes`, cached six
  hours per process) are the item specifics merchants see: not read-only, fixed, inferred or
  hidden ones, unless required. Item specifics and option names are matched to attribute ids by
  name, ignoring case and accents. Required attributes missing from the listing fail it before
  any write (`item_specifics`).
- **Categories** come from `domain_discovery` (the old category predictor is gone from the
  guides), each read for its path.
- **Notifications as hints.** A notification is accepted only when its `application_id` is this
  instance's App ID, deduplicated by `_id`, and never trusted as data. An `orders_v2`
  notification makes Crossmart read `/orders/{id}` with the token of the connections of its
  `user_id`; Mercado Libre answers that only for the seller's own order, which is the
  verification. Other topics are acknowledged and ignored.
- **Disabled until configured.** `MERCADOLIBRE_CLIENT_ID` and `MERCADOLIBRE_CLIENT_SECRET` are
  optional; without both, `isConfigured()` is false and starting a connection answers 503. The
  web app shows Mercado Libre as an admin-only preview, as it does Etsy.

## Data Crossmart does not have

| Mercado Libre wants                            | How Crossmart handles it                                                                                                                      |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `BRAND`, `MODEL` and other category attributes | `BRAND` from the vendor; the rest from the merchant's item specifics, checked against the category's required attributes                      |
| `GTIN`, or `EMPTY_GTIN_REASON` without one     | `GTIN` from the variant's barcode. Without one, the merchant sets the empty-GTIN reason as an item specific; Mercado Libre's refusal names it |
| `SELLER_SKU`                                   | The variant's SKU                                                                                                                             |
| Warranty (`WARRANTY_TYPE`, `WARRANTY_TIME`)    | Not sent. Optional except for refurbished items, which Crossmart lists as used                                                                |
| Shipping mode (`me2`, `me1`, `custom`)         | Not sent: Mercado Libre applies the seller's shipping preferences (`me2` where it is mandatory) and decides free shipping                     |
| Listing type                                   | `gold_special` (Classic) for every item; the seller can upgrade on Mercado Libre                                                              |
| Condition                                      | `new` for new items, `used` for every other condition                                                                                         |
| Package dimensions                             | Not sent; Mercado Libre asks the seller when `me2` needs them                                                                                 |

A per-connection listing setup (listing type, warranty) can be added later as Etsy's was.

## Verified and unverified facts

Verified against Mercado Libre's guides (Authentication and authorization, Manage your
applications, Users, Categories and listings, Attributes, List products, Variations, User
Products and Price per variation, Item description, Products sync, Manage sales, Receive
notifications, Start testing): the endpoints, parameters and fields used; the token request and
response; single-use refresh tokens and their 6 months; revocation; sites, currencies and
decimal places; `domain_discovery`; the attribute tags; both item models and the
`user_product_seller` tag; descriptions as plain text after creation; closing as final;
`orders/search` filters; the notification body, the 500 ms answer and the absence of a
signature; test users.

Where the guides contradict the brief or themselves:

- Access tokens: the text says 6 hours, the examples answer `expires_in: 10800` (3 hours).
  Crossmart uses `expires_in`.
- No scope parameter is documented on the authorize URL: scopes are set on the app.
- PKCE is a per-app setting: optional, and mandatory once enabled.
- The guides show only `auth.mercadolibre.com.ar` and `auth.mercadolivre.com.br`, saying to use
  the country's domain; the Mexico, Chile, Colombia and Peru hosts follow that rule.
- A seller's order search leaves cancelled orders out.

Not verified, to check with the first live app:

- The auth hosts of Mexico, Chile, Colombia and Peru.
- That `seller_custom_field` on a new variation comes back on it (Crossmart falls back to the
  order sent), and that `picture_ids` takes the pictures' source URLs.
- Whether Mercado Libre rounds or refuses fractional CLP and COP prices (Crossmart rounds).
- Custom attributes on items of sellers without User Products (Crossmart leaves them out).
- The app's real rate limits (the connector declares 5 calls a second, from the documented
  `max_requests_per_hour: 18000`), and the largest `orders/search` page.
- Stock for sellers with multi-origin warehouses, which use `seller_warehouse` stock endpoints.

## Consequences

Mercado Libre can be enabled with two settings once the app exists. Each stock or price change
of an item with variations costs a read and a write. Not built yet: removing a User Products
variant's item when the variant is deleted, the `items` topic (changes made on Mercado Libre),
catalog import, multi-origin stock, listing type and warranty choices, refurbished listings,
questions and messages, and shipping labels.
