<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ChannelConnectionStatus;
use Crossmart\Enum\ChannelType;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ConnectionSummaryDto implements JsonSerializable
{
    public function __construct(
        public readonly string $id,
        public readonly ChannelType|string $channel,
        public readonly string $displayName,
        public readonly ChannelConnectionStatus|string $status,
        public readonly string $currencyCode,
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
            channel: $payload->enum('channel', ChannelType::class),
            displayName: $payload->string('displayName'),
            status: $payload->enum('status', ChannelConnectionStatus::class),
            currencyCode: $payload->string('currencyCode'),
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
            'channel' => Payload::enumValue($this->channel),
            'displayName' => $this->displayName,
            'status' => Payload::enumValue($this->status),
            'currencyCode' => $this->currencyCode,
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
