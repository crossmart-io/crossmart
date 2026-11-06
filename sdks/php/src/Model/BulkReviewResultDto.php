<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class BulkReviewResultDto implements JsonSerializable
{
    /**
     * @param list<SuggestionDto> $items Each suggestion reviewed: `APPLIED`, or `STALE` when its field had changed
     * @param list<string> $skippedIds Ids not found in the workspace or no longer pending
     */
    public function __construct(
        public readonly array $items,
        public readonly array $skippedIds,
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
            items: $payload->modelList('items', SuggestionDto::fromArray(...)),
            skippedIds: $payload->stringList('skippedIds'),
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
            'items' => array_map(static fn (SuggestionDto $item): array => $item->toArray(), $this->items),
            'skippedIds' => $this->skippedIds,
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
