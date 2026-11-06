<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\WorkspaceRole;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class InvitationDto implements JsonSerializable
{
    /**
     * @param CustomRoleRefDto|null $customRole The workspace’s own role, when `role` is CUSTOM
     */
    public function __construct(
        public readonly string $id,
        public readonly string $email,
        public readonly WorkspaceRole|string $role,
        public readonly ?CustomRoleRefDto $customRole,
        public readonly string $invitedByName,
        public readonly DateTimeImmutable $expiresAt,
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
            email: $payload->string('email'),
            role: $payload->enum('role', WorkspaceRole::class),
            customRole: $payload->isNull('customRole') ? null : $payload->model('customRole', CustomRoleRefDto::fromArray(...)),
            invitedByName: $payload->string('invitedByName'),
            expiresAt: $payload->dateTime('expiresAt'),
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
            'email' => $this->email,
            'role' => Payload::enumValue($this->role),
            'customRole' => $this->customRole?->toArray(),
            'invitedByName' => $this->invitedByName,
            'expiresAt' => Payload::formatDateTime($this->expiresAt),
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
