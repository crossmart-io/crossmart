<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\GettingStartedDto;

/**
 * The operations tagged "Getting started".
 */
final class GettingStartedApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * Where a new account stands, and what to do next
     *
     * Counts of products, stores and live listings, whether the email is confirmed, and the steps to a first listing: each says whether it is done, whether the seller (in the app, with a link) or an agent (with the tools named) takes it. For agents that connect to an empty workspace.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function gettingStartedControllerGetV1(
        string $workspaceId,
    ): GettingStartedDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/getting-started',
            pathParameters: ['workspaceId' => $workspaceId],
        ));

        return GettingStartedDto::fromArray($response->object());
    }
}
