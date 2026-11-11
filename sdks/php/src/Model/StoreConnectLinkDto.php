<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ChannelType;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class StoreConnectLinkDto implements JsonSerializable
{
    /**
     * @param string $url Opens the Stores page with this channel’s connect dialog
     */
    public function __construct(
        public readonly ChannelType|string $channel,
        public readonly string $url,
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
            url: $payload->string('url'),
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
            'url' => $this->url,
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
