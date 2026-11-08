<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class DecideAgentProposalDto implements JsonSerializable
{
    /**
     * @param bool|null $confirmHighRisk Required for a proposal with risks (deletes, changes prices, or many items)
     */
    public function __construct(
        public readonly ?bool $confirmHighRisk = null,
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
            confirmHighRisk: $payload->isNull('confirmHighRisk') ? null : $payload->bool('confirmHighRisk'),
        );
    }

    /**
     * The model in the API's JSON shape.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [];
        if ($this->confirmHighRisk !== null) {
            $data['confirmHighRisk'] = $this->confirmHighRisk;
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
