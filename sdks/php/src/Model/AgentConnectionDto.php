<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\AgentScope;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class AgentConnectionDto implements JsonSerializable
{
    /**
     * @param string $clientId The OAuth client id: a Client ID Metadata Document URL, or a registered id
     * @param string $clientName The name the agent gives, such as "Claude"
     * @param string|null $clientUri The agent’s home page
     * @param string|null $clientIcon The agent’s logo address, from its metadata. Crossmart never fetches it.
     * @param string $userId The member who connected the agent
     * @param list<AgentScope|string> $scopes
     */
    public function __construct(
        public readonly string $id,
        public readonly string $clientId,
        public readonly string $clientName,
        public readonly ?string $clientUri,
        public readonly ?string $clientIcon,
        public readonly string $userId,
        public readonly string $userName,
        public readonly string $userEmail,
        public readonly array $scopes,
        public readonly DateTimeImmutable $connectedAt,
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
            clientId: $payload->string('clientId'),
            clientName: $payload->string('clientName'),
            clientUri: $payload->isNull('clientUri') ? null : $payload->string('clientUri'),
            clientIcon: $payload->isNull('clientIcon') ? null : $payload->string('clientIcon'),
            userId: $payload->string('userId'),
            userName: $payload->string('userName'),
            userEmail: $payload->string('userEmail'),
            scopes: $payload->enumList('scopes', AgentScope::class),
            connectedAt: $payload->dateTime('connectedAt'),
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
            'clientId' => $this->clientId,
            'clientName' => $this->clientName,
            'clientUri' => $this->clientUri,
            'clientIcon' => $this->clientIcon,
            'userId' => $this->userId,
            'userName' => $this->userName,
            'userEmail' => $this->userEmail,
            'scopes' => array_map(Payload::enumValue(...), $this->scopes),
            'connectedAt' => Payload::formatDateTime($this->connectedAt),
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
