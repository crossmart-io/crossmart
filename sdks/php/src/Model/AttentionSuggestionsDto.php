<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class AttentionSuggestionsDto implements JsonSerializable
{
    /**
     * @param int|float $count AI suggestions waiting for review
     * @param list<AttentionSuggestionDto> $items The latest ones, up to `limit`
     */
    public function __construct(
        public readonly int|float $count,
        public readonly array $items,
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
            count: $payload->number('count'),
            items: $payload->modelList('items', AttentionSuggestionDto::fromArray(...)),
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
            'count' => $this->count,
            'items' => array_map(static fn (AttentionSuggestionDto $item): array => $item->toArray(), $this->items),
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
