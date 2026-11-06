<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class VariantPriceOverrideDto implements JsonSerializable
{
    public function __construct(
        public readonly string $variantId,
        public readonly ?string $price,
        public readonly ?string $compareAtPrice,
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
            variantId: $payload->string('variantId'),
            price: $payload->isNull('price') ? null : $payload->string('price'),
            compareAtPrice: $payload->isNull('compareAtPrice') ? null : $payload->string('compareAtPrice'),
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
            'variantId' => $this->variantId,
            'price' => $this->price,
            'compareAtPrice' => $this->compareAtPrice,
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
