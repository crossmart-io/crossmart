<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class InheritedTextDto implements JsonSerializable
{
    /**
     * @param string $product The product’s value
     * @param string|null $override Null when it follows the product
     * @param string $effective What the store gets
     * @param bool $overridden Whether the store overrides it; reverting sets `override` to null
     */
    public function __construct(
        public readonly string $product,
        public readonly ?string $override,
        public readonly string $effective,
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
            product: $payload->string('product'),
            override: $payload->isNull('override') ? null : $payload->string('override'),
            effective: $payload->string('effective'),
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
            'product' => $this->product,
            'override' => $this->override,
            'effective' => $this->effective,
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
