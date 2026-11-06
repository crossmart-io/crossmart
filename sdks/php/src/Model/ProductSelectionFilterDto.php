<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\CatalogGap;
use Crossmart\Enum\ProductStatus;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ProductSelectionFilterDto implements JsonSerializable
{
    /**
     * @param string|null $search Matches title, handle or SKU
     * @param list<string>|null $tags Products with any of these tags
     * @param string|null $vendor Products of this vendor, ignoring case
     */
    public function __construct(
        public readonly ?string $search = null,
        public readonly ProductStatus|string|null $status = null,
        public readonly CatalogGap|string|null $gap = null,
        public readonly ?array $tags = null,
        public readonly ?string $vendor = null,
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
            search: $payload->isNull('search') ? null : $payload->string('search'),
            status: $payload->isNull('status') ? null : $payload->enum('status', ProductStatus::class),
            gap: $payload->isNull('gap') ? null : $payload->enum('gap', CatalogGap::class),
            tags: $payload->isNull('tags') ? null : $payload->stringList('tags'),
            vendor: $payload->isNull('vendor') ? null : $payload->string('vendor'),
        );
    }

    /**
     * The model in the API's JSON shape.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [];
        if ($this->search !== null) {
            $data['search'] = $this->search;
        }
        if ($this->status !== null) {
            $data['status'] = Payload::enumValue($this->status);
        }
        if ($this->gap !== null) {
            $data['gap'] = Payload::enumValue($this->gap);
        }
        if ($this->tags !== null) {
            $data['tags'] = $this->tags;
        }
        if ($this->vendor !== null) {
            $data['vendor'] = $this->vendor;
        }

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
