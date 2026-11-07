<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class SandboxStateDto implements JsonSerializable
{
    /**
     * @param DateTimeImmutable $claimExpiresAt When the claim link stops working and the account is deleted
     */
    public function __construct(
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
