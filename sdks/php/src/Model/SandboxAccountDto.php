<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\SandboxOpeningOutcome;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class SandboxAccountDto implements JsonSerializable
{
    /**
     * @param string $nextStep What the agent should do next
     * @param string|null $apiKey An Editor API key for the new workspace, shown only now. Send it as `Authorization: Bearer <key>` or `x-api-key`.
     * @param DateTimeImmutable|null $claimExpiresAt When the claim link stops working and the unclaimed account is deleted
     */
    public function __construct(
        public readonly SandboxOpeningOutcome|string $outcome,
        public readonly string $nextStep,
        public readonly ?string $workspaceId,
        public readonly ?string $apiKey,
        public readonly ?DateTimeImmutable $claimExpiresAt,
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
            outcome: $payload->enum('outcome', SandboxOpeningOutcome::class),
            nextStep: $payload->string('nextStep'),
            workspaceId: $payload->isNull('workspaceId') ? null : $payload->string('workspaceId'),
            apiKey: $payload->isNull('apiKey') ? null : $payload->string('apiKey'),
            claimExpiresAt: $payload->isNull('claimExpiresAt') ? null : $payload->dateTime('claimExpiresAt'),
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
            'nextStep' => $this->nextStep,
            'workspaceId' => $this->workspaceId,
            'apiKey' => $this->apiKey,
            'claimExpiresAt' => $this->claimExpiresAt === null ? null : Payload::formatDateTime($this->claimExpiresAt),
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
