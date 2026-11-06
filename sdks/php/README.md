# Crossmart PHP SDK

The official PHP client for [Crossmart](https://crossmart.io), the open-source multichannel platform for sellers and their AI agents. Manage your catalog and stock, publish products to your Shopify, eBay, Etsy and Google Merchant Center stores, set per-store prices and overrides, read orders and sales, and work with Crossmart's AI writing tools from PHP applications and agents.

- Typed end to end: every model, enum and operation is generated from the API's OpenAPI document, and the SDK passes PHPStan at the maximum level.
- Works with any [PSR-18](https://www.php-fig.org/psr/psr-18/) HTTP client: Guzzle, Symfony HttpClient, or the one your framework already uses.
- Automatic pagination, typed exceptions, and retries with backoff that respect `Retry-After`.

Requires PHP 8.1 or later.

## Install

```bash
composer require crossmart/crossmart-php
```

The SDK needs a PSR-18 HTTP client and PSR-17 factories. If your project has none yet, install one, for example:

```bash
composer require guzzlehttp/guzzle
# or: composer require symfony/http-client nyholm/psr7
```

The client is found automatically with [php-http/discovery](https://docs.php-http.org/en/latest/discovery.html), or you pass your own (see [HTTP client](#http-client)).

## Authentication

Create an API key in the Crossmart web app under **Settings → API keys**. The secret starts with `cm_` and is shown only once. A key belongs to one workspace and has a role:

| Role     | Can                                                                                                   |
| -------- | ----------------------------------------------------------------------------------------------------- |
| Admin    | Everything below, plus manage stores, pricing rules, members and keys                                 |
| Editor   | Read everything; create and edit products and stock; publish and remove listings; ask the AI to write |
| Approver | Read everything; approve or reject AI suggestions                                                     |
| Viewer   | Read everything                                                                                       |

Keys can't be Owners, and a key never has more access than the member who created it. Custom roles work too. See [Roles and permissions](https://github.com/crossmart-io/crossmart/blob/main/docs/permissions.md) for each permission.

```php
use Crossmart\Crossmart;

$client = new Crossmart(apiKey: 'cm_...');
```

Every setting can come from the environment instead (`$_ENV`, `$_SERVER` or `getenv()`):

| Argument      | Environment variable     | Default                    |
| ------------- | ------------------------ | -------------------------- |
| `apiKey`      | `CROSSMART_API_KEY`      |                            |
| `accessToken` | `CROSSMART_ACCESS_TOKEN` |                            |
| `baseUrl`     | `CROSSMART_BASE_URL`     | `https://api.crossmart.io` |
| `workspaceId` | `CROSSMART_WORKSPACE_ID` | the API key's workspace    |

The API key is sent in the `x-api-key` header. With an API key you don't need `workspaceId`: the client asks the API which workspace the key belongs to (`GET /api/v1/api-key`) the first time it needs it.

AI agents that connect to Crossmart through OAuth get an access token instead of an API key. Pass it as `accessToken`, together with `workspaceId`; the client sends it as `Authorization: Bearer <token>`.

A self-hosted Crossmart works the same way: set `baseUrl` to your API's address, with or without `/api/v1`.

## Quick start

```php
use Crossmart\Crossmart;
use Crossmart\Enum\OrderStatus;
use Crossmart\Enum\ProductStatus;
use Crossmart\Model\CreateProductDto;
use Crossmart\Model\CreateVariantDto;
use Crossmart\Resource\Filter\OrderFilters;
use Crossmart\Resource\Filter\ProductFilters;

$client = new Crossmart(); // reads CROSSMART_API_KEY

// List products, one page at a time...
$page = $client->products->list(new ProductFilters(status: ProductStatus::Active), limit: 20);
echo $page->total, " active products\n";

// ...or iterate over all of them; pages are fetched as you go.
foreach ($client->products->listAll(new ProductFilters(search: 'apron')) as $product) {
    echo $product->id, ' ', $product->title, "\n";
}

// Create a product with one variant and opening stock.
$created = $client->products->create(new CreateProductDto(
    title: 'Linen apron',
    variants: [new CreateVariantDto(price: '24.00', sku: 'APR-NAT', quantity: 15)],
    status: ProductStatus::Active,
));

// Publish it to a connected store.
$store = $client->stores->list()[0];
$listing = $client->listings->publish($created->id, $store->id);

// Read open orders across every store.
foreach ($client->orders->listAll(new OrderFilters(status: OrderStatus::Open)) as $order) {
    echo $order->name, ' ', $order->storeName, ' ', $order->total, ' ', $order->currencyCode, "\n";
}
```

Request bodies accept either a generated model or an array in the API's JSON shape (camelCase keys), which is handy for agents that build requests as JSON:

```php
$client->products->create(['title' => 'Linen apron', 'variants' => [['price' => '24.00']]]);
```

## Resources

| Property      | Methods                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `products`    | `list`, `listAll`, `get`, `create`, `update` (replaces the product; a variant without `quantity` keeps its stock), `delete`                 |
| `inventory`   | `list`, `listAll`, `adjust`, `listMovements`, `listAllMovements`                                                                            |
| `stores`      | `list`, `get`, `setPricing`, `previewPricing`, `sync`, `syncProgress`, `listProducts`, `listAllProducts`, `listListings`, `listAllListings` |
| `listings`    | `forProduct`, `editor`, `publish`, `retry`, `remove`, `setOverride`, `patchOverride`, `clearOverride`, `publishMany`, `removeMany`          |
| `orders`      | `list`, `listAll`, `get`                                                                                                                    |
| `reports`     | `sales`, `inventory`                                                                                                                        |
| `ai`          | `status`, `usage`, `generateContent`, `draftContent`                                                                                        |
| `suggestions` | `list`, `listAll`, `get`, `approve`, `reject`, `approveMany`                                                                                |
| `workspaces`  | `get`, `update`, `currentApiKey`                                                                                                            |

Models live in `Crossmart\Model`, enums in `Crossmart\Enum`, and list filters in `Crossmart\Resource\Filter`. Models are immutable, with `fromArray()`, `toArray()` and `jsonSerialize()`.

The API may add enum values within a version. An enum field holds its case, such as `ProductStatus::Active`, or a plain string for a value newer than your SDK, so existing code keeps working: compare with `===` and give a `match` a `default` arm.

A few more examples:

```php
use Crossmart\Enum\CompareAtMode;
use Crossmart\Enum\InventoryMovementReason;
use Crossmart\Enum\PriceRounding;
use Crossmart\Enum\SalesRange;
use Crossmart\Enum\StockLevel;
use Crossmart\Enum\SuggestionStatus;
use Crossmart\Model\ListingOverrideDto;
use Crossmart\Model\ListingOverridePatchDto;
use Crossmart\Model\PricingRuleDto;
use Crossmart\Resource\Filter\InventoryFilters;
use Crossmart\Resource\Filter\SuggestionFilters;

// Restock everything that runs low.
foreach ($client->inventory->listAll(new InventoryFilters(stockLevel: StockLevel::LowStock)) as $item) {
    $client->inventory->adjust($item->inventoryItemId, 10, InventoryMovementReason::Received);
}

// Price one store 10% above the catalog, ending in .99. `null` removes the rule.
$client->stores->setPricing($storeId, new PricingRuleDto(
    adjustmentPercent: '10',
    fixedAmount: '0',
    rounding: PriceRounding::Ending99,
    floor: null,
    compareAt: CompareAtMode::Keep,
));

// Show a different title in one store...
$client->listings->setOverride($productId, $storeId, new ListingOverrideDto(title: 'Linen apron | Free shipping'));

// ...then change only the stock cap, and revert the title to the product's. Arguments you leave
// out are not sent, so their overrides stay as they are; `null` clears an override.
$client->listings->patchOverride($productId, $storeId, new ListingOverridePatchDto(title: null, maxQuantity: 5));

// Sales of the last 7 days, bucketed in a time zone.
$report = $client->reports->sales(SalesRange::Last7Days, 'America/New_York');

// Ask the AI to write store-specific titles and descriptions, then review them.
$client->ai->generateContent($storeId, [$productId]);
foreach ($client->suggestions->listAll(new SuggestionFilters(status: SuggestionStatus::Pending)) as $suggestion) {
    echo $suggestion->currentValue, ' -> ', $suggestion->proposedValue, "\n";
    $client->suggestions->approve($suggestion->id);
}
```

AI-generated content never changes a product directly. It arrives as pending suggestions, and nothing is applied until someone with the `suggestions:approve` permission approves them.

### Every other operation

The resources cover what sellers and agents do most. Every operation of the API, including members, roles, API keys, product views, activity and channel setup, is also available through `$client->api`, one generated class per tag, with methods named after the operation:

```php
$members = $client->api->members->membersControllerListV1($client->workspaceId());
$stats = $client->api->catalog->catalogStatsControllerGetV1($client->workspaceId());
```

File uploads (CSV product imports and image uploads, which use `multipart/form-data`) are not in the PHP SDK yet; use the REST API directly for those.

## Pagination

List endpoints use cursors. `list()` returns one `Page` with `items`, `nextCursor`, `total` (how many match across all pages) and `hasMore()`. Pass `nextCursor` back as `cursor` to get the next page. `listAll()` does that for you and returns a lazy generator; it asks for the largest page the API serves (100), or `pageSize`.

```php
$page = $client->orders->list(limit: 50);
while (true) {
    foreach ($page->items as $order) {
        // ...
    }
    if (!$page->hasMore()) {
        break;
    }
    $page = $client->orders->list(cursor: $page->nextCursor, limit: 50);
}
```

## Errors

Every error status throws an `ApiException` with `getStatus()`, `getApiMessage()`, `getErrorCode()`, `getReasonPhrase()`, `getBody()` and `getHeaders()`. Subclasses in `Crossmart\Exception` let you catch the cases you handle differently:

| Exception                   | Status | When                                                                      |
| --------------------------- | ------ | ------------------------------------------------------------------------- |
| `BadRequestException`       | 400    | Validation failed; the message joins the API's messages with `"; "`       |
| `AuthenticationException`   | 401    | The key or token is missing, wrong, revoked or expired                    |
| `PlanLimitException`        | 402    | The plan doesn't allow it; see `getFeature()`, `getLimit()`, `getUsage()` |
| `PermissionDeniedException` | 403    | The key's role lacks the permission                                       |
| `NotFoundException`         | 404    | Not found, or not in the key's workspace                                  |
| `ConflictException`         | 409    | Conflicts with the current state, such as a suggestion already reviewed   |
| `RateLimitException`        | 429    | Too many requests, after retries                                          |
| `ServerException`           | 5xx    | The API or an upstream provider failed                                    |

`ConnectionException` means the API could not be reached, `ConfigurationException` means the client is missing credentials or a workspace, and `InvalidPayloadException` means a response (or a request array) did not match the API's schema. All of them implement `CrossmartExceptionInterface`.

```php
use Crossmart\Enum\EntitlementErrorCode;
use Crossmart\Exception\PlanLimitException;

try {
    $client->listings->publish($productId, $storeId);
} catch (PlanLimitException $exception) {
    if ($exception->getErrorCode() === EntitlementErrorCode::PlanLimitReached->value) {
        printf("Your %s plan allows %d %s. Upgrade to add more.\n", $exception->getPlan(), $exception->getLimit(), $exception->getFeature());
    }
}
```

## Retries

Idempotent requests (`GET`, `PUT`, `DELETE`) are retried twice by default after a 429, a 5xx or a network failure, with exponential backoff and jitter. When the API sends `Retry-After`, the client waits that long (at most 60 seconds). `POST` and `PATCH` requests are never retried, so nothing is created or published twice.

```php
$client = new Crossmart(maxRetries: 5); // maxRetries: 0 turns retries off
```

## HTTP client

The SDK talks HTTP through [PSR-18](https://www.php-fig.org/psr/psr-18/) and builds requests with [PSR-17](https://www.php-fig.org/psr/psr-17/) factories, instead of depending on Guzzle directly. That is the convention of modern PHP SDKs: it never conflicts with the Guzzle (or Symfony) version your application already pins, it reuses the client your framework has configured, and tests can swap in a mock client. Pass your own client to set timeouts, proxies or middleware:

```php
use GuzzleHttp\Client;

$client = new Crossmart(
    apiKey: 'cm_...',
    httpClient: new Client(['timeout' => 30, 'connect_timeout' => 5]),
);
```

Without `httpClient`, `requestFactory` and `streamFactory`, the installed implementations are found with php-http/discovery.

## Development

The SDK lives in the Crossmart backend monorepo, in `sdks/php`. `src/Api`, `src/Enum` and `src/Model` are generated from the API's OpenAPI document by a small generator in `generator/` (no Java, no runtime dependencies). Don't edit them by hand; the rest of `src` is written by hand.

```bash
cd sdks/php
composer install

# Regenerate after an API change (from the repository root: pnpm build:api && pnpm openapi:generate)
composer generate

# Drift check, PHPStan (level max, checked against PHP 8.1) and PHPUnit
scripts/check.sh
```

`composer check:drift` regenerates in memory and fails when the committed code differs from the current OpenAPI document. Pass another document as an argument, or set `OPENAPI_SPEC`.

Test fixtures in `tests/Fixtures` are sample bodies built from the schemas, the same as the Python SDK's. The contract tests parse each one with its generated model and write it back unchanged. Rebuild them with `php scripts/build-test-fixtures.php` when the API's models change.

### Releasing (maintainers)

Packagist reads a package from the root of a Git repository, so the SDK is published from a read-only mirror, `crossmart-io/crossmart-php`, that holds only this directory. Development, issues and pull requests stay in the monorepo.

One-time setup:

1. Create the empty public repository `crossmart-io/crossmart-php` on GitHub. Its description should say that it is a read-only split and point to the monorepo; turn off issues and pull requests there.
2. Push the first split (step 2 below), then sign in to [Packagist](https://packagist.org) with the account that should own the `crossmart` vendor, choose **Submit**, and enter `https://github.com/crossmart-io/crossmart-php`. The package name `crossmart/crossmart-php` comes from `composer.json`.
3. Keep Packagist up to date automatically: connect the Packagist GitHub integration (Packagist profile → **Settings** → GitHub), or add a webhook to the split repository (Settings → Webhooks, payload URL `https://packagist.org/api/github?username=<packagist-user>`, content type `application/json`, secret: your Packagist API token).
4. Add a second Packagist maintainer for recovery.

Each release, from an up-to-date `main` of the monorepo:

1. Run `scripts/check.sh`, bump `Crossmart::VERSION` in `src/Crossmart.php`, update `CHANGELOG.md`, and merge.
2. Split this directory and push it to the mirror:

   ```bash
   git subtree split --prefix=sdks/php -b sdk-php-split
   git push git@github.com:crossmart-io/crossmart-php.git sdk-php-split:main
   ```

3. Tag the split commit there with the plain version (Packagist reads `vX.Y.Z` tags of the mirror), and tag the monorepo commit too:

   ```bash
   git tag v0.1.0 sdk-php-split && git push git@github.com:crossmart-io/crossmart-php.git v0.1.0 && git tag -d v0.1.0
   git tag sdk-php-v0.1.0 && git push origin sdk-php-v0.1.0
   ```

Packagist picks the tag up through the webhook within a minute. See [sdks/RELEASING.md](https://github.com/crossmart-io/crossmart/blob/main/sdks/RELEASING.md) for the versioning policy shared by all SDKs.

## License

[AGPL-3.0-only](LICENSE), like the rest of Crossmart.
