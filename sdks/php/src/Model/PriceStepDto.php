<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\PriceStepKind;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class PriceStepDto implements JsonSerializable
{
    /**
     * @param string $amount The price after this step
     */
    public function __construct(
        public readonly PriceStepKind|string $kind,
        public readonly string $label,
        public readonly string $amount,
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
            kind: $payload->enum('kind', PriceStepKind::class),
            label: $payload->string('label'),
            amount: $payload->string('amount'),
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
            'kind' => Payload::enumValue($this->kind),
            'label' => $this->label,
            'amount' => $this->amount,
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
