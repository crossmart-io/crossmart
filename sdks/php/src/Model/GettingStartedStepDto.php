<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\GettingStartedStep;
use Crossmart\Enum\GettingStartedStepOwner;
use Crossmart\Enum\GettingStartedStepState;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class GettingStartedStepDto implements JsonSerializable
{
    /**
     * @param GettingStartedStepOwner|string $owner `merchant`: only the seller can take it, in the app; `agent`: with `tools`
     * @param string|null $url The page of the web app where the seller takes it
     * @param list<string> $tools Agent tools
     */
    public function __construct(
        public readonly GettingStartedStep|string $step,
        public readonly GettingStartedStepState|string $state,
        public readonly GettingStartedStepOwner|string $owner,
        public readonly string $title,
        public readonly string $detail,
        public readonly ?string $url,
        public readonly array $tools,
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
            step: $payload->enum('step', GettingStartedStep::class),
            state: $payload->enum('state', GettingStartedStepState::class),
            owner: $payload->enum('owner', GettingStartedStepOwner::class),
            title: $payload->string('title'),
            detail: $payload->string('detail'),
            url: $payload->isNull('url') ? null : $payload->string('url'),
            tools: $payload->stringList('tools'),
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
            'step' => Payload::enumValue($this->step),
            'state' => Payload::enumValue($this->state),
            'owner' => Payload::enumValue($this->owner),
            'title' => $this->title,
            'detail' => $this->detail,
            'url' => $this->url,
            'tools' => $this->tools,
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
