<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\OutOfStockPolicy;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class UpdateVariantDto implements JsonSerializable
{
    /**
     * @param string|null $barcode GTIN, UPC, EAN or ISBN
     * @param list<string>|null $optionValues One value per product option, in order
     * @param string|null $cost What you pay per unit. Used for pricing floors; never shown to buyers.
     * @param bool|null $tracked Track stock for this variant
     * @param string|null $id The variant to edit. Leave empty to add a new variant.
     * @param int|float|null $quantity Stock on hand; a change is logged as an adjustment. Leave it out to keep the variant’s current stock (a new variant then opens with none).
     */
    public function __construct(
        public readonly string $price,
        public readonly ?string $sku = null,
        public readonly ?string $barcode = null,
        public readonly ?array $optionValues = null,
        public readonly ?string $compareAtPrice = null,
        public readonly ?string $cost = null,
        public readonly int|float|null $weightGrams = null,
        public readonly ?bool $requiresShipping = null,
        public readonly ?bool $taxable = null,
        public readonly OutOfStockPolicy|string|null $outOfStockPolicy = null,
        public readonly ?bool $tracked = null,
        public readonly ?string $id = null,
        public readonly int|float|null $quantity = null,
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
            price: $payload->string('price'),
            sku: $payload->isNull('sku') ? null : $payload->string('sku'),
            barcode: $payload->isNull('barcode') ? null : $payload->string('barcode'),
            optionValues: $payload->isNull('optionValues') ? null : $payload->stringList('optionValues'),
            compareAtPrice: $payload->isNull('compareAtPrice') ? null : $payload->string('compareAtPrice'),
            cost: $payload->isNull('cost') ? null : $payload->string('cost'),
            weightGrams: $payload->isNull('weightGrams') ? null : $payload->number('weightGrams'),
            requiresShipping: $payload->isNull('requiresShipping') ? null : $payload->bool('requiresShipping'),
            taxable: $payload->isNull('taxable') ? null : $payload->bool('taxable'),
            outOfStockPolicy: $payload->isNull('outOfStockPolicy') ? null : $payload->enum('outOfStockPolicy', OutOfStockPolicy::class),
            tracked: $payload->isNull('tracked') ? null : $payload->bool('tracked'),
            id: $payload->isNull('id') ? null : $payload->string('id'),
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
        $data = [
            'price' => $this->price,
        ];
        if ($this->sku !== null) {
            $data['sku'] = $this->sku;
        }
        if ($this->barcode !== null) {
            $data['barcode'] = $this->barcode;
        }
        if ($this->optionValues !== null) {
            $data['optionValues'] = $this->optionValues;
        }
        if ($this->compareAtPrice !== null) {
            $data['compareAtPrice'] = $this->compareAtPrice;
        }
        if ($this->cost !== null) {
            $data['cost'] = $this->cost;
        }
        if ($this->weightGrams !== null) {
            $data['weightGrams'] = $this->weightGrams;
        }
        if ($this->requiresShipping !== null) {
            $data['requiresShipping'] = $this->requiresShipping;
        }
        if ($this->taxable !== null) {
            $data['taxable'] = $this->taxable;
        }
        if ($this->outOfStockPolicy !== null) {
            $data['outOfStockPolicy'] = Payload::enumValue($this->outOfStockPolicy);
        }
        if ($this->tracked !== null) {
            $data['tracked'] = $this->tracked;
        }
        if ($this->id !== null) {
            $data['id'] = $this->id;
        }
        if ($this->quantity !== null) {
            $data['quantity'] = $this->quantity;
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
