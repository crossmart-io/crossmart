<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\AskEscalationReason;
use Crossmart\Enum\AskEscalationStatus;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class OpenedAskEscalationDto implements JsonSerializable
{
    /**
     * @param string $id The ticket id. It is the only way to read the escalation, so keep it like a password.
     * @param string|null $reply The team’s reply, once sent
     * @param string|null $callbackSecret Verifies the callback’s `Crossmart-Signature`, as for webhooks. Shown only now; null without a callback URL.
     */
    public function __construct(
        public readonly string $id,
        public readonly AskEscalationStatus|string $status,
        public readonly AskEscalationReason|string $reason,
        public readonly ?string $reply,
        public readonly ?DateTimeImmutable $repliedAt,
        public readonly DateTimeImmutable $createdAt,
        public readonly ?string $callbackSecret,
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
            status: $payload->enum('status', AskEscalationStatus::class),
            reason: $payload->enum('reason', AskEscalationReason::class),
            reply: $payload->isNull('reply') ? null : $payload->string('reply'),
            repliedAt: $payload->isNull('repliedAt') ? null : $payload->dateTime('repliedAt'),
            createdAt: $payload->dateTime('createdAt'),
            callbackSecret: $payload->isNull('callbackSecret') ? null : $payload->string('callbackSecret'),
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
            'status' => Payload::enumValue($this->status),
            'reason' => Payload::enumValue($this->reason),
            'reply' => $this->reply,
            'repliedAt' => $this->repliedAt === null ? null : Payload::formatDateTime($this->repliedAt),
            'createdAt' => Payload::formatDateTime($this->createdAt),
            'callbackSecret' => $this->callbackSecret,
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
