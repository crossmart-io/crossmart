<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ChannelType;
use Crossmart\Enum\ConnectFailure;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ChannelConnectRedirectDto implements JsonSerializable
{
    /**
     * @param ChannelType|string|null $connected Set when the account was connected
     * @param ConnectFailure|string|null $error Set when connecting failed
     * @param ChannelType|string|null $channel The channel an error is about
     */
    public function __construct(
        public readonly ChannelType|string|null $connected = null,
        public readonly ConnectFailure|string|null $error = null,
        public readonly ChannelType|string|null $channel = null,
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
            connected: $payload->isNull('connected') ? null : $payload->enum('connected', ChannelType::class),
            error: $payload->isNull('error') ? null : $payload->enum('error', ConnectFailure::class),
            channel: $payload->isNull('channel') ? null : $payload->enum('channel', ChannelType::class),
        );
    }

    /**
     * The model in the API's JSON shape.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [];
        if ($this->connected !== null) {
            $data['connected'] = Payload::enumValue($this->connected);
        }
        if ($this->error !== null) {
            $data['error'] = Payload::enumValue($this->error);
        }
        if ($this->channel !== null) {
            $data['channel'] = Payload::enumValue($this->channel);
        }

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
