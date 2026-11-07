<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\WebhookDisabledReason;
use Crossmart\Enum\WebhookEventType;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class WebhookEndpointDto implements JsonSerializable
{
    /**
     * @param list<WebhookEventType|string> $eventTypes
     * @param bool $enabled False when turned off by someone or after repeated failures
     * @param WebhookDisabledReason|string|null $disabledReason MANUAL: turned off by someone. FAILING: turned off by Crossmart.
     * @param int|float $consecutiveFailures Failed attempts since the last delivery that went through
     * @param WebhookEndpointLastDeliveryDto|null $lastDelivery The latest delivery attempt, whatever event it carried; null before the first
     * @param DateTimeImmutable|null $previousSecretExpiresAt Until then deliveries are also signed with the secret the last rotation replaced
     */
    public function __construct(
        public readonly string $id,
        public readonly string $url,
        public readonly ?string $description,
        public readonly array $eventTypes,
        public readonly bool $enabled,
        public readonly WebhookDisabledReason|string|null $disabledReason,
        public readonly ?DateTimeImmutable $disabledAt,
        public readonly int|float $consecutiveFailures,
        public readonly ?WebhookEndpointLastDeliveryDto $lastDelivery,
        public readonly ?DateTimeImmutable $previousSecretExpiresAt,
        public readonly DateTimeImmutable $createdAt,
        public readonly DateTimeImmutable $updatedAt,
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
            url: $payload->string('url'),
            description: $payload->isNull('description') ? null : $payload->string('description'),
            eventTypes: $payload->enumList('eventTypes', WebhookEventType::class),
            enabled: $payload->bool('enabled'),
            disabledReason: $payload->isNull('disabledReason') ? null : $payload->enum('disabledReason', WebhookDisabledReason::class),
            disabledAt: $payload->isNull('disabledAt') ? null : $payload->dateTime('disabledAt'),
            consecutiveFailures: $payload->number('consecutiveFailures'),
            lastDelivery: $payload->isNull('lastDelivery') ? null : $payload->model('lastDelivery', WebhookEndpointLastDeliveryDto::fromArray(...)),
            previousSecretExpiresAt: $payload->isNull('previousSecretExpiresAt') ? null : $payload->dateTime('previousSecretExpiresAt'),
            createdAt: $payload->dateTime('createdAt'),
            updatedAt: $payload->dateTime('updatedAt'),
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
            'url' => $this->url,
            'description' => $this->description,
            'eventTypes' => array_map(Payload::enumValue(...), $this->eventTypes),
            'enabled' => $this->enabled,
            'disabledReason' => Payload::enumValue($this->disabledReason),
            'disabledAt' => $this->disabledAt === null ? null : Payload::formatDateTime($this->disabledAt),
            'consecutiveFailures' => $this->consecutiveFailures,
            'lastDelivery' => $this->lastDelivery?->toArray(),
            'previousSecretExpiresAt' => $this->previousSecretExpiresAt === null ? null : Payload::formatDateTime($this->previousSecretExpiresAt),
            'createdAt' => Payload::formatDateTime($this->createdAt),
            'updatedAt' => Payload::formatDateTime($this->updatedAt),
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
