<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\SuggestionAgent;
use Crossmart\Enum\SuggestionCreatorType;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class SuggestionCreatorDto implements JsonSerializable
{
    /**
     * @param SuggestionAgent|string|null $agent The agent that made it, for `AGENT` suggestions
     * @param string|null $userId Who asked for it
     * @param string|null $name The user’s or API key’s name
     */
    public function __construct(
        public readonly SuggestionCreatorType|string $type,
        public readonly SuggestionAgent|string|null $agent,
        public readonly ?string $userId,
        public readonly ?string $apiKeyId,
        public readonly ?string $name,
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
            type: $payload->enum('type', SuggestionCreatorType::class),
            agent: $payload->isNull('agent') ? null : $payload->enum('agent', SuggestionAgent::class),
            userId: $payload->isNull('userId') ? null : $payload->string('userId'),
            apiKeyId: $payload->isNull('apiKeyId') ? null : $payload->string('apiKeyId'),
            name: $payload->isNull('name') ? null : $payload->string('name'),
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
            'agent' => Payload::enumValue($this->agent),
            'userId' => $this->userId,
            'apiKeyId' => $this->apiKeyId,
            'name' => $this->name,
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
