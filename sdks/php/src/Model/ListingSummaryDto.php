<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ListingSource;
use Crossmart\Enum\ListingStatus;
use Crossmart\Enum\PublishRequirement;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class ListingSummaryDto implements JsonSerializable
{
    /**
     * @param ListingSource|string $source How the product joined the store: by hand, by an import, or by the automatic rule
     * @param string|null $externalId The product’s id on the channel
     * @param string|null $externalUrl Where to see it on the channel
     * @param string|null $lastError Why the last sync failed
     * @param PublishRequirement|string|null $missingRequirement What the channel refused the last publish for lacking (such as `item_specifics`), when the merchant can add it; null otherwise
     * @param DateTimeImmutable|null $syncRequestedAt When a sync or retry queued its publish, update or delist; null once that job finished or gave up. While set, a selected listing shows `displayState: publishing`.
     * @param ChannelCategoryDto|null $category The channel category it is listed in, on channels with categories (eBay)
     */
    public function __construct(
        public readonly string $id,
        public readonly ListingStatus|string $status,
        public readonly ListingSource|string $source,
        public readonly ?string $externalId,
        public readonly ?string $externalUrl,
        public readonly ?string $lastError,
        public readonly PublishRequirement|string|null $missingRequirement,
        public readonly ?DateTimeImmutable $lastSyncedAt,
        public readonly ?DateTimeImmutable $syncRequestedAt,
        public readonly ?ChannelCategoryDto $category,
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
            status: $payload->enum('status', ListingStatus::class),
            source: $payload->enum('source', ListingSource::class),
            externalId: $payload->isNull('externalId') ? null : $payload->string('externalId'),
            externalUrl: $payload->isNull('externalUrl') ? null : $payload->string('externalUrl'),
            lastError: $payload->isNull('lastError') ? null : $payload->string('lastError'),
            missingRequirement: $payload->isNull('missingRequirement') ? null : $payload->enum('missingRequirement', PublishRequirement::class),
            lastSyncedAt: $payload->isNull('lastSyncedAt') ? null : $payload->dateTime('lastSyncedAt'),
            syncRequestedAt: $payload->isNull('syncRequestedAt') ? null : $payload->dateTime('syncRequestedAt'),
            category: $payload->isNull('category') ? null : $payload->model('category', ChannelCategoryDto::fromArray(...)),
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
            'status' => Payload::enumValue($this->status),
            'source' => Payload::enumValue($this->source),
            'externalId' => $this->externalId,
            'externalUrl' => $this->externalUrl,
            'lastError' => $this->lastError,
            'missingRequirement' => Payload::enumValue($this->missingRequirement),
            'lastSyncedAt' => $this->lastSyncedAt === null ? null : Payload::formatDateTime($this->lastSyncedAt),
            'syncRequestedAt' => $this->syncRequestedAt === null ? null : Payload::formatDateTime($this->syncRequestedAt),
            'category' => $this->category?->toArray(),
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
