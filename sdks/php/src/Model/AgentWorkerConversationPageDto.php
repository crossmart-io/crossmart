<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class AgentWorkerConversationPageDto implements JsonSerializable
{
    /**
     * @param list<AgentWorkerConversationDto> $items Most recently active first
     */
    public function __construct(
        public readonly array $items,
        public readonly int|float $total,
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
            items: $payload->modelList('items', AgentWorkerConversationDto::fromArray(...)),
            total: $payload->number('total'),
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
            'items' => array_map(static fn (AgentWorkerConversationDto $item): array => $item->toArray(), $this->items),
            'total' => $this->total,
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
