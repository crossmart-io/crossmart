<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\SalesInterval;
use Crossmart\Enum\SalesRange;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class SalesReportDto implements JsonSerializable
{
    /**
     * @param string $currencyCode The workspace currency; amounts are in it
     * @param SalesTotalsDto $previous The period of the same length before
     * @param list<SalesBucketDto> $buckets
     * @param list<SalesStoreDto> $stores Every store, oldest first
     * @param list<TopProductDto> $topProducts
     * @param int|float $otherCurrencyOrders Orders in other currencies, which the report leaves out
     */
    public function __construct(
        public readonly SalesRange|string $range,
        public readonly SalesInterval|string $interval,
        public readonly string $timeZone,
        public readonly string $currencyCode,
        public readonly SalesTotalsDto $current,
        public readonly SalesTotalsDto $previous,
        public readonly array $buckets,
        public readonly array $stores,
        public readonly array $topProducts,
        public readonly int|float $otherCurrencyOrders,
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
            range: $payload->enum('range', SalesRange::class),
            interval: $payload->enum('interval', SalesInterval::class),
            timeZone: $payload->string('timeZone'),
            currencyCode: $payload->string('currencyCode'),
            current: $payload->model('current', SalesTotalsDto::fromArray(...)),
            previous: $payload->model('previous', SalesTotalsDto::fromArray(...)),
            buckets: $payload->modelList('buckets', SalesBucketDto::fromArray(...)),
            stores: $payload->modelList('stores', SalesStoreDto::fromArray(...)),
            topProducts: $payload->modelList('topProducts', TopProductDto::fromArray(...)),
            otherCurrencyOrders: $payload->number('otherCurrencyOrders'),
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
            'range' => Payload::enumValue($this->range),
            'interval' => Payload::enumValue($this->interval),
            'timeZone' => $this->timeZone,
            'currencyCode' => $this->currencyCode,
            'current' => $this->current->toArray(),
            'previous' => $this->previous->toArray(),
            'buckets' => array_map(static fn (SalesBucketDto $item): array => $item->toArray(), $this->buckets),
            'stores' => array_map(static fn (SalesStoreDto $item): array => $item->toArray(), $this->stores),
            'topProducts' => array_map(static fn (TopProductDto $item): array => $item->toArray(), $this->topProducts),
            'otherCurrencyOrders' => $this->otherCurrencyOrders,
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
