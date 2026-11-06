<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ActivitySubjectType;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ActivitySubjectDto implements JsonSerializable
{
    /**
     * @param string|null $label The name when the event happened
     */
    public function __construct(
        public readonly ActivitySubjectType|string $type,
        public readonly ?string $id,
        public readonly ?string $label,
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
            type: $payload->enum('type', ActivitySubjectType::class),
            id: $payload->isNull('id') ? null : $payload->string('id'),
            label: $payload->isNull('label') ? null : $payload->string('label'),
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
            'type' => Payload::enumValue($this->type),
            'id' => $this->id,
            'label' => $this->label,
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
