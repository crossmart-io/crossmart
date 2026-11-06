<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ListingDisplayState;
use Crossmart\Enum\ListingSource;
use Crossmart\Enum\ListingStatus;
use Crossmart\Enum\PublishRequirement;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class ChannelListingDto implements JsonSerializable
{
    /**
     * @param ListingSource|string $source How the product joined the store: by hand, by an import, or by the automatic rule
     * @param string|null $externalId The product’s id on the channel
     * @param string|null $externalUrl Where to see it on the channel
     * @param string|null $lastError Why the last sync failed
     * @param PublishRequirement|string|null $missingRequirement What the channel refused the last publish for lacking (such as `item_specifics`), when the merchant can add it; null otherwise
     * @param DateTimeImmutable|null $syncRequestedAt When a sync or retry queued its publish, update or delist; null once that job finished or gave up. While set, a selected listing shows `displayState: publishing`.
     * @param ChannelCategoryDto|null $category The channel category it is listed in, on channels with categories (eBay)
     * @param ListingDisplayState|string $displayState The product on this store, in one state computed by the server: `draft` (not selected for the store), `needs_details` (selected, but the store setup or the product lacks something publishing needs), `ready` (publishable, not sent yet), `publishing` (queued or in flight, including an update of a published listing that a sync or retry queued), `published`, `failed`, `removing` (being taken off) or `removed`.
     * @param string|null $displayReason For `needs_details` and `failed`: a short, merchant-readable reason (what to add, or the channel’s message). Never holds secrets. Null for the other states.
     * @param PublishRequirement|string|null $displayRequirement For `needs_details`: the requirement to fix first, so a client can open the right place. Store-setup requirements (`reconnect`, `account_settings`, `shipping_policy`, `payment_policy`, `return_policy`, `ship_from_location`, `listing_setup`) come before the product’s (`images`, `active_product`, `option_names`), which the server checks before publishing; `category` and `item_specifics` are known once the channel refused a publish. Null for the other states.
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
        public readonly string $productId,
        public readonly string $productTitle,
        public readonly ?string $imageUrl,
        public readonly int|float $variantCount,
        public readonly ListingDisplayState|string $displayState,
        public readonly ?string $displayReason,
        public readonly PublishRequirement|string|null $displayRequirement,
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
            productId: $payload->string('productId'),
            productTitle: $payload->string('productTitle'),
            imageUrl: $payload->isNull('imageUrl') ? null : $payload->string('imageUrl'),
            variantCount: $payload->number('variantCount'),
            displayState: $payload->enum('displayState', ListingDisplayState::class),
            displayReason: $payload->isNull('displayReason') ? null : $payload->string('displayReason'),
            displayRequirement: $payload->isNull('displayRequirement') ? null : $payload->enum('displayRequirement', PublishRequirement::class),
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
            'productId' => $this->productId,
            'productTitle' => $this->productTitle,
            'imageUrl' => $this->imageUrl,
            'variantCount' => $this->variantCount,
            'displayState' => Payload::enumValue($this->displayState),
            'displayReason' => $this->displayReason,
            'displayRequirement' => Payload::enumValue($this->displayRequirement),
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
