<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ChannelVariantDto implements JsonSerializable
{
    /**
     * @param string $rulePrice In the store’s currency: what its pricing rule gives, before a fixed price on the listing. Equal to the effective price unless the price is overridden.
     * @param int|float|null $quantity The stock the channel shows; null when the variant does not track stock
     */
    public function __construct(
        public readonly string $variantId,
        public readonly string $title,
        public readonly ResolvedPriceDto $price,
        public readonly string $rulePrice,
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
            price: $payload->model('price', ResolvedPriceDto::fromArray(...)),
            rulePrice: $payload->string('rulePrice'),
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
            'price' => $this->price->toArray(),
            'rulePrice' => $this->rulePrice,
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
