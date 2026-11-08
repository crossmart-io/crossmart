<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Enum\AgentProposalStatus;
use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\AgentProposalDto;
use Crossmart\Model\AgentProposalPageDto;
use Crossmart\Model\AgentProposalSubmissionDto;
use Crossmart\Model\AgentProposalSummaryDto;
use Crossmart\Model\DecideAgentProposalDto;
use Crossmart\Model\ProposeAgentChangeDto;

/**
 * The operations tagged "Agent proposals".
 */
final class AgentProposalsApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * Outside agents’ proposals, newest first (signed-in people)
     *
     * @param int|float|null $page 1-based page number, for tables with page numbers. It wins over `cursor`.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function agentProposalsControllerListV1(
        string $workspaceId,
        AgentProposalStatus|string|null $status = null,
        int|float|null $page = null,
        int|float|null $limit = null,
    ): AgentProposalPageDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/agent-proposals',
            pathParameters: ['workspaceId' => $workspaceId],
            query: ['status' => $status, 'page' => $page, 'limit' => $limit],
        ));

        return AgentProposalPageDto::fromArray($response->object());
    }

    /**
     * Propose a change as an outside agent
     *
     * For connected agents and MCP sessions. Takes an MCP write tool and its input. When the workspace approves agents’ changes, it stores a proposal for the seller and answers `proposed`; otherwise it answers `apply_directly` and stores nothing. 400 for a read tool, an unknown one or invalid input; 403 when the caller could not make the change.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function agentProposalsControllerProposeV1(
        string $workspaceId,
        ProposeAgentChangeDto $body,
    ): AgentProposalSubmissionDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/agent-proposals',
            pathParameters: ['workspaceId' => $workspaceId],
            body: $body->toArray(),
        ));

        return AgentProposalSubmissionDto::fromArray($response->object());
    }

    /**
     * How many proposals wait for a decision (signed-in people)
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function agentProposalsControllerSummaryV1(
        string $workspaceId,
    ): AgentProposalSummaryDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/agent-proposals/summary',
            pathParameters: ['workspaceId' => $workspaceId],
        ));

        return AgentProposalSummaryDto::fromArray($response->object());
    }

    /**
     * One proposal and where it stands
     *
     * People need suggestions:view. An agent or key reads only proposals it made; any other id answers 404.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function agentProposalsControllerGetV1(
        string $workspaceId,
        string $proposalId,
    ): AgentProposalDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/agent-proposals/{proposalId}',
            pathParameters: ['workspaceId' => $workspaceId, 'proposalId' => $proposalId],
        ));

        return AgentProposalDto::fromArray($response->object());
    }

    /**
     * Approve a proposal: the change is made as the agent, approved by you
     *
     * Needs the permission the change itself needs too. A proposal with risks needs `confirmHighRisk`. 409 when it no longer waits (decided or expired).
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function agentProposalsControllerApproveV1(
        string $workspaceId,
        string $proposalId,
        DecideAgentProposalDto $body,
    ): AgentProposalDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/agent-proposals/{proposalId}/approve',
            pathParameters: ['workspaceId' => $workspaceId, 'proposalId' => $proposalId],
            body: $body->toArray(),
        ));

        return AgentProposalDto::fromArray($response->object());
    }

    /**
     * Reject a proposal; nothing changes and the agent reads `rejected`
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function agentProposalsControllerRejectV1(
        string $workspaceId,
        string $proposalId,
    ): AgentProposalDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/agent-proposals/{proposalId}/reject',
            pathParameters: ['workspaceId' => $workspaceId, 'proposalId' => $proposalId],
        ));

        return AgentProposalDto::fromArray($response->object());
    }
}
