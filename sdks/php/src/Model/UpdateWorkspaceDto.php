<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\OutsideAgentChanges;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class UpdateWorkspaceDto implements JsonSerializable
{
    /**
     * @param string|null $timeZone IANA time zone where the workspace’s day starts, for reports, such as Asia/Jerusalem
     * @param OutsideAgentChanges|string|null $outsideAgentChanges Whether outside agents' changes wait for approval. Only a signed-in person may change it; an API key or agent gets 403. Recorded in the activity log.
     */
    public function __construct(
        public readonly ?string $name = null,
        public readonly ?string $timeZone = null,
        public readonly OutsideAgentChanges|string|null $outsideAgentChanges = null,
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
            name: $payload->isNull('name') ? null : $payload->string('name'),
            timeZone: $payload->isNull('timeZone') ? null : $payload->string('timeZone'),
            outsideAgentChanges: $payload->isNull('outsideAgentChanges') ? null : $payload->enum('outsideAgentChanges', OutsideAgentChanges::class),
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
        if ($this->name !== null) {
            $data['name'] = $this->name;
        }
        if ($this->timeZone !== null) {
            $data['timeZone'] = $this->timeZone;
        }
        if ($this->outsideAgentChanges !== null) {
            $data['outsideAgentChanges'] = Payload::enumValue($this->outsideAgentChanges);
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
