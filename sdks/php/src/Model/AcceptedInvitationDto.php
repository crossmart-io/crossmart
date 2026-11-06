<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\WorkspaceRole;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class AcceptedInvitationDto implements JsonSerializable
{
    public function __construct(
        public readonly string $workspaceId,
        public readonly WorkspaceRole|string $role,
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
            workspaceId: $payload->string('workspaceId'),
            role: $payload->enum('role', WorkspaceRole::class),
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
            'workspaceId' => $this->workspaceId,
            'role' => Payload::enumValue($this->role),
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
