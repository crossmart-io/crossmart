<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\WorkspaceRole;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class WorkspaceMemberDto implements JsonSerializable
{
    /**
     * @param CustomRoleRefDto|null $customRole The workspace’s own role, when `role` is CUSTOM
     */
    public function __construct(
        public readonly string $userId,
        public readonly string $name,
        public readonly string $email,
        public readonly WorkspaceRole|string $role,
        public readonly ?CustomRoleRefDto $customRole,
        public readonly DateTimeImmutable $joinedAt,
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
            userId: $payload->string('userId'),
            name: $payload->string('name'),
            email: $payload->string('email'),
            role: $payload->enum('role', WorkspaceRole::class),
            customRole: $payload->isNull('customRole') ? null : $payload->model('customRole', CustomRoleRefDto::fromArray(...)),
            joinedAt: $payload->dateTime('joinedAt'),
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
            'userId' => $this->userId,
            'name' => $this->name,
            'email' => $this->email,
            'role' => Payload::enumValue($this->role),
            'customRole' => $this->customRole?->toArray(),
            'joinedAt' => Payload::formatDateTime($this->joinedAt),
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
