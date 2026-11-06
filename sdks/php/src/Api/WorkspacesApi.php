<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\CreateWorkspaceDto;
use Crossmart\Model\DeleteWorkspaceDto;
use Crossmart\Model\MeDto;
use Crossmart\Model\UpdateWorkspaceDto;
use Crossmart\Model\WorkspaceDto;

/**
 * The operations tagged "Workspaces".
 */
final class WorkspacesApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * The signed-in user and the workspaces they belong to
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function meControllerGetMeV1(): MeDto
    {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/me',
        ));

        return MeDto::fromArray($response->object());
    }

    /**
     * Delete your account
     *
     * Deletes the workspaces only you use, with everything in them, and removes you from the others. Refused (409) while you own a workspace other people use.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function meControllerDeleteMeV1(): void
    {
        $this->transport->send(new ApiRequest(
            method: HttpMethod::Delete,
            pathTemplate: '/api/v1/me',
        ));
    }

    /**
     * A workspace and your role in it
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function workspacesControllerGetWorkspaceV1(
        string $workspaceId,
    ): WorkspaceDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}',
            pathParameters: ['workspaceId' => $workspaceId],
        ));

        return WorkspaceDto::fromArray($response->object());
    }

    /**
     * Delete a workspace and everything in it
     *
     * Disconnects every store (removing the app unless another workspace uses the store), then deletes products, stock, listings, orders, activity and API keys. It cannot be undone.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function workspacesControllerDeleteWorkspaceV1(
        string $workspaceId,
        DeleteWorkspaceDto $body,
    ): void {
        $this->transport->send(new ApiRequest(
            method: HttpMethod::Delete,
            pathTemplate: '/api/v1/workspaces/{workspaceId}',
            pathParameters: ['workspaceId' => $workspaceId],
            body: $body->toArray(),
        ));
    }

    /**
     * Rename a workspace or set its time zone
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function workspacesControllerUpdateV1(
        string $workspaceId,
        UpdateWorkspaceDto $body,
    ): WorkspaceDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Patch,
            pathTemplate: '/api/v1/workspaces/{workspaceId}',
            pathParameters: ['workspaceId' => $workspaceId],
            body: $body->toArray(),
        ));

        return WorkspaceDto::fromArray($response->object());
    }

    /**
     * Create a workspace
     *
     * For owners of a workspace in the organization, such as one per client or brand. You own the new workspace. Refused (402) past the plan’s workspace limit.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function organizationWorkspacesControllerCreateV1(
        string $organizationId,
        CreateWorkspaceDto $body,
    ): WorkspaceDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/organizations/{organizationId}/workspaces',
            pathParameters: ['organizationId' => $organizationId],
            body: $body->toArray(),
        ));

        return WorkspaceDto::fromArray($response->object());
    }
}
