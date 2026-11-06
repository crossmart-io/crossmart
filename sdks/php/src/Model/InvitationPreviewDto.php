<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\WorkspaceRole;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class InvitationPreviewDto implements JsonSerializable
{
    /**
     * @param string $workspaceName The workspace's display name
     * @param string $email The address invited; accepting needs an account with it
     * @param string $roleName The role as people read it
     */
    public function __construct(
        public readonly string $workspaceName,
        public readonly string $inviterName,
        public readonly string $email,
        public readonly WorkspaceRole|string $role,
        public readonly string $roleName,
        public readonly DateTimeImmutable $expiresAt,
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
            workspaceName: $payload->string('workspaceName'),
            inviterName: $payload->string('inviterName'),
            email: $payload->string('email'),
            role: $payload->enum('role', WorkspaceRole::class),
            roleName: $payload->string('roleName'),
            expiresAt: $payload->dateTime('expiresAt'),
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
            'workspaceName' => $this->workspaceName,
            'inviterName' => $this->inviterName,
            'email' => $this->email,
            'role' => Payload::enumValue($this->role),
            'roleName' => $this->roleName,
            'expiresAt' => Payload::formatDateTime($this->expiresAt),
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
