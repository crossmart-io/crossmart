<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ProductCondition;
use Crossmart\Enum\ProductStatus;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class ProductSummaryDto implements JsonSerializable
{
    /**
     * @param int|float|null $totalAvailable Stock across variants that track it; null when none do
     * @param list<ProductStoreBadgeDto> $stores The stores it is in, in the order it joined them
     */
    public function __construct(
        public readonly string $id,
        public readonly string $handle,
        public readonly string $title,
        public readonly ProductStatus|string $status,
        public readonly ProductCondition|string|null $condition,
        public readonly ?string $vendor,
        public readonly ?string $productType,
        public readonly int|float $variantCount,
        public readonly int|float|null $totalAvailable,
        public readonly ?PriceRangeDto $priceRange,
        public readonly ?string $imageUrl,
        public readonly array $stores,
        public readonly DateTimeImmutable $updatedAt,
    ) {
    }

    /**
     * Builds the model from the API's JSON shape.
     *
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $payload = new Payload($data, self::class);

        return new self(
            id: $payload->string('id'),
            handle: $payload->string('handle'),
            title: $payload->string('title'),
            status: $payload->enum('status', ProductStatus::class),
            condition: $payload->isNull('condition') ? null : $payload->enum('condition', ProductCondition::class),
            vendor: $payload->isNull('vendor') ? null : $payload->string('vendor'),
            productType: $payload->isNull('productType') ? null : $payload->string('productType'),
            variantCount: $payload->number('variantCount'),
            totalAvailable: $payload->isNull('totalAvailable') ? null : $payload->number('totalAvailable'),
            priceRange: $payload->isNull('priceRange') ? null : $payload->model('priceRange', PriceRangeDto::fromArray(...)),
            imageUrl: $payload->isNull('imageUrl') ? null : $payload->string('imageUrl'),
            stores: $payload->modelList('stores', ProductStoreBadgeDto::fromArray(...)),
            updatedAt: $payload->dateTime('updatedAt'),
        );
    }

    /**
     * The model in the API's JSON shape.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'handle' => $this->handle,
            'title' => $this->title,
            'status' => Payload::enumValue($this->status),
            'condition' => Payload::enumValue($this->condition),
            'vendor' => $this->vendor,
            'productType' => $this->productType,
            'variantCount' => $this->variantCount,
            'totalAvailable' => $this->totalAvailable,
            'priceRange' => $this->priceRange?->toArray(),
            'imageUrl' => $this->imageUrl,
            'stores' => array_map(static fn (ProductStoreBadgeDto $item): array => $item->toArray(), $this->stores),
            'updatedAt' => Payload::formatDateTime($this->updatedAt),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
