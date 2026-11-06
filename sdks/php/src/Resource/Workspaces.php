<?php

declare(strict_types=1);

namespace Crossmart\Resource;

use Crossmart\Model\CurrentApiKeyDto;
use Crossmart\Model\UpdateWorkspaceDto;
use Crossmart\Model\WorkspaceDto;

/**
 * The workspace the client acts in, and the API key acting in it.
 *
 * ```php
 * $workspace = $client->workspaces->get();
 * if (in_array(WorkspacePermission::ProductsEdit, $workspace->permissions, true)) {
 *     // ...
 * }
 * ```
 */
final class Workspaces extends AbstractResource
{
    /**
     * The workspace, with the caller's role and permissions in it. Check `permissions` rather
     * than the role name, so the code keeps working when roles change.
     */
    public function get(): WorkspaceDto
    {
        return $this->api->workspaces->workspacesControllerGetWorkspaceV1($this->workspaceId());
    }

    /**
     * Renames the workspace or sets its time zone.
     *
     * @param UpdateWorkspaceDto|array<string, mixed> $changes
     */
    public function update(UpdateWorkspaceDto|array $changes): WorkspaceDto
    {
        $body = is_array($changes) ? UpdateWorkspaceDto::fromArray($changes) : $changes;

        return $this->api->workspaces->workspacesControllerUpdateV1($this->workspaceId(), $body);
    }

    /**
     * The API key making the request: its workspace, role and permissions.
     */
    public function currentApiKey(): CurrentApiKeyDto
    {
        return $this->api->apiKeys->currentApiKeyControllerGetV1();
    }
}
