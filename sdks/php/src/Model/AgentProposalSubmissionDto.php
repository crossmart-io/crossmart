<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\AgentApprovalExemption;
use Crossmart\Enum\AgentProposalOutcome;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class AgentProposalSubmissionDto implements JsonSerializable
{
    /**
     * @param AgentProposalOutcome|string $outcome `proposed`: it waits for the seller. `apply_directly`: make the call itself, because the workspace lets agents make changes at once or the call needs no approval (`exemption`).
     * @param string $message What to do next, or to tell the user
     * @param AgentApprovalExemption|string|null $exemption Set with `apply_directly` when the workspace approves agents’ changes but this call needs none: `new_draft` for `create_product` with no status or DRAFT. Null otherwise.
     */
    public function __construct(
        public readonly AgentProposalOutcome|string $outcome,
        public readonly string $message,
        public readonly ?AgentProposalDto $proposal,
        public readonly AgentApprovalExemption|string|null $exemption,
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
            exemption: $payload->isNull('exemption') ? null : $payload->enum('exemption', AgentApprovalExemption::class),
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
            'exemption' => Payload::enumValue($this->exemption),
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
