<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class SendAgentWorkerMessageDto implements JsonSerializable
{
    /**
     * @param AgentWorkerPageContextDto|null $context Where the person is in the app, so "this product" means something
     */
    public function __construct(
        public readonly string $text,
        public readonly ?AgentWorkerPageContextDto $context = null,
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
            text: $payload->string('text'),
            context: $payload->isNull('context') ? null : $payload->model('context', AgentWorkerPageContextDto::fromArray(...)),
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
            'text' => $this->text,
        ];
        if ($this->context !== null) {
            $data['context'] = $this->context->toArray();
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
