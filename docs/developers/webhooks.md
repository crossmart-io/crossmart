# Webhooks

Crossmart can POST events to your URL as they happen: new and changed orders, stock changes,
listings that went live, failed or were removed, and product changes. Use them instead of polling
from n8n, Zapier, Make or your agent's backend. The design is recorded in
[ADR 0023](../decisions/0023-outgoing-webhooks.md).

## Add an endpoint

In the dashboard: **Settings → Webhooks → Add endpoint**. Or with the API, using a key whose role
holds `webhooks:manage` (Owner or Admin, see [roles](../permissions.md)):

```bash
curl -X POST "https://api.crossmart.io/api/v1/workspaces/$WORKSPACE_ID/webhook-endpoints" \
  -H "x-api-key: $CROSSMART_API_KEY" -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/crossmart/webhooks",
       "eventTypes": ["order.created", "inventory.stock_changed"],
       "description": "Orders to the warehouse"}'
```

The answer holds `endpoint` and `secret` (`whsec_…`). **The secret is shown only once**: store it
where your receiver can read it.

The URL must be `https` and resolve to public addresses only. Crossmart refuses private,
loopback and link-local addresses (`400`), at creation and again on every delivery. Self-hosted
instances on a trusted network can allow plain http and private addresses with
`WEBHOOK_ALLOW_PRIVATE_URLS=true`.

| Call                                                             | Does                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------- |
| `GET /webhook-endpoints`                                         | Lists the endpoints. Secrets are never returned               |
| `POST /webhook-endpoints`                                        | Adds one and returns its secret once                          |
| `GET`, `PATCH`, `DELETE /webhook-endpoints/{id}`                 | Reads, changes (URL, events, description, `enabled`), deletes |
| `POST /webhook-endpoints/{id}/rotate-secret`                     | Issues a new secret, returned once                            |
| `POST /webhook-endpoints/{id}/test`                              | Sends a `webhook.test` event to this endpoint                 |
| `GET /webhook-endpoints/{id}/deliveries`                         | The delivery log, newest first (filter by status, event)      |
| `GET /webhook-endpoints/{id}/deliveries/{deliveryId}`            | One delivery with the JSON body it sends                      |
| `POST /webhook-endpoints/{id}/deliveries/{deliveryId}/redeliver` | Sends that event again, with the same event id                |

Paths are under `/api/v1/workspaces/{workspaceId}`. Endpoints count toward your plan's
`webhook_endpoints` limit, across the organization. AI agents connected with OAuth can list and
add endpoints with the `webhooks:write` scope ([MCP](../mcp.md)).

## Events

| Type                      | Sent when                                                         | `data`                  |
| ------------------------- | ----------------------------------------------------------------- | ----------------------- |
| `order.created`           | An order from a store is seen for the first time                  | `order`                 |
| `order.updated`           | A newer version of an order arrives (status, lines, total)        | `order`                 |
| `inventory.stock_changed` | Stock moves for any reason: an order, an edit, an import          | `items`                 |
| `listing.published`       | A product goes live on a store for the first time                 | `listing`               |
| `listing.failed`          | A store refuses a listing for good; it stays in error until fixed | `listing`               |
| `listing.removed`         | A listing is taken off its store                                  | `listing`               |
| `product.created`         | A product is created, by hand, API, file or store import          | `product`               |
| `product.updated`         | A product is edited, alone or in bulk                             | `product`               |
| `product.deleted`         | A product is deleted                                              | `product`               |
| `webhook.test`            | You send a test event; it ignores subscriptions                   | `endpointId`, `message` |

Deleting a product sends `product.deleted`, not one `listing.removed` per store. New event types
and new fields may appear within `v1`: ignore what you don't know.

### Payload

Every delivery is a `POST` with `Content-Type: application/json` and this envelope:

```json
{
  "id": "7d0f4b5e-2c1a-4b8e-9a51-0e6f3c2d9b10",
  "type": "order.created",
  "createdAt": "2026-11-06T10:15:30.000Z",
  "workspaceId": "3b1f9a52-6c0e-4d7a-8f21-5a9c0e4b7d33",
  "apiVersion": "v1",
  "data": {
    "order": {
      "id": "c6a1d2e3-…",
      "externalId": "5432109876",
      "name": "#1001",
      "status": "OPEN",
      "currencyCode": "USD",
      "total": "45.00",
      "placedAt": "2026-11-06T10:15:02.000Z",
      "connectionId": "8e2b…",
      "channel": "shopify",
      "lines": [
        {
          "externalId": "1122",
          "sku": "MUG-BLUE",
          "title": "Blue mug",
          "quantity": 3,
          "unitPrice": "15.00",
          "variantId": "a91c…"
        }
      ]
    }
  }
}
```

The other `data` shapes:

```jsonc
// inventory.stock_changed: one event per stock write, with every item it moved
{ "items": [{ "inventoryItemId": "…", "variantId": "…", "productId": "…", "sku": "MUG-BLUE",
              "available": 12, "reserved": 3, "onHand": 15, "availableDelta": -3,
              "reason": "ORDER_SHIPPED" }] }

// listing.published, listing.failed, listing.removed
{ "listing": { "id": "…", "productId": "…", "connectionId": "…", "channel": "ebay",
               "status": "ERROR", "externalId": null, "externalUrl": null,
               "lastError": "Add a shipping policy" } }

// product.created, product.updated
{ "product": { "id": "…", "title": "Blue mug", "handle": "blue-mug", "status": "ACTIVE",
               "updatedAt": "2026-11-06T10:15:30.000Z" } }

// product.deleted
{ "product": { "id": "…", "title": "Blue mug" } }
```

Money is a decimal string and times are ISO 8601 in UTC, as in the REST API. Events carry a
snapshot of what changed. Fetch the resource from the API when you need all of it.

## Verify the signature

Every request carries these headers:

| Header                  | Value                                                         |
| ----------------------- | ------------------------------------------------------------- |
| `Crossmart-Signature`   | `t=<unix seconds>,v1=<hex HMAC-SHA256>` (one `v1` per secret) |
| `Crossmart-Event-Id`    | The event `id`                                                |
| `Crossmart-Event-Type`  | The event `type`                                              |
| `Crossmart-Delivery-Id` | This delivery, as the delivery log shows it                   |

`v1` is HMAC-SHA256, keyed with your whole secret (including `whsec_`), over
`<t>.<raw request body>`, in lowercase hex. Verify it against the **raw body bytes**, before any
JSON parsing. Refuse a `t` more than 5 minutes from your clock, so a captured request cannot be
replayed later. Compare in constant time. Accept the request if any `v1` matches. After a
rotation there are two, one per secret, for 24 hours.

The SDKs do all of this and return the parsed event:

**TypeScript** (`@crossmart/sdk`, Node 20+), with Express:

```ts
import express from 'express';
import { verifyWebhookSignature, WebhookSignatureError } from '@crossmart/sdk';

const app = express();
app.post('/crossmart/webhooks', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const event = await verifyWebhookSignature({
      payload: req.body, // the raw Buffer
      header: req.header('Crossmart-Signature'),
      secret: process.env.CROSSMART_WEBHOOK_SECRET!,
    });
    if (event.type === 'order.created') {
      // handle it; deduplicate on event.id
    }
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(error instanceof WebhookSignatureError ? 400 : 500);
  }
});
```

**Python** (`crossmart`), with Flask:

```python
import os

from flask import Flask, request
from crossmart import WebhookSignatureError, verify_webhook_signature

app = Flask(__name__)

@app.post("/crossmart/webhooks")
def crossmart_webhook():
    try:
        event = verify_webhook_signature(
            request.get_data(),  # the raw body
            request.headers.get("Crossmart-Signature"),
            os.environ["CROSSMART_WEBHOOK_SECRET"],
        )
    except WebhookSignatureError:
        return "", 400
    if event["type"] == "order.created":
        ...  # handle it; deduplicate on event["id"]
    return "", 200
```

**PHP** (`crossmart/crossmart-php`):

```php
use Crossmart\Exception\WebhookSignatureException;
use Crossmart\Webhook\WebhookSignature;

try {
    $event = WebhookSignature::verify(
        file_get_contents('php://input'),
        $_SERVER['HTTP_CROSSMART_SIGNATURE'] ?? null,
        getenv('CROSSMART_WEBHOOK_SECRET'),
    );
} catch (WebhookSignatureException $e) {
    http_response_code(400);
    exit;
}
if ($event->type === 'order.created') {
    // handle it; deduplicate on $event->id
}
http_response_code(200);
```

Without an SDK, in any language: split the header on `,`, take `t` and every `v1`, compute
`HMAC_SHA256(secret, t + "." + rawBody)` in hex, and compare.

## Delivery and retries

- **Answer 2xx quickly**, within 10 seconds, and do slow work afterwards. Anything else counts as
  a failure: other statuses, timeouts, connection errors and redirects, which are not followed.
  Response bodies are ignored.
- **At least once.** A failed attempt is retried after 30 seconds, then with the delay doubling
  each time up to 6 hours, plus a little jitter: 12 attempts over about 16 hours. The same event
  may arrive more than once, so **deduplicate on `id`**. It stays the same across retries and
  redeliveries.
- **No ordering.** Events can arrive out of order. Use `createdAt`, or fetch the resource, when
  order matters.
- **Delivery log.** Each delivery shows its status (`PENDING`, `RETRYING`, `SUCCEEDED`,
  `FAILED`), attempts, last HTTP status, duration and error. Deliveries are kept for 30 days and
  can be sent again (**Redeliver**).
- **Auto-disable.** After 30 failed attempts in a row, across events, Crossmart turns the endpoint
  off. What it still had to receive fails, the activity log says so, and members who manage
  webhooks get an email. Fix the receiver, send a test event, then turn the endpoint back on.
  Events from while it was off are not sent; redeliver the ones you need from the log.

## Rotate a secret

`POST …/rotate-secret` returns a new secret once. For the next 24 hours every delivery is signed
with both the new and the old secret, so you can deploy the new one without dropping events.
Rotating again within those 24 hours ends the older secret's grace at once.

## Test locally

Crossmart Cloud only delivers to public https URLs. To receive events on your machine, expose your
receiver with a tunnel (for example `cloudflared tunnel --url http://localhost:3000`), add the
tunnel URL as an endpoint, and press **Send test event**.
