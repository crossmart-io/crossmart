<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\ClaimSandboxDto;
use Crossmart\Model\ClaimedSandboxDto;
use Crossmart\Model\CreateSandboxAccountDto;
use Crossmart\Model\SandboxAccountDto;
use Crossmart\Model\SandboxClaimPreviewDto;
use Crossmart\Model\SandboxClaimTokenDto;

/**
 * The operations tagged "Sandbox accounts".
 */
final class SandboxAccountsApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * Open a sandbox account for someone without one
     *
     * For AI agents: no credentials needed. Opens an account for `email` with a workspace named `storeName`, returns an Editor API key for it, and emails the person a link to claim it. Until claimed it is a sandbox: products (at most 100), stock and drafts work, but connecting stores, publishing, inviting people and Crossmart AI answer 403 `sandbox_claim_required`. Unclaimed accounts are deleted after 14 days. When the address already has an account, nothing is created and no email is sent, and the answer is the same whoever owns it: `sign_in_required`. At most 5 calls an hour and 50 a day per caller address; 429 past those.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function sandboxAccountsControllerCreateV1(
        CreateSandboxAccountDto $body,
    ): SandboxAccountDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/sandbox-accounts',
            body: $body->toArray(),
        ));

        return SandboxAccountDto::fromArray($response->object());
    }

    /**
     * What a claim link is for
     *
     * Open to anyone with the link, so the claim page can show it before signing in.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function sandboxClaimsControllerPreviewV1(
        SandboxClaimTokenDto $body,
    ): SandboxClaimPreviewDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/sandbox-claims/preview',
            body: $body->toArray(),
        ));

        return SandboxClaimPreviewDto::fromArray($response->object());
    }

    /**
     * Claim a sandbox account with a new password
     *
     * Sets the password the person signs in with and makes the workspace a normal one. The link works once. Sign in with the returned email and the password afterwards. 409 when the person already has a password: they sign in and claim from the app instead.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function sandboxClaimsControllerClaimV1(
        ClaimSandboxDto $body,
    ): ClaimedSandboxDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/sandbox-claims',
            body: $body->toArray(),
        ));

        return ClaimedSandboxDto::fromArray($response->object());
    }

    /**
     * Claim this sandbox account as its owner
     *
     * For the person the sandbox was opened for, signed in (a password reset link is the only other way in, and it proves the address too). Makes the workspace a normal one. API keys and agents get 403; anyone else, or a workspace with nothing to claim, 404.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function workspaceSandboxControllerClaimV1(
        string $workspaceId,
    ): ClaimedSandboxDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/sandbox/claim',
            pathParameters: ['workspaceId' => $workspaceId],
        ));

        return ClaimedSandboxDto::fromArray($response->object());
    }
}
