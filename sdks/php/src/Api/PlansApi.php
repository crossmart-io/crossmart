<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\SubscriptionDto;

/**
 * The operations tagged "Plans".
 */
final class PlansApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * The organization’s plan, its limits and current usage
     *
     * For people holding `billing:view` (owners and admins) in a workspace of the organization; others in it get 403, and outsiders 404. Usage is counted across all of its workspaces. Needs a signed-in user.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function organizationSubscriptionControllerGetV1(
        string $organizationId,
    ): SubscriptionDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/organizations/{organizationId}/subscription',
            pathParameters: ['organizationId' => $organizationId],
        ));

        return SubscriptionDto::fromArray($response->object());
    }
}
