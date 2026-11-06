<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\CompareAtMode;
use Crossmart\Enum\PriceRounding;
use Crossmart\Serialization\Payload;
use Crossmart\Serialization\Undefined;
use JsonSerializable;

final class PricingRuleDto implements JsonSerializable
{
    /**
     * @param string $adjustmentPercent Markup (positive) or discount (negative), -90 to 500
     * @param string $fixedAmount Added after the percentage; may be negative
     * @param string|Undefined|null $fixedExchangeRate Store-currency units per catalog-currency unit, used instead of the ECB daily rate. Only applies when the store sells in another currency than the workspace.
     */
    public function __construct(
        public readonly string $adjustmentPercent,
        public readonly string $fixedAmount,
        public readonly PriceRounding|string $rounding,
        public readonly ?PricingFloorDto $floor,
        public readonly CompareAtMode|string $compareAt,
        public readonly string|Undefined|null $fixedExchangeRate = Undefined::Value,
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
            adjustmentPercent: $payload->string('adjustmentPercent'),
            fixedAmount: $payload->string('fixedAmount'),
            rounding: $payload->enum('rounding', PriceRounding::class),
            floor: $payload->isNull('floor') ? null : $payload->model('floor', PricingFloorDto::fromArray(...)),
            compareAt: $payload->enum('compareAt', CompareAtMode::class),
            fixedExchangeRate: !$payload->has('fixedExchangeRate') ? Undefined::Value : ($payload->isNull('fixedExchangeRate') ? null : $payload->string('fixedExchangeRate')),
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
            'adjustmentPercent' => $this->adjustmentPercent,
            'fixedAmount' => $this->fixedAmount,
            'rounding' => Payload::enumValue($this->rounding),
            'floor' => $this->floor?->toArray(),
            'compareAt' => Payload::enumValue($this->compareAt),
        ];
        if (!$this->fixedExchangeRate instanceof Undefined) {
            $data['fixedExchangeRate'] = $this->fixedExchangeRate;
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
