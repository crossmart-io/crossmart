<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class InventoryReportDto implements JsonSerializable
{
    /**
     * @param int|float $lowStockThreshold Available units at or below which stock counts as low
     * @param list<StoreHealthDto> $stores Every store, oldest first
     */
    public function __construct(
        public readonly string $currencyCode,
        public readonly InventoryValueDto $value,
        public readonly StockLevelCountsDto $stockLevels,
        public readonly int|float $lowStockThreshold,
        public readonly array $stores,
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
            currencyCode: $payload->string('currencyCode'),
            value: $payload->model('value', InventoryValueDto::fromArray(...)),
            stockLevels: $payload->model('stockLevels', StockLevelCountsDto::fromArray(...)),
            lowStockThreshold: $payload->number('lowStockThreshold'),
            stores: $payload->modelList('stores', StoreHealthDto::fromArray(...)),
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
            'currencyCode' => $this->currencyCode,
            'value' => $this->value->toArray(),
            'stockLevels' => $this->stockLevels->toArray(),
            'lowStockThreshold' => $this->lowStockThreshold,
            'stores' => array_map(static fn (StoreHealthDto $item): array => $item->toArray(), $this->stores),
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
