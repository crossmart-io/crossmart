<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class AgentWorkerChangeDto implements JsonSerializable
{
    /**
     * @param string|null $before The value now; null when unknown
     * @param string|null $after The value after the change
     */
    public function __construct(
        public readonly string $field,
        public readonly ?string $before,
        public readonly ?string $after,
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
            field: $payload->string('field'),
            before: $payload->isNull('before') ? null : $payload->string('before'),
            after: $payload->isNull('after') ? null : $payload->string('after'),
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
            'field' => $this->field,
            'before' => $this->before,
            'after' => $this->after,
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
