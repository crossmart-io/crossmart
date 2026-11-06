<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ChannelConnectionStatus;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class StoreHealthDto implements JsonSerializable
{
    /**
     * @param list<ListingStatusCountDto> $listings Every listing status, in order
     */
    public function __construct(
        public readonly string $connectionId,
        public readonly string $channel,
        public readonly string $displayName,
        public readonly ChannelConnectionStatus|string $status,
        public readonly ?DateTimeImmutable $lastSyncedAt,
        public readonly array $listings,
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
            channel: $payload->string('channel'),
            displayName: $payload->string('displayName'),
            status: $payload->enum('status', ChannelConnectionStatus::class),
            lastSyncedAt: $payload->isNull('lastSyncedAt') ? null : $payload->dateTime('lastSyncedAt'),
            listings: $payload->modelList('listings', ListingStatusCountDto::fromArray(...)),
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
            'channel' => $this->channel,
            'displayName' => $this->displayName,
            'status' => Payload::enumValue($this->status),
            'lastSyncedAt' => $this->lastSyncedAt === null ? null : Payload::formatDateTime($this->lastSyncedAt),
            'listings' => array_map(static fn (ListingStatusCountDto $item): array => $item->toArray(), $this->listings),
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
