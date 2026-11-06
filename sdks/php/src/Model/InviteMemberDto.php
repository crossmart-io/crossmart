<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\WorkspaceRole;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class InviteMemberDto implements JsonSerializable
{
    /**
     * @param WorkspaceRole|string $role At most your own access. CUSTOM needs `customRoleId`.
     * @param string|null $customRoleId One of the workspace’s roles, with CUSTOM
     */
    public function __construct(
        public readonly WorkspaceRole|string $role,
        public readonly string $email,
        public readonly ?string $customRoleId = null,
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
            email: $payload->string('email'),
            customRoleId: $payload->isNull('customRoleId') ? null : $payload->string('customRoleId'),
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
            'email' => $this->email,
        ];
        if ($this->customRoleId !== null) {
            $data['customRoleId'] = $this->customRoleId;
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
