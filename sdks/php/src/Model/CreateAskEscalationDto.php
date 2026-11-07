<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\AskEscalationReason;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class CreateAskEscalationDto implements JsonSerializable
{
    /**
     * @param string $conversationId The `conversationId` of your conversation with Ask Crossmart
     * @param string|null $contactEmail Where a person from the Crossmart team should email the reply
     * @param string|null $callbackUrl A public https URL the reply is POSTed to, signed like Crossmart webhooks with the `callbackSecret` this call returns (event type `ask.escalation.replied`)
     * @param AskEscalationReason|string|null $reason Why; defaults to the reason Ask last offered a person, else `human_requested`
     */
    public function __construct(
        public readonly string $conversationId,
        public readonly ?string $contactEmail = null,
        public readonly ?string $callbackUrl = null,
        public readonly AskEscalationReason|string|null $reason = null,
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
            conversationId: $payload->string('conversationId'),
            contactEmail: $payload->isNull('contactEmail') ? null : $payload->string('contactEmail'),
            callbackUrl: $payload->isNull('callbackUrl') ? null : $payload->string('callbackUrl'),
            reason: $payload->isNull('reason') ? null : $payload->enum('reason', AskEscalationReason::class),
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
            'conversationId' => $this->conversationId,
        ];
        if ($this->contactEmail !== null) {
            $data['contactEmail'] = $this->contactEmail;
        }
        if ($this->callbackUrl !== null) {
            $data['callbackUrl'] = $this->callbackUrl;
        }
        if ($this->reason !== null) {
            $data['reason'] = Payload::enumValue($this->reason);
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
