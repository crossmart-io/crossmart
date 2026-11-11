<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ChannelType;
use Crossmart\Enum\PublishRequirement;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class AttentionListingGroupDto implements JsonSerializable
{
    /**
     * @param int|float $failedListings Failed listings of the product on this store
     * @param string|null $lastError The channel’s latest refusal
     * @param PublishRequirement|string|null $missingRequirement What the channel asks for, when details are missing rather than an error
     */
    public function __construct(
        public readonly string $productId,
        public readonly string $productTitle,
        public readonly ?string $imageUrl,
        public readonly string $connectionId,
        public readonly ChannelType|string $channel,
        public readonly string $storeName,
        public readonly int|float $failedListings,
        public readonly ?string $lastError,
        public readonly PublishRequirement|string|null $missingRequirement,
        public readonly DateTimeImmutable $updatedAt,
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
            productId: $payload->string('productId'),
            productTitle: $payload->string('productTitle'),
            imageUrl: $payload->isNull('imageUrl') ? null : $payload->string('imageUrl'),
            connectionId: $payload->string('connectionId'),
            channel: $payload->enum('channel', ChannelType::class),
            storeName: $payload->string('storeName'),
            failedListings: $payload->number('failedListings'),
            lastError: $payload->isNull('lastError') ? null : $payload->string('lastError'),
            missingRequirement: $payload->isNull('missingRequirement') ? null : $payload->enum('missingRequirement', PublishRequirement::class),
            updatedAt: $payload->dateTime('updatedAt'),
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
            'productId' => $this->productId,
            'productTitle' => $this->productTitle,
            'imageUrl' => $this->imageUrl,
            'connectionId' => $this->connectionId,
            'channel' => Payload::enumValue($this->channel),
            'storeName' => $this->storeName,
            'failedListings' => $this->failedListings,
            'lastError' => $this->lastError,
            'missingRequirement' => Payload::enumValue($this->missingRequirement),
            'updatedAt' => Payload::formatDateTime($this->updatedAt),
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
