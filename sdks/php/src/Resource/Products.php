<?php

declare(strict_types=1);

namespace Crossmart\Resource;

use Crossmart\Config\Defaults;
use Crossmart\Model\CreateProductDto;
use Crossmart\Model\ProductDto;
use Crossmart\Model\ProductSummaryDto;
use Crossmart\Model\UpdateProductDto;
use Crossmart\Pagination\Page;
use Crossmart\Pagination\Paginator;
use Crossmart\Resource\Filter\ProductFilters;
use Generator;

/**
 * Create, read, replace and delete products.
 *
 * ```php
 * $product = $client->products->create(new CreateProductDto(
 *     title: 'Linen apron',
 *     variants: [new CreateVariantDto(price: '24.00', sku: 'APR-1')],
 * ));
 * ```
 */
final class Products extends AbstractResource
{
    /**
     * One page of products, in title order unless the filters say otherwise.
     *
     * @return Page<ProductSummaryDto>
     */
    public function list(?ProductFilters $filters = null, ?string $cursor = null, ?int $limit = null): Page
    {
        $filters ??= new ProductFilters();
        $page = $this->api->catalog->productsControllerListV1(
            workspaceId: $this->workspaceId(),
            search: $filters->search,
            status: $filters->status,
            gap: $filters->gap,
            tags: $filters->tags,
            vendor: $filters->vendor,
            storeFilter: $filters->storeFilter,
            storeId: $filters->storeId,
            sort: $filters->sort,
            direction: $filters->direction,
            cursor: $cursor,
            limit: $limit,
        );

        return Page::of($page->items, $page->nextCursor, $page->total);
    }

    /**
     * Every matching product, fetched page by page as you iterate.
     *
     * @return Generator<int, ProductSummaryDto>
     */
    public function listAll(?ProductFilters $filters = null, int $pageSize = Defaults::MAX_PAGE_SIZE): Generator
    {
        return Paginator::items(fn (?string $cursor): Page => $this->list($filters, $cursor, $pageSize));
    }

    /**
     * A product with its variants, stock and media.
     */
    public function get(string $productId): ProductDto
    {
        return $this->api->catalog->productsControllerGetV1($this->workspaceId(), $productId);
    }

    /**
     * Creates a product with its variants.
     *
     * @param CreateProductDto|array<string, mixed> $product A model, or an array in the API's
     *                                                      JSON shape such as `['title' => 'Mug', 'variants' => [['price' => '12.00']]]`.
     */
    public function create(CreateProductDto|array $product): ProductDto
    {
        $body = is_array($product) ? CreateProductDto::fromArray($product) : $product;

        return $this->api->catalog->productsControllerCreateV1($this->workspaceId(), $body);
    }

    /**
     * Replaces a product (`PUT`).
     *
     * Variants sent with an `id` are edited, new ones are added and missing ones are removed. A
     * variant's `quantity` sets its available stock; leave it out to keep the current stock (a
     * new variant then starts at 0). Fetch the product first and send it back changed, so
     * nothing is dropped by accident.
     *
     * @param UpdateProductDto|array<string, mixed> $product
     */
    public function update(string $productId, UpdateProductDto|array $product): ProductDto
    {
        $body = is_array($product) ? UpdateProductDto::fromArray($product) : $product;

        return $this->api->catalog->productsControllerUpdateV1($this->workspaceId(), $productId, $body);
    }

    /**
     * Deletes a product, its variants and their stock.
     */
    public function delete(string $productId): void
    {
        $this->api->catalog->productsControllerDeleteV1($this->workspaceId(), $productId);
    }
}
