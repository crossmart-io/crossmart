# Mercado Libre

Crossmart connects to Mercado Libre through its local-site API (`https://api.mercadolibre.com`,
not the cross-border CBT API) with OAuth 2.0. The merchant picks their country on the Stores
page and signs in on that country's Mercado Libre. Crossmart reads the seller, publishes
products as items with their variants, pictures and description, sends stock and prices, and
reads orders, polled and on `orders_v2` notifications. See
[ADR 0031](../decisions/0031-mercadolibre-connector.md).

**Status: in development.** The connector is built from Mercado Libre's developer guides and
tested against fixtures in the shape of their examples; it has not run against a live app.
Until the instance has a Mercado Libre app (`MERCADOLIBRE_CLIENT_ID` and
`MERCADOLIBRE_CLIENT_SECRET`), Mercado Libre cannot be connected: starting a connection answers
`503` ("Mercado Libre is not configured on this Crossmart instance"). In the web app it is a
preview that only platform admins see.

| Capability         | What it does on Mercado Libre                                                |
| ------------------ | ---------------------------------------------------------------------------- |
| `publish_listings` | Items in the seller's item model, then their descriptions (see Publishing)   |
| `update_price`     | `price` of an item, or the one price an item's variations share              |
| `provide_taxonomy` | `domain_discovery` category predictions; the category's attributes           |
| `fetch_orders`     | `/orders/search` by last update, and one order per notification (see Orders) |
| `update_inventory` | `available_quantity` of an item or its variations (see Stock)                |
| `receive_webhooks` | `orders_v2` notifications, checked and then read with the seller's token     |

## Sites

| Site id | Country   | Currency | Decimals | Sign-in                            |
| ------- | --------- | -------- | -------- | ---------------------------------- |
| `MLM`   | Mexico    | MXN      | 2        | `https://auth.mercadolibre.com.mx` |
| `MLC`   | Chile     | CLP      | 0        | `https://auth.mercadolibre.cl`     |
| `MCO`   | Colombia  | COP      | 0        | `https://auth.mercadolibre.com.co` |
| `MPE`   | Peru      | PEN      | 2        | `https://auth.mercadolibre.com.pe` |
| `MLA`   | Argentina | ARS      | 2        | `https://auth.mercadolibre.com.ar` |
| `MLB`   | Brazil    | BRL      | 2        | `https://auth.mercadolivre.com.br` |

Currencies are the sites' `default_currency_id` (`GET /sites`) and decimals the currencies'
`decimal_places` (`GET /currencies`): Chilean and Colombian prices are whole pesos, rounded half
up. Another site is one entry in `MERCADOLIBRE_SITES` (`mercadolibre-site.ts`).

## What Crossmart uses

|               |                                                                                    |
| ------------- | ---------------------------------------------------------------------------------- |
| Sign-in       | `{site auth origin}/authorization` with `response_type=code`, `client_id`, `state` |
| Tokens        | `POST /oauth/token`, form-encoded, `client_id` and `client_secret` in the body     |
| Every call    | `Authorization: Bearer {token}` (never in the query)                               |
| Seller        | `GET /users/me`                                                                    |
| Categories    | `GET /sites/{site}/domain_discovery/search`, `GET /categories/{id}`                |
| Attributes    | `GET /categories/{id}/attributes`                                                  |
| Items         | `POST /items`, `GET` and `PUT /items/{id}`                                         |
| Descriptions  | `POST /items/{id}/description`, `PUT /items/{id}/description?api_version=2`        |
| Orders        | `GET /orders/search?seller=…`, `GET /orders/{id}`                                  |
| Disconnect    | `DELETE /users/{user_id}/applications/{app_id}`                                    |
| Callback      | `{API_PUBLIC_URL}/api/v1/channels/mercado_libre/oauth/callback`                    |
| Notifications | `{API_PUBLIC_URL}/api/v1/webhooks/mercado_libre`, topics `orders_v2` (and `items`) |

## Setting up the app (DevCenter)

1. Create the app at the Mercado Libre developers site of any country, signed in with the
   account that will own it.
2. **Redirect URI:** `{API_PUBLIC_URL}/api/v1/channels/mercado_libre/oauth/callback`, exactly
   (https, no variable parts; Crossmart carries everything else in `state`).
3. **Scopes:** read, write and offline access. Without `offline_access` there is no refresh
   token, and connecting fails with `missing_scopes`.
4. **PKCE:** turn it on. Crossmart always sends an S256 challenge and the verifier.
5. **Notifications callback URL:** `{API_PUBLIC_URL}/api/v1/webhooks/mercado_libre`, with the
   `orders_v2` topic (`items` may be on; it is acknowledged and ignored).
6. Set `MERCADOLIBRE_CLIENT_ID` (the App ID) and `MERCADOLIBRE_CLIENT_SECRET` (the Secret Key).

## Sign-in (OAuth 2.0)

The account handle is the **site id** the merchant picked. The authorize URL is on that site's
auth host, with a PKCE S256 challenge derived as for Etsy (the HMAC of the state's nonce, never
in a URL). Scopes come from the app's settings, not the URL. After the code exchange Crossmart
checks the token response lists `offline_access read write`, reads `GET /users/me`, and refuses
the connection (`invalid_account`) when the seller's `site_id` is not the site picked. The
connection's `externalAccountId` is the seller's **user id**; its name is their nickname.

Access tokens expire after `expires_in` seconds (the guide says 6 hours; its examples answer
`10800`, 3 hours). Refresh tokens are **single-use**: each refresh returns a new one, which
replaces the stored one under the connection's credentials lock, so two workers never spend the
same one. They expire after 6 months, or after 4 months without calls. `invalid_grant` marks the
connection as needing re-authorization.

Disconnecting revokes the grant (`DELETE /users/{user_id}/applications/{app_id}`), then
deletes the credentials.

## What is stored

- **Credentials**, sealed like every channel's: access token, rotating refresh token, expiries.
- **Settings** (`settings.account`): `userId`, `nickname`, `siteId`, `currencyCode`,
  `permalink` and `userProductSeller` (the `user_product_seller` tag). Nothing else of the user
  (name, email, address, identification) is kept.
- **Per listing:** `Listing.externalId` is an item id (`MLM2061397137`). A variant's
  `externalId` and `externalInventoryId` are its own item id, or `{itemId}:{variationId}` for a
  variation of one item. `channelCategoryId` / `channelCategoryName` hold the category.

## Publishing

Mercado Libre has two item models, and a seller uses one:

- **User Products** ("Precio por variación"), for sellers with the `user_product_seller` tag
  (all sellers since 2025, by Mercado Libre's plan): one item per variant, each with its own
  price, grouped by a shared `family_name` and the variant's option attributes. Items take no
  `title` (Mercado Libre writes it) and no `variations`.
- **One item with variations**, for other sellers (and test users not enabled for User
  Products): the variants are the item's `variations`, which must share one price.

A listing first published as variations keeps that model.

1. **Checks before Mercado Libre.** The account settings and at least one picture.
2. **Category.** The listing's stored one, or the first `domain_discovery` prediction for its
   title, read with `GET /categories/{id}` for its path. None asks the merchant for a category.
3. **Attributes.** The category's attributes (cached six hours per process). The merchant's item
   specifics and the product's option names are matched to them by name, ignoring case and
   accents, and sent by id; the vendor is `BRAND` unless an item specific sets it; each
   variant's SKU is `SELLER_SKU` and its barcode `GTIN`. Under User Products, names the category
   does not have are sent as custom attributes; otherwise they are left out. A listing missing
   an attribute tagged `required` fails with `item_specifics`, naming them.
4. **Items.** `POST /items` with `category_id`, `currency_id`, `buying_mode=buy_it_now`,
   `listing_type_id=gold_special` (Classic), `condition`, `pictures` (the first 10 image URLs,
   which Mercado Libre downloads), price and `available_quantity` (the shown stock; untracked
   variants list 1). With User Products, one item per variant with `family_name`; otherwise one
   item with `title` and, for several variants, `variations` (`attribute_combinations`,
   `picture_ids`, and Crossmart's variant id in `seller_custom_field` to match them back).
5. **Description.** `POST /items/{id}/description` with `plain_text` (Crossmart converts the
   HTML; descriptions take no markup).
6. **Status.** An inactive product's item is paused.

**Updates** read the item first; a closed or deleted one fails with a message to publish again.
They send the price, stock and attributes, the pictures only when they changed, the title only
while the item has no sales, and replace the description. An active product's paused item is
reactivated when it has stock (Mercado Libre pauses items at 0 and reactivates them when
restocked). With variations, the update lists every variation (one left out is deleted); with
User Products, a new variant becomes a new item in the family. **Ending a listing** closes its
items (`status=closed`), which is final on Mercado Libre: publishing again creates new items.

| Rule        | Value                                                                    |
| ----------- | ------------------------------------------------------------------------ |
| Title       | At most 60 characters (the categories' `max_title_length` in the guides) |
| Description | Plain text; at most 50,000 characters; Crossmart writes up to 5,000      |
| Pictures    | At most 10 (`max_pictures_per_item_var`), JPG or PNG, by URL             |
| Condition   | `new` for new items; every other condition, refurbished included, `used` |

## Stock

`PUT /items/{id}` with `available_quantity` for an item; for variations, Crossmart reads the item
and sends every variation, with the new quantity on the ones that changed. A closed item or a
refused write is reported on the listing; outages and rate limits are retried.

## Orders

Polling searches `GET /orders/search?seller={user id}&order.date_last_updated.from=…&sort=date_asc`,
50 a page. Mercado Libre leaves cancelled orders out of a seller's search, so cancellations
arrive through notifications. A line's variant is its item, or `{itemId}:{variation_id}`, which
matches the listing variant. `cancelled` and `invalid` orders are cancelled; `fulfilled` orders
count their units as shipped. No buyer data is read.

## Notifications

Mercado Libre posts `{ _id, resource, user_id, topic, application_id, … }` to the app's one
callback URL and wants a 200 within 500 ms. Notifications carry **no signature**. Crossmart
accepts one only when `application_id` is this instance's App ID (anything else answers 401),
deduplicates it by `_id`, and treats it as a hint: an `orders_v2` notification queues a read of
`/orders/{id}` with the token of each connection of that `user_id`, which Mercado Libre answers
only for the seller's own order. Other topics are acknowledged and ignored.

## Testing with test users

Mercado Libre has no sandbox: test users act on production, and trade only with other test
users. Once the app exists:

1. Create up to 10 test users with `POST /users/test_user {"site_id": "MLM"}` (and `MLC`, `MCO`,
   `MPE`), authorized with the app owner's token. Keep the returned nickname and password: they
   cannot be read again. Test users are deleted after 60 days without activity.
2. Connect each seller test user from the Stores page (as a platform admin), publish a product
   under the "Others" category, never as `gold` or `gold_premium`.
3. Buy it with a buyer test user and Mercado Pago's test cards (cardholder `APRO`), and check the
   `orders_v2` notification moves the stock in Crossmart and on the other stores.
4. To test User Products, ask Mercado Libre (through its form) to enable the test users; until
   then they list with variations.
