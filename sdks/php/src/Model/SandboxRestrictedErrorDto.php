<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\EntitlementErrorCode;
use Crossmart\Enum\SandboxRestriction;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class SandboxRestrictedErrorDto implements JsonSerializable
{
    /**
     * @param DateTimeImmutable $claimExpiresAt When the claim link stops working and the sandbox is deleted
     */
    public function __construct(
        public readonly int|float $statusCode,
        public readonly string $error,
        public readonly EntitlementErrorCode|string $code,
        public readonly string $message,
        public readonly SandboxRestriction|string $restriction,
        public readonly DateTimeImmutable $claimExpiresAt,
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
            code: $payload->enum('code', EntitlementErrorCode::class),
            message: $payload->string('message'),
            restriction: $payload->enum('restriction', SandboxRestriction::class),
            claimExpiresAt: $payload->dateTime('claimExpiresAt'),
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
            'code' => Payload::enumValue($this->code),
            'message' => $this->message,
            'restriction' => Payload::enumValue($this->restriction),
            'claimExpiresAt' => Payload::formatDateTime($this->claimExpiresAt),
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
