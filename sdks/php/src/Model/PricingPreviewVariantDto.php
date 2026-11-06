<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class PricingPreviewVariantDto implements JsonSerializable
{
    public function __construct(
        public readonly string $variantId,
        public readonly string $title,
        public readonly string $basePrice,
        public readonly ?string $cost,
        public readonly ResolvedPriceDto $resolved,
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
            basePrice: $payload->string('basePrice'),
            cost: $payload->isNull('cost') ? null : $payload->string('cost'),
            resolved: $payload->model('resolved', ResolvedPriceDto::fromArray(...)),
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
            'basePrice' => $this->basePrice,
            'cost' => $this->cost,
            'resolved' => $this->resolved->toArray(),
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
