<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class CatalogStatsDto implements JsonSerializable
{
    /**
     * @param int|float $outOfStockVariants Tracked variants with nothing available
     * @param list<CatalogGapCountDto> $gaps Products lacking what channels require
     */
    public function __construct(
        public readonly int|float $products,
        public readonly int|float $activeProducts,
        public readonly int|float $draftProducts,
        public readonly int|float $archivedProducts,
        public readonly int|float $variants,
        public readonly int|float $outOfStockVariants,
        public readonly array $gaps,
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
            products: $payload->number('products'),
            activeProducts: $payload->number('activeProducts'),
            draftProducts: $payload->number('draftProducts'),
            archivedProducts: $payload->number('archivedProducts'),
            variants: $payload->number('variants'),
            outOfStockVariants: $payload->number('outOfStockVariants'),
            gaps: $payload->modelList('gaps', CatalogGapCountDto::fromArray(...)),
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
            'products' => $this->products,
            'activeProducts' => $this->activeProducts,
            'draftProducts' => $this->draftProducts,
            'archivedProducts' => $this->archivedProducts,
            'variants' => $this->variants,
            'outOfStockVariants' => $this->outOfStockVariants,
            'gaps' => array_map(static fn (CatalogGapCountDto $item): array => $item->toArray(), $this->gaps),
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
