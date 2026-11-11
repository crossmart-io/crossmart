<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ChannelType;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class SoldProductStoreDto implements JsonSerializable
{
    public function __construct(
        public readonly string $connectionId,
        public readonly ChannelType|string $channel,
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
            channel: $payload->enum('channel', ChannelType::class),
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
            'channel' => Payload::enumValue($this->channel),
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
