<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\BillingInterval;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class PlanPriceDto implements JsonSerializable
{
    /**
     * @param int|float $amount Each charge, in the currency’s minor unit (cents)
     * @param int|float $monthlyAmount The charge spread over the months it covers, in minor units, to compare intervals
     * @param string $currency Lower-case ISO 4217 code
     */
    public function __construct(
        public readonly BillingInterval|string $interval,
        public readonly int|float $amount,
        public readonly int|float $monthlyAmount,
        public readonly string $currency,
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
            interval: $payload->enum('interval', BillingInterval::class),
            amount: $payload->number('amount'),
            monthlyAmount: $payload->number('monthlyAmount'),
            currency: $payload->string('currency'),
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
            'interval' => Payload::enumValue($this->interval),
            'amount' => $this->amount,
            'monthlyAmount' => $this->monthlyAmount,
            'currency' => $this->currency,
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
