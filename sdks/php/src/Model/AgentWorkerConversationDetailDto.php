<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class AgentWorkerConversationDetailDto implements JsonSerializable
{
    /**
     * @param list<AgentWorkerMessageDto> $messages Oldest first
     * @param AgentWorkerTurnDto|null $activeTurn The turn running or waiting for approval; null when the agent is idle
     */
    public function __construct(
        public readonly AgentWorkerConversationDto $conversation,
        public readonly array $messages,
        public readonly ?AgentWorkerTurnDto $activeTurn,
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
            conversation: $payload->model('conversation', AgentWorkerConversationDto::fromArray(...)),
            messages: $payload->modelList('messages', AgentWorkerMessageDto::fromArray(...)),
            activeTurn: $payload->isNull('activeTurn') ? null : $payload->model('activeTurn', AgentWorkerTurnDto::fromArray(...)),
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
            'conversation' => $this->conversation->toArray(),
            'messages' => array_map(static fn (AgentWorkerMessageDto $item): array => $item->toArray(), $this->messages),
            'activeTurn' => $this->activeTurn?->toArray(),
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
