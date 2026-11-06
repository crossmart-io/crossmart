<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ListingEditorVariantDto implements JsonSerializable
{
    /**
     * @param string $rulePrice In the store’s currency: what its pricing rule gives, before a fixed price on the listing. Equal to the effective price unless the price is overridden.
     * @param ResolvedPriceDto $resolvedPrice How the effective price was reached
     * @param int|float|null $quantity The stock the store shows; null when the variant does not track stock
     */
    public function __construct(
        public readonly string $variantId,
        public readonly string $title,
        public readonly ?string $sku,
        public readonly InheritedPriceDto $price,
        public readonly string $rulePrice,
        public readonly InheritedCompareAtPriceDto $compareAtPrice,
        public readonly ResolvedPriceDto $resolvedPrice,
        public readonly int|float|null $quantity,
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
            variantId: $payload->string('variantId'),
            title: $payload->string('title'),
            sku: $payload->isNull('sku') ? null : $payload->string('sku'),
            price: $payload->model('price', InheritedPriceDto::fromArray(...)),
            rulePrice: $payload->string('rulePrice'),
            compareAtPrice: $payload->model('compareAtPrice', InheritedCompareAtPriceDto::fromArray(...)),
            resolvedPrice: $payload->model('resolvedPrice', ResolvedPriceDto::fromArray(...)),
            quantity: $payload->isNull('quantity') ? null : $payload->number('quantity'),
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
            'variantId' => $this->variantId,
            'title' => $this->title,
            'sku' => $this->sku,
            'price' => $this->price->toArray(),
            'rulePrice' => $this->rulePrice,
            'compareAtPrice' => $this->compareAtPrice->toArray(),
            'resolvedPrice' => $this->resolvedPrice->toArray(),
            'quantity' => $this->quantity,
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
