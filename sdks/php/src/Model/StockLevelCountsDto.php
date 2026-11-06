<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class StockLevelCountsDto implements JsonSerializable
{
    /**
     * @param int|float $untracked Variants that do not track stock
     */
    public function __construct(
        public readonly int|float $inStock,
        public readonly int|float $lowStock,
        public readonly int|float $outOfStock,
        public readonly int|float $untracked,
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
            inStock: $payload->number('inStock'),
            lowStock: $payload->number('lowStock'),
            outOfStock: $payload->number('outOfStock'),
            untracked: $payload->number('untracked'),
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
            'inStock' => $this->inStock,
            'lowStock' => $this->lowStock,
            'outOfStock' => $this->outOfStock,
            'untracked' => $this->untracked,
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
