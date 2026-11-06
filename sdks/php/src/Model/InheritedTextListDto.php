<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class InheritedTextListDto implements JsonSerializable
{
    /**
     * @param list<string> $product
     * @param list<string>|null $override Null when it follows the product
     * @param list<string> $effective
     * @param bool $overridden Whether the store overrides it; reverting sets `override` to null
     */
    public function __construct(
        public readonly array $product,
        public readonly ?array $override,
        public readonly array $effective,
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
            product: $payload->stringList('product'),
            override: $payload->isNull('override') ? null : $payload->stringList('override'),
            effective: $payload->stringList('effective'),
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
