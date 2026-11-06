<?php

declare(strict_types=1);

namespace Crossmart\Resource;

use Crossmart\Config\Defaults;
use Crossmart\Model\ChannelConnectionDto;
use Crossmart\Model\ChannelListingDto;
use Crossmart\Model\ChannelProductDto;
use Crossmart\Model\PricingPreviewDto;
use Crossmart\Model\PricingPreviewRequestDto;
use Crossmart\Model\PricingRuleDto;
use Crossmart\Model\SyncProgressDto;
use Crossmart\Model\SyncRequestResultDto;
use Crossmart\Model\UpdatePricingDto;
use Crossmart\Pagination\Page;
use Crossmart\Pagination\Paginator;
use Crossmart\Resource\Filter\StoreListingFilters;
use Crossmart\Resource\Filter\StoreProductFilters;
use Generator;

/**
 * The workspace's connected stores (channel connections): Shopify shops, eBay accounts, Etsy
 * shops and Merchant Center accounts.
 *
 * Stores are connected in the Crossmart web app, because the merchant approves the app on the
 * channel. Here you read them, set their pricing rule, and follow what they list.
 */
final class Stores extends AbstractResource
{
    /**
     * The connected stores, in connection order.
     *
     * @return list<ChannelConnectionDto>
     */
    public function list(): array
    {
        return $this->api->channels->channelConnectionsControllerListV1($this->workspaceId());
    }

    public function get(string $storeId): ChannelConnectionDto
    {
        return $this->api->channels->channelConnectionsControllerGetV1($this->workspaceId(), $storeId);
    }

    /**
     * Sets how the store prices variants. The store's listings get the new prices at once.
     * Null removes the rule, so catalog prices are sent as they are.
     *
     * @param PricingRuleDto|array<string, mixed>|null $rule
     */
    public function setPricing(string $storeId, PricingRuleDto|array|null $rule): ChannelConnectionDto
    {
        $body = new UpdatePricingDto($this->pricingRule($rule));

        return $this->api->listings->channelRulesControllerUpdatePricingV1($this->workspaceId(), $storeId, $body);
    }

    /**
     * Prices a real product with a rule, saved or not. Without `$productId`, the first product
     * the store lists is priced.
     *
     * @param PricingRuleDto|array<string, mixed>|null $rule
     */
    public function previewPricing(string $storeId, PricingRuleDto|array|null $rule, ?string $productId = null): PricingPreviewDto
    {
        $body = new PricingPreviewRequestDto($this->pricingRule($rule), $productId);

        return $this->api->listings->channelRulesControllerPreviewPricingV1($this->workspaceId(), $storeId, $body);
    }

    /**
     * Publishes the store's selected products and delists the rest, in the background.
     *
     * Throws a {@see \Crossmart\Exception\PlanLimitException} when the plan has no room for the
     * listings it would add.
     */
    public function sync(string $storeId): SyncRequestResultDto
    {
        return $this->api->listings->channelSyncControllerRequestSyncV1($this->workspaceId(), $storeId);
    }

    /**
     * How far the store's sync has come: `pending` listings, `failed` ones, and `done` once
     * nothing is pending.
     */
    public function syncProgress(string $storeId): SyncProgressDto
    {
        return $this->api->listings->channelSyncControllerSyncProgressV1($this->workspaceId(), $storeId);
    }

    /**
     * One page of the store's products with their state on the channel.
     *
     * @return Page<ChannelProductDto>
     */
    public function listProducts(string $storeId, ?StoreProductFilters $filters = null, ?string $cursor = null, ?int $limit = null): Page
    {
        $filters ??= new StoreProductFilters();
        $page = $this->api->listings->channelProductsControllerListProductsV1(
            workspaceId: $this->workspaceId(),
            connectionId: $storeId,
            state: $filters->state,
            search: $filters->search,
            sort: $filters->sort,
            direction: $filters->direction,
            cursor: $cursor,
            limit: $limit,
        );

        return Page::of($page->items, $page->nextCursor, $page->total);
    }

    /**
     * All of the store's matching products, fetched page by page as you iterate.
     *
     * @return Generator<int, ChannelProductDto>
     */
    public function listAllProducts(string $storeId, ?StoreProductFilters $filters = null, int $pageSize = Defaults::MAX_PAGE_SIZE): Generator
    {
        return Paginator::items(fn (?string $cursor): Page => $this->listProducts($storeId, $filters, $cursor, $pageSize));
    }

    /**
     * One page of the store's listings, most recently changed first.
     *
     * @return Page<ChannelListingDto>
     */
    public function listListings(string $storeId, ?StoreListingFilters $filters = null, ?string $cursor = null, ?int $limit = null): Page
    {
        $page = $this->api->listings->channelSyncControllerListListingsV1(
            workspaceId: $this->workspaceId(),
            connectionId: $storeId,
            status: $filters?->status,
            cursor: $cursor,
            limit: $limit,
        );

        return Page::of($page->items, $page->nextCursor, $page->total);
    }

    /**
     * All of the store's matching listings, fetched page by page as you iterate.
     *
     * @return Generator<int, ChannelListingDto>
     */
    public function listAllListings(string $storeId, ?StoreListingFilters $filters = null, int $pageSize = Defaults::MAX_PAGE_SIZE): Generator
    {
        return Paginator::items(fn (?string $cursor): Page => $this->listListings($storeId, $filters, $cursor, $pageSize));
    }

    /**
     * @param PricingRuleDto|array<string, mixed>|null $rule
     */
    private function pricingRule(PricingRuleDto|array|null $rule): ?PricingRuleDto
    {
        return is_array($rule) ? PricingRuleDto::fromArray($rule) : $rule;
    }
}
