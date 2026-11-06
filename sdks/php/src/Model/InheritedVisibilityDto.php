<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ListingVisibility;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class InheritedVisibilityDto implements JsonSerializable
{
    /**
     * @param ListingVisibility|string $product `VISIBLE` when the product is active, else `HIDDEN`
     * @param bool $overridden Whether the store overrides it; reverting sets `override` to null
     */
    public function __construct(
        public readonly ListingVisibility|string $product,
        public readonly ListingVisibility|string|null $override,
        public readonly ListingVisibility|string $effective,
        public readonly bool $overridden,
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
            product: $payload->enum('product', ListingVisibility::class),
            override: $payload->isNull('override') ? null : $payload->enum('override', ListingVisibility::class),
            effective: $payload->enum('effective', ListingVisibility::class),
            overridden: $payload->bool('overridden'),
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
            'product' => Payload::enumValue($this->product),
            'override' => Payload::enumValue($this->override),
            'effective' => Payload::enumValue($this->effective),
            'overridden' => $this->overridden,
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
