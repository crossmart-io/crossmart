<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\WorkspaceRole;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class CreateApiKeyDto implements JsonSerializable
{
    /**
     * @param WorkspaceRole|string $role At most your own access. CUSTOM needs `customRoleId`.
     * @param string|null $customRoleId One of the workspace’s roles, with CUSTOM
     * @param DateTimeImmutable|null $expiresAt Leave empty for a key that does not expire
     */
    public function __construct(
        public readonly WorkspaceRole|string $role,
        public readonly string $name,
        public readonly ?string $customRoleId = null,
        public readonly ?DateTimeImmutable $expiresAt = null,
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
            name: $payload->string('name'),
            customRoleId: $payload->isNull('customRoleId') ? null : $payload->string('customRoleId'),
            expiresAt: $payload->isNull('expiresAt') ? null : $payload->dateTime('expiresAt'),
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
            'role' => Payload::enumValue($this->role),
            'name' => $this->name,
        ];
        if ($this->customRoleId !== null) {
            $data['customRoleId'] = $this->customRoleId;
        }
        if ($this->expiresAt !== null) {
            $data['expiresAt'] = Payload::formatDateTime($this->expiresAt);
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
