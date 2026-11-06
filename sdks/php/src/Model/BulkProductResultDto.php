<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class BulkProductResultDto implements JsonSerializable
{
    /**
     * @param int|float $affected Products changed. Ids from other workspaces are not counted.
     */
    public function __construct(
        public readonly int|float $affected,
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
            affected: $payload->number('affected'),
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
            'affected' => $this->affected,
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
