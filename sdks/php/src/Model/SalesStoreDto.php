<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class SalesStoreDto implements JsonSerializable
{
    public function __construct(
        public readonly string $connectionId,
        public readonly string $sales,
        public readonly int|float $orders,
        public readonly string $channel,
        public readonly string $displayName,
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
            connectionId: $payload->string('connectionId'),
            sales: $payload->string('sales'),
            orders: $payload->number('orders'),
            channel: $payload->string('channel'),
            displayName: $payload->string('displayName'),
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
            'connectionId' => $this->connectionId,
            'sales' => $this->sales,
            'orders' => $this->orders,
            'channel' => $this->channel,
            'displayName' => $this->displayName,
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
