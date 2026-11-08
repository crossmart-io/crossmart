<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class AgentWorkerActionTargetsDto implements JsonSerializable
{
    /**
     * @param list<string> $connectionIds Stores (channel connections) the call names; empty for none
     * @param list<string> $productIds Products the call names
     */
    public function __construct(
        public readonly array $connectionIds,
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
            connectionIds: $payload->stringList('connectionIds'),
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
            'connectionIds' => $this->connectionIds,
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
