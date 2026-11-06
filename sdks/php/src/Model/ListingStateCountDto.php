<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ListingDisplayState;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ListingStateCountDto implements JsonSerializable
{
    /**
     * @param int|float $count Products of the catalog in this state on the store
     */
    public function __construct(
        public readonly ListingDisplayState|string $state,
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
            state: $payload->enum('state', ListingDisplayState::class),
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
            'state' => Payload::enumValue($this->state),
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
