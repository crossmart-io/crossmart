<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ProductCondition;
use Crossmart\Enum\ProductStatus;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class ProductDto implements JsonSerializable
{
    /**
     * @param list<string> $tags
     * @param ProductCondition|string|null $condition The item’s condition; null lists it in each store’s default condition
     * @param list<string> $optionNames
     * @param list<VariantDto> $variants
     * @param list<MediaDto> $media
     */
    public function __construct(
        public readonly string $id,
        public readonly string $handle,
        public readonly string $title,
        public readonly string $descriptionHtml,
        public readonly ?string $vendor,
        public readonly ?string $productType,
        public readonly array $tags,
        public readonly ProductStatus|string $status,
        public readonly ProductCondition|string|null $condition,
        public readonly array $optionNames,
        public readonly array $variants,
        public readonly array $media,
        public readonly DateTimeImmutable $createdAt,
        public readonly DateTimeImmutable $updatedAt,
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
            handle: $payload->string('handle'),
            title: $payload->string('title'),
            descriptionHtml: $payload->string('descriptionHtml'),
            vendor: $payload->isNull('vendor') ? null : $payload->string('vendor'),
            productType: $payload->isNull('productType') ? null : $payload->string('productType'),
            tags: $payload->stringList('tags'),
            status: $payload->enum('status', ProductStatus::class),
            condition: $payload->isNull('condition') ? null : $payload->enum('condition', ProductCondition::class),
            optionNames: $payload->stringList('optionNames'),
            variants: $payload->modelList('variants', VariantDto::fromArray(...)),
            media: $payload->modelList('media', MediaDto::fromArray(...)),
            createdAt: $payload->dateTime('createdAt'),
            updatedAt: $payload->dateTime('updatedAt'),
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
            'handle' => $this->handle,
            'title' => $this->title,
            'descriptionHtml' => $this->descriptionHtml,
            'vendor' => $this->vendor,
            'productType' => $this->productType,
            'tags' => $this->tags,
            'status' => Payload::enumValue($this->status),
            'condition' => Payload::enumValue($this->condition),
            'optionNames' => $this->optionNames,
            'variants' => array_map(static fn (VariantDto $item): array => $item->toArray(), $this->variants),
            'media' => array_map(static fn (MediaDto $item): array => $item->toArray(), $this->media),
            'createdAt' => Payload::formatDateTime($this->createdAt),
            'updatedAt' => Payload::formatDateTime($this->updatedAt),
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
