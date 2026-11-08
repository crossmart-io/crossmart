<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\AgentWorkerContextView;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class AgentWorkerPageContextDto implements JsonSerializable
{
    /**
     * @param AgentWorkerContextView|string|null $view The page the person wrote from
     * @param string|null $productId The product on screen
     * @param string|null $connectionId The store on screen
     */
    public function __construct(
        public readonly AgentWorkerContextView|string|null $view = null,
        public readonly ?string $productId = null,
        public readonly ?string $connectionId = null,
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
            view: $payload->isNull('view') ? null : $payload->enum('view', AgentWorkerContextView::class),
            productId: $payload->isNull('productId') ? null : $payload->string('productId'),
            connectionId: $payload->isNull('connectionId') ? null : $payload->string('connectionId'),
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
        if ($this->view !== null) {
            $data['view'] = Payload::enumValue($this->view);
        }
        if ($this->productId !== null) {
            $data['productId'] = $this->productId;
        }
        if ($this->connectionId !== null) {
            $data['connectionId'] = $this->connectionId;
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
