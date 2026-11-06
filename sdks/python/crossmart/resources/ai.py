"""AI writing: content generation into suggestions, and drafts for an editor."""

from __future__ import annotations

import datetime
from collections.abc import Iterable, Mapping
from typing import Any

from .._core import AsyncResource, SyncResource
from .._generated.api.ai import (
    ai_controller_draft_content_v_1,
    ai_controller_generate_content_v_1,
    ai_controller_status_v_1,
    ai_controller_usage_report_v_1,
)
from .._generated.models import (
    AiStatusDto,
    AiUsageReportDto,
    ContentDraftDto,
    ContentGenerationReceiptDto,
    CreateContentDraftDto,
    GenerateContentDto,
)
from .._response import translate_transport_errors, unwrap, unwrap_as
from .._utils import Id, as_model, as_uuid, or_unset

ContentDraftRequest = CreateContentDraftDto | Mapping[str, Any]
"""A draft request as a model, or a mapping in the API's JSON shape."""


def _generation(store_id: Id, product_ids: Iterable[Id]) -> GenerateContentDto:
    return GenerateContentDto(
        connection_id=as_uuid(store_id),
        product_ids=[as_uuid(product_id) for product_id in product_ids],
    )


class AI(SyncResource):
    """Ask Crossmart's AI agents to write. Calls are metered against the plan's AI credits.

    Generated content never changes a product directly: it arrives as pending suggestions that a
    person (or an approver key) reviews in :attr:`crossmart.Crossmart.suggestions`. Both writing
    calls raise :class:`~crossmart.errors.ServerError` (503) while the server has no AI provider.

    Example::

        receipt = client.ai.generate_content(store_id, [product_id])
        print(receipt.queued, "products queued")
    """

    def status(self) -> AiStatusDto:
        """Whether AI features are available on this server, and which provider and model."""
        with translate_transport_errors():
            response = ai_controller_status_v_1.sync_detailed(self._workspace(), client=self._http)
        return unwrap(response)

    def usage(
        self, *, from_: datetime.datetime | None = None, to: datetime.datetime | None = None
    ) -> AiUsageReportDto:
        """AI calls and tokens the workspace used, per feature and model.

        The period defaults to the current UTC month.
        """
        with translate_transport_errors():
            response = ai_controller_usage_report_v_1.sync_detailed(
                self._workspace(), client=self._http, from_=or_unset(from_), to=or_unset(to)
            )
        return unwrap(response)

    def generate_content(
        self, store_id: Id, product_ids: Iterable[Id]
    ) -> ContentGenerationReceiptDto:
        """Queues the Content Generator for each product.

        It writes a title and description fitted to the store's channel. The results arrive as
        pending suggestions.
        """
        with translate_transport_errors():
            response = ai_controller_generate_content_v_1.sync_detailed(
                self._workspace(), client=self._http, body=_generation(store_id, product_ids)
            )
        return unwrap_as(response, ContentGenerationReceiptDto)

    def draft_content(self, request: ContentDraftRequest) -> ContentDraftDto:
        """Rewrites a product's title or description right away, for the catalog or one store.

        Nothing is stored: the answer is a draft to show in an editor.

        Example::

            from crossmart.models import ContentField, CreateContentDraftDto

            draft = client.ai.draft_content(CreateContentDraftDto(
                product_id=product_id, fields=[ContentField.TITLE], instruction="shorter",
            ))
        """
        body = as_model(CreateContentDraftDto, request)
        with translate_transport_errors():
            response = ai_controller_draft_content_v_1.sync_detailed(
                self._workspace(), client=self._http, body=body
            )
        return unwrap_as(response, ContentDraftDto)


class AsyncAI(AsyncResource):
    """The asynchronous counterpart of :class:`AI`."""

    async def status(self) -> AiStatusDto:
        """Whether AI features are available on this server."""
        with translate_transport_errors():
            response = await ai_controller_status_v_1.asyncio_detailed(
                await self._workspace(), client=self._http
            )
        return unwrap(response)

    async def usage(
        self, *, from_: datetime.datetime | None = None, to: datetime.datetime | None = None
    ) -> AiUsageReportDto:
        """AI calls and tokens the workspace used, per feature and model."""
        with translate_transport_errors():
            response = await ai_controller_usage_report_v_1.asyncio_detailed(
                await self._workspace(), client=self._http, from_=or_unset(from_), to=or_unset(to)
            )
        return unwrap(response)

    async def generate_content(
        self, store_id: Id, product_ids: Iterable[Id]
    ) -> ContentGenerationReceiptDto:
        """Queues the Content Generator. See :meth:`AI.generate_content`."""
        with translate_transport_errors():
            response = await ai_controller_generate_content_v_1.asyncio_detailed(
                await self._workspace(), client=self._http, body=_generation(store_id, product_ids)
            )
        return unwrap_as(response, ContentGenerationReceiptDto)

    async def draft_content(self, request: ContentDraftRequest) -> ContentDraftDto:
        """Rewrites a product's title or description right away. See :meth:`AI.draft_content`."""
        body = as_model(CreateContentDraftDto, request)
        with translate_transport_errors():
            response = await ai_controller_draft_content_v_1.asyncio_detailed(
                await self._workspace(), client=self._http, body=body
            )
        return unwrap_as(response, ContentDraftDto)
