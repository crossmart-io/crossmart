# REST API fallback

Use the REST API only when the MCP tools aren't available (for example in a script or a sandbox
with network access). Every MCP tool is a thin wrapper over one of these endpoints.

- Base URL: `https://api.crossmart.io/api/v1` (self-hosted: `http://localhost:3000/api/v1`)
- Auth: header `x-api-key: $CROSSMART_API_KEY`. Read the key from the environment; never print it.
- Find the workspace: `GET /api-key` returns `workspaceId`, `role` and `permissions`.
- Reference: <https://api.crossmart.io/api/docs> (OpenAPI: `/api/docs-json`). SDKs:
  `npm install @crossmart/sdk`, `pip install crossmart`.

```bash
curl -s "https://api.crossmart.io/api/v1/api-key" -H "x-api-key: $CROSSMART_API_KEY"
```

Paths below are under `/workspaces/{workspaceId}`.

| MCP tool                    | Method and path                                                          |
| --------------------------- | ------------------------------------------------------------------------ |
| `list_products`             | `GET /products`                                                          |
| `get_product`               | `GET /products/{productId}`                                              |
| `create_product`            | `POST /products`                                                         |
| `replace_product`           | `PUT /products/{productId}`                                              |
| `list_inventory`            | `GET /inventory-items`                                                   |
| `adjust_stock`              | `POST /inventory-items/{inventoryItemId}/adjustments`                    |
| `list_orders`               | `GET /orders`                                                            |
| `get_order`                 | `GET /orders/{orderId}`                                                  |
| `list_stores`               | `GET /channel-connections`                                               |
| `get_store`                 | `GET /channel-connections/{connectionId}`                                |
| `add_product_to_store`      | `POST /products/{productId}/channels/{connectionId}`                     |
| `remove_product_from_store` | `DELETE /products/{productId}/channels/{connectionId}`                   |
| `list_store_products`       | `GET /channel-connections/{connectionId}/products`                       |
| `get_product_stores`        | `GET /products/{productId}/channels`                                     |
| `retry_store_listing`       | `POST /products/{productId}/channels/{connectionId}/retry`               |
| `get_sync_progress`         | `GET /channel-connections/{connectionId}/sync`                           |
| `get_listing`               | `GET /products/{productId}/channels/{connectionId}/listing`              |
| `update_listing`            | `PATCH /products/{productId}/channels/{connectionId}/override`           |
| `suggest_store_categories`  | `GET /products/{productId}/channels/{connectionId}/category-suggestions` |
| `set_store_category`        | `PUT /products/{productId}/channels/{connectionId}/category`             |
| `get_item_specifics`        | `GET /products/{productId}/channels/{connectionId}/item-specifics`       |
| `save_item_specifics`       | `PUT /products/{productId}/channels/{connectionId}/item-specifics`       |
| `get_sales_report`          | `GET /analytics/sales`                                                   |
| `get_inventory_report`      | `GET /analytics/inventory`                                               |
| `get_listing_health_report` | `GET /analytics/listings`                                                |
| `generate_content`          | `POST /ai/content-generations`                                           |
| `list_suggestions`          | `GET /suggestions`                                                       |
| `approve_suggestion`        | `POST /suggestions/{suggestionId}/approve`                               |
| `get_proposal`              | `GET /agent-proposals/{proposalId}`                                      |
| `get_platform_health`       | `GET /api/v1/health` (not workspace-scoped)                              |

Bulk publish (no MCP tool): `POST /channel-connections/{connectionId}/products/add` with
`{ "productIds": [...] }`. Confirm the list with the seller first.

An API key over REST writes directly, like any integration. An OAuth agent token does not while
the workspace approves agents' changes: writes answer `403` with `code: agent_approval_required`.
Propose the change instead with `POST /agent-proposals` and `{ "tool": "<MCP tool>", "input": {…} }`;
the answer's `outcome` is `proposed` (it waits for the seller; check it with
`GET /agent-proposals/{id}`) or `apply_directly` (make the call yourself).

Lists return `{ items, nextCursor, total }`; pass `cursor=<nextCursor>` for the next page. Errors are
`{ statusCode, error, message }`; `402` adds `code` (`plan_limit_reached`,
`plan_feature_not_included`).
