<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ListingItemSpecificsSummaryDto implements JsonSerializable
{
    /**
     * @param bool $supported Whether the channel has item specifics (eBay)
     * @param int|float $count How many item specifics the merchant set on the listing
     * @param list<string> $names
     */
    public function __construct(
        public readonly bool $supported,
        public readonly int|float $count,
        public readonly array $names,
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
            supported: $payload->bool('supported'),
            count: $payload->number('count'),
            names: $payload->stringList('names'),
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
            'supported' => $this->supported,
            'count' => $this->count,
            'names' => $this->names,
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
