<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ListingStatus;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ListingStatusCountDto implements JsonSerializable
{
    public function __construct(
        public readonly ListingStatus|string $status,
        public readonly int|float $count,
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
            status: $payload->enum('status', ListingStatus::class),
            count: $payload->number('count'),
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
            'status' => Payload::enumValue($this->status),
            'count' => $this->count,
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
