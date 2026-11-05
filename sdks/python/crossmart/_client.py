"""The entry points: :class:`Crossmart` and :class:`AsyncCrossmart`."""

from __future__ import annotations

from types import TracebackType
from typing import Self

import httpx

from ._constants import DEFAULT_MAX_RETRIES, DEFAULT_TIMEOUT_SECONDS
from ._core import AsyncCore, SyncCore
from ._options import ClientOptions, resolve_options
from ._retry import RetryPolicy
from .resources import (
    AI,
    AsyncAI,
    AsyncInventory,
    AsyncListings,
    AsyncOrders,
    AsyncProducts,
    AsyncReports,
    AsyncStores,
    AsyncSuggestions,
    AsyncWorkspaces,
    Inventory,
    Listings,
    Orders,
    Products,
    Reports,
    Stores,
    Suggestions,
    Workspaces,
)


def _options(
    *,
    api_key: str | None,
    access_token: str | None,
    base_url: str | None,
    workspace_id: str | None,
    timeout: float,
    max_retries: int,
) -> ClientOptions:
    return resolve_options(
        api_key=api_key,
        access_token=access_token,
        base_url=base_url,
        workspace_id=workspace_id,
        timeout=timeout,
        retry_policy=RetryPolicy(max_retries=max_retries),
    )


class Crossmart:
    """A synchronous client of the Crossmart API.

    Args:
        api_key: A workspace API key (Settings → API keys). Defaults to ``CROSSMART_API_KEY``.
        access_token: An OAuth access token issued to an agent, sent as a bearer token.
            Defaults to ``CROSSMART_ACCESS_TOKEN``. Pass ``api_key`` or ``access_token``, not both.
        base_url: The API's origin. Defaults to ``CROSSMART_BASE_URL``, then
            ``https://api.crossmart.io``. A trailing ``/api/v1`` is accepted.
        workspace_id: The workspace to act in. Defaults to ``CROSSMART_WORKSPACE_ID``. With an API
            key it can be left out: the key's own workspace is looked up on first use.
        timeout: Seconds to wait for each request.
        max_retries: Retries of idempotent requests (``GET``, ``PUT``, ``DELETE``) after a 429, a
            5xx or a failed connection. ``POST`` requests are never retried.
        transport: A custom httpx transport, for proxies or tests.

    Example::

        from crossmart import Crossmart

        with Crossmart(api_key="cm_...") as client:
            for product in client.products.iter():
                print(product.title)

    """

    def __init__(
        self,
        *,
        api_key: str | None = None,
        access_token: str | None = None,
        base_url: str | None = None,
        workspace_id: str | None = None,
        timeout: float = DEFAULT_TIMEOUT_SECONDS,
        max_retries: int = DEFAULT_MAX_RETRIES,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        options = _options(
            api_key=api_key,
            access_token=access_token,
            base_url=base_url,
            workspace_id=workspace_id,
            timeout=timeout,
            max_retries=max_retries,
        )
        self._core = SyncCore(options, transport)
        self.products = Products(self._core)
        self.inventory = Inventory(self._core)
        self.stores = Stores(self._core)
        self.listings = Listings(self._core)
        self.orders = Orders(self._core)
        self.reports = Reports(self._core)
        self.ai = AI(self._core)
        self.suggestions = Suggestions(self._core)
        self.workspaces = Workspaces(self._core)

    @property
    def workspace_id(self) -> str:
        """The workspace the client acts in, looked up from the API key when not configured."""
        return self._core.workspace_id()

    def close(self) -> None:
        """Closes the connection pool. Called on leaving a ``with`` block."""
        self._core.close()

    def __enter__(self) -> Self:
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_value: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        self.close()


class AsyncCrossmart:
    """An asynchronous client of the Crossmart API. Takes the same arguments as :class:`Crossmart`.

    Example::

        import asyncio
        from crossmart import AsyncCrossmart

        async def main() -> None:
            async with AsyncCrossmart() as client:
                async for order in client.orders.iter():
                    print(order.name)

        asyncio.run(main())
    """

    def __init__(
        self,
        *,
        api_key: str | None = None,
        access_token: str | None = None,
        base_url: str | None = None,
        workspace_id: str | None = None,
        timeout: float = DEFAULT_TIMEOUT_SECONDS,
        max_retries: int = DEFAULT_MAX_RETRIES,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        options = _options(
            api_key=api_key,
            access_token=access_token,
            base_url=base_url,
            workspace_id=workspace_id,
            timeout=timeout,
            max_retries=max_retries,
        )
        self._core = AsyncCore(options, transport)
        self.products = AsyncProducts(self._core)
        self.inventory = AsyncInventory(self._core)
        self.stores = AsyncStores(self._core)
        self.listings = AsyncListings(self._core)
        self.orders = AsyncOrders(self._core)
        self.reports = AsyncReports(self._core)
        self.ai = AsyncAI(self._core)
        self.suggestions = AsyncSuggestions(self._core)
        self.workspaces = AsyncWorkspaces(self._core)

    async def workspace_id(self) -> str:
        """The workspace the client acts in, looked up from the API key when not configured."""
        return await self._core.workspace_id()

    async def close(self) -> None:
        """Closes the connection pool. Called on leaving an ``async with`` block."""
        await self._core.close()

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_value: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        await self.close()
