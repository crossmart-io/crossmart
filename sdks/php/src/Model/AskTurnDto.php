<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\AccountLookupKind;
use Crossmart\Enum\AskConfidence;
use Crossmart\Enum\AskEscalationReason;
use Crossmart\Enum\AskOutcome;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class AskTurnDto implements JsonSerializable
{
    /**
     * @param string $question The question, with obvious secrets and emails redacted
     * @param list<AskCitationDto> $citations
     * @param list<AccountLookupKind|string> $accountLookups
     */
    public function __construct(
        public readonly string $id,
        public readonly int|float $position,
        public readonly string $question,
        public readonly string $answer,
        public readonly AskOutcome|string $outcome,
        public readonly AskConfidence|string $confidence,
        public readonly array $citations,
        public readonly array $accountLookups,
        public readonly AskEscalationReason|string|null $escalationReason,
        public readonly int|float $latencyMs,
        public readonly ?string $model,
        public readonly bool $cached,
        public readonly DateTimeImmutable $createdAt,
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
            position: $payload->number('position'),
            question: $payload->string('question'),
            answer: $payload->string('answer'),
            outcome: $payload->enum('outcome', AskOutcome::class),
            confidence: $payload->enum('confidence', AskConfidence::class),
            citations: $payload->modelList('citations', AskCitationDto::fromArray(...)),
            accountLookups: $payload->enumList('accountLookups', AccountLookupKind::class),
            escalationReason: $payload->isNull('escalationReason') ? null : $payload->enum('escalationReason', AskEscalationReason::class),
            latencyMs: $payload->number('latencyMs'),
            model: $payload->isNull('model') ? null : $payload->string('model'),
            cached: $payload->bool('cached'),
            createdAt: $payload->dateTime('createdAt'),
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
            'position' => $this->position,
            'question' => $this->question,
            'answer' => $this->answer,
            'outcome' => Payload::enumValue($this->outcome),
            'confidence' => Payload::enumValue($this->confidence),
            'citations' => array_map(static fn (AskCitationDto $item): array => $item->toArray(), $this->citations),
            'accountLookups' => array_map(Payload::enumValue(...), $this->accountLookups),
            'escalationReason' => Payload::enumValue($this->escalationReason),
            'latencyMs' => $this->latencyMs,
            'model' => $this->model,
            'cached' => $this->cached,
            'createdAt' => Payload::formatDateTime($this->createdAt),
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
