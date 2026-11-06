<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ProductSelectionRuleDto implements JsonSerializable
{
    /**
     * @param list<string> $includeProductIds
     * @param list<string> $excludeProductIds
     */
    public function __construct(
        public readonly ?ProductSelectionFilterDto $filter,
        public readonly array $includeProductIds,
        public readonly array $excludeProductIds,
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
            filter: $payload->isNull('filter') ? null : $payload->model('filter', ProductSelectionFilterDto::fromArray(...)),
            includeProductIds: $payload->stringList('includeProductIds'),
            excludeProductIds: $payload->stringList('excludeProductIds'),
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
            'filter' => $this->filter?->toArray(),
            'includeProductIds' => $this->includeProductIds,
            'excludeProductIds' => $this->excludeProductIds,
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
