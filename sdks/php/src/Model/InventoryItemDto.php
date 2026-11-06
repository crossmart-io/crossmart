<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\StockLevel;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class InventoryItemDto implements JsonSerializable
{
    /**
     * @param list<string> $optionValues One value per product option, in order
     * @param string|null $imageUrl The product’s first image
     * @param bool $tracked Whether Crossmart tracks stock for this variant
     * @param int|float $onHand Units in stock: available plus reserved
     * @param int|float $reserved Units held for open orders
     * @param int|float $available Units that can still be sold, and what channels receive
     */
    public function __construct(
        public readonly string $inventoryItemId,
        public readonly string $variantId,
        public readonly string $productId,
        public readonly string $productTitle,
        public readonly array $optionValues,
        public readonly ?string $sku,
        public readonly ?string $imageUrl,
        public readonly bool $tracked,
        public readonly int|float $onHand,
        public readonly int|float $reserved,
        public readonly int|float $available,
        public readonly StockLevel|string $stockLevel,
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
            inventoryItemId: $payload->string('inventoryItemId'),
            variantId: $payload->string('variantId'),
            productId: $payload->string('productId'),
            productTitle: $payload->string('productTitle'),
            optionValues: $payload->stringList('optionValues'),
            sku: $payload->isNull('sku') ? null : $payload->string('sku'),
            imageUrl: $payload->isNull('imageUrl') ? null : $payload->string('imageUrl'),
            tracked: $payload->bool('tracked'),
            onHand: $payload->number('onHand'),
            reserved: $payload->number('reserved'),
            available: $payload->number('available'),
            stockLevel: $payload->enum('stockLevel', StockLevel::class),
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
            'inventoryItemId' => $this->inventoryItemId,
            'variantId' => $this->variantId,
            'productId' => $this->productId,
            'productTitle' => $this->productTitle,
            'optionValues' => $this->optionValues,
            'sku' => $this->sku,
            'imageUrl' => $this->imageUrl,
            'tracked' => $this->tracked,
            'onHand' => $this->onHand,
            'reserved' => $this->reserved,
            'available' => $this->available,
            'stockLevel' => Payload::enumValue($this->stockLevel),
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
