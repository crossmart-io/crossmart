<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class PricingPreviewDto implements JsonSerializable
{
    /**
     * @param list<PricingPreviewVariantDto> $variants
     */
    public function __construct(
        public readonly string $currencyCode,
        public readonly ?PricingPreviewProductDto $product,
        public readonly array $variants,
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
            currencyCode: $payload->string('currencyCode'),
            product: $payload->isNull('product') ? null : $payload->model('product', PricingPreviewProductDto::fromArray(...)),
            variants: $payload->modelList('variants', PricingPreviewVariantDto::fromArray(...)),
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
            'currencyCode' => $this->currencyCode,
            'product' => $this->product?->toArray(),
            'variants' => array_map(static fn (PricingPreviewVariantDto $item): array => $item->toArray(), $this->variants),
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
