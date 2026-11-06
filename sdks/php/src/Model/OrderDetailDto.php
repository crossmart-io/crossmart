<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\OrderStatus;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class OrderDetailDto implements JsonSerializable
{
    /**
     * @param string $name The number the merchant and buyer see
     * @param string $total What the buyer pays now
     * @param int|float $itemCount Units ordered, over every line
     * @param int|float $unmatchedLines Lines that match no catalog variant, so their stock is not tracked
     * @param string $externalId The order’s id on its channel
     * @param list<OrderLineDto> $lines
     */
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly OrderStatus|string $status,
        public readonly string $currencyCode,
        public readonly string $total,
        public readonly DateTimeImmutable $placedAt,
        public readonly string $connectionId,
        public readonly string $storeName,
        public readonly string $channel,
        public readonly int|float $itemCount,
        public readonly int|float $unmatchedLines,
        public readonly string $externalId,
        public readonly array $lines,
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
            id: $payload->string('id'),
            name: $payload->string('name'),
            status: $payload->enum('status', OrderStatus::class),
            currencyCode: $payload->string('currencyCode'),
            total: $payload->string('total'),
            placedAt: $payload->dateTime('placedAt'),
            connectionId: $payload->string('connectionId'),
            storeName: $payload->string('storeName'),
            channel: $payload->string('channel'),
            itemCount: $payload->number('itemCount'),
            unmatchedLines: $payload->number('unmatchedLines'),
            externalId: $payload->string('externalId'),
            lines: $payload->modelList('lines', OrderLineDto::fromArray(...)),
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
            'id' => $this->id,
            'name' => $this->name,
            'status' => Payload::enumValue($this->status),
            'currencyCode' => $this->currencyCode,
            'total' => $this->total,
            'placedAt' => Payload::formatDateTime($this->placedAt),
            'connectionId' => $this->connectionId,
            'storeName' => $this->storeName,
            'channel' => $this->channel,
            'itemCount' => $this->itemCount,
            'unmatchedLines' => $this->unmatchedLines,
            'externalId' => $this->externalId,
            'lines' => array_map(static fn (OrderLineDto $item): array => $item->toArray(), $this->lines),
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
