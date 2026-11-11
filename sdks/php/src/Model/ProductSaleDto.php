<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ProductSaleDto implements JsonSerializable
{
    /**
     * @param ProductDto $product The product as it is now, with every tracked variant at 0 available
     * @param int|float $unitsCleared Available units set to 0 across its tracked variants
     * @param list<SoldProductStoreDto> $removedFromStores The stores it was taken off. Their listings are ended on the channel in the background, like removing a product from a store by hand.
     * @param bool $alreadySold True when it was sold already (no stock left, on no store): nothing changed
     */
    public function __construct(
        public readonly ProductDto $product,
        public readonly int|float $unitsCleared,
        public readonly array $removedFromStores,
        public readonly bool $alreadySold,
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
            product: $payload->model('product', ProductDto::fromArray(...)),
            unitsCleared: $payload->number('unitsCleared'),
            removedFromStores: $payload->modelList('removedFromStores', SoldProductStoreDto::fromArray(...)),
            alreadySold: $payload->bool('alreadySold'),
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
            'product' => $this->product->toArray(),
            'unitsCleared' => $this->unitsCleared,
            'removedFromStores' => array_map(static fn (SoldProductStoreDto $item): array => $item->toArray(), $this->removedFromStores),
            'alreadySold' => $this->alreadySold,
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
