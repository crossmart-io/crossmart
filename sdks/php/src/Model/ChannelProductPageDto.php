<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ChannelProductPageDto implements JsonSerializable
{
    /**
     * @param list<ChannelProductDto> $items
     * @param int|float $total How many match in all, for page numbers
     */
    public function __construct(
        public readonly array $items,
        public readonly ChannelProductCountsDto $counts,
        public readonly ?string $nextCursor,
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
            items: $payload->modelList('items', ChannelProductDto::fromArray(...)),
            counts: $payload->model('counts', ChannelProductCountsDto::fromArray(...)),
            nextCursor: $payload->isNull('nextCursor') ? null : $payload->string('nextCursor'),
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
            'items' => array_map(static fn (ChannelProductDto $item): array => $item->toArray(), $this->items),
            'counts' => $this->counts->toArray(),
            'nextCursor' => $this->nextCursor,
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
