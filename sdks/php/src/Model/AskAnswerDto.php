<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\AskConfidence;
use Crossmart\Enum\AskOutcome;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class AskAnswerDto implements JsonSerializable
{
    /**
     * @param AskOutcome|string $outcome `answered` from the cited pages; `unknown` when the docs do not answer it (the answer points to support); `out_of_scope` when it is not about Crossmart
     * @param string $answer The answer, in plain text (no Markdown)
     * @param list<AskCitationDto> $citations Pages the answer is based on
     * @param bool $handoff True when a person should take over, at supportEmail
     * @param string $conversationId Send it as `conversationId` with a follow-up question. Only you can continue the conversation, for 24 hours after its last question.
     * @param string $turnId This question and answer, as stored
     */
    public function __construct(
        public readonly AskOutcome|string $outcome,
        public readonly string $answer,
        public readonly array $citations,
        public readonly AskConfidence|string $confidence,
        public readonly bool $handoff,
        public readonly string $supportEmail,
        public readonly string $conversationId,
        public readonly string $turnId,
        public readonly AskEscalationOfferDto $escalation,
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
            outcome: $payload->enum('outcome', AskOutcome::class),
            answer: $payload->string('answer'),
            citations: $payload->modelList('citations', AskCitationDto::fromArray(...)),
            confidence: $payload->enum('confidence', AskConfidence::class),
            handoff: $payload->bool('handoff'),
            supportEmail: $payload->string('supportEmail'),
            conversationId: $payload->string('conversationId'),
            turnId: $payload->string('turnId'),
            escalation: $payload->model('escalation', AskEscalationOfferDto::fromArray(...)),
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
            'outcome' => Payload::enumValue($this->outcome),
            'answer' => $this->answer,
            'citations' => array_map(static fn (AskCitationDto $item): array => $item->toArray(), $this->citations),
            'confidence' => Payload::enumValue($this->confidence),
            'handoff' => $this->handoff,
            'supportEmail' => $this->supportEmail,
            'conversationId' => $this->conversationId,
            'turnId' => $this->turnId,
            'escalation' => $this->escalation->toArray(),
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
