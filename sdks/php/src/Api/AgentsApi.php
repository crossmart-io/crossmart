<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\AgentConnectionDto;
use Crossmart\Model\PickAgentWorkspaceDto;

/**
 * The operations tagged "Agents".
 */
final class AgentsApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * Pick the workspace for the agent being authorized
     *
     * Called by the web app before it continues the OAuth flow. The agent will only ever act in this workspace, within your role there.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function agentAuthorizationControllerPickWorkspaceV1(
        PickAgentWorkspaceDto $body,
    ): void {
        $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/oauth/workspace',
            body: $body->toArray(),
        ));
    }

    /**
     * AI agents connected to the workspace
     *
     * Your own connections, or every member’s if you may manage API keys. Signed-in users only.
     *
     * @return list<AgentConnectionDto>
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function agentConnectionsControllerListV1(
        string $workspaceId,
    ): array {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/agent-connections',
            pathParameters: ['workspaceId' => $workspaceId],
        ));

        return array_map(AgentConnectionDto::fromArray(...), $response->objectList());
    }

    /**
     * Disconnect an agent
     *
     * Revokes its tokens at once. The agent must be authorized again to come back.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function agentConnectionsControllerRevokeV1(
        string $workspaceId,
        string $connectionId,
    ): void {
        $this->transport->send(new ApiRequest(
            method: HttpMethod::Delete,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/agent-connections/{connectionId}',
            pathParameters: ['workspaceId' => $workspaceId, 'connectionId' => $connectionId],
        ));
    }
}
