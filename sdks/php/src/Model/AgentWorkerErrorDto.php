<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\AgentWorkerErrorCode;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class AgentWorkerErrorDto implements JsonSerializable
{
    /**
     * @param string $message Safe to show to the person
     */
    public function __construct(
        public readonly AgentWorkerErrorCode|string $code,
        public readonly string $message,
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
            code: $payload->enum('code', AgentWorkerErrorCode::class),
            message: $payload->string('message'),
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
            'code' => Payload::enumValue($this->code),
            'message' => $this->message,
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
