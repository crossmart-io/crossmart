# Falabella

Crossmart connects to Falabella through the **Seller Center API**
(`https://sellercenter-api.falabella.com/`) in Chile, Colombia and Peru. The merchant pastes
four values from Falabella Seller Center:

- the seller id;
- the user's email;
- that user's API key;
- the country.

Products are published as Falabella products with their images, prices and stock. Crossmart
reads the seller's orders to move stock, and sends stock back. See
[ADR 0030](../decisions/0030-falabella-connector.md).

**Status: preview.** The connector is built from Falabella's documentation and tested against
fixtures copied from it. It has not yet run against a live seller account. Only platform admins
see it on the Stores page.

| Capability         | What it does on Falabella                                                            |
| ------------------ | ------------------------------------------------------------------------------------ |
| `publish_listings` | `ProductCreate` or `ProductUpdate` (one product per variant), then `Image`           |
| `update_price`     | `ProductUpdate` with each SKU's `Price` in the country                               |
| `provide_taxonomy` | `GetCategoryTree` and `GetCategorySuggestion`; category attributes as item specifics |
| `fetch_orders`     | `GetOrders` changed since the last poll, with `GetMultipleOrderItems`                |
| `update_inventory` | `ProductUpdate` with each SKU's `Stock`; read back with `GetProducts`                |

## Connect

1. In Falabella Seller Center, open **Mi cuenta → Usuarios**. Your email is the user id, and the
   **Api Key** column has the key. The user needs the _Seller API Access_ role.
2. Find your seller id under **Mi cuenta**.
3. In Crossmart's **Stores**, choose **Falabella**, paste the four values and pick the country.

Crossmart checks the key with a signed call before saving it. The key is stored encrypted and is
never shown again. Each country is its own store. To change the key, connect the same seller and
country again.

## Every request

Each call is signed with the API key, which is never sent:

- `Signature` is the HMAC-SHA256 hex digest of the sorted, RFC 3986-encoded query.
- The query also carries `Action`, `Format=XML`, `Timestamp`, `UserID` and `Version=1.0`.
- The User-Agent is `{SELLER_ID}/Node/{version}/CROSSMART/{FACL|FACO|FAPE}`.

## Publishing

- Every variant is a Falabella product with its own SKU. In categories that group variations,
  they share the first variant's SKU as `ParentSku`, and each variation attribute takes its value
  from the product option of the same name (for example an option named _Talla_).
- Each listing needs a category. Crossmart suggests one from the title.
- The category's required attributes are item specifics. So are the package height, width and
  length (cm) and weight (kg), and in Colombia the tax percentage. The weight comes from the
  variant when it has one. A listing without them is held back with what it lacks.
- The brand is the product's vendor, or `Genérico`. It must exist in Falabella's brand list.
- Condition: new → `Nuevo`, refurbished → `Reacondicionado`, other grades → `Usado`.
- Images: https links only, at most 8. The first is the main image.
- Compare-at prices are not sent.
- Ending a listing sets its products inactive. Crossmart never deletes Falabella products.

Falabella applies writes asynchronously as **feeds**. Crossmart waits up to a minute for each
feed and shows Falabella's row errors on the listing. A seller can send 50 feeds freely, then
one every two minutes, so Crossmart paces each store's syncs.

## Orders

Crossmart reads the orders the seller ships (`dropshipping`). Orders Falabella ships from its
own warehouse do not move the seller's stock. Each order item is one unit, and canceled items
release their stock. Crossmart reads no buyer details.

## Not yet supported

- Mexico, which Falabella's API does not document.
- Multi-warehouse stock.
- Sale prices.
- Marking orders ready to ship.
- Catalog import.
- Spanish content generation.
