<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\AttentionStoreReason;
use Crossmart\Enum\ChannelConnectionStatus;
use Crossmart\Enum\ChannelType;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class AttentionStoreDto implements JsonSerializable
{
    /**
     * @param int|float $liveListings Listings still on the channel (not delisted)
     */
    public function __construct(
        public readonly string $connectionId,
        public readonly ChannelType|string $channel,
        public readonly string $displayName,
        public readonly ChannelConnectionStatus|string $status,
        public readonly ?string $statusReason,
        public readonly AttentionStoreReason|string $reason,
        public readonly int|float $liveListings,
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
            reason: $payload->enum('reason', AttentionStoreReason::class),
            liveListings: $payload->number('liveListings'),
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
            'reason' => Payload::enumValue($this->reason),
            'liveListings' => $this->liveListings,
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
