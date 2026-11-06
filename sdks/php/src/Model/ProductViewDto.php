<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\CatalogGap;
use Crossmart\Enum\ProductStatus;
use Crossmart\Serialization\Payload;
use Crossmart\Serialization\Undefined;
use DateTimeImmutable;
use JsonSerializable;

final class ProductViewDto implements JsonSerializable
{
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly DateTimeImmutable $createdAt,
        public readonly string|Undefined|null $search = Undefined::Value,
        public readonly ProductStatus|string|Undefined|null $status = Undefined::Value,
        public readonly CatalogGap|string|Undefined|null $gap = Undefined::Value,
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
            id: $payload->string('id'),
            name: $payload->string('name'),
            createdAt: $payload->dateTime('createdAt'),
            search: !$payload->has('search') ? Undefined::Value : ($payload->isNull('search') ? null : $payload->string('search')),
            status: !$payload->has('status') ? Undefined::Value : ($payload->isNull('status') ? null : $payload->enum('status', ProductStatus::class)),
            gap: !$payload->has('gap') ? Undefined::Value : ($payload->isNull('gap') ? null : $payload->enum('gap', CatalogGap::class)),
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
            'id' => $this->id,
            'name' => $this->name,
            'createdAt' => Payload::formatDateTime($this->createdAt),
        ];
        if (!$this->search instanceof Undefined) {
            $data['search'] = $this->search;
        }
        if (!$this->status instanceof Undefined) {
            $data['status'] = Payload::enumValue($this->status);
        }
        if (!$this->gap instanceof Undefined) {
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
