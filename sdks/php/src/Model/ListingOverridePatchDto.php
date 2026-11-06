<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ListingVisibility;
use Crossmart\Serialization\Payload;
use Crossmart\Serialization\Undefined;
use JsonSerializable;

final class ListingOverridePatchDto implements JsonSerializable
{
    /**
     * @param string|Undefined|null $vendor The brand this channel shows instead of the product’s vendor
     * @param list<string>|Undefined|null $tags Replaces the product’s tags
     * @param list<string>|Undefined|null $mediaUrls The product’s image URLs to show, in order
     * @param ListingVisibility|string|Undefined|null $visibility Show or hide on this channel, whatever the product’s status
     * @param int|float|Undefined|null $inventoryBuffer Units held back
     * @param int|float|Undefined|null $maxQuantity Most units shown
     * @param list<VariantPriceOverrideDto>|null $variantPrices
     */
    public function __construct(
        public readonly string|Undefined|null $title = Undefined::Value,
        public readonly string|Undefined|null $descriptionHtml = Undefined::Value,
        public readonly string|Undefined|null $vendor = Undefined::Value,
        public readonly array|Undefined|null $tags = Undefined::Value,
        public readonly array|Undefined|null $mediaUrls = Undefined::Value,
        public readonly ListingVisibility|string|Undefined|null $visibility = Undefined::Value,
        public readonly int|float|Undefined|null $inventoryBuffer = Undefined::Value,
        public readonly int|float|Undefined|null $maxQuantity = Undefined::Value,
        public readonly ?array $variantPrices = null,
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
            title: !$payload->has('title') ? Undefined::Value : ($payload->isNull('title') ? null : $payload->string('title')),
            descriptionHtml: !$payload->has('descriptionHtml') ? Undefined::Value : ($payload->isNull('descriptionHtml') ? null : $payload->string('descriptionHtml')),
            vendor: !$payload->has('vendor') ? Undefined::Value : ($payload->isNull('vendor') ? null : $payload->string('vendor')),
            tags: !$payload->has('tags') ? Undefined::Value : ($payload->isNull('tags') ? null : $payload->stringList('tags')),
            mediaUrls: !$payload->has('mediaUrls') ? Undefined::Value : ($payload->isNull('mediaUrls') ? null : $payload->stringList('mediaUrls')),
            visibility: !$payload->has('visibility') ? Undefined::Value : ($payload->isNull('visibility') ? null : $payload->enum('visibility', ListingVisibility::class)),
            inventoryBuffer: !$payload->has('inventoryBuffer') ? Undefined::Value : ($payload->isNull('inventoryBuffer') ? null : $payload->number('inventoryBuffer')),
            maxQuantity: !$payload->has('maxQuantity') ? Undefined::Value : ($payload->isNull('maxQuantity') ? null : $payload->number('maxQuantity')),
            variantPrices: $payload->isNull('variantPrices') ? null : $payload->modelList('variantPrices', VariantPriceOverrideDto::fromArray(...)),
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
        if (!$this->title instanceof Undefined) {
            $data['title'] = $this->title;
        }
        if (!$this->descriptionHtml instanceof Undefined) {
            $data['descriptionHtml'] = $this->descriptionHtml;
        }
        if (!$this->vendor instanceof Undefined) {
            $data['vendor'] = $this->vendor;
        }
        if (!$this->tags instanceof Undefined) {
            $data['tags'] = $this->tags;
        }
        if (!$this->mediaUrls instanceof Undefined) {
            $data['mediaUrls'] = $this->mediaUrls;
        }
        if (!$this->visibility instanceof Undefined) {
            $data['visibility'] = Payload::enumValue($this->visibility);
        }
        if (!$this->inventoryBuffer instanceof Undefined) {
            $data['inventoryBuffer'] = $this->inventoryBuffer;
        }
        if (!$this->maxQuantity instanceof Undefined) {
            $data['maxQuantity'] = $this->maxQuantity;
        }
        if ($this->variantPrices !== null) {
            $data['variantPrices'] = array_map(static fn (VariantPriceOverrideDto $item): array => $item->toArray(), $this->variantPrices);
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
