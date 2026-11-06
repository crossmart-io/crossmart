<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ListingStockLimitsDto implements JsonSerializable
{
    /**
     * @param int|float|null $inventoryBuffer Units held back from this store
     * @param int|float|null $maxQuantity The most units this store shows
     */
    public function __construct(
        public readonly int|float|null $inventoryBuffer,
        public readonly int|float|null $maxQuantity,
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
            inventoryBuffer: $payload->isNull('inventoryBuffer') ? null : $payload->number('inventoryBuffer'),
            maxQuantity: $payload->isNull('maxQuantity') ? null : $payload->number('maxQuantity'),
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
            'inventoryBuffer' => $this->inventoryBuffer,
            'maxQuantity' => $this->maxQuantity,
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
