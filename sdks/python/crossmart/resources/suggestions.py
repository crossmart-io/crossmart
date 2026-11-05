"""The AI suggestions inbox."""

from __future__ import annotations

from collections.abc import AsyncIterator, Iterable, Iterator
from typing import TypedDict, Unpack
from uuid import UUID

from .._core import AsyncResource, SyncResource
from .._generated.api.suggestions import (
    suggestions_controller_approve_v_1,
    suggestions_controller_bulk_approve_v_1,
    suggestions_controller_get_v_1,
    suggestions_controller_list_v_1,
    suggestions_controller_reject_v_1,
)
from .._generated.models import (
    BulkApproveSuggestionsDto,
    BulkReviewResultDto,
    SuggestionDto,
    SuggestionKind,
    SuggestionStatus,
)
from .._response import translate_transport_errors, unwrap
from .._utils import Id, as_uuid, optional_uuid, or_unset
from ..pagination import Page, aiterate_pages, iterate_pages


class SuggestionFilters(TypedDict, total=False):
    """Filters of the suggestion list. Every key is optional."""

    status: SuggestionStatus
    """``SuggestionStatus.PENDING`` for the inbox."""
    product_id: UUID
    connection_id: UUID
    """Suggestions for one store."""
    kind: SuggestionKind


def _bulk_approval(suggestion_ids: Iterable[Id]) -> BulkApproveSuggestionsDto:
    return BulkApproveSuggestionsDto(
        suggestion_ids=[as_uuid(suggestion_id) for suggestion_id in suggestion_ids]
    )


class Suggestions(SyncResource):
    """Review the changes AI agents propose. Nothing changes until a suggestion is approved.

    Approving applies the change the way an edit would (a store override, synced to the store) and
    returns the suggestion ``APPLIED``, or ``STALE`` when its field changed since it was made.
    Reviewing a suggestion that is no longer pending raises
    :class:`~crossmart.errors.ConflictError`.

    Example::

        from crossmart.models import SuggestionStatus

        for suggestion in client.suggestions.iter(status=SuggestionStatus.PENDING):
            print(suggestion.current_value, "->", suggestion.proposed_value)
            client.suggestions.approve(suggestion.id)
    """

    def list(
        self,
        *,
        cursor: Id | None = None,
        limit: int | None = None,
        **filters: Unpack[SuggestionFilters],
    ) -> Page[SuggestionDto]:
        """One page of suggestions, newest first."""
        with translate_transport_errors():
            response = suggestions_controller_list_v_1.sync_detailed(
                self._workspace(),
                client=self._http,
                cursor=optional_uuid(cursor),
                limit=or_unset(limit),
                **filters,
            )
        page_dto = unwrap(response)
        return Page.from_dto(page_dto)

    def iter(
        self, *, limit: int | None = None, **filters: Unpack[SuggestionFilters]
    ) -> Iterator[SuggestionDto]:
        """Every matching suggestion, fetched page by page."""
        return iterate_pages(lambda cursor: self.list(cursor=cursor, limit=limit, **filters))

    def get(self, suggestion_id: Id) -> SuggestionDto:
        with translate_transport_errors():
            response = suggestions_controller_get_v_1.sync_detailed(
                as_uuid(self._workspace()), as_uuid(suggestion_id), client=self._http
            )
        return unwrap(response)

    def approve(self, suggestion_id: Id) -> SuggestionDto:
        """Applies a pending suggestion."""
        with translate_transport_errors():
            response = suggestions_controller_approve_v_1.sync_detailed(
                as_uuid(self._workspace()), as_uuid(suggestion_id), client=self._http
            )
        return unwrap(response)

    def reject(self, suggestion_id: Id) -> SuggestionDto:
        """Rejects a pending suggestion. Nothing is changed."""
        with translate_transport_errors():
            response = suggestions_controller_reject_v_1.sync_detailed(
                as_uuid(self._workspace()), as_uuid(suggestion_id), client=self._http
            )
        return unwrap(response)

    def approve_many(self, suggestion_ids: Iterable[Id]) -> BulkReviewResultDto:
        """Applies several pending suggestions. Those no longer pending are skipped."""
        with translate_transport_errors():
            response = suggestions_controller_bulk_approve_v_1.sync_detailed(
                self._workspace(), client=self._http, body=_bulk_approval(suggestion_ids)
            )
        return unwrap(response)


class AsyncSuggestions(AsyncResource):
    """The asynchronous counterpart of :class:`Suggestions`."""

    async def list(
        self,
        *,
        cursor: Id | None = None,
        limit: int | None = None,
        **filters: Unpack[SuggestionFilters],
    ) -> Page[SuggestionDto]:
        """One page of suggestions, newest first."""
        with translate_transport_errors():
            response = await suggestions_controller_list_v_1.asyncio_detailed(
                await self._workspace(),
                client=self._http,
                cursor=optional_uuid(cursor),
                limit=or_unset(limit),
                **filters,
            )
        page_dto = unwrap(response)
        return Page.from_dto(page_dto)

    def iter(
        self, *, limit: int | None = None, **filters: Unpack[SuggestionFilters]
    ) -> AsyncIterator[SuggestionDto]:
        """Every matching suggestion. Use with ``async for``."""
        return aiterate_pages(lambda cursor: self.list(cursor=cursor, limit=limit, **filters))

    async def get(self, suggestion_id: Id) -> SuggestionDto:
        with translate_transport_errors():
            response = await suggestions_controller_get_v_1.asyncio_detailed(
                as_uuid(await self._workspace()), as_uuid(suggestion_id), client=self._http
            )
        return unwrap(response)

    async def approve(self, suggestion_id: Id) -> SuggestionDto:
        """Applies a pending suggestion."""
        with translate_transport_errors():
            response = await suggestions_controller_approve_v_1.asyncio_detailed(
                as_uuid(await self._workspace()), as_uuid(suggestion_id), client=self._http
            )
        return unwrap(response)

    async def reject(self, suggestion_id: Id) -> SuggestionDto:
        """Rejects a pending suggestion. Nothing is changed."""
        with translate_transport_errors():
            response = await suggestions_controller_reject_v_1.asyncio_detailed(
                as_uuid(await self._workspace()), as_uuid(suggestion_id), client=self._http
            )
        return unwrap(response)

    async def approve_many(self, suggestion_ids: Iterable[Id]) -> BulkReviewResultDto:
        """Applies several pending suggestions. Those no longer pending are skipped."""
        with translate_transport_errors():
            response = await suggestions_controller_bulk_approve_v_1.asyncio_detailed(
                await self._workspace(), client=self._http, body=_bulk_approval(suggestion_ids)
            )
        return unwrap(response)
