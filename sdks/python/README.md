# Crossmart Python SDK

The official Python client for [Crossmart](https://crossmart.io), the open-source multichannel platform for sellers and their AI agents. Manage your catalog and stock, publish products to your Shopify, eBay and Google Merchant Center stores, set per-store prices and overrides, read orders and sales, and work with Crossmart's AI writing tools from Python scripts and AI agents.

- Typed end to end: models and enums are generated from the API's OpenAPI document, and the client passes `mypy --strict`.
- Synchronous (`Crossmart`) and asynchronous (`AsyncCrossmart`) clients built on [httpx](https://www.python-httpx.org/).
- Automatic pagination, typed exceptions, and retries with backoff that respect `Retry-After`.

Requires Python 3.11 or later.

## Install

```bash
pip install crossmart
```

## Authentication

Create an API key in the Crossmart web app under **Settings → API keys**. The secret starts with `cm_` and is shown only once. A key belongs to one workspace and has a role:

| Role     | Can                                                                                                   |
| -------- | ----------------------------------------------------------------------------------------------------- |
| Admin    | Everything below, plus manage stores, pricing rules, members and keys                                 |
| Editor   | Read everything; create and edit products and stock; publish and remove listings; ask the AI to write |
| Approver | Read everything; approve or reject AI suggestions                                                     |
| Viewer   | Read everything                                                                                       |

Keys can't be Owners, and a key never has more access than the member who created it. Custom roles work too. See [Roles and permissions](https://github.com/crossmart-io/crossmart/blob/main/docs/permissions.md) for each permission.

```python
from crossmart import Crossmart

client = Crossmart(api_key="cm_...")
```

Every setting can come from the environment instead:

| Argument       | Environment variable     | Default                    |
| -------------- | ------------------------ | -------------------------- |
| `api_key`      | `CROSSMART_API_KEY`      |                            |
| `access_token` | `CROSSMART_ACCESS_TOKEN` |                            |
| `base_url`     | `CROSSMART_BASE_URL`     | `https://api.crossmart.io` |
| `workspace_id` | `CROSSMART_WORKSPACE_ID` | the API key's workspace    |

With an API key you don't need `workspace_id`: the client asks the API which workspace the key belongs to (`GET /api/v1/api-key`) the first time it needs it.

AI agents that connect to Crossmart through OAuth get an access token instead of an API key. Pass it as `access_token`, together with `workspace_id`; the client sends it as `Authorization: Bearer <token>`.

A self-hosted Crossmart works the same way: set `base_url` to your API's address, with or without `/api/v1`.

## Quick start

```python
from crossmart import Crossmart
from crossmart.models import CreateProductDto, CreateVariantDto, OrderStatus, ProductStatus

with Crossmart() as client:  # reads CROSSMART_API_KEY
    # List products, one page at a time...
    page = client.products.list(status=ProductStatus.ACTIVE, limit=20)
    print(page.total, "active products")

    # ...or iterate over all of them; pages are fetched as you go.
    for product in client.products.iter(search="apron"):
        print(product.id, product.title)

    # Create a product with one variant and opening stock.
    created = client.products.create(
        CreateProductDto(
            title="Linen apron",
            status=ProductStatus.ACTIVE,
            variants=[CreateVariantDto(sku="APR-NAT", price="24.00", quantity=15)],
        )
    )

    # Publish it to a connected store.
    store = client.stores.list()[0]
    listing = client.listings.publish(created.id, store.id)
    print(listing.connection.display_name, listing.listing.status if listing.listing else "queued")

    # Read open orders across every store.
    for order in client.orders.iter(status=OrderStatus.OPEN):
        print(order.name, order.store_name, order.total, order.currency_code)
```

Request bodies accept either a generated model or a plain mapping in the API's JSON shape (camelCase keys), which is handy for agents that build requests as JSON:

```python
client.products.create({"title": "Linen apron", "variants": [{"price": "24.00"}]})
```

## Resources

| Attribute     | Methods                                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `products`    | `list`, `iter`, `get`, `create`, `update` (replaces the product; a variant without `quantity` keeps its stock), `delete`                     |
| `inventory`   | `list`, `iter`, `adjust`, `movements`, `iter_movements`                                                                                      |
| `stores`      | `list`, `get`, `set_pricing`, `preview_pricing`, `sync`, `sync_progress`, `list_products`, `iter_products`, `list_listings`, `iter_listings` |
| `listings`    | `for_product`, `editor`, `publish`, `retry`, `remove`, `set_override`, `patch_override`, `clear_override`, `publish_many`, `remove_many`     |
| `orders`      | `list`, `iter`, `get`                                                                                                                        |
| `reports`     | `sales`, `inventory`                                                                                                                         |
| `ai`          | `status`, `usage`, `generate_content`, `draft_content`                                                                                       |
| `suggestions` | `list`, `iter`, `get`, `approve`, `reject`, `approve_many`                                                                                   |
| `workspaces`  | `get`, `update`, `current_api_key`                                                                                                           |

Models and enums live in `crossmart.models`. A few more examples:

```python
from crossmart.models import (
    InventoryMovementReason,
    ListingOverrideDto,
    PriceRounding,
    CompareAtMode,
    PricingRuleDto,
    SalesRange,
    StockLevel,
    SuggestionStatus,
)

# Restock everything that runs low.
for item in client.inventory.iter(stock_level=StockLevel.LOW_STOCK):
    client.inventory.adjust(item.inventory_item_id, 10, InventoryMovementReason.RECEIVED)

# Price one store 10% above the catalog, ending in .99. `None` removes the rule.
client.stores.set_pricing(
    store_id,
    PricingRuleDto(
        adjustment_percent="10",
        fixed_amount="0",
        rounding=PriceRounding.ENDING_99,
        floor=None,
        compare_at=CompareAtMode.KEEP,
    ),
)

# Show a different title in one store.
client.listings.set_override(
    product_id, store_id, ListingOverrideDto(title="Linen apron | Free shipping")
)

# Sales of the last 7 days, bucketed in a time zone.
report = client.reports.sales(range_=SalesRange.LAST_7_DAYS, time_zone="America/New_York")
print(report.current.sales, report.currency_code)

# Ask the AI to write store-specific titles and descriptions, then review them.
client.ai.generate_content(store_id, [product_id])
for suggestion in client.suggestions.iter(status=SuggestionStatus.PENDING):
    print(suggestion.current_value, "->", suggestion.proposed_value)
    client.suggestions.approve(suggestion.id)
```

AI-generated content never changes a product directly. It arrives as pending suggestions, and nothing is applied until someone with the `suggestions:approve` permission approves them.

## Async usage

`AsyncCrossmart` takes the same arguments and has the same resources. Methods are coroutines, and `iter` methods return async iterators:

```python
import asyncio

from crossmart import AsyncCrossmart


async def main() -> None:
    async with AsyncCrossmart() as client:
        stores = await client.stores.list()
        async for product in client.products.iter():
            print(product.title)


asyncio.run(main())
```

## Pagination

List endpoints use cursors. `list()` returns one `Page` with `items`, `next_cursor`, `total` (how many match across all pages) and `has_more`. Pass `next_cursor` back as `cursor` to get the next page. `iter()` does that for you and yields items lazily. `limit` sets the page size (at most 100).

```python
page = client.orders.list(limit=50)
while True:
    for order in page.items:
        ...
    if not page.has_more:
        break
    page = client.orders.list(limit=50, cursor=page.next_cursor)
```

## Errors

Every error status raises a `CrossmartAPIError` with `status`, `message`, `code`, `error`, `body` and `headers`. Subclasses let you catch the cases you handle differently:

| Exception               | Status | When                                                                    |
| ----------------------- | ------ | ----------------------------------------------------------------------- |
| `BadRequestError`       | 400    | Validation failed; `message` joins the API's messages with `"; "`       |
| `AuthenticationError`   | 401    | The key or token is missing, wrong, revoked or expired                  |
| `PlanLimitError`        | 402    | The plan doesn't allow it; see `code`, `feature`, `limit`, `usage`      |
| `PermissionDeniedError` | 403    | The key's role lacks the permission                                     |
| `NotFoundError`         | 404    | Not found, or not in the key's workspace                                |
| `ConflictError`         | 409    | Conflicts with the current state, such as a suggestion already reviewed |
| `RateLimitError`        | 429    | Too many requests, after retries                                        |
| `ServerError`           | 5xx    | The API or an upstream provider failed                                  |

`CrossmartConnectionError` means the API could not be reached, and `CrossmartConfigurationError` means the client is missing credentials or a workspace. All of them derive from `CrossmartError`.

```python
from crossmart import PlanLimitError
from crossmart.models import EntitlementErrorCode

try:
    client.listings.publish(product_id, store_id)
except PlanLimitError as error:
    if error.code == EntitlementErrorCode.PLAN_LIMIT_REACHED:
        print(f"Your {error.plan} plan allows {error.limit} {error.feature}. Upgrade to add more.")
```

## Retries and timeouts

Idempotent requests (`GET`, `PUT`, `DELETE`) are retried twice by default after a 429, a 5xx or a refused connection, with exponential backoff and jitter. When the API sends `Retry-After`, the client waits that long (at most 60 seconds). `POST` requests are never retried, so nothing is created or published twice.

```python
client = Crossmart(max_retries=5, timeout=60.0)  # max_retries=0 turns retries off
```

You can pass your own httpx transport, for example for a proxy or for tests: `Crossmart(transport=httpx.HTTPTransport(proxy="http://proxy:8080"))`.

## Development

The models and the low-level client in `crossmart/_generated` are generated with [openapi-python-client](https://github.com/openapi-generators/openapi-python-client) from the API's OpenAPI document. Don't edit them by hand. The hand-written client lives in the rest of the `crossmart` package.

```bash
cd sdks/python
python -m venv .venv && source .venv/bin/activate
pip install --group dev -e .

# Regenerate after an API change (from the repository root: pnpm build && pnpm openapi:generate)
scripts/generate.sh

ruff check . && ruff format --check . && mypy && pytest
```

`scripts/generate.sh` first rewrites the nullable nested objects NestJS emits (`nullable` next to a single `allOf`) into a form the generator understands (`scripts/normalize_spec.py`). CI regenerates the client from the current API and fails when the committed code is out of date.

Test fixtures in `tests/fixtures` are sample bodies built from the schemas. Rebuild them with `python scripts/build_test_fixtures.py ../../openapi.json tests/fixtures` when the API's models change.

## License

[AGPL-3.0](LICENSE).
