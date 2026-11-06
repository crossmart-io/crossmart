<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\WorkspaceRole;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class ApiKeyDto implements JsonSerializable
{
    /**
     * @param CustomRoleRefDto|null $customRole The workspace’s own role, when `role` is CUSTOM
     * @param string $prefix The first characters of the key, to tell keys apart
     */
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly WorkspaceRole|string $role,
        public readonly ?CustomRoleRefDto $customRole,
        public readonly string $prefix,
        public readonly ?DateTimeImmutable $lastUsedAt,
        public readonly ?DateTimeImmutable $expiresAt,
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
            name: $payload->string('name'),
            role: $payload->enum('role', WorkspaceRole::class),
            customRole: $payload->isNull('customRole') ? null : $payload->model('customRole', CustomRoleRefDto::fromArray(...)),
            prefix: $payload->string('prefix'),
            lastUsedAt: $payload->isNull('lastUsedAt') ? null : $payload->dateTime('lastUsedAt'),
            expiresAt: $payload->isNull('expiresAt') ? null : $payload->dateTime('expiresAt'),
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
            'name' => $this->name,
            'role' => Payload::enumValue($this->role),
            'customRole' => $this->customRole?->toArray(),
            'prefix' => $this->prefix,
            'lastUsedAt' => $this->lastUsedAt === null ? null : Payload::formatDateTime($this->lastUsedAt),
            'expiresAt' => $this->expiresAt === null ? null : Payload::formatDateTime($this->expiresAt),
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
