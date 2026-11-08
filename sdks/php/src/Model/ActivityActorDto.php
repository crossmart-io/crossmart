<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ActivityActorType;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ActivityActorDto implements JsonSerializable
{
    /**
     * @param string|null $agentClientId The OAuth client id of the connected agent, for agent actions
     * @param string|null $name User or API key name; for an agent, the user it acted for. Null for system actions and deleted users or keys
     * @param string|null $email Set for users, and for the user an agent acted for
     * @param string|null $agentName The agent's name, such as "Claude", for agent actions
     * @param string|null $approvedByUserId Who approved the outside agent's proposal that made this change; null when nobody had to
     * @param string|null $approvedByName Their name, for "Claude for Dana, approved by Lee"; null when deleted or none
     */
    public function __construct(
        public readonly ActivityActorType|string $type,
        public readonly ?string $userId,
        public readonly ?string $apiKeyId,
        public readonly ?string $agentClientId,
        public readonly ?string $name,
        public readonly ?string $email,
        public readonly ?string $agentName,
        public readonly ?string $approvedByUserId,
        public readonly ?string $approvedByName,
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
            type: $payload->enum('type', ActivityActorType::class),
            userId: $payload->isNull('userId') ? null : $payload->string('userId'),
            apiKeyId: $payload->isNull('apiKeyId') ? null : $payload->string('apiKeyId'),
            agentClientId: $payload->isNull('agentClientId') ? null : $payload->string('agentClientId'),
            name: $payload->isNull('name') ? null : $payload->string('name'),
            email: $payload->isNull('email') ? null : $payload->string('email'),
            agentName: $payload->isNull('agentName') ? null : $payload->string('agentName'),
            approvedByUserId: $payload->isNull('approvedByUserId') ? null : $payload->string('approvedByUserId'),
            approvedByName: $payload->isNull('approvedByName') ? null : $payload->string('approvedByName'),
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
            'type' => Payload::enumValue($this->type),
            'userId' => $this->userId,
            'apiKeyId' => $this->apiKeyId,
            'agentClientId' => $this->agentClientId,
            'name' => $this->name,
            'email' => $this->email,
            'agentName' => $this->agentName,
            'approvedByUserId' => $this->approvedByUserId,
            'approvedByName' => $this->approvedByName,
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
