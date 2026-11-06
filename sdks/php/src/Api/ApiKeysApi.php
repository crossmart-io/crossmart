<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\ApiKeyDto;
use Crossmart\Model\CreateApiKeyDto;
use Crossmart\Model\CurrentApiKeyDto;
use Crossmart\Model\IssuedApiKeyDto;

/**
 * The operations tagged "API keys".
 */
final class ApiKeysApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * Active API keys of a workspace
     *
     * @return list<ApiKeyDto>
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function apiKeysControllerListV1(
        string $workspaceId,
    ): array {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/api-keys',
            pathParameters: ['workspaceId' => $workspaceId],
        ));

        return array_map(ApiKeyDto::fromArray(...), $response->objectList());
    }

    /**
     * Create an API key. The secret is returned once.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function apiKeysControllerCreateV1(
        string $workspaceId,
        CreateApiKeyDto $body,
    ): IssuedApiKeyDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/api-keys',
            pathParameters: ['workspaceId' => $workspaceId],
            body: $body->toArray(),
        ));

        return IssuedApiKeyDto::fromArray($response->object());
    }

    /**
     * Revoke an API key
     *
     * Answers 403 unless the caller created the key or has every permission the key has.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function apiKeysControllerRevokeV1(
        string $workspaceId,
        string $apiKeyId,
    ): void {
        $this->transport->send(new ApiRequest(
            method: HttpMethod::Delete,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/api-keys/{apiKeyId}',
            pathParameters: ['workspaceId' => $workspaceId, 'apiKeyId' => $apiKeyId],
        ));
    }

    /**
     * The API key making this request
     *
     * Lets a program, such as the MCP server, find the workspace its key works in.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function currentApiKeyControllerGetV1(): CurrentApiKeyDto
    {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/api-key',
        ));

        return CurrentApiKeyDto::fromArray($response->object());
    }
}
