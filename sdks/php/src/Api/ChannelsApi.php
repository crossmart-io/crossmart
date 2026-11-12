<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\ChannelConnectionDto;
use Crossmart\Model\ConnectWithCredentialsDto;
use Crossmart\Model\ConnectedChannelDto;
use Crossmart\Model\ImportJobDetailDto;
use Crossmart\Model\StartAuthorizationDto;
use Crossmart\Model\StartedAuthorizationDto;
use Crossmart\Model\UpdateEbayListingDefaultsDto;
use Crossmart\Model\UpdateEtsyListingSetupDto;
use Crossmart\Model\UpdateGoogleListingSetupDto;

/**
 * The operations tagged "Channels".
 */
final class ChannelsApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * Channel accounts connected to the workspace, in connection order
     *
     * @return list<ChannelConnectionDto>
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function channelConnectionsControllerListV1(
        string $workspaceId,
    ): array {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/channel-connections',
            pathParameters: ['workspaceId' => $workspaceId],
        ));

        return array_map(ChannelConnectionDto::fromArray(...), $response->objectList());
    }

    /**
     * Start connecting a channel account
     *
     * Returns the URL to send the merchant to. After they approve the app, the channel redirects to the API, which stores the connection and sends them back to the web app’s Channels page with the parameters of `ChannelConnectRedirectDto`. Needs a signed-in user, and the browser must store the cookie this response sets (send it with credentials): the callback only accepts the same browser and session that started the connection.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function channelConnectionsControllerStartAuthorizationV1(
        string $workspaceId,
        StartAuthorizationDto $body,
    ): StartedAuthorizationDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/channel-connections/authorizations',
            pathParameters: ['workspaceId' => $workspaceId],
            body: $body->toArray(),
        ));

        return StartedAuthorizationDto::fromArray($response->object());
    }

    /**
     * One channel connection
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function channelConnectionsControllerGetV1(
        string $workspaceId,
        string $connectionId,
    ): ChannelConnectionDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}',
            pathParameters: ['workspaceId' => $workspaceId, 'connectionId' => $connectionId],
        ));

        return ChannelConnectionDto::fromArray($response->object());
    }

    /**
     * Disconnect a channel account
     *
     * Revokes Crossmart’s access on the channel (for Shopify, uninstalls the app unless another workspace uses the same store) and wipes the stored credentials. Listings stay.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function channelConnectionsControllerDisconnectV1(
        string $workspaceId,
        string $connectionId,
    ): ChannelConnectionDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/disconnect',
            pathParameters: ['workspaceId' => $workspaceId, 'connectionId' => $connectionId],
        ));

        return ChannelConnectionDto::fromArray($response->object());
    }

    /**
     * Connect a channel account with credentials the channel issued
     *
     * For channels whose sellers paste keys instead of approving an app (Falabella). The credentials are checked with a live call to the channel, then stored encrypted; they are never returned or logged. Connecting the same account again replaces its keys. Needs a signed-in user.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function channelCredentialsControllerConnectV1(
        string $workspaceId,
        ConnectWithCredentialsDto $body,
    ): ConnectedChannelDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/channel-connections/credentials',
            pathParameters: ['workspaceId' => $workspaceId],
            body: $body->toArray(),
        ));

        return ConnectedChannelDto::fromArray($response->object());
    }

    /**
     * Import the connected channel’s catalog
     *
     * Queues an import of every product of the channel account. Products already linked to it are refreshed, products that match the catalog by handle or SKU are linked, and the rest are created with their stock. Returns the import history entry; poll it with `GET /import-jobs/{jobId}` to follow the progress. While an import of the connection runs, this returns that import instead of starting another. 409 when the connection is not connected.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function channelImportsControllerStartV1(
        string $workspaceId,
        string $connectionId,
    ): ImportJobDetailDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/imports',
            pathParameters: ['workspaceId' => $workspaceId, 'connectionId' => $connectionId],
        ));

        return ImportJobDetailDto::fromArray($response->object());
    }

    /**
     * Set an eBay connection’s listing defaults
     *
     * Business policies, condition and ship-from address for every listing. The address is saved on eBay as the account’s Crossmart inventory location.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function ebayAccountControllerSaveListingDefaultsV1(
        string $workspaceId,
        string $connectionId,
        UpdateEbayListingDefaultsDto $body,
    ): ChannelConnectionDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Put,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/ebay/listing-defaults',
            pathParameters: ['workspaceId' => $workspaceId, 'connectionId' => $connectionId],
            body: $body->toArray(),
        ));

        return ChannelConnectionDto::fromArray($response->object());
    }

    /**
     * Opt an eBay account in to business policies
     *
     * eBay may take a few minutes to enable them; refresh the policies once they are created.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function ebayAccountControllerOptInToBusinessPoliciesV1(
        string $workspaceId,
        string $connectionId,
    ): ChannelConnectionDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/ebay/business-policies/opt-in',
            pathParameters: ['workspaceId' => $workspaceId, 'connectionId' => $connectionId],
        ));

        return ChannelConnectionDto::fromArray($response->object());
    }

    /**
     * Create default business policies on an eBay account
     *
     * Creates free standard shipping, immediate payment and 30-day return policies on the eBay account (opting it in to business policies first when needed), reads the policies again and chooses the new ones as the listing defaults. Policies that already exist are used as they are, so calling this twice is harmless. Marketplaces without a default shipping service answer 422.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function ebayAccountControllerCreateDefaultPoliciesV1(
        string $workspaceId,
        string $connectionId,
    ): ChannelConnectionDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/ebay/business-policies/defaults',
            pathParameters: ['workspaceId' => $workspaceId, 'connectionId' => $connectionId],
        ));

        return ChannelConnectionDto::fromArray($response->object());
    }

    /**
     * Read an eBay account’s business policies again
     *
     * After the merchant creates or edits policies on eBay. Defaults are kept.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function ebayAccountControllerRefreshPoliciesV1(
        string $workspaceId,
        string $connectionId,
    ): ChannelConnectionDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/ebay/business-policies/refresh',
            pathParameters: ['workspaceId' => $workspaceId, 'connectionId' => $connectionId],
        ));

        return ChannelConnectionDto::fromArray($response->object());
    }

    /**
     * Set where a Google Merchant Center connection lists
     *
     * The country listings target (their currency and language follow) and each product’s page address. Saving creates the Merchant Center API data source for a new country.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function googleMerchantAccountControllerSaveListingSetupV1(
        string $workspaceId,
        string $connectionId,
        UpdateGoogleListingSetupDto $body,
    ): ChannelConnectionDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Put,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/google-merchant/listing-setup',
            pathParameters: ['workspaceId' => $workspaceId, 'connectionId' => $connectionId],
            body: $body->toArray(),
        ));

        return ChannelConnectionDto::fromArray($response->object());
    }

    /**
     * Set an Etsy connection’s listing setup
     *
     * Who made the items, when, whether they are supplies, and the shop’s shipping and processing profiles every listing uses. Etsy requires all of them for physical listings.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function etsyShopControllerSaveListingSetupV1(
        string $workspaceId,
        string $connectionId,
        UpdateEtsyListingSetupDto $body,
    ): ChannelConnectionDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Put,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/etsy/listing-setup',
            pathParameters: ['workspaceId' => $workspaceId, 'connectionId' => $connectionId],
            body: $body->toArray(),
        ));

        return ChannelConnectionDto::fromArray($response->object());
    }

    /**
     * Read an Etsy shop and its profiles again
     *
     * After the merchant creates or edits shipping or processing profiles on Etsy. The listing setup is kept.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function etsyShopControllerRefreshShopV1(
        string $workspaceId,
        string $connectionId,
    ): ChannelConnectionDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/etsy/shop/refresh',
            pathParameters: ['workspaceId' => $workspaceId, 'connectionId' => $connectionId],
        ));

        return ChannelConnectionDto::fromArray($response->object());
    }
}
