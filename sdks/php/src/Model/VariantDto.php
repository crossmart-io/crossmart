<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\OutOfStockPolicy;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class VariantDto implements JsonSerializable
{
    /**
     * @param string|null $barcode GTIN, UPC, EAN or ISBN
     * @param list<string> $optionValues One value per product option, in order
     * @param string $price Decimal string in the workspace currency
     * @param string|null $cost What you pay per unit; never shown to buyers
     * @param bool $tracked Whether Crossmart tracks stock for this variant
     */
    public function __construct(
        public readonly string $id,
        public readonly int|float $position,
        public readonly ?string $sku,
        public readonly ?string $barcode,
        public readonly array $optionValues,
        public readonly string $price,
        public readonly ?string $compareAtPrice,
        public readonly ?string $cost,
        public readonly int|float|null $weightGrams,
        public readonly bool $requiresShipping,
        public readonly bool $taxable,
        public readonly OutOfStockPolicy|string $outOfStockPolicy,
        public readonly bool $tracked,
        public readonly int|float $available,
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
            position: $payload->number('position'),
            sku: $payload->isNull('sku') ? null : $payload->string('sku'),
            barcode: $payload->isNull('barcode') ? null : $payload->string('barcode'),
            optionValues: $payload->stringList('optionValues'),
            price: $payload->string('price'),
            compareAtPrice: $payload->isNull('compareAtPrice') ? null : $payload->string('compareAtPrice'),
            cost: $payload->isNull('cost') ? null : $payload->string('cost'),
            weightGrams: $payload->isNull('weightGrams') ? null : $payload->number('weightGrams'),
            requiresShipping: $payload->bool('requiresShipping'),
            taxable: $payload->bool('taxable'),
            outOfStockPolicy: $payload->enum('outOfStockPolicy', OutOfStockPolicy::class),
            tracked: $payload->bool('tracked'),
            available: $payload->number('available'),
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
            'position' => $this->position,
            'sku' => $this->sku,
            'barcode' => $this->barcode,
            'optionValues' => $this->optionValues,
            'price' => $this->price,
            'compareAtPrice' => $this->compareAtPrice,
            'cost' => $this->cost,
            'weightGrams' => $this->weightGrams,
            'requiresShipping' => $this->requiresShipping,
            'taxable' => $this->taxable,
            'outOfStockPolicy' => Payload::enumValue($this->outOfStockPolicy),
            'tracked' => $this->tracked,
            'available' => $this->available,
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
