<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ConnectFailure;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class CredentialsRejectedErrorDto implements JsonSerializable
{
    public function __construct(
        public readonly int|float $statusCode,
        public readonly string $error,
        public readonly ConnectFailure|string $failure,
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
            statusCode: $payload->number('statusCode'),
            error: $payload->string('error'),
            failure: $payload->enum('failure', ConnectFailure::class),
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
            'statusCode' => $this->statusCode,
            'error' => $this->error,
            'failure' => Payload::enumValue($this->failure),
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
