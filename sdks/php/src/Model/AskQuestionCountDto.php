<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class AskQuestionCountDto implements JsonSerializable
{
    /**
     * @param string $question One of the questions asked alike, redacted
     * @param int|float $count How many times it was asked in the period
     */
    public function __construct(
        public readonly string $question,
        public readonly int|float $count,
        public readonly DateTimeImmutable $lastAskedAt,
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
            count: $payload->number('count'),
            lastAskedAt: $payload->dateTime('lastAskedAt'),
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
            'question' => $this->question,
            'count' => $this->count,
            'lastAskedAt' => Payload::formatDateTime($this->lastAskedAt),
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
