<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Enum\CatalogGap;
use Crossmart\Enum\CatalogImportFormat;
use Crossmart\Enum\ImportJobStatus;
use Crossmart\Enum\ProductSort;
use Crossmart\Enum\ProductStatus;
use Crossmart\Enum\ProductStoreFilter;
use Crossmart\Enum\SortDirection;
use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\BulkProductActionDto;
use Crossmart\Model\BulkProductResultDto;
use Crossmart\Model\CatalogStatsDto;
use Crossmart\Model\CreateProductDto;
use Crossmart\Model\CreateProductViewDto;
use Crossmart\Model\ImportJobDetailDto;
use Crossmart\Model\ImportJobPageDto;
use Crossmart\Model\ProductDto;
use Crossmart\Model\ProductPageDto;
use Crossmart\Model\ProductViewDto;
use Crossmart\Model\UpdateProductDto;

/**
 * The operations tagged "Catalog".
 */
final class CatalogApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * Products of a workspace, in title order
     *
     * Each row’s `stores` badges carry `displayState`, `displayReason` and `displayRequirement`, computed by the same rule as the store’s own pages.
     *
     * @param string|null $search Matches title, handle or SKU
     * @param CatalogGap|string|null $gap Only products that lack this value
     * @param list<string>|null $tags Only products with any of these tags. Repeat the parameter for several.
     * @param string|null $vendor Only products of this vendor, ignoring case
     * @param ProductStoreFilter|string|null $storeFilter By the stores products are in; `in_store` and `not_in_store` need `storeId`
     * @param string|null $storeId The store `storeFilter` is about
     * @param string|null $cursor `nextCursor` from the previous page
     * @param int|float|null $page 1-based page number, for tables with page numbers. It wins over `cursor`.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function productsControllerListV1(
        string $workspaceId,
        ?string $search = null,
        ProductStatus|string|null $status = null,
        CatalogGap|string|null $gap = null,
        ?array $tags = null,
        ?string $vendor = null,
        ProductStoreFilter|string|null $storeFilter = null,
        ?string $storeId = null,
        ProductSort|string|null $sort = null,
        SortDirection|string|null $direction = null,
        ?string $cursor = null,
        int|float|null $page = null,
        int|float|null $limit = null,
    ): ProductPageDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/products',
            pathParameters: ['workspaceId' => $workspaceId],
            query: ['search' => $search, 'status' => $status, 'gap' => $gap, 'tags' => $tags, 'vendor' => $vendor, 'storeFilter' => $storeFilter, 'storeId' => $storeId, 'sort' => $sort, 'direction' => $direction, 'cursor' => $cursor, 'page' => $page, 'limit' => $limit],
        ));

        return ProductPageDto::fromArray($response->object());
    }

    /**
     * Create a product with its variants
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function productsControllerCreateV1(
        string $workspaceId,
        CreateProductDto $body,
    ): ProductDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/products',
            pathParameters: ['workspaceId' => $workspaceId],
            body: $body->toArray(),
        ));

        return ProductDto::fromArray($response->object());
    }

    /**
     * A product with its variants, stock and media
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function productsControllerGetV1(
        string $workspaceId,
        string $productId,
    ): ProductDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/products/{productId}',
            pathParameters: ['workspaceId' => $workspaceId, 'productId' => $productId],
        ));

        return ProductDto::fromArray($response->object());
    }

    /**
     * Replace a product
     *
     * Variants sent with an id are edited, new ones are added and missing ones are removed. Stock changes are written to the inventory ledger as adjustments.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function productsControllerUpdateV1(
        string $workspaceId,
        string $productId,
        UpdateProductDto $body,
    ): ProductDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Put,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/products/{productId}',
            pathParameters: ['workspaceId' => $workspaceId, 'productId' => $productId],
            body: $body->toArray(),
        ));

        return ProductDto::fromArray($response->object());
    }

    /**
     * Delete a product, its variants and their stock
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function productsControllerDeleteV1(
        string $workspaceId,
        string $productId,
    ): void {
        $this->transport->send(new ApiRequest(
            method: HttpMethod::Delete,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/products/{productId}',
            pathParameters: ['workspaceId' => $workspaceId, 'productId' => $productId],
        ));
    }

    /**
     * Change many products at once
     *
     * Set a status, add or remove tags, move every variant price by a percentage, or delete. Each action runs as one statement, scoped to the workspace.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function productBulkActionsControllerApplyV1(
        string $workspaceId,
        BulkProductActionDto $body,
    ): BulkProductResultDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/product-bulk-actions',
            pathParameters: ['workspaceId' => $workspaceId],
            body: $body->toArray(),
        ));

        return BulkProductResultDto::fromArray($response->object());
    }

    /**
     * Saved filters of the product list, oldest first
     *
     * @return list<ProductViewDto>
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function productViewsControllerListV1(
        string $workspaceId,
    ): array {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/product-views',
            pathParameters: ['workspaceId' => $workspaceId],
        ));

        return array_map(ProductViewDto::fromArray(...), $response->objectList());
    }

    /**
     * Save the current filters of the product list as a view
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function productViewsControllerCreateV1(
        string $workspaceId,
        CreateProductViewDto $body,
    ): ProductViewDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/product-views',
            pathParameters: ['workspaceId' => $workspaceId],
            body: $body->toArray(),
        ));

        return ProductViewDto::fromArray($response->object());
    }

    /**
     * Delete a saved view
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function productViewsControllerDeleteV1(
        string $workspaceId,
        string $viewId,
    ): void {
        $this->transport->send(new ApiRequest(
            method: HttpMethod::Delete,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/product-views/{viewId}',
            pathParameters: ['workspaceId' => $workspaceId, 'viewId' => $viewId],
        ));
    }

    /**
     * Import history of a workspace, newest first
     *
     * @param CatalogImportFormat|string|null $format Where the records came from: a file of this format, or a channel
     * @param string|null $cursor `nextCursor` from the previous page
     * @param int|float|null $page 1-based page number, for tables with page numbers. It wins over `cursor`.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function importJobsControllerListV1(
        string $workspaceId,
        ImportJobStatus|string|null $status = null,
        CatalogImportFormat|string|null $format = null,
        SortDirection|string|null $direction = null,
        ?string $cursor = null,
        int|float|null $page = null,
        int|float|null $limit = null,
    ): ImportJobPageDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/import-jobs',
            pathParameters: ['workspaceId' => $workspaceId],
            query: ['status' => $status, 'format' => $format, 'direction' => $direction, 'cursor' => $cursor, 'page' => $page, 'limit' => $limit],
        ));

        return ImportJobPageDto::fromArray($response->object());
    }

    /**
     * An import with its skipped and failed records
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function importJobsControllerGetV1(
        string $workspaceId,
        string $jobId,
    ): ImportJobDetailDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/import-jobs/{jobId}',
            pathParameters: ['workspaceId' => $workspaceId, 'jobId' => $jobId],
        ));

        return ImportJobDetailDto::fromArray($response->object());
    }

    /**
     * Product and stock counts for the workspace overview
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function catalogStatsControllerGetV1(
        string $workspaceId,
    ): CatalogStatsDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/catalog-stats',
            pathParameters: ['workspaceId' => $workspaceId],
        ));

        return CatalogStatsDto::fromArray($response->object());
    }
}
