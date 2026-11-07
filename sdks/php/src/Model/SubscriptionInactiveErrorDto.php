<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\EntitlementErrorCode;
use Crossmart\Enum\SubscriptionAccessState;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class SubscriptionInactiveErrorDto implements JsonSerializable
{
    public function __construct(
        public readonly int|float $statusCode,
        public readonly string $error,
        public readonly EntitlementErrorCode|string $code,
        public readonly string $message,
        public readonly SubscriptionAccessState|string $state,
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
            state: $payload->enum('state', SubscriptionAccessState::class),
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
            'state' => Payload::enumValue($this->state),
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
