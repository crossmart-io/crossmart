<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ProductStatus;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class UpdateProductDto implements JsonSerializable
{
    /**
     * @param list<UpdateVariantDto> $variants
     * @param list<string>|null $tags
     * @param list<string>|null $optionNames
     * @param list<CreateMediaDto>|null $media
     */
    public function __construct(
        public readonly string $title,
        public readonly string $handle,
        public readonly array $variants,
        public readonly ?string $descriptionHtml = null,
        public readonly ?string $vendor = null,
        public readonly ?string $productType = null,
        public readonly ?array $tags = null,
        public readonly ProductStatus|string|null $status = null,
        public readonly ?array $optionNames = null,
        public readonly ?array $media = null,
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
            title: $payload->string('title'),
            handle: $payload->string('handle'),
            variants: $payload->modelList('variants', UpdateVariantDto::fromArray(...)),
            descriptionHtml: $payload->isNull('descriptionHtml') ? null : $payload->string('descriptionHtml'),
            vendor: $payload->isNull('vendor') ? null : $payload->string('vendor'),
            productType: $payload->isNull('productType') ? null : $payload->string('productType'),
            tags: $payload->isNull('tags') ? null : $payload->stringList('tags'),
            status: $payload->isNull('status') ? null : $payload->enum('status', ProductStatus::class),
            optionNames: $payload->isNull('optionNames') ? null : $payload->stringList('optionNames'),
            media: $payload->isNull('media') ? null : $payload->modelList('media', CreateMediaDto::fromArray(...)),
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
            'title' => $this->title,
            'handle' => $this->handle,
            'variants' => array_map(static fn (UpdateVariantDto $item): array => $item->toArray(), $this->variants),
        ];
        if ($this->descriptionHtml !== null) {
            $data['descriptionHtml'] = $this->descriptionHtml;
        }
        if ($this->vendor !== null) {
            $data['vendor'] = $this->vendor;
        }
        if ($this->productType !== null) {
            $data['productType'] = $this->productType;
        }
        if ($this->tags !== null) {
            $data['tags'] = $this->tags;
        }
        if ($this->status !== null) {
            $data['status'] = Payload::enumValue($this->status);
        }
        if ($this->optionNames !== null) {
            $data['optionNames'] = $this->optionNames;
        }
        if ($this->media !== null) {
            $data['media'] = array_map(static fn (CreateMediaDto $item): array => $item->toArray(), $this->media);
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
