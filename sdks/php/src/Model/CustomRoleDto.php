<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\WorkspacePermission;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class CustomRoleDto implements JsonSerializable
{
    /**
     * @param list<WorkspacePermission|string> $permissions
     * @param int|float $memberCount Members holding the role now
     */
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly ?string $description,
        public readonly array $permissions,
        public readonly int|float $memberCount,
        public readonly DateTimeImmutable $createdAt,
        public readonly DateTimeImmutable $updatedAt,
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
            description: $payload->isNull('description') ? null : $payload->string('description'),
            permissions: $payload->enumList('permissions', WorkspacePermission::class),
            memberCount: $payload->number('memberCount'),
            createdAt: $payload->dateTime('createdAt'),
            updatedAt: $payload->dateTime('updatedAt'),
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
            'description' => $this->description,
            'permissions' => array_map(Payload::enumValue(...), $this->permissions),
            'memberCount' => $this->memberCount,
            'createdAt' => Payload::formatDateTime($this->createdAt),
            'updatedAt' => Payload::formatDateTime($this->updatedAt),
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
