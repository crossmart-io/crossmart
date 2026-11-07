<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\BillingInterval;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class StartCheckoutDto implements JsonSerializable
{
    /**
     * @param string $planCode The `code` of an offered, self-serve plan
     */
    public function __construct(
        public readonly string $planCode,
        public readonly BillingInterval|string $interval,
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
            planCode: $payload->string('planCode'),
            interval: $payload->enum('interval', BillingInterval::class),
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
            'planCode' => $this->planCode,
            'interval' => Payload::enumValue($this->interval),
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
