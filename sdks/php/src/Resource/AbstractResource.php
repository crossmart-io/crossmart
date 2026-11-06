<?php

declare(strict_types=1);

namespace Crossmart\Resource;

use Crossmart\Api\ApiClients;
use Crossmart\WorkspaceResolver;

/**
 * Base of the resources: the generated operations and the workspace they act in.
 */
abstract class AbstractResource
{
    public function __construct(
        protected readonly ApiClients $api,
        private readonly WorkspaceResolver $workspace,
    ) {
    }

    protected function workspaceId(): string
    {
        return $this->workspace->workspaceId();
    }
}
