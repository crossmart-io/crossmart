<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\WorkspacePermission;
use Crossmart\Enum\WorkspaceRole;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class BuiltInRoleDto implements JsonSerializable
{
    /**
     * @param list<WorkspacePermission|string> $permissions
     */
    public function __construct(
        public readonly WorkspaceRole|string $role,
        public readonly array $permissions,
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
            role: $payload->enum('role', WorkspaceRole::class),
            permissions: $payload->enumList('permissions', WorkspacePermission::class),
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
            'role' => Payload::enumValue($this->role),
            'permissions' => array_map(Payload::enumValue(...), $this->permissions),
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
