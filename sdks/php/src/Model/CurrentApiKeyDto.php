<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\WorkspacePermission;
use Crossmart\Enum\WorkspaceRole;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class CurrentApiKeyDto implements JsonSerializable
{
    /**
     * @param string $workspaceId The one workspace the key works in
     * @param CustomRoleRefDto|null $customRole The workspace’s own role, when `role` is CUSTOM
     * @param list<WorkspacePermission|string> $permissions What the key may do
     */
    public function __construct(
        public readonly string $apiKeyId,
        public readonly string $workspaceId,
        public readonly WorkspaceRole|string $role,
        public readonly ?CustomRoleRefDto $customRole,
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
            apiKeyId: $payload->string('apiKeyId'),
            workspaceId: $payload->string('workspaceId'),
            role: $payload->enum('role', WorkspaceRole::class),
            customRole: $payload->isNull('customRole') ? null : $payload->model('customRole', CustomRoleRefDto::fromArray(...)),
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
            'apiKeyId' => $this->apiKeyId,
            'workspaceId' => $this->workspaceId,
            'role' => Payload::enumValue($this->role),
            'customRole' => $this->customRole?->toArray(),
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
