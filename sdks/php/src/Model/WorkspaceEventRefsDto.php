<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class WorkspaceEventRefsDto implements JsonSerializable
{
    /**
     * @param string|null $connectionId The store (channel connection)
     * @param string|null $conversationId Your Crossmart Agent conversation
     * @param string|null $actionId The Crossmart Agent tool call
     * @param string|null $proposalId An outside agent's proposal
     */
    public function __construct(
        public readonly ?string $connectionId,
        public readonly ?string $productId,
        public readonly ?string $orderId,
        public readonly ?string $webhookEndpointId,
        public readonly ?string $conversationId,
        public readonly ?string $actionId,
        public readonly ?string $proposalId,
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
            connectionId: $payload->isNull('connectionId') ? null : $payload->string('connectionId'),
            productId: $payload->isNull('productId') ? null : $payload->string('productId'),
            orderId: $payload->isNull('orderId') ? null : $payload->string('orderId'),
            webhookEndpointId: $payload->isNull('webhookEndpointId') ? null : $payload->string('webhookEndpointId'),
            conversationId: $payload->isNull('conversationId') ? null : $payload->string('conversationId'),
            actionId: $payload->isNull('actionId') ? null : $payload->string('actionId'),
            proposalId: $payload->isNull('proposalId') ? null : $payload->string('proposalId'),
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
            'connectionId' => $this->connectionId,
            'productId' => $this->productId,
            'orderId' => $this->orderId,
            'webhookEndpointId' => $this->webhookEndpointId,
            'conversationId' => $this->conversationId,
            'actionId' => $this->actionId,
            'proposalId' => $this->proposalId,
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
