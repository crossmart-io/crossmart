<?php

declare(strict_types=1);

namespace Crossmart;

use Crossmart\Api\ApiKeysApi;
use Crossmart\Config\CredentialKind;
use Crossmart\Exception\ConfigurationException;

/**
 * The workspace the client acts in: the configured one, or the API key's own, fetched once.
 */
final class WorkspaceResolver
{
    private const MISSING_WORKSPACE_MESSAGE = 'Pass workspaceId (or set CROSSMART_WORKSPACE_ID). Only an API key, which belongs to a single workspace, lets the client find its workspace by itself.';

    public function __construct(
        private readonly ApiKeysApi $apiKeys,
        private readonly CredentialKind $credentialKind,
        private ?string $workspaceId,
    ) {
    }

    public function workspaceId(): string
    {
        return $this->workspaceId ??= $this->fetchApiKeyWorkspace();
    }

    private function fetchApiKeyWorkspace(): string
    {
        if ($this->credentialKind !== CredentialKind::ApiKey) {
            throw new ConfigurationException(self::MISSING_WORKSPACE_MESSAGE);
        }

        return $this->apiKeys->currentApiKeyControllerGetV1()->workspaceId;
    }
}
