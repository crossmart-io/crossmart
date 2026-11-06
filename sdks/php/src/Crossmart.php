<?php

declare(strict_types=1);

namespace Crossmart;

use Crossmart\Api\ApiClients;
use Crossmart\Config\ClientOptions;
use Crossmart\Config\Defaults;
use Crossmart\Exception\ConfigurationException;
use Crossmart\Http\HttpTransport;
use Crossmart\Http\RequestBuilder;
use Crossmart\Http\RetryingHttpClient;
use Crossmart\Http\RetryPolicy;
use Crossmart\Http\SleeperInterface;
use Crossmart\Http\SystemSleeper;
use Crossmart\Resource\Ai;
use Crossmart\Resource\Inventory;
use Crossmart\Resource\Listings;
use Crossmart\Resource\Orders;
use Crossmart\Resource\Products;
use Crossmart\Resource\Reports;
use Crossmart\Resource\Stores;
use Crossmart\Resource\Suggestions;
use Crossmart\Resource\Workspaces;
use Http\Discovery\Psr17FactoryDiscovery;
use Http\Discovery\Psr18ClientDiscovery;
use Psr\Http\Client\ClientInterface;
use Psr\Http\Message\RequestFactoryInterface;
use Psr\Http\Message\StreamFactoryInterface;
use SensitiveParameter;

/**
 * The Crossmart API client.
 *
 * ```php
 * $client = new Crossmart(apiKey: 'cm_...');  // or set CROSSMART_API_KEY
 * foreach ($client->products->listAll() as $product) {
 *     echo $product->title, PHP_EOL;
 * }
 * ```
 */
final class Crossmart
{
    /** The SDK's version, sent in the User-Agent header. Bumped before each release. */
    public const VERSION = '0.1.0';

    public readonly Products $products;
    public readonly Inventory $inventory;
    public readonly Stores $stores;
    public readonly Listings $listings;
    public readonly Orders $orders;
    public readonly Reports $reports;
    public readonly Ai $ai;
    public readonly Suggestions $suggestions;
    public readonly Workspaces $workspaces;

    /** Every operation of the API, generated from its OpenAPI document, grouped by tag. */
    public readonly ApiClients $api;

    private readonly WorkspaceResolver $workspace;

    /**
     * @param string|null $apiKey A workspace API key (Settings → API keys). Defaults to `CROSSMART_API_KEY`.
     * @param string|null $accessToken An OAuth access token issued to an agent, sent as a bearer
     *                                 token. Defaults to `CROSSMART_ACCESS_TOKEN`. Pass one credential, not both.
     * @param string|null $baseUrl The API's origin. Defaults to `CROSSMART_BASE_URL`, then
     *                             `https://api.crossmart.io`. A trailing `/api/v1` is accepted.
     * @param string|null $workspaceId The workspace to act in. Defaults to `CROSSMART_WORKSPACE_ID`.
     *                                 With an API key it can be left out: the key's workspace is looked up on first use.
     * @param int $maxRetries Retries of idempotent requests (`GET`, `PUT`, `DELETE`) after a 429, a
     *                        5xx or a network failure. `POST` and `PATCH` requests are never retried.
     * @param ClientInterface|null $httpClient Any PSR-18 client, such as Guzzle or Symfony
     *                                         HttpClient. Found automatically when left out. Configure timeouts and proxies on it.
     * @param RequestFactoryInterface|null $requestFactory A PSR-17 request factory. Found automatically when left out.
     * @param StreamFactoryInterface|null $streamFactory A PSR-17 stream factory. Found automatically when left out.
     * @param SleeperInterface|null $sleeper Waits between retries. Replace it in tests.
     *
     * @throws ConfigurationException When there is no credential, or two.
     */
    public function __construct(
        #[SensitiveParameter]
        ?string $apiKey = null,
        #[SensitiveParameter]
        ?string $accessToken = null,
        ?string $baseUrl = null,
        ?string $workspaceId = null,
        int $maxRetries = Defaults::MAX_RETRIES,
        ?ClientInterface $httpClient = null,
        ?RequestFactoryInterface $requestFactory = null,
        ?StreamFactoryInterface $streamFactory = null,
        ?SleeperInterface $sleeper = null,
    ) {
        $options = ClientOptions::resolve($apiKey, $accessToken, $baseUrl, $workspaceId);
        $retryingClient = new RetryingHttpClient(
            $httpClient ?? Psr18ClientDiscovery::find(),
            new RetryPolicy(maxRetries: $maxRetries),
            $sleeper ?? new SystemSleeper(),
        );
        $requestBuilder = new RequestBuilder(
            $options,
            $requestFactory ?? Psr17FactoryDiscovery::findRequestFactory(),
            $streamFactory ?? Psr17FactoryDiscovery::findStreamFactory(),
        );
        $this->api = new ApiClients(new HttpTransport($retryingClient, $requestBuilder));
        $this->workspace = new WorkspaceResolver($this->api->apiKeys, $options->credentials->kind, $options->workspaceId);
        $this->products = new Products($this->api, $this->workspace);
        $this->inventory = new Inventory($this->api, $this->workspace);
        $this->stores = new Stores($this->api, $this->workspace);
        $this->listings = new Listings($this->api, $this->workspace);
        $this->orders = new Orders($this->api, $this->workspace);
        $this->reports = new Reports($this->api, $this->workspace);
        $this->ai = new Ai($this->api, $this->workspace);
        $this->suggestions = new Suggestions($this->api, $this->workspace);
        $this->workspaces = new Workspaces($this->api, $this->workspace);
    }

    /**
     * The workspace the client acts in, looked up from the API key when not configured.
     */
    public function workspaceId(): string
    {
        return $this->workspace->workspaceId();
    }
}
