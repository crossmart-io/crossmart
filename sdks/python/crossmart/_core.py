"""The HTTP session and workspace resolution that every resource shares."""

from __future__ import annotations

from typing import Any, Final

import httpx

from ._constants import USER_AGENT, Header
from ._generated.api.api_keys import current_api_key_controller_get_v_1
from ._generated.client import AuthenticatedClient
from ._options import ClientOptions, CredentialKind
from ._response import translate_transport_errors, unwrap
from ._retry import AsyncRetryTransport, RetryTransport
from .errors import CrossmartConfigurationError

_TRANSPORT_ARGUMENT: Final = "transport"
_MISSING_WORKSPACE_MESSAGE: Final = (
    "Pass workspace_id (or set CROSSMART_WORKSPACE_ID). Only an API key, which belongs to a "
    "single workspace, lets the client find its workspace by itself."
)


def _build_http_client(options: ClientOptions, transport: Any) -> AuthenticatedClient:
    credentials = options.credentials
    return AuthenticatedClient(
        base_url=options.base_url,
        token=credentials.secret,
        prefix=credentials.prefix,
        auth_header_name=credentials.header_name,
        headers={Header.USER_AGENT: USER_AGENT},
        timeout=httpx.Timeout(options.timeout),
        httpx_args={_TRANSPORT_ARGUMENT: transport},
    )


def _require_api_key(options: ClientOptions) -> None:
    if options.credentials.kind is not CredentialKind.API_KEY:
        raise CrossmartConfigurationError(_MISSING_WORKSPACE_MESSAGE)


class SyncCore:
    """Owns the synchronous HTTP client and the workspace the resources act on."""

    def __init__(self, options: ClientOptions, transport: httpx.BaseTransport | None) -> None:
        self.options = options
        retrying = RetryTransport(transport or httpx.HTTPTransport(), options.retry_policy)
        self.http = _build_http_client(options, retrying)
        self._workspace_id = options.workspace_id

    def workspace_id(self) -> str:
        """The configured workspace, or the API key's own workspace, fetched once."""
        if self._workspace_id is None:
            self._workspace_id = self._fetch_api_key_workspace()
        return self._workspace_id

    def _fetch_api_key_workspace(self) -> str:
        _require_api_key(self.options)
        with translate_transport_errors():
            response = current_api_key_controller_get_v_1.sync_detailed(client=self.http)
        return str(unwrap(response).workspace_id)

    def close(self) -> None:
        self.http.get_httpx_client().close()


class AsyncCore:
    """Owns the asynchronous HTTP client and the workspace the resources act on."""

    def __init__(self, options: ClientOptions, transport: httpx.AsyncBaseTransport | None) -> None:
        self.options = options
        retrying = AsyncRetryTransport(
            transport or httpx.AsyncHTTPTransport(), options.retry_policy
        )
        self.http = _build_http_client(options, retrying)
        self._workspace_id = options.workspace_id

    async def workspace_id(self) -> str:
        """The configured workspace, or the API key's own workspace, fetched once."""
        if self._workspace_id is None:
            self._workspace_id = await self._fetch_api_key_workspace()
        return self._workspace_id

    async def _fetch_api_key_workspace(self) -> str:
        _require_api_key(self.options)
        with translate_transport_errors():
            response = await current_api_key_controller_get_v_1.asyncio_detailed(client=self.http)
        return str(unwrap(response).workspace_id)

    async def close(self) -> None:
        await self.http.get_async_httpx_client().aclose()


class SyncResource:
    """Base of the synchronous resources."""

    def __init__(self, core: SyncCore) -> None:
        self._core = core

    @property
    def _http(self) -> AuthenticatedClient:
        return self._core.http

    def _workspace(self) -> str:
        return self._core.workspace_id()


class AsyncResource:
    """Base of the asynchronous resources."""

    def __init__(self, core: AsyncCore) -> None:
        self._core = core

    @property
    def _http(self) -> AuthenticatedClient:
        return self._core.http

    async def _workspace(self) -> str:
        return await self._core.workspace_id()
