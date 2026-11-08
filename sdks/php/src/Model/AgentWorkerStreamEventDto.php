<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\AgentWorkerEventType;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class AgentWorkerStreamEventDto implements JsonSerializable
{
    /**
     * @param AgentWorkerTurnDto|null $turn turn_started, turn_finished
     * @param string|null $delta text_delta: the next piece of the answer
     * @param AgentWorkerMessageDto|null $message message
     * @param AgentWorkerActionDto|null $action tool_started, tool_finished, action_proposed, action_decided
     * @param AgentWorkerErrorDto|null $error error
     */
    public function __construct(
        public readonly AgentWorkerEventType|string $type,
        public readonly ?AgentWorkerTurnDto $turn = null,
        public readonly ?string $delta = null,
        public readonly ?AgentWorkerMessageDto $message = null,
        public readonly ?AgentWorkerActionDto $action = null,
        public readonly ?AgentWorkerErrorDto $error = null,
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
            type: $payload->enum('type', AgentWorkerEventType::class),
            turn: $payload->isNull('turn') ? null : $payload->model('turn', AgentWorkerTurnDto::fromArray(...)),
            delta: $payload->isNull('delta') ? null : $payload->string('delta'),
            message: $payload->isNull('message') ? null : $payload->model('message', AgentWorkerMessageDto::fromArray(...)),
            action: $payload->isNull('action') ? null : $payload->model('action', AgentWorkerActionDto::fromArray(...)),
            error: $payload->isNull('error') ? null : $payload->model('error', AgentWorkerErrorDto::fromArray(...)),
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
            'type' => Payload::enumValue($this->type),
        ];
        if ($this->turn !== null) {
            $data['turn'] = $this->turn->toArray();
        }
        if ($this->delta !== null) {
            $data['delta'] = $this->delta;
        }
        if ($this->message !== null) {
            $data['message'] = $this->message->toArray();
        }
        if ($this->action !== null) {
            $data['action'] = $this->action->toArray();
        }
        if ($this->error !== null) {
            $data['error'] = $this->error->toArray();
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
