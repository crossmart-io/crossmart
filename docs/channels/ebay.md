# eBay

Crossmart connects to eBay with the OAuth authorization code grant for user tokens. The
merchant picks an eBay marketplace (such as eBay US) on the Channels page and signs in on eBay.
eBay then redirects to the API, which stores the connection and sends the merchant back to the
Channels page.

This is phase one: Crossmart connects the account and reads its details. Publishing listings,
stock, prices and orders come next. Until then, the connector declares no capabilities.

## What Crossmart uses

|            |                                                                                                                 |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| Sign-in    | `{auth}/oauth2/authorize` with `client_id`, `response_type=code`, `redirect_uri` (the RuName), `scope`, `state` |
| Tokens     | `POST {api}/identity/v1/oauth2/token` with HTTP Basic auth (`client_id:client_secret`)                          |
| Identity   | `GET {identity}/commerce/identity/v1/user/`: the account's `userId` and `username`                              |
| Policies   | `GET {api}/sell/account/v1/{fulfillment,payment,return}_policy?marketplace_id=…` (Account API)                  |
| Callback   | `{API_PUBLIC_URL}/api/v1/channels/ebay/oauth/callback`, registered with eBay as the RuName's accept URL         |
| Disconnect | eBay has no public endpoint that revokes a user token. Disconnecting deletes the credentials in Crossmart only. |

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

| Marketplace | Site           | Currency |
| ----------- | -------------- | -------- |
| `EBAY_US`   | eBay US        | USD      |
| `EBAY_GB`   | eBay UK        | GBP      |
| `EBAY_DE`   | eBay Germany   | EUR      |
| `EBAY_AU`   | eBay Australia | AUD      |
| `EBAY_CA`   | eBay Canada    | CAD      |
| `EBAY_FR`   | eBay France    | EUR      |
| `EBAY_IT`   | eBay Italy     | EUR      |
| `EBAY_ES`   | eBay Spain     | EUR      |

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
  marketplace.

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
that business policies are off. Publishing (next phase) will require them.

## API errors

| eBay answers                 | Crossmart reports      |
| ---------------------------- | ---------------------- |
| 401                          | `credentials_rejected` |
| 429                          | `rate_limited`         |
| 5xx, or a body it can't read | `channel_unavailable`  |
| Other 4xx                    | `request_rejected`     |

Messages never include tokens or response bodies.

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

- Publishing listings through the Inventory API (inventory items, offers, business policies).
- Stock and price updates.
- Orders through the Fulfillment API.
- The marketplace account deletion notification endpoint.
