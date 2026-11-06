<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\CatalogGap;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class CatalogGapCountDto implements JsonSerializable
{
    /**
     * @param int|float $products Products with this gap
     */
    public function __construct(
        public readonly CatalogGap|string $gap,
        public readonly int|float $products,
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
            gap: $payload->enum('gap', CatalogGap::class),
            products: $payload->number('products'),
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
            'gap' => Payload::enumValue($this->gap),
            'products' => $this->products,
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
