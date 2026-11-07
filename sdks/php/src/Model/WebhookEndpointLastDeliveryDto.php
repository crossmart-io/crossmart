<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\WebhookAttemptOutcome;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class WebhookEndpointLastDeliveryDto implements JsonSerializable
{
    /**
     * @param WebhookAttemptOutcome|string $outcome SUCCEEDED: the endpoint answered 2xx. FAILED: anything else, or no answer.
     * @param int|float|null $responseStatus Null when no response came: a timeout or a connection error
     * @param string|null $error Why the attempt failed; null on success
     */
    public function __construct(
        public readonly DateTimeImmutable $attemptedAt,
        public readonly WebhookAttemptOutcome|string $outcome,
        public readonly int|float|null $responseStatus,
        public readonly ?string $error,
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
            attemptedAt: $payload->dateTime('attemptedAt'),
            outcome: $payload->enum('outcome', WebhookAttemptOutcome::class),
            responseStatus: $payload->isNull('responseStatus') ? null : $payload->number('responseStatus'),
            error: $payload->isNull('error') ? null : $payload->string('error'),
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
            'attemptedAt' => Payload::formatDateTime($this->attemptedAt),
            'outcome' => Payload::enumValue($this->outcome),
            'responseStatus' => $this->responseStatus,
            'error' => $this->error,
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
