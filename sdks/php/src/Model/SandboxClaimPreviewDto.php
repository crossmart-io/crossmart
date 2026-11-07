<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class SandboxClaimPreviewDto implements JsonSerializable
{
    /**
     * @param string $email The address the account is for; the person signs in with it
     * @param DateTimeImmutable $claimExpiresAt When the link stops working and the account is deleted
     * @param bool $passwordSet True when the person already has a password: they sign in and claim from the app instead of choosing one
     */
    public function __construct(
        public readonly string $workspaceId,
        public readonly string $email,
        public readonly string $storeName,
        public readonly DateTimeImmutable $claimExpiresAt,
        public readonly bool $passwordSet,
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
            workspaceId: $payload->string('workspaceId'),
            email: $payload->string('email'),
            storeName: $payload->string('storeName'),
            claimExpiresAt: $payload->dateTime('claimExpiresAt'),
            passwordSet: $payload->bool('passwordSet'),
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
            'workspaceId' => $this->workspaceId,
            'email' => $this->email,
            'storeName' => $this->storeName,
            'claimExpiresAt' => Payload::formatDateTime($this->claimExpiresAt),
            'passwordSet' => $this->passwordSet,
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
