<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ChannelType;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ConnectWithCredentialsDto implements JsonSerializable
{
    /**
     * @param ChannelType|string $channel A channel connected with credentials: `falabella`
     * @param string $credentials The credentials the channel issued, with the fields of its schema
     */
    public function __construct(
        public readonly ChannelType|string $channel,
        public readonly string $credentials,
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
            channel: $payload->enum('channel', ChannelType::class),
            credentials: $payload->string('credentials'),
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
            'channel' => Payload::enumValue($this->channel),
            'credentials' => $this->credentials,
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
