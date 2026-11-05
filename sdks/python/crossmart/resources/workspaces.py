"""The workspace the client acts in, and the API key acting in it."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from .._core import AsyncResource, SyncResource
from .._generated.api.api_keys import current_api_key_controller_get_v_1
from .._generated.api.workspaces import (
    workspaces_controller_get_workspace_v_1,
    workspaces_controller_update_v_1,
)
from .._generated.models import CurrentApiKeyDto, UpdateWorkspaceDto, WorkspaceDto
from .._response import translate_transport_errors, unwrap
from .._utils import as_model

WorkspaceUpdate = UpdateWorkspaceDto | Mapping[str, Any]
"""A workspace change as a model, or a mapping in the API's JSON shape."""


class Workspaces(SyncResource):
    """The workspace the client acts in.

    Example::

        from crossmart.models import WorkspacePermission

        workspace = client.workspaces.get()
        if WorkspacePermission.PRODUCTSEDIT in workspace.permissions:
            ...
    """

    def get(self) -> WorkspaceDto:
        """The workspace, with the caller's role and permissions in it.

        Check ``permissions`` rather than the role name, so the code keeps working when roles
        change.
        """
        with translate_transport_errors():
            response = workspaces_controller_get_workspace_v_1.sync_detailed(
                self._workspace(), client=self._http
            )
        return unwrap(response)

    def update(self, changes: WorkspaceUpdate) -> WorkspaceDto:
        """Renames the workspace or sets its time zone."""
        body = as_model(UpdateWorkspaceDto, changes)
        with translate_transport_errors():
            response = workspaces_controller_update_v_1.sync_detailed(
                self._workspace(), client=self._http, body=body
            )
        return unwrap(response)

    def current_api_key(self) -> CurrentApiKeyDto:
        """The API key making the request: its workspace, role and permissions."""
        with translate_transport_errors():
            response = current_api_key_controller_get_v_1.sync_detailed(client=self._http)
        return unwrap(response)


class AsyncWorkspaces(AsyncResource):
    """The asynchronous counterpart of :class:`Workspaces`."""

    async def get(self) -> WorkspaceDto:
        """The workspace, with the caller's role and permissions in it."""
        with translate_transport_errors():
            response = await workspaces_controller_get_workspace_v_1.asyncio_detailed(
                await self._workspace(), client=self._http
            )
        return unwrap(response)

    async def update(self, changes: WorkspaceUpdate) -> WorkspaceDto:
        """Renames the workspace or sets its time zone."""
        body = as_model(UpdateWorkspaceDto, changes)
        with translate_transport_errors():
            response = await workspaces_controller_update_v_1.asyncio_detailed(
                await self._workspace(), client=self._http, body=body
            )
        return unwrap(response)

    async def current_api_key(self) -> CurrentApiKeyDto:
        """The API key making the request: its workspace, role and permissions."""
        with translate_transport_errors():
            response = await current_api_key_controller_get_v_1.asyncio_detailed(client=self._http)
        return unwrap(response)
