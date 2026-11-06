<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\CustomRoleDto;
use Crossmart\Model\CustomRoleInputDto;
use Crossmart\Model\RoleCatalogDto;

/**
 * The operations tagged "Roles".
 */
final class RolesApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * Every role: the built-in ones with their permissions, and custom ones
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function customRolesControllerListV1(
        string $workspaceId,
    ): RoleCatalogDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/roles',
            pathParameters: ['workspaceId' => $workspaceId],
        ));

        return RoleCatalogDto::fromArray($response->object());
    }

    /**
     * Create a role from permissions you have
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function customRolesControllerCreateV1(
        string $workspaceId,
        CustomRoleInputDto $body,
    ): CustomRoleDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/roles',
            pathParameters: ['workspaceId' => $workspaceId],
            body: $body->toArray(),
        ));

        return CustomRoleDto::fromArray($response->object());
    }

    /**
     * Change a role
     *
     * Applies to everyone holding it at once. API keys created by its members that now allow more than the role are revoked.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function customRolesControllerUpdateV1(
        string $workspaceId,
        string $roleId,
        CustomRoleInputDto $body,
    ): CustomRoleDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Put,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/roles/{roleId}',
            pathParameters: ['workspaceId' => $workspaceId, 'roleId' => $roleId],
            body: $body->toArray(),
        ));

        return CustomRoleDto::fromArray($response->object());
    }

    /**
     * Delete a role
     *
     * Refused (409) while members, pending invitations or API keys hold it.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function customRolesControllerDeleteV1(
        string $workspaceId,
        string $roleId,
    ): void {
        $this->transport->send(new ApiRequest(
            method: HttpMethod::Delete,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/roles/{roleId}',
            pathParameters: ['workspaceId' => $workspaceId, 'roleId' => $roleId],
        ));
    }
}
