# Google Merchant Center

Crossmart publishes products to Google Merchant Center (Google Shopping) through Google's
**Merchant API** (`https://merchantapi.googleapis.com`, `v1`). The merchant types their Merchant
Center account id on the Channels page and signs in with Google. Crossmart reads the account,
the merchant saves a listing setup (country and product page address), and each variant is
published as an offer. The connector declares `publish_listings` and `update_price`. See
[ADR 0017](../decisions/0017-google-merchant-connector.md).

**Status: in development.** The connector is not yet generally available. Until the instance has
a Google Cloud OAuth client (`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`), Google Merchant
Center cannot be connected. See the [channel status](https://docs.crossmart.io/channels/).

## What Crossmart uses

|             |                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------- |
| Sign-in     | `https://accounts.google.com/o/oauth2/v2/auth`, `access_type=offline`, `prompt=consent`           |
| Tokens      | `POST https://oauth2.googleapis.com/token` (client id and secret in the form body)                |
| Disconnect  | `POST https://oauth2.googleapis.com/revoke` revokes the grant                                     |
| Account     | `GET /accounts/v1/accounts/{id}`, `…/homepage`, `…/businessInfo`                                  |
| Data source | `POST /datasources/v1/accounts/{id}/dataSources`: one primary API source per country              |
| Offers      | `POST /products/v1/accounts/{id}/productInputs:insert?dataSource=…`, `PATCH` and `DELETE` by name |
| Callback    | `{API_PUBLIC_URL}/api/v1/channels/google_merchant/oauth/callback`                                 |
| Scope       | `https://www.googleapis.com/auth/content` (required)                                              |

Offer names are `{contentLanguage}~{feedLabel}~{offerId}`, sent base64url-encoded as Google
recommends, so offer ids with `/` or `~` are safe.

## Operator setup

1. Create a Google Cloud project and enable the **Merchant API**.
2. In **Google Auth Platform**: set the branding (app name, support email, home page, authorized
   domain), the audience (External), and add the scope `https://www.googleapis.com/auth/content`.
3. Create an OAuth client of type **Web application** with the redirect URI
   `{API_PUBLIC_URL}/api/v1/channels/google_merchant/oauth/callback`.
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` on the API and the worker. Never commit the
   secret.
5. **Register the project with the Merchant API, once.** Google rejects every call from an
   unregistered project (401, "GCP project … is not registered"). Register it against your own
   **production** Merchant Center account with a verified and claimed website (not a test
   account), signed in as an admin of that account:
   `POST https://merchantapi.googleapis.com/accounts/v1/accounts/{ACCOUNT_ID}/developerRegistration:registerGcp`
   with `{ "developerEmail": "you@your-domain" }`, authorized with the scope above through this
   project's OAuth client (for example in the OAuth 2.0 Playground with "Use your own OAuth
   credentials", after adding `https://developers.google.com/oauthplayground` as a redirect URI).
   Calls work about five minutes later. Do not register against merchants' accounts.
6. While the app is in **Testing**, only its test users can connect, and their refresh tokens
   expire after seven days (connections then need reconnecting). Production use needs Google's
   OAuth app verification.

## Account model and listing setup

The account handle is the **Merchant Center account id** (dashes and spaces are ignored). On
connect Crossmart reads the account name, the website it claimed and its business country.
The target country defaults to the business country when Crossmart lists there, else the US.

| Country | Currency | Content language |
| ------- | -------- | ---------------- |
| US      | USD      | en               |
| GB      | GBP      | en               |
| CA      | CAD      | en               |
| AU      | AUD      | en               |
| DE      | EUR      | de               |
| FR      | EUR      | fr               |
| IT      | EUR      | it               |
| ES      | EUR      | es               |
| NL      | EUR      | nl               |
| IL      | ILS      | he               |

Before publishing, the merchant saves the **listing setup** (`PUT …/google-merchant/listing-setup`):
the country and the product page address with `{handle}`, such as
`https://shop.example/products/{handle}`. Saving creates the country's API data source; saving
the same country again keeps it.

## How a product becomes offers

- One offer per variant, grouped by `itemGroupId` (the product id) when the product has several.
- Offer id: the SKU when it is 1–50 of `A-Z a-z 0-9 _ . -` and unique in the product, else the
  variant id. A published variant keeps its offer id.
- Title up to 150 characters; description as plain text up to 5,000; the first https image as
  `imageLink`, up to 10 more as `additionalImageLinks`. Products without an https image are
  refused before calling Google.
- `link`: the setup's address with the product's handle. It must be on the account's verified
  website, or Google disapproves the offer ("Mismatched domains").
- Price in the country's currency (converted by the connection's pricing). A higher compare-at
  price becomes the price and the price the `salePrice`.
- Availability: in stock when untracked or stock is above zero; otherwise backorder when the
  variant keeps selling, else out of stock.
- Condition from the product's `condition` (ADR 0029): `NEW` → `NEW`, `REFURBISHED` →
  `REFURBISHED`, every other grade (new without tags or with defects included) → `USED`. A product
  without one is `NEW`.
- `brand` from the vendor; `gtins` from the barcode when it is 8, 12, 13 or 14 digits, else
  `identifierExists: false`; `color` and `size` from options named Color/Colour and Size;
  `shippingWeight` in grams.
- A price change patches only `price` and `salePrice`. A product that is no longer active, or is
  removed from the store, has its offers deleted.

## Not yet

Offer status and disapprovals, Google product categories, multiple countries per connection,
local inventory and promotions.
