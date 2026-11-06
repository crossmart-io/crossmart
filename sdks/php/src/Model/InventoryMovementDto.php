<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\InventoryMovementReason;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class InventoryMovementDto implements JsonSerializable
{
    /**
     * @param int|float $delta Units added (positive) or removed (negative)
     * @param int|float $quantityAfter Stock on hand right after this movement
     * @param string|null $userName The user who made the change; null for API keys and changes made by Crossmart
     * @param string|null $apiKeyName The API key that made the change, if any
     */
    public function __construct(
        public readonly string $id,
        public readonly int|float $delta,
        public readonly InventoryMovementReason|string $reason,
        public readonly int|float $quantityAfter,
        public readonly ?string $note,
        public readonly ?string $userName,
        public readonly ?string $apiKeyName,
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
            delta: $payload->number('delta'),
            reason: $payload->enum('reason', InventoryMovementReason::class),
            quantityAfter: $payload->number('quantityAfter'),
            note: $payload->isNull('note') ? null : $payload->string('note'),
            userName: $payload->isNull('userName') ? null : $payload->string('userName'),
            apiKeyName: $payload->isNull('apiKeyName') ? null : $payload->string('apiKeyName'),
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
            'delta' => $this->delta,
            'reason' => Payload::enumValue($this->reason),
            'quantityAfter' => $this->quantityAfter,
            'note' => $this->note,
            'userName' => $this->userName,
            'apiKeyName' => $this->apiKeyName,
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
