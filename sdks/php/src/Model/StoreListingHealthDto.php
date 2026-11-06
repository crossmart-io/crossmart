<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ChannelConnectionStatus;
use Crossmart\Enum\ChannelType;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class StoreListingHealthDto implements JsonSerializable
{
    /**
     * @param string|null $statusReason Why the store needs reconnecting or is in error; null otherwise
     * @param list<ListingStateCountDto> $states Every display state, in order, with how many products are in it: the same states and rule as the store’s product list (`draft` counts the catalog products not in the store)
     * @param int|float $failedListings Listings the channel refused on their last sync
     */
    public function __construct(
        public readonly string $connectionId,
        public readonly ChannelType|string $channel,
        public readonly string $displayName,
        public readonly ChannelConnectionStatus|string $status,
        public readonly ?string $statusReason,
        public readonly ?DateTimeImmutable $lastSyncedAt,
        public readonly array $states,
        public readonly int|float $failedListings,
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
            channel: $payload->enum('channel', ChannelType::class),
            displayName: $payload->string('displayName'),
            status: $payload->enum('status', ChannelConnectionStatus::class),
            statusReason: $payload->isNull('statusReason') ? null : $payload->string('statusReason'),
            lastSyncedAt: $payload->isNull('lastSyncedAt') ? null : $payload->dateTime('lastSyncedAt'),
            states: $payload->modelList('states', ListingStateCountDto::fromArray(...)),
            failedListings: $payload->number('failedListings'),
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
            'channel' => Payload::enumValue($this->channel),
            'displayName' => $this->displayName,
            'status' => Payload::enumValue($this->status),
            'statusReason' => $this->statusReason,
            'lastSyncedAt' => $this->lastSyncedAt === null ? null : Payload::formatDateTime($this->lastSyncedAt),
            'states' => array_map(static fn (ListingStateCountDto $item): array => $item->toArray(), $this->states),
            'failedListings' => $this->failedListings,
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
