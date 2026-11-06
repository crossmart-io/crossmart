<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Enum\SortDirection;
use Crossmart\Enum\WebhookDeliveryStatus;
use Crossmart\Enum\WebhookEventType;
use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\CreateWebhookEndpointDto;
use Crossmart\Model\UpdateWebhookEndpointDto;
use Crossmart\Model\WebhookDeliveryDetailDto;
use Crossmart\Model\WebhookDeliveryDto;
use Crossmart\Model\WebhookDeliveryPageDto;
use Crossmart\Model\WebhookEndpointDto;
use Crossmart\Model\WebhookEndpointWithSecretDto;

/**
 * The operations tagged "Webhooks".
 */
final class WebhooksApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * Webhook endpoints of a workspace, oldest first
     *
     * @return list<WebhookEndpointDto>
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function webhookEndpointsControllerListV1(
        string $workspaceId,
    ): array {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/webhook-endpoints',
            pathParameters: ['workspaceId' => $workspaceId],
        ));

        return array_map(WebhookEndpointDto::fromArray(...), $response->objectList());
    }

    /**
     * Add a webhook endpoint. Its signing secret is returned once.
     *
     * Events are POSTed to the URL as JSON, signed in the Crossmart-Signature header.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function webhookEndpointsControllerCreateV1(
        string $workspaceId,
        CreateWebhookEndpointDto $body,
    ): WebhookEndpointWithSecretDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/webhook-endpoints',
            pathParameters: ['workspaceId' => $workspaceId],
            body: $body->toArray(),
        ));

        return WebhookEndpointWithSecretDto::fromArray($response->object());
    }

    /**
     * One webhook endpoint
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function webhookEndpointsControllerGetV1(
        string $workspaceId,
        string $endpointId,
    ): WebhookEndpointDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/webhook-endpoints/{endpointId}',
            pathParameters: ['workspaceId' => $workspaceId, 'endpointId' => $endpointId],
        ));

        return WebhookEndpointDto::fromArray($response->object());
    }

    /**
     * Delete a webhook endpoint and its delivery log
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function webhookEndpointsControllerDeleteV1(
        string $workspaceId,
        string $endpointId,
    ): void {
        $this->transport->send(new ApiRequest(
            method: HttpMethod::Delete,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/webhook-endpoints/{endpointId}',
            pathParameters: ['workspaceId' => $workspaceId, 'endpointId' => $endpointId],
        ));
    }

    /**
     * Change a webhook endpoint, or turn it off or on
     *
     * Turning an endpoint off fails what it still had to receive; turning it on clears its failure count. Events from while it was off are not sent.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function webhookEndpointsControllerUpdateV1(
        string $workspaceId,
        string $endpointId,
        UpdateWebhookEndpointDto $body,
    ): WebhookEndpointDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Patch,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/webhook-endpoints/{endpointId}',
            pathParameters: ['workspaceId' => $workspaceId, 'endpointId' => $endpointId],
            body: $body->toArray(),
        ));

        return WebhookEndpointDto::fromArray($response->object());
    }

    /**
     * Give a webhook endpoint a new signing secret, returned once
     *
     * For 24 hours deliveries are signed with both the new and the old secret (two v1 signatures), so the receiver can switch without dropping events.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function webhookEndpointsControllerRotateSecretV1(
        string $workspaceId,
        string $endpointId,
    ): WebhookEndpointWithSecretDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/webhook-endpoints/{endpointId}/rotate-secret',
            pathParameters: ['workspaceId' => $workspaceId, 'endpointId' => $endpointId],
        ));

        return WebhookEndpointWithSecretDto::fromArray($response->object());
    }

    /**
     * The delivery log of a webhook endpoint, newest first
     *
     * Deliveries are kept for 30 days.
     *
     * @param string|null $cursor `nextCursor` from the previous page
     * @param int|float|null $page 1-based page number, for tables with page numbers. It wins over `cursor`.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function webhookDeliveriesControllerListV1(
        string $workspaceId,
        string $endpointId,
        WebhookDeliveryStatus|string|null $status = null,
        WebhookEventType|string|null $eventType = null,
        SortDirection|string|null $direction = null,
        ?string $cursor = null,
        int|float|null $page = null,
        int|float|null $limit = null,
    ): WebhookDeliveryPageDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/webhook-endpoints/{endpointId}/deliveries',
            pathParameters: ['workspaceId' => $workspaceId, 'endpointId' => $endpointId],
            query: ['status' => $status, 'eventType' => $eventType, 'direction' => $direction, 'cursor' => $cursor, 'page' => $page, 'limit' => $limit],
        ));

        return WebhookDeliveryPageDto::fromArray($response->object());
    }

    /**
     * One delivery, with the JSON body it sends
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function webhookDeliveriesControllerGetV1(
        string $workspaceId,
        string $endpointId,
        string $deliveryId,
    ): WebhookDeliveryDetailDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/webhook-endpoints/{endpointId}/deliveries/{deliveryId}',
            pathParameters: ['workspaceId' => $workspaceId, 'endpointId' => $endpointId, 'deliveryId' => $deliveryId],
        ));

        return WebhookDeliveryDetailDto::fromArray($response->object());
    }

    /**
     * Send a delivery’s event again
     *
     * A new delivery of the same event, with the same event id, sent right away.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function webhookDeliveriesControllerRedeliverV1(
        string $workspaceId,
        string $endpointId,
        string $deliveryId,
    ): WebhookDeliveryDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/webhook-endpoints/{endpointId}/deliveries/{deliveryId}/redeliver',
            pathParameters: ['workspaceId' => $workspaceId, 'endpointId' => $endpointId, 'deliveryId' => $deliveryId],
        ));

        return WebhookDeliveryDto::fromArray($response->object());
    }

    /**
     * Send a test event to a webhook endpoint
     *
     * A `webhook.test` event, to this endpoint only and tried once. Its outcome shows in the delivery log within seconds.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function webhookDeliveriesControllerSendTestV1(
        string $workspaceId,
        string $endpointId,
    ): WebhookDeliveryDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/webhook-endpoints/{endpointId}/test',
            pathParameters: ['workspaceId' => $workspaceId, 'endpointId' => $endpointId],
        ));

        return WebhookDeliveryDto::fromArray($response->object());
    }
}
