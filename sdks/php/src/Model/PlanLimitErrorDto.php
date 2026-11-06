<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\EntitlementErrorCode;
use Crossmart\Enum\Feature;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class PlanLimitErrorDto implements JsonSerializable
{
    /**
     * @param string $plan The code of the organization’s plan
     * @param int|float|null $limit Null is unlimited
     * @param int|float $requested How many more the request asked for
     */
    public function __construct(
        public readonly int|float $statusCode,
        public readonly string $error,
        public readonly EntitlementErrorCode|string $code,
        public readonly string $message,
        public readonly Feature|string $feature,
        public readonly string $plan,
        public readonly int|float|null $limit,
        public readonly int|float $usage,
        public readonly int|float $requested,
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
            statusCode: $payload->number('statusCode'),
            error: $payload->string('error'),
            code: $payload->enum('code', EntitlementErrorCode::class),
            message: $payload->string('message'),
            feature: $payload->enum('feature', Feature::class),
            plan: $payload->string('plan'),
            limit: $payload->isNull('limit') ? null : $payload->number('limit'),
            usage: $payload->number('usage'),
            requested: $payload->number('requested'),
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
            'statusCode' => $this->statusCode,
            'error' => $this->error,
            'code' => Payload::enumValue($this->code),
            'message' => $this->message,
            'feature' => Payload::enumValue($this->feature),
            'plan' => $this->plan,
            'limit' => $this->limit,
            'usage' => $this->usage,
            'requested' => $this->requested,
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
