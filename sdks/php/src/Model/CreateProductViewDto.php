<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\CatalogGap;
use Crossmart\Enum\ProductStatus;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class CreateProductViewDto implements JsonSerializable
{
    /**
     * @param string $name Unique in the workspace
     * @param string|null $search Matches title, handle or SKU
     */
    public function __construct(
        public readonly string $name,
        public readonly ?string $search = null,
        public readonly ProductStatus|string|null $status = null,
        public readonly CatalogGap|string|null $gap = null,
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
            name: $payload->string('name'),
            search: $payload->isNull('search') ? null : $payload->string('search'),
            status: $payload->isNull('status') ? null : $payload->enum('status', ProductStatus::class),
            gap: $payload->isNull('gap') ? null : $payload->enum('gap', CatalogGap::class),
        );
    }

    /**
     * The model in the API's JSON shape.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'name' => $this->name,
        ];
        if ($this->search !== null) {
            $data['search'] = $this->search;
        }
        if ($this->status !== null) {
            $data['status'] = Payload::enumValue($this->status);
        }
        if ($this->gap !== null) {
            $data['gap'] = Payload::enumValue($this->gap);
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
