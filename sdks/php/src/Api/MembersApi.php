<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\AcceptedInvitationDto;
use Crossmart\Model\InvitationDto;
use Crossmart\Model\InvitationPreviewDto;
use Crossmart\Model\InvitationTokenDto;
use Crossmart\Model\InviteMemberDto;
use Crossmart\Model\UpdateMemberRoleDto;
use Crossmart\Model\WorkspaceMemberDto;

/**
 * The operations tagged "Members".
 */
final class MembersApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * The members of a workspace
     *
     * @return list<WorkspaceMemberDto>
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function membersControllerListV1(
        string $workspaceId,
    ): array {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/members',
            pathParameters: ['workspaceId' => $workspaceId],
        ));

        return array_map(WorkspaceMemberDto::fromArray(...), $response->objectList());
    }

    /**
     * Remove a member
     *
     * Only members whose role yours covers. Their API keys here are revoked.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function membersControllerRemoveV1(
        string $workspaceId,
        string $userId,
    ): void {
        $this->transport->send(new ApiRequest(
            method: HttpMethod::Delete,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/members/{userId}',
            pathParameters: ['workspaceId' => $workspaceId, 'userId' => $userId],
        ));
    }

    /**
     * Change a member's role
     *
     * Only for members whose role yours covers, to a role yours covers. Their API keys that the new role could not have created are revoked.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function membersControllerChangeRoleV1(
        string $workspaceId,
        string $userId,
        UpdateMemberRoleDto $body,
    ): WorkspaceMemberDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Patch,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/members/{userId}',
            pathParameters: ['workspaceId' => $workspaceId, 'userId' => $userId],
            body: $body->toArray(),
        ));

        return WorkspaceMemberDto::fromArray($response->object());
    }

    /**
     * Leave a workspace
     *
     * Your API keys here are revoked. Refused (409) for its last owner and for your only workspace.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function membershipControllerLeaveV1(
        string $workspaceId,
    ): void {
        $this->transport->send(new ApiRequest(
            method: HttpMethod::Delete,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/membership',
            pathParameters: ['workspaceId' => $workspaceId],
        ));
    }

    /**
     * Pending invitations of a workspace
     *
     * @return list<InvitationDto>
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function invitationsControllerListV1(
        string $workspaceId,
    ): array {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/invitations',
            pathParameters: ['workspaceId' => $workspaceId],
        ));

        return array_map(InvitationDto::fromArray(...), $response->objectList());
    }

    /**
     * Invite someone by email
     *
     * Emails a link that works for 7 days. A new invitation to the same address replaces the pending one. Refused (409) for members and past 50 pending invitations, and (402) when the plan has no seat for someone new to the organization.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function invitationsControllerInviteV1(
        string $workspaceId,
        InviteMemberDto $body,
    ): InvitationDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/invitations',
            pathParameters: ['workspaceId' => $workspaceId],
            body: $body->toArray(),
        ));

        return InvitationDto::fromArray($response->object());
    }

    /**
     * Revoke a pending invitation; its link stops working
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function invitationsControllerRevokeV1(
        string $workspaceId,
        string $invitationId,
    ): void {
        $this->transport->send(new ApiRequest(
            method: HttpMethod::Delete,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/invitations/{invitationId}',
            pathParameters: ['workspaceId' => $workspaceId, 'invitationId' => $invitationId],
        ));
    }

    /**
     * What an invitation link is for
     *
     * Open to anyone with the link, so it can be shown before signing in. 404 when the link is unknown, used, revoked or expired.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function invitationLinksControllerPreviewV1(
        InvitationTokenDto $body,
    ): InvitationPreviewDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/invitations/preview',
            body: $body->toArray(),
        ));

        return InvitationPreviewDto::fromArray($response->object());
    }

    /**
     * Accept an invitation and join its workspace
     *
     * Needs a signed-in user whose email is the invited address (403 otherwise).
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function invitationLinksControllerAcceptV1(
        InvitationTokenDto $body,
    ): AcceptedInvitationDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/invitations/accept',
            body: $body->toArray(),
        ));

        return AcceptedInvitationDto::fromArray($response->object());
    }
}
