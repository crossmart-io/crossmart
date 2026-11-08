<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\AgentProposalOutcome;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class AgentProposalSubmissionDto implements JsonSerializable
{
    /**
     * @param AgentProposalOutcome|string $outcome `proposed`: it waits for the seller. `apply_directly`: the workspace lets agents make changes at once, so make the call itself.
     * @param string $message What to do next, or to tell the user
     */
    public function __construct(
        public readonly AgentProposalOutcome|string $outcome,
        public readonly string $message,
        public readonly ?AgentProposalDto $proposal,
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
            outcome: $payload->enum('outcome', AgentProposalOutcome::class),
            message: $payload->string('message'),
            proposal: $payload->isNull('proposal') ? null : $payload->model('proposal', AgentProposalDto::fromArray(...)),
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
            'message' => $this->message,
            'proposal' => $this->proposal?->toArray(),
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
