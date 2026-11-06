<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class SalesBucketDto implements JsonSerializable
{
    /**
     * @param string $startsOn First day of the bucket, in the time zone
     * @param string $previousStartsOn First day of the matching earlier bucket
     * @param list<ConnectionSalesDto> $byConnection Stores with orders in the bucket
     */
    public function __construct(
        public readonly string $startsOn,
        public readonly string $sales,
        public readonly int|float $orders,
        public readonly string $previousStartsOn,
        public readonly string $previousSales,
        public readonly array $byConnection,
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
            startsOn: $payload->string('startsOn'),
            sales: $payload->string('sales'),
            orders: $payload->number('orders'),
            previousStartsOn: $payload->string('previousStartsOn'),
            previousSales: $payload->string('previousSales'),
            byConnection: $payload->modelList('byConnection', ConnectionSalesDto::fromArray(...)),
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
            'startsOn' => $this->startsOn,
            'sales' => $this->sales,
            'orders' => $this->orders,
            'previousStartsOn' => $this->previousStartsOn,
            'previousSales' => $this->previousSales,
            'byConnection' => array_map(static fn (ConnectionSalesDto $item): array => $item->toArray(), $this->byConnection),
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
