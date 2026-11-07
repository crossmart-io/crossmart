<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\BillingPlanCatalogDto;
use Crossmart\Model\BillingStatusDto;
use Crossmart\Model\HostedSessionDto;
use Crossmart\Model\StartCheckoutDto;
use Crossmart\Model\SubscriptionAccessDto;

/**
 * The operations tagged "Billing".
 */
final class BillingApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * The plans on offer, with what each includes and costs
     *
     * Open to anyone. Prices come from the billing provider, monthly and annual; a plan with none (Enterprise, or every plan on a self-hosted instance) is not self-serve and is sold through `salesEmail`. No plan charges a fee on sales.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function billingPlansControllerListV1(): BillingPlanCatalogDto
    {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/billing/plans',
        ));

        return BillingPlanCatalogDto::fromArray($response->object());
    }

    /**
     * The organization’s subscription and what it may do under it
     *
     * For people holding `billing:view` in a workspace of the organization. Includes whether it is read-only and why, and whether a checkout would start with a trial. Usage against limits is at `GET /organizations/{organizationId}/subscription`.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function organizationBillingControllerGetV1(
        string $organizationId,
    ): BillingStatusDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/organizations/{organizationId}/billing',
            pathParameters: ['organizationId' => $organizationId],
        ));

        return BillingStatusDto::fromArray($response->object());
    }

    /**
     * Start a subscription: a checkout page for a plan and interval
     *
     * For people holding `billing:manage` (owners and admins). Answers the URL of the provider’s checkout page. The card is collected even for the free trial, which only the organization’s first subscription gets, and is charged when it ends. An organization with a live subscription changes it in the billing portal instead (409).
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function organizationBillingControllerStartCheckoutV1(
        string $organizationId,
        StartCheckoutDto $body,
    ): HostedSessionDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/organizations/{organizationId}/billing/checkout-sessions',
            pathParameters: ['organizationId' => $organizationId],
            body: $body->toArray(),
        ));

        return HostedSessionDto::fromArray($response->object());
    }

    /**
     * Open the billing portal
     *
     * For people holding `billing:manage`. Answers the URL of the provider’s portal, where the plan, interval and card are changed, the subscription canceled, and invoices downloaded.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function organizationBillingControllerOpenPortalV1(
        string $organizationId,
    ): HostedSessionDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/organizations/{organizationId}/billing/portal-sessions',
            pathParameters: ['organizationId' => $organizationId],
        ));

        return HostedSessionDto::fromArray($response->object());
    }

    /**
     * Whether the workspace can be changed under its organization’s subscription
     *
     * For anyone in the workspace, including API keys and agents. While `writable` is false and `enforced` is true, changes answer 402 `subscription_inactive`: ask a billing admin of the organization (owners and admins) to fix the subscription.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function workspaceBillingAccessControllerGetV1(
        string $workspaceId,
    ): SubscriptionAccessDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/billing-access',
            pathParameters: ['workspaceId' => $workspaceId],
        ));

        return SubscriptionAccessDto::fromArray($response->object());
    }
}
