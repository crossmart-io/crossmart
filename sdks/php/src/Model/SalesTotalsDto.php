<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class SalesTotalsDto implements JsonSerializable
{
    /**
     * @param string $sales Order totals, cancelled orders left out
     * @param int|float $units Units ordered
     * @param string|null $averageOrderValue Sales per order
     */
    public function __construct(
        public readonly string $sales,
        public readonly int|float $orders,
        public readonly int|float $units,
        public readonly ?string $averageOrderValue,
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
            sales: $payload->string('sales'),
            orders: $payload->number('orders'),
            units: $payload->number('units'),
            averageOrderValue: $payload->isNull('averageOrderValue') ? null : $payload->string('averageOrderValue'),
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
            'sales' => $this->sales,
            'orders' => $this->orders,
            'units' => $this->units,
            'averageOrderValue' => $this->averageOrderValue,
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
