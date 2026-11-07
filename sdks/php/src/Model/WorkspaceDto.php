<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\WorkspacePermission;
use Crossmart\Enum\WorkspaceRole;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class WorkspaceDto implements JsonSerializable
{
    /**
     * @param string $displayName The name to show: the organization name while the workspace is named Default
     * @param string $currency ISO 4217 code of the catalog prices
     * @param string|null $timeZone IANA time zone that reports follow; null until set
     * @param SandboxStateDto|null $sandbox Set while the workspace is an unclaimed sandbox account an AI agent opened: it cannot connect stores, publish or invite people until claimed. Null for every other workspace.
     * @param WorkspaceRole|string $role Your role here
     * @param CustomRoleRefDto|null $customRole The workspace’s own role, when `role` is CUSTOM
     * @param list<WorkspacePermission|string> $permissions What your role lets you do here. Check these, not the role, to adapt a UI.
     */
    public function __construct(
        public readonly string $id,
        public readonly string $organizationId,
        public readonly string $name,
        public readonly string $displayName,
        public readonly string $slug,
        public readonly string $currency,
        public readonly ?string $timeZone,
        public readonly ?SandboxStateDto $sandbox,
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
            id: $payload->string('id'),
            organizationId: $payload->string('organizationId'),
            name: $payload->string('name'),
            displayName: $payload->string('displayName'),
            slug: $payload->string('slug'),
            currency: $payload->string('currency'),
            timeZone: $payload->isNull('timeZone') ? null : $payload->string('timeZone'),
            sandbox: $payload->isNull('sandbox') ? null : $payload->model('sandbox', SandboxStateDto::fromArray(...)),
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
            'id' => $this->id,
            'organizationId' => $this->organizationId,
            'name' => $this->name,
            'displayName' => $this->displayName,
            'slug' => $this->slug,
            'currency' => $this->currency,
            'timeZone' => $this->timeZone,
            'sandbox' => $this->sandbox?->toArray(),
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
