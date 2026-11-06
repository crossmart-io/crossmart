<?php

declare(strict_types=1);

namespace Crossmart\Resource;

use Crossmart\Model\ListingEditorDto;
use Crossmart\Model\ListingOverrideDto;
use Crossmart\Model\ListingOverridePatchDto;
use Crossmart\Model\ProductChannelDto;
use Crossmart\Model\StoreProductsDto;
use Crossmart\Model\StoreProductsResultDto;

/**
 * Put products in stores, take them out, and change what one store shows.
 *
 * A product added by hand stays in the store whatever its automatic selection rule says, and is
 * published at once. Removing it delists it at once, and the rule leaves it out from then on.
 *
 * ```php
 * $client->listings->publish($productId, $storeId);
 * $client->listings->setOverride($productId, $storeId, new ListingOverrideDto(title: 'Linen apron | Free shipping'));
 * ```
 */
final class Listings extends AbstractResource
{
    /**
     * The product on each connected store: listing status, channel prices with their
     * explanation, shown stock and overrides.
     *
     * @return list<ProductChannelDto>
     */
    public function forProduct(string $productId): array
    {
        return $this->api->listings->productChannelsControllerListV1($this->workspaceId(), $productId);
    }

    /**
     * Adds the product to a store and publishes it there at once.
     */
    public function publish(string $productId, string $storeId): ProductChannelDto
    {
        return $this->api->listings->productChannelsControllerAddV1($this->workspaceId(), $productId, $storeId);
    }

    /**
     * Publishes the product to one store again, such as after a failed publish.
     *
     * Throws a {@see \Crossmart\Exception\ConflictException} when the store must be connected
     * again (error code `store_not_connected`) or does not include the product
     * (`product_not_in_store`), and a {@see \Crossmart\Exception\PlanLimitException} when the plan
     * has no room for another active listing.
     */
    public function retry(string $productId, string $storeId): ProductChannelDto
    {
        return $this->api->listings->productChannelsControllerRetryV1($this->workspaceId(), $productId, $storeId);
    }

    /**
     * Removes the product from a store. It is delisted there at once.
     */
    public function remove(string $productId, string $storeId): ProductChannelDto
    {
        return $this->api->listings->productChannelsControllerRemoveV1($this->workspaceId(), $productId, $storeId);
    }

    /**
     * Replaces the product's overrides in one store. Absent or null fields follow the product.
     *
     * @param ListingOverrideDto|array<string, mixed> $override
     */
    public function setOverride(string $productId, string $storeId, ListingOverrideDto|array $override): ProductChannelDto
    {
        $body = is_array($override) ? ListingOverrideDto::fromArray($override) : $override;

        return $this->api->listings->productChannelsControllerSaveOverrideV1($this->workspaceId(), $productId, $storeId, $body);
    }

    /**
     * Changes some of the product's overrides in one store and keeps the rest.
     *
     * Absent fields keep their override; null reverts a field to the product's value.
     *
     * @param ListingOverridePatchDto|array<string, mixed> $patch
     */
    public function patchOverride(string $productId, string $storeId, ListingOverridePatchDto|array $patch): ProductChannelDto
    {
        $body = is_array($patch) ? ListingOverridePatchDto::fromArray($patch) : $patch;

        return $this->api->listings->productChannelsControllerPatchOverrideV1($this->workspaceId(), $productId, $storeId, $body);
    }

    /**
     * Removes the product's overrides in one store, so it follows the product again.
     */
    public function clearOverride(string $productId, string $storeId): ProductChannelDto
    {
        return $this->api->listings->productChannelsControllerClearOverrideV1($this->workspaceId(), $productId, $storeId);
    }

    /**
     * The product's listing in one store, for an editor: each field's product value, override,
     * effective value and whether it is overridden, with the display state.
     */
    public function editor(string $productId, string $storeId): ListingEditorDto
    {
        return $this->api->listings->listingEditorControllerGetV1($this->workspaceId(), $productId, $storeId);
    }

    /**
     * Adds several products to a store and publishes them at once. Throws a
     * {@see \Crossmart\Exception\PlanLimitException}, without changing anything, when the plan has
     * no room for the listings they would add.
     *
     * @param list<string> $productIds
     */
    public function publishMany(string $storeId, array $productIds): StoreProductsResultDto
    {
        return $this->api->listings->storeProductsControllerAddV1($this->workspaceId(), $storeId, new StoreProductsDto($productIds));
    }

    /**
     * Removes several products from a store. They are delisted at once.
     *
     * @param list<string> $productIds
     */
    public function removeMany(string $storeId, array $productIds): StoreProductsResultDto
    {
        return $this->api->listings->storeProductsControllerRemoveV1($this->workspaceId(), $storeId, new StoreProductsDto($productIds));
    }
}
