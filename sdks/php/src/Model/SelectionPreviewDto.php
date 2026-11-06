<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class SelectionPreviewDto implements JsonSerializable
{
    /**
     * @param int|float $total Products the selection lists
     * @param int|float $matchingFilter Products the filter matches, before the manual lists
     * @param int|float $addedManually Products added by hand that the filter does not match
     * @param int|float $removedManually Products the filter matches that were removed by hand
     * @param list<ProductSummaryDto> $items
     * @param int|float $toPublish Products saving this rule publishes now
     * @param int|float $toRemove Products saving this rule delists now
     */
    public function __construct(
        public readonly int|float $total,
        public readonly int|float $matchingFilter,
        public readonly int|float $addedManually,
        public readonly int|float $removedManually,
        public readonly array $items,
        public readonly ?string $nextCursor,
        public readonly int|float $toPublish,
        public readonly int|float $toRemove,
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
            total: $payload->number('total'),
            matchingFilter: $payload->number('matchingFilter'),
            addedManually: $payload->number('addedManually'),
            removedManually: $payload->number('removedManually'),
            items: $payload->modelList('items', ProductSummaryDto::fromArray(...)),
            nextCursor: $payload->isNull('nextCursor') ? null : $payload->string('nextCursor'),
            toPublish: $payload->number('toPublish'),
            toRemove: $payload->number('toRemove'),
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
            'total' => $this->total,
            'matchingFilter' => $this->matchingFilter,
            'addedManually' => $this->addedManually,
            'removedManually' => $this->removedManually,
            'items' => array_map(static fn (ProductSummaryDto $item): array => $item->toArray(), $this->items),
            'nextCursor' => $this->nextCursor,
            'toPublish' => $this->toPublish,
            'toRemove' => $this->toRemove,
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
