<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ConnectedChannelDto implements JsonSerializable
{
    /**
     * @param bool $reconnected True when the account was connected before and got new keys
     */
    public function __construct(
        public readonly ChannelConnectionDto $connection,
        public readonly bool $reconnected,
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
            connection: $payload->model('connection', ChannelConnectionDto::fromArray(...)),
            reconnected: $payload->bool('reconnected'),
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
            'connection' => $this->connection->toArray(),
            'reconnected' => $this->reconnected,
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
