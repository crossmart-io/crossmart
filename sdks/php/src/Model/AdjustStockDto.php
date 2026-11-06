<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\InventoryMovementReason;
use Crossmart\Enum\StockAdjustmentMode;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class AdjustStockDto implements JsonSerializable
{
    /**
     * @param int|float $quantity With `delta`, units to add (or remove, when negative). With `set`, the new stock on hand.
     * @param InventoryMovementReason|string $reason One of RECEIVED, CORRECTION, RETURNED, DAMAGED, LOST, SOLD. The other reasons are recorded by Crossmart.
     */
    public function __construct(
        public readonly StockAdjustmentMode|string $mode,
        public readonly int|float $quantity,
        public readonly InventoryMovementReason|string $reason,
        public readonly ?string $note = null,
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
            mode: $payload->enum('mode', StockAdjustmentMode::class),
            quantity: $payload->number('quantity'),
            reason: $payload->enum('reason', InventoryMovementReason::class),
            note: $payload->isNull('note') ? null : $payload->string('note'),
        );
    }

    /**
     * The model in the API's JSON shape.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'mode' => Payload::enumValue($this->mode),
            'quantity' => $this->quantity,
            'reason' => Payload::enumValue($this->reason),
        ];
        if ($this->note !== null) {
            $data['note'] = $this->note;
        }

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
