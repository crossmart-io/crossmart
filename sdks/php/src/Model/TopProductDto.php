<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class TopProductDto implements JsonSerializable
{
    /**
     * @param string $sales Line prices times units
     */
    public function __construct(
        public readonly string $productId,
        public readonly string $title,
        public readonly int|float $units,
        public readonly string $sales,
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
            productId: $payload->string('productId'),
            title: $payload->string('title'),
            units: $payload->number('units'),
            sales: $payload->string('sales'),
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
            'productId' => $this->productId,
            'title' => $this->title,
            'units' => $this->units,
            'sales' => $this->sales,
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
