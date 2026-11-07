<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\AskEscalationReason;
use Crossmart\Enum\AskEscalationStatus;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class AskEscalationRecordDto implements JsonSerializable
{
    /**
     * @param string|null $repliedBy The admin who replied
     * @param string|null $callbackError Why the callback failed
     */
    public function __construct(
        public readonly string $id,
        public readonly string $conversationId,
        public readonly AskEscalationReason|string $reason,
        public readonly AskEscalationStatus|string $status,
        public readonly ?string $contactEmail,
        public readonly ?string $callbackUrl,
        public readonly ?string $reply,
        public readonly ?DateTimeImmutable $repliedAt,
        public readonly ?string $repliedBy,
        public readonly ?DateTimeImmutable $callbackDeliveredAt,
        public readonly ?string $callbackError,
        public readonly DateTimeImmutable $createdAt,
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
            conversationId: $payload->string('conversationId'),
            reason: $payload->enum('reason', AskEscalationReason::class),
            status: $payload->enum('status', AskEscalationStatus::class),
            contactEmail: $payload->isNull('contactEmail') ? null : $payload->string('contactEmail'),
            callbackUrl: $payload->isNull('callbackUrl') ? null : $payload->string('callbackUrl'),
            reply: $payload->isNull('reply') ? null : $payload->string('reply'),
            repliedAt: $payload->isNull('repliedAt') ? null : $payload->dateTime('repliedAt'),
            repliedBy: $payload->isNull('repliedBy') ? null : $payload->string('repliedBy'),
            callbackDeliveredAt: $payload->isNull('callbackDeliveredAt') ? null : $payload->dateTime('callbackDeliveredAt'),
            callbackError: $payload->isNull('callbackError') ? null : $payload->string('callbackError'),
            createdAt: $payload->dateTime('createdAt'),
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
            'conversationId' => $this->conversationId,
            'reason' => Payload::enumValue($this->reason),
            'status' => Payload::enumValue($this->status),
            'contactEmail' => $this->contactEmail,
            'callbackUrl' => $this->callbackUrl,
            'reply' => $this->reply,
            'repliedAt' => $this->repliedAt === null ? null : Payload::formatDateTime($this->repliedAt),
            'repliedBy' => $this->repliedBy,
            'callbackDeliveredAt' => $this->callbackDeliveredAt === null ? null : Payload::formatDateTime($this->callbackDeliveredAt),
            'callbackError' => $this->callbackError,
            'createdAt' => Payload::formatDateTime($this->createdAt),
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
