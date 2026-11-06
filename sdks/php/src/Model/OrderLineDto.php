<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class OrderLineDto implements JsonSerializable
{
    /**
     * @param int|float $reservedQuantity Units held for the order until they ship
     * @param int|float $fulfilledQuantity Units shipped
     */
    public function __construct(
        public readonly string $id,
        public readonly string $title,
        public readonly ?string $sku,
        public readonly int|float $quantity,
        public readonly string $unitPrice,
        public readonly int|float $reservedQuantity,
        public readonly int|float $fulfilledQuantity,
        public readonly ?string $variantId,
        public readonly ?string $productId,
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
            title: $payload->string('title'),
            sku: $payload->isNull('sku') ? null : $payload->string('sku'),
            quantity: $payload->number('quantity'),
            unitPrice: $payload->string('unitPrice'),
            reservedQuantity: $payload->number('reservedQuantity'),
            fulfilledQuantity: $payload->number('fulfilledQuantity'),
            variantId: $payload->isNull('variantId') ? null : $payload->string('variantId'),
            productId: $payload->isNull('productId') ? null : $payload->string('productId'),
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
            'title' => $this->title,
            'sku' => $this->sku,
            'quantity' => $this->quantity,
            'unitPrice' => $this->unitPrice,
            'reservedQuantity' => $this->reservedQuantity,
            'fulfilledQuantity' => $this->fulfilledQuantity,
            'variantId' => $this->variantId,
            'productId' => $this->productId,
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
