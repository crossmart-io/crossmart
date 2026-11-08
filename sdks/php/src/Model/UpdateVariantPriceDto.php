<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use Crossmart\Serialization\Undefined;
use JsonSerializable;

final class UpdateVariantPriceDto implements JsonSerializable
{
    /**
     * @param string|null $price In the workspace currency
     * @param string|Undefined|null $compareAtPrice The "was" price buyers see struck through; null removes it
     */
    public function __construct(
        public readonly ?string $price = null,
        public readonly string|Undefined|null $compareAtPrice = Undefined::Value,
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
            price: $payload->isNull('price') ? null : $payload->string('price'),
            compareAtPrice: !$payload->has('compareAtPrice') ? Undefined::Value : ($payload->isNull('compareAtPrice') ? null : $payload->string('compareAtPrice')),
        );
    }

    /**
     * The model in the API's JSON shape.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [];
        if ($this->price !== null) {
            $data['price'] = $this->price;
        }
        if (!$this->compareAtPrice instanceof Undefined) {
            $data['compareAtPrice'] = $this->compareAtPrice;
        }

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
