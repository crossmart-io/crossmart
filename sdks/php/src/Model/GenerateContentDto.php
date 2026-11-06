<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class GenerateContentDto implements JsonSerializable
{
    /**
     * @param string $connectionId The store to write for
     * @param list<string> $productIds
     */
    public function __construct(
        public readonly string $connectionId,
        public readonly array $productIds,
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
            productIds: $payload->stringList('productIds'),
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
            'productIds' => $this->productIds,
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
