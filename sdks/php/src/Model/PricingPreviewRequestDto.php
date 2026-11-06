<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class PricingPreviewRequestDto implements JsonSerializable
{
    /**
     * @param PricingRuleDto|null $rule The rule to try, saved or not; null shows catalog prices
     * @param string|null $productId The product to price; defaults to the first selected product
     */
    public function __construct(
        public readonly ?PricingRuleDto $rule,
        public readonly ?string $productId = null,
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
            rule: $payload->isNull('rule') ? null : $payload->model('rule', PricingRuleDto::fromArray(...)),
            productId: $payload->isNull('productId') ? null : $payload->string('productId'),
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
            'rule' => $this->rule?->toArray(),
        ];
        if ($this->productId !== null) {
            $data['productId'] = $this->productId;
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
