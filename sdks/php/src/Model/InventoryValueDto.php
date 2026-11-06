<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class InventoryValueDto implements JsonSerializable
{
    /**
     * @param string $atCost Units on hand times cost; no-cost variants left out
     * @param string $atPrice Units on hand times price
     * @param int|float $unitsOnHand Available plus held for orders
     * @param int|float $variantsWithoutCost Variants with stock on hand but no cost
     */
    public function __construct(
        public readonly string $atCost,
        public readonly string $atPrice,
        public readonly int|float $unitsOnHand,
        public readonly int|float $variantsWithoutCost,
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
            atCost: $payload->string('atCost'),
            atPrice: $payload->string('atPrice'),
            unitsOnHand: $payload->number('unitsOnHand'),
            variantsWithoutCost: $payload->number('variantsWithoutCost'),
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
            'atCost' => $this->atCost,
            'atPrice' => $this->atPrice,
            'unitsOnHand' => $this->unitsOnHand,
            'variantsWithoutCost' => $this->variantsWithoutCost,
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
