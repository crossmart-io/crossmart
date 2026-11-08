<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class DecideAgentWorkerActionsDto implements JsonSerializable
{
    /**
     * @param list<string> $approvedActionIds The waiting actions to approve; every other waiting action of the conversation is rejected. Empty rejects them all.
     * @param bool|null $confirmHighRisk Required (true) to approve an action with `risks`: a deletion, a price change or a bulk change
     */
    public function __construct(
        public readonly array $approvedActionIds,
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
            approvedActionIds: $payload->stringList('approvedActionIds'),
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
        $data = [
            'approvedActionIds' => $this->approvedActionIds,
        ];
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
