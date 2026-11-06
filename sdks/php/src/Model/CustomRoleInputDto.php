<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\WorkspacePermission;
use Crossmart\Serialization\Payload;
use Crossmart\Serialization\Undefined;
use JsonSerializable;

final class CustomRoleInputDto implements JsonSerializable
{
    /**
     * @param list<WorkspacePermission|string> $permissions At most your own permissions. workspace:view is always added; workspace:delete is for owners only.
     */
    public function __construct(
        public readonly string $name,
        public readonly array $permissions,
        public readonly string|Undefined|null $description = Undefined::Value,
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
            name: $payload->string('name'),
            permissions: $payload->enumList('permissions', WorkspacePermission::class),
            description: !$payload->has('description') ? Undefined::Value : ($payload->isNull('description') ? null : $payload->string('description')),
        );
    }

    /**
     * The model in the API's JSON shape.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'name' => $this->name,
            'permissions' => array_map(Payload::enumValue(...), $this->permissions),
        ];
        if (!$this->description instanceof Undefined) {
            $data['description'] = $this->description;
        }

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
