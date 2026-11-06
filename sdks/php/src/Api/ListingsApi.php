<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Enum\ChannelProductSort;
use Crossmart\Enum\ChannelProductState;
use Crossmart\Enum\ListingDisplayState;
use Crossmart\Enum\ListingStatus;
use Crossmart\Enum\SortDirection;
use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\ChannelCategoryDto;
use Crossmart\Model\ChannelConnectionDto;
use Crossmart\Model\ChannelListingPageDto;
use Crossmart\Model\ChannelProductPageDto;
use Crossmart\Model\ChooseChannelCategoryDto;
use Crossmart\Model\ListingEditorDto;
use Crossmart\Model\ListingItemSpecificsDto;
use Crossmart\Model\ListingOverrideDto;
use Crossmart\Model\ListingOverridePatchDto;
use Crossmart\Model\PricingPreviewDto;
use Crossmart\Model\PricingPreviewRequestDto;
use Crossmart\Model\ProductChannelDto;
use Crossmart\Model\SaveItemSpecificsDto;
use Crossmart\Model\SelectionPreviewDto;
use Crossmart\Model\StoreProductsDto;
use Crossmart\Model\StoreProductsResultDto;
use Crossmart\Model\SyncProgressDto;
use Crossmart\Model\SyncRequestResultDto;
use Crossmart\Model\UpdatePricingDto;
use Crossmart\Model\UpdateProductSelectionDto;

/**
 * The operations tagged "Listings".
 */
final class ListingsApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * The store’s products with their state on the channel
     *
     * Products the store should have or still has: listed, pending (being published), failed or removing (being delisted). Pass `state=excluded` for the catalog products it does not have. `displayState` narrows them to the state a merchant reads (`needs_details`, `ready`, …). Counts per state follow `search`, so they can label filter tabs.
     *
     * @param ListingDisplayState|string|null $displayState Only products showing this display state. Without `state` it looks at every catalog product, so `draft` and `removed` find those not in the store.
     * @param string|null $search Matches title, handle or SKU
     * @param int|float|null $page 1-based page number, for tables with page numbers. It wins over `cursor`.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function channelProductsControllerListProductsV1(
        string $workspaceId,
        string $connectionId,
        ChannelProductState|string|null $state = null,
        ListingDisplayState|string|null $displayState = null,
        ?string $search = null,
        ChannelProductSort|string|null $sort = null,
        SortDirection|string|null $direction = null,
        ?string $cursor = null,
        int|float|null $page = null,
        int|float|null $limit = null,
    ): ChannelProductPageDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/products',
            pathParameters: ['workspaceId' => $workspaceId, 'connectionId' => $connectionId],
            query: ['state' => $state, 'displayState' => $displayState, 'search' => $search, 'sort' => $sort, 'direction' => $direction, 'cursor' => $cursor, 'page' => $page, 'limit' => $limit],
        ));

        return ChannelProductPageDto::fromArray($response->object());
    }

    /**
     * Set the connection’s pricing rule
     *
     * The store’s listings get the new prices at once. A null rule sends catalog prices.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function channelRulesControllerUpdatePricingV1(
        string $workspaceId,
        string $connectionId,
        UpdatePricingDto $body,
    ): ChannelConnectionDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Put,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/pricing',
            pathParameters: ['workspaceId' => $workspaceId, 'connectionId' => $connectionId],
            body: $body->toArray(),
        ));

        return ChannelConnectionDto::fromArray($response->object());
    }

    /**
     * Price a real product with a rule, saved or not
     *
     * Without `productId`, the first product of the selection is priced.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function channelRulesControllerPreviewPricingV1(
        string $workspaceId,
        string $connectionId,
        PricingPreviewRequestDto $body,
    ): PricingPreviewDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/pricing/preview',
            pathParameters: ['workspaceId' => $workspaceId, 'connectionId' => $connectionId],
            body: $body->toArray(),
        ));

        return PricingPreviewDto::fromArray($response->object());
    }

    /**
     * Set the store’s automatic rule
     *
     * Applies at once: products the rule now adds are published, and products it now drops are delisted. Products added by hand stay; those removed by hand stay out. Refused (402) without saving when the plan has no room for the active listings it would add.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function channelSelectionControllerUpdateSelectionV1(
        string $workspaceId,
        string $connectionId,
        UpdateProductSelectionDto $body,
    ): ChannelConnectionDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Put,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/product-selection',
            pathParameters: ['workspaceId' => $workspaceId, 'connectionId' => $connectionId],
            body: $body->toArray(),
        ));

        return ChannelConnectionDto::fromArray($response->object());
    }

    /**
     * The products a selection lists, with counts, saved or not
     *
     * @param string|null $cursor `nextCursor` from the previous page
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function channelSelectionControllerPreviewSelectionV1(
        string $workspaceId,
        string $connectionId,
        UpdateProductSelectionDto $body,
        ?string $cursor = null,
        int|float|null $limit = null,
    ): SelectionPreviewDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/product-selection/preview',
            pathParameters: ['workspaceId' => $workspaceId, 'connectionId' => $connectionId],
            query: ['cursor' => $cursor, 'limit' => $limit],
            body: $body->toArray(),
        ));

        return SelectionPreviewDto::fromArray($response->object());
    }

    /**
     * How far the connection’s sync has come
     *
     * Counts the listings a sync or retry queued whose job has not finished yet, and those in error. Poll it after `POST …/sync`: the sync is done when `pending` is 0.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function channelSyncControllerSyncProgressV1(
        string $workspaceId,
        string $connectionId,
    ): SyncProgressDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/sync',
            pathParameters: ['workspaceId' => $workspaceId, 'connectionId' => $connectionId],
        ));

        return SyncProgressDto::fromArray($response->object());
    }

    /**
     * Publish the selected products and sync the connection
     *
     * Queues every selected product to be published (or updated when the channel has it) and every listing that is no longer selected to be delisted. Jobs run in the background. Each listing it queues is marked (`syncRequestedAt`, `displayState: publishing`) until its job finishes; follow them with `GET …/sync`. Refused (402) before anything is queued when the plan has no room for the active listings it would add.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function channelSyncControllerRequestSyncV1(
        string $workspaceId,
        string $connectionId,
    ): SyncRequestResultDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/sync',
            pathParameters: ['workspaceId' => $workspaceId, 'connectionId' => $connectionId],
        ));

        return SyncRequestResultDto::fromArray($response->object());
    }

    /**
     * The connection’s listings, most recently changed first
     *
     * @param int|float|null $page 1-based page number, for tables with page numbers. It wins over `cursor`.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function channelSyncControllerListListingsV1(
        string $workspaceId,
        string $connectionId,
        ListingStatus|string|null $status = null,
        ?string $cursor = null,
        int|float|null $page = null,
        int|float|null $limit = null,
    ): ChannelListingPageDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/listings',
            pathParameters: ['workspaceId' => $workspaceId, 'connectionId' => $connectionId],
            query: ['status' => $status, 'cursor' => $cursor, 'page' => $page, 'limit' => $limit],
        ));

        return ChannelListingPageDto::fromArray($response->object());
    }

    /**
     * Add products to the store
     *
     * They stay until removed and are published at once. Refused (402) without changes when the plan has no room for the active listings they would add.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function storeProductsControllerAddV1(
        string $workspaceId,
        string $connectionId,
        StoreProductsDto $body,
    ): StoreProductsResultDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/products/add',
            pathParameters: ['workspaceId' => $workspaceId, 'connectionId' => $connectionId],
            body: $body->toArray(),
        ));

        return StoreProductsResultDto::fromArray($response->object());
    }

    /**
     * Remove products from the store
     *
     * They are delisted at once, and the automatic rule leaves them out.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function storeProductsControllerRemoveV1(
        string $workspaceId,
        string $connectionId,
        StoreProductsDto $body,
    ): StoreProductsResultDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/products/remove',
            pathParameters: ['workspaceId' => $workspaceId, 'connectionId' => $connectionId],
            body: $body->toArray(),
        ));

        return StoreProductsResultDto::fromArray($response->object());
    }

    /**
     * The product on each connected channel
     *
     * Listing status, channel prices with their explanation, shown stock and overrides.
     *
     * @return list<ProductChannelDto>
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function productChannelsControllerListV1(
        string $workspaceId,
        string $productId,
    ): array {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/products/{productId}/channels',
            pathParameters: ['workspaceId' => $workspaceId, 'productId' => $productId],
        ));

        return array_map(ProductChannelDto::fromArray(...), $response->objectList());
    }

    /**
     * Add the product to a store
     *
     * The product stays in the store until it is removed, whatever the automatic rule says, and is published there at once.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function productChannelsControllerAddV1(
        string $workspaceId,
        string $productId,
        string $connectionId,
    ): ProductChannelDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/products/{productId}/channels/{connectionId}',
            pathParameters: ['workspaceId' => $workspaceId, 'productId' => $productId, 'connectionId' => $connectionId],
        ));

        return ProductChannelDto::fromArray($response->object());
    }

    /**
     * Remove the product from a store
     *
     * The product is delisted there at once, and the automatic rule leaves it out.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function productChannelsControllerRemoveV1(
        string $workspaceId,
        string $productId,
        string $connectionId,
    ): ProductChannelDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Delete,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/products/{productId}/channels/{connectionId}',
            pathParameters: ['workspaceId' => $workspaceId, 'productId' => $productId, 'connectionId' => $connectionId],
        ));

        return ProductChannelDto::fromArray($response->object());
    }

    /**
     * Publish the product to one store again
     *
     * Re-queues this product’s publish (or update) to this store only, unlike `POST …/sync`, which resyncs the whole store. A failed or delisted listing becomes pending at once, so the answer shows `displayState: publishing`; the job runs in the background. Refused (409) when the store is not connected (`code: store_not_connected`: it needs re-auth or was disconnected) or does not select the product (`code: product_not_in_store`), and (402) when the plan has no room for another active listing.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function productChannelsControllerRetryV1(
        string $workspaceId,
        string $productId,
        string $connectionId,
    ): ProductChannelDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/products/{productId}/channels/{connectionId}/retry',
            pathParameters: ['workspaceId' => $workspaceId, 'productId' => $productId, 'connectionId' => $connectionId],
        ));

        return ProductChannelDto::fromArray($response->object());
    }

    /**
     * Override the product on one channel
     *
     * Replaces the overrides: absent or null fields follow the product. When the channel already lists the product, an update is queued.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function productChannelsControllerSaveOverrideV1(
        string $workspaceId,
        string $productId,
        string $connectionId,
        ListingOverrideDto $body,
    ): ProductChannelDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Put,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/products/{productId}/channels/{connectionId}/override',
            pathParameters: ['workspaceId' => $workspaceId, 'productId' => $productId, 'connectionId' => $connectionId],
            body: $body->toArray(),
        ));

        return ProductChannelDto::fromArray($response->object());
    }

    /**
     * Remove the product’s overrides on one channel
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function productChannelsControllerClearOverrideV1(
        string $workspaceId,
        string $productId,
        string $connectionId,
    ): ProductChannelDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Delete,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/products/{productId}/channels/{connectionId}/override',
            pathParameters: ['workspaceId' => $workspaceId, 'productId' => $productId, 'connectionId' => $connectionId],
        ));

        return ProductChannelDto::fromArray($response->object());
    }

    /**
     * Change some of the product’s overrides on one channel
     *
     * Absent fields keep their override; null reverts a field to the product’s value. Each `variantPrices` entry replaces that variant’s prices only, and both prices null revert the variant to the pricing rule. When the channel already lists the product, an update is queued.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function productChannelsControllerPatchOverrideV1(
        string $workspaceId,
        string $productId,
        string $connectionId,
        ListingOverridePatchDto $body,
    ): ProductChannelDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Patch,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/products/{productId}/channels/{connectionId}/override',
            pathParameters: ['workspaceId' => $workspaceId, 'productId' => $productId, 'connectionId' => $connectionId],
            body: $body->toArray(),
        ));

        return ProductChannelDto::fromArray($response->object());
    }

    /**
     * The product’s listing on one store, for the listing editor
     *
     * Every field (title, description, tags, images, visibility, and each variant’s price and compare-at price) with the product’s value, the store’s override (null when it follows the product) and the value the store gets, plus the stock limits, category, a summary of the item specifics and the display state. Revert one field with `PATCH …/override`.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function listingEditorControllerGetV1(
        string $workspaceId,
        string $productId,
        string $connectionId,
    ): ListingEditorDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/products/{productId}/channels/{connectionId}/listing',
            pathParameters: ['workspaceId' => $workspaceId, 'productId' => $productId, 'connectionId' => $connectionId],
        ));

        return ListingEditorDto::fromArray($response->object());
    }

    /**
     * Suggest channel categories for the product
     *
     * Searches the channel’s categories for `search`, or for the product’s title.
     *
     * @param string|null $search Keywords; the product’s title when absent
     * @return list<ChannelCategoryDto>
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function productChannelCategoryControllerSuggestV1(
        string $workspaceId,
        string $productId,
        string $connectionId,
        ?string $search = null,
    ): array {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/products/{productId}/channels/{connectionId}/category-suggestions',
            pathParameters: ['workspaceId' => $workspaceId, 'productId' => $productId, 'connectionId' => $connectionId],
            query: ['search' => $search],
        ));

        return array_map(ChannelCategoryDto::fromArray(...), $response->objectList());
    }

    /**
     * Choose the product’s channel category
     *
     * Null lets the next publish pick the channel’s best match. When the channel already lists the product, an update is queued.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function productChannelCategoryControllerChooseV1(
        string $workspaceId,
        string $productId,
        string $connectionId,
        ChooseChannelCategoryDto $body,
    ): ProductChannelDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Put,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/products/{productId}/channels/{connectionId}/category',
            pathParameters: ['workspaceId' => $workspaceId, 'productId' => $productId, 'connectionId' => $connectionId],
            body: $body->toArray(),
        ));

        return ProductChannelDto::fromArray($response->object());
    }

    /**
     * Get the listing’s item specifics
     *
     * The item specifics the listing’s channel category asks for (none until it has a category), with the values set on the listing.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function productChannelItemSpecificsControllerGetV1(
        string $workspaceId,
        string $productId,
        string $connectionId,
    ): ListingItemSpecificsDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/products/{productId}/channels/{connectionId}/item-specifics',
            pathParameters: ['workspaceId' => $workspaceId, 'productId' => $productId, 'connectionId' => $connectionId],
        ));

        return ListingItemSpecificsDto::fromArray($response->object());
    }

    /**
     * Set the listing’s item specifics
     *
     * Replaces the item specifics set on the listing. They are sent on publish ahead of the ones Crossmart derives (such as Brand from the vendor). The listing is sent again when the channel holds it or its last publish failed.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function productChannelItemSpecificsControllerSaveV1(
        string $workspaceId,
        string $productId,
        string $connectionId,
        SaveItemSpecificsDto $body,
    ): ListingItemSpecificsDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Put,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/products/{productId}/channels/{connectionId}/item-specifics',
            pathParameters: ['workspaceId' => $workspaceId, 'productId' => $productId, 'connectionId' => $connectionId],
            body: $body->toArray(),
        ));

        return ListingItemSpecificsDto::fromArray($response->object());
    }
}
