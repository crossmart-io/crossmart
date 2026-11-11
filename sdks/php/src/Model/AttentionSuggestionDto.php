<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\SuggestionKind;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class AttentionSuggestionDto implements JsonSerializable
{
    public function __construct(
        public readonly string $id,
        public readonly string $productId,
        public readonly string $productTitle,
        public readonly SuggestionKind|string $kind,
        public readonly ?string $connectionId,
        public readonly ?string $storeName,
        public readonly DateTimeImmutable $createdAt,
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
            productId: $payload->string('productId'),
            productTitle: $payload->string('productTitle'),
            kind: $payload->enum('kind', SuggestionKind::class),
            connectionId: $payload->isNull('connectionId') ? null : $payload->string('connectionId'),
            storeName: $payload->isNull('storeName') ? null : $payload->string('storeName'),
            createdAt: $payload->dateTime('createdAt'),
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
            'id' => $this->id,
            'productId' => $this->productId,
            'productTitle' => $this->productTitle,
            'kind' => Payload::enumValue($this->kind),
            'connectionId' => $this->connectionId,
            'storeName' => $this->storeName,
            'createdAt' => Payload::formatDateTime($this->createdAt),
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
