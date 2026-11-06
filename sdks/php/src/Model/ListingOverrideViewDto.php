<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ListingVisibility;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class ListingOverrideViewDto implements JsonSerializable
{
    /**
     * @param list<string>|null $tags
     * @param list<string>|null $mediaUrls
     * @param list<VariantPriceOverrideDto> $variantPrices
     */
    public function __construct(
        public readonly ?string $title,
        public readonly ?string $descriptionHtml,
        public readonly ?array $tags,
        public readonly ?array $mediaUrls,
        public readonly ListingVisibility|string|null $visibility,
        public readonly int|float|null $inventoryBuffer,
        public readonly int|float|null $maxQuantity,
        public readonly array $variantPrices,
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
            title: $payload->isNull('title') ? null : $payload->string('title'),
            descriptionHtml: $payload->isNull('descriptionHtml') ? null : $payload->string('descriptionHtml'),
            tags: $payload->isNull('tags') ? null : $payload->stringList('tags'),
            mediaUrls: $payload->isNull('mediaUrls') ? null : $payload->stringList('mediaUrls'),
            visibility: $payload->isNull('visibility') ? null : $payload->enum('visibility', ListingVisibility::class),
            inventoryBuffer: $payload->isNull('inventoryBuffer') ? null : $payload->number('inventoryBuffer'),
            maxQuantity: $payload->isNull('maxQuantity') ? null : $payload->number('maxQuantity'),
            variantPrices: $payload->modelList('variantPrices', VariantPriceOverrideDto::fromArray(...)),
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
            'title' => $this->title,
            'descriptionHtml' => $this->descriptionHtml,
            'tags' => $this->tags,
            'mediaUrls' => $this->mediaUrls,
            'visibility' => Payload::enumValue($this->visibility),
            'inventoryBuffer' => $this->inventoryBuffer,
            'maxQuantity' => $this->maxQuantity,
            'variantPrices' => array_map(static fn (VariantPriceOverrideDto $item): array => $item->toArray(), $this->variantPrices),
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
