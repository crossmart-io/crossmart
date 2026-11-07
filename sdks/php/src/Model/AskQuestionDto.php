<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\AskChannel;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class AskQuestionDto implements JsonSerializable
{
    /**
     * @param string $question A question about Crossmart, in any language
     * @param string|null $conversationId The `conversationId` of an earlier answer, to ask a follow-up in the same conversation. Only the same caller can continue it, and it expires after 24 hours without a question.
     * @param AskChannel|string|null $channel Where the question comes from, for Crossmart’s statistics only
     * @param string|null $workspaceId For a signed-in person: a workspace they belong to, so Ask can also answer about it (listings, plan and usage, stores), read-only. API keys and agents always ask from their own workspace.
     */
    public function __construct(
        public readonly string $question,
        public readonly ?string $conversationId = null,
        public readonly AskChannel|string|null $channel = null,
        public readonly ?string $workspaceId = null,
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
            question: $payload->string('question'),
            conversationId: $payload->isNull('conversationId') ? null : $payload->string('conversationId'),
            channel: $payload->isNull('channel') ? null : $payload->enum('channel', AskChannel::class),
            workspaceId: $payload->isNull('workspaceId') ? null : $payload->string('workspaceId'),
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
            'question' => $this->question,
        ];
        if ($this->conversationId !== null) {
            $data['conversationId'] = $this->conversationId;
        }
        if ($this->channel !== null) {
            $data['channel'] = Payload::enumValue($this->channel);
        }
        if ($this->workspaceId !== null) {
            $data['workspaceId'] = $this->workspaceId;
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
