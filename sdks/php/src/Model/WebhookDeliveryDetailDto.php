<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\WebhookDeliveryStatus;
use Crossmart\Enum\WebhookEventType;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class WebhookDeliveryDetailDto implements JsonSerializable
{
    /**
     * @param string $id Sent as the Crossmart-Delivery-Id header
     * @param string $eventId The event id; the same on every redelivery
     * @param WebhookDeliveryStatus|string $status RETRYING: an attempt failed and another is scheduled at nextAttemptAt
     * @param int|float $attempts Attempts made so far
     * @param int|float|null $responseStatus HTTP status of the latest attempt
     * @param string|null $error Why the latest attempt failed
     * @param WebhookEnvelopeDto $payload The JSON body every attempt sends
     */
    public function __construct(
        public readonly string $id,
        public readonly string $endpointId,
        public readonly string $eventId,
        public readonly WebhookEventType|string $eventType,
        public readonly WebhookDeliveryStatus|string $status,
        public readonly int|float $attempts,
        public readonly int|float|null $responseStatus,
        public readonly int|float|null $durationMs,
        public readonly ?string $error,
        public readonly ?DateTimeImmutable $nextAttemptAt,
        public readonly ?DateTimeImmutable $lastAttemptAt,
        public readonly ?DateTimeImmutable $deliveredAt,
        public readonly DateTimeImmutable $createdAt,
        public readonly WebhookEnvelopeDto $payload,
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
            id: $payload->string('id'),
            endpointId: $payload->string('endpointId'),
            eventId: $payload->string('eventId'),
            eventType: $payload->enum('eventType', WebhookEventType::class),
            status: $payload->enum('status', WebhookDeliveryStatus::class),
            attempts: $payload->number('attempts'),
            responseStatus: $payload->isNull('responseStatus') ? null : $payload->number('responseStatus'),
            durationMs: $payload->isNull('durationMs') ? null : $payload->number('durationMs'),
            error: $payload->isNull('error') ? null : $payload->string('error'),
            nextAttemptAt: $payload->isNull('nextAttemptAt') ? null : $payload->dateTime('nextAttemptAt'),
            lastAttemptAt: $payload->isNull('lastAttemptAt') ? null : $payload->dateTime('lastAttemptAt'),
            deliveredAt: $payload->isNull('deliveredAt') ? null : $payload->dateTime('deliveredAt'),
            createdAt: $payload->dateTime('createdAt'),
            payload: $payload->model('payload', WebhookEnvelopeDto::fromArray(...)),
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
            'id' => $this->id,
            'endpointId' => $this->endpointId,
            'eventId' => $this->eventId,
            'eventType' => Payload::enumValue($this->eventType),
            'status' => Payload::enumValue($this->status),
            'attempts' => $this->attempts,
            'responseStatus' => $this->responseStatus,
            'durationMs' => $this->durationMs,
            'error' => $this->error,
            'nextAttemptAt' => $this->nextAttemptAt === null ? null : Payload::formatDateTime($this->nextAttemptAt),
            'lastAttemptAt' => $this->lastAttemptAt === null ? null : Payload::formatDateTime($this->lastAttemptAt),
            'deliveredAt' => $this->deliveredAt === null ? null : Payload::formatDateTime($this->deliveredAt),
            'createdAt' => Payload::formatDateTime($this->createdAt),
            'payload' => $this->payload->toArray(),
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
