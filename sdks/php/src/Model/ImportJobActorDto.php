<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ImportJobActorDto implements JsonSerializable
{
    /**
     * @param string|null $userName The user who sent the file; null for API keys and deleted users
     * @param string|null $apiKeyName The API key that sent the file, if one did
     */
    public function __construct(
        public readonly ?string $userId,
        public readonly ?string $userName,
        public readonly ?string $apiKeyId,
        public readonly ?string $apiKeyName,
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
            userId: $payload->isNull('userId') ? null : $payload->string('userId'),
            userName: $payload->isNull('userName') ? null : $payload->string('userName'),
            apiKeyId: $payload->isNull('apiKeyId') ? null : $payload->string('apiKeyId'),
            apiKeyName: $payload->isNull('apiKeyName') ? null : $payload->string('apiKeyName'),
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
            'userId' => $this->userId,
            'userName' => $this->userName,
            'apiKeyId' => $this->apiKeyId,
            'apiKeyName' => $this->apiKeyName,
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
