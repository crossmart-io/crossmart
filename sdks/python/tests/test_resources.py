"""Each facade method sends the right request and returns the parsed response."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

import pytest
import respx

from crossmart import AsyncCrossmart, Crossmart
from crossmart.models import (
    ContentField,
    CreateProductDto,
    CreateVariantDto,
    InventoryMovementReason,
    ListingOverrideDto,
    ListingVisibility,
    OrderStatus,
    SalesRange,
    StockAdjustmentMode,
    SuggestionStatus,
)

from .conftest import PRODUCT_ID, STORE_ID, WORKSPACE_PATH, fixture, page

ITEM_ID = "66666666-6666-4666-8666-666666666666"
ORDER_ID = "77777777-7777-4777-8777-777777777777"
SUGGESTION_ID = "88888888-8888-4888-8888-888888888888"
PRODUCT_CHANNEL_PATH = f"{WORKSPACE_PATH}/products/{PRODUCT_ID}/channels/{STORE_ID}"
STORE_PATH = f"{WORKSPACE_PATH}/channel-connections/{STORE_ID}"


def _body(route: respx.Route) -> Any:
    return json.loads(route.calls.last.request.content)


class TestProducts:
    def test_create_from_a_model(self, api: respx.MockRouter, client: Crossmart) -> None:
        route = api.post(f"{WORKSPACE_PATH}/products").respond(201, json=fixture("ProductDto"))

        product = client.products.create(
            CreateProductDto(title="Mug", variants=[CreateVariantDto(price="9.00", sku="MUG-1")])
        )

        body = _body(route)
        assert body["title"] == "Mug"
        assert (body["variants"][0]["price"], body["variants"][0]["sku"]) == ("9.00", "MUG-1")
        assert isinstance(product.id, UUID)

    def test_create_from_a_mapping(self, api: respx.MockRouter, client: Crossmart) -> None:
        route = api.post(f"{WORKSPACE_PATH}/products").respond(201, json=fixture("ProductDto"))

        client.products.create({"title": "Mug", "variants": [{"price": "9.00"}]})

        assert _body(route) == {"title": "Mug", "variants": [{"price": "9.00"}]}

    def test_update_replaces_the_product(self, api: respx.MockRouter, client: Crossmart) -> None:
        route = api.put(f"{WORKSPACE_PATH}/products/{PRODUCT_ID}").respond(
            json=fixture("ProductDto")
        )

        client.products.update(PRODUCT_ID, {"title": "Mug", "handle": "mug", "variants": []})

        assert _body(route) == {"title": "Mug", "handle": "mug", "variants": []}

    def test_delete(self, api: respx.MockRouter, client: Crossmart) -> None:
        route = api.delete(f"{WORKSPACE_PATH}/products/{PRODUCT_ID}").respond(204)

        client.products.delete(UUID(PRODUCT_ID))

        assert route.called


class TestInventory:
    def test_adjust(self, api: respx.MockRouter, client: Crossmart) -> None:
        route = api.post(f"{WORKSPACE_PATH}/inventory-items/{ITEM_ID}/adjustments").respond(
            json=fixture("InventoryItemDto")
        )

        client.inventory.adjust(
            ITEM_ID,
            12,
            InventoryMovementReason.CORRECTION,
            mode=StockAdjustmentMode.SET,
            note="Count",
        )

        assert _body(route) == {
            "mode": "set",
            "quantity": 12,
            "reason": "CORRECTION",
            "note": "Count",
        }

    def test_list(self, api: respx.MockRouter, client: Crossmart) -> None:
        api.get(f"{WORKSPACE_PATH}/inventory-items").respond(
            json=page([fixture("InventoryItemDto")])
        )

        assert client.inventory.list().total == 1


class TestStores:
    def test_list_parses_null_nested_objects(
        self, api: respx.MockRouter, client: Crossmart
    ) -> None:
        api.get(f"{WORKSPACE_PATH}/channel-connections").respond(
            json=[fixture("ChannelConnectionDto")]
        )

        [store] = client.stores.list()

        assert store.pricing is None
        assert store.shopify is None

    def test_set_pricing_to_none_sends_catalog_prices(
        self, api: respx.MockRouter, client: Crossmart
    ) -> None:
        route = api.put(f"{STORE_PATH}/pricing").respond(json=fixture("ChannelConnectionDto"))

        client.stores.set_pricing(STORE_ID, None)

        assert _body(route) == {"rule": None}

    def test_set_pricing_with_a_rule(self, api: respx.MockRouter, client: Crossmart) -> None:
        route = api.put(f"{STORE_PATH}/pricing").respond(json=fixture("ChannelConnectionDto"))
        rule = {
            "adjustmentPercent": "10",
            "fixedAmount": "0",
            "rounding": "ending_99",
            "floor": None,
            "compareAt": "keep",
        }

        client.stores.set_pricing(STORE_ID, rule)

        assert _body(route) == {"rule": rule}

    def test_sync(self, api: respx.MockRouter, client: Crossmart) -> None:
        api.post(f"{STORE_PATH}/sync").respond(202, json={"queued": 3, "delisting": 1})

        result = client.stores.sync(STORE_ID)

        assert (result.queued, result.delisting) == (3, 1)


class TestListings:
    def test_publish(self, api: respx.MockRouter, client: Crossmart) -> None:
        route = api.post(PRODUCT_CHANNEL_PATH).respond(json=fixture("ProductChannelDto"))

        listing = client.listings.publish(PRODUCT_ID, STORE_ID)

        assert route.called
        assert listing.override is None

    def test_remove(self, api: respx.MockRouter, client: Crossmart) -> None:
        route = api.delete(PRODUCT_CHANNEL_PATH).respond(json=fixture("ProductChannelDto"))

        client.listings.remove(PRODUCT_ID, STORE_ID)

        assert route.called

    def test_set_override(self, api: respx.MockRouter, client: Crossmart) -> None:
        route = api.put(f"{PRODUCT_CHANNEL_PATH}/override").respond(
            json=fixture("ProductChannelDto")
        )

        client.listings.set_override(
            PRODUCT_ID,
            STORE_ID,
            ListingOverrideDto(title="Mug | Free shipping", visibility=ListingVisibility.VISIBLE),
        )

        assert _body(route) == {"title": "Mug | Free shipping", "visibility": "VISIBLE"}

    def test_clear_override(self, api: respx.MockRouter, client: Crossmart) -> None:
        route = api.delete(f"{PRODUCT_CHANNEL_PATH}/override").respond(
            json=fixture("ProductChannelDto")
        )

        client.listings.clear_override(PRODUCT_ID, STORE_ID)

        assert route.called

    def test_publish_many(self, api: respx.MockRouter, client: Crossmart) -> None:
        route = api.post(f"{STORE_PATH}/products/add").respond(json={"count": 1})

        result = client.listings.publish_many(STORE_ID, [PRODUCT_ID])

        assert _body(route) == {"productIds": [PRODUCT_ID]}
        assert result.count == 1


class TestOrdersAndReports:
    def test_list_orders(self, api: respx.MockRouter, client: Crossmart) -> None:
        route = api.get(f"{WORKSPACE_PATH}/orders").respond(json=page([fixture("OrderSummaryDto")]))

        orders = client.orders.list(status=OrderStatus.OPEN, connection_id=UUID(STORE_ID))

        assert len(orders.items) == 1
        assert route.calls.last.request.url.params["connectionId"] == STORE_ID

    def test_get_order(self, api: respx.MockRouter, client: Crossmart) -> None:
        api.get(f"{WORKSPACE_PATH}/orders/{ORDER_ID}").respond(json=fixture("OrderDetailDto"))

        assert client.orders.get(ORDER_ID).name == "sample"

    def test_sales_report(self, api: respx.MockRouter, client: Crossmart) -> None:
        route = api.get(f"{WORKSPACE_PATH}/analytics/sales").respond(json=fixture("SalesReportDto"))

        client.reports.sales(range_=SalesRange.LAST_7_DAYS, time_zone="Europe/London")

        params = route.calls.last.request.url.params
        assert (params["range"], params["timeZone"]) == ("last_7_days", "Europe/London")


class TestAIAndSuggestions:
    def test_generate_content(self, api: respx.MockRouter, client: Crossmart) -> None:
        route = api.post(f"{WORKSPACE_PATH}/ai/content-generations").respond(
            202, json={"queued": 1}
        )

        receipt = client.ai.generate_content(STORE_ID, [PRODUCT_ID])

        assert _body(route) == {"connectionId": STORE_ID, "productIds": [PRODUCT_ID]}
        assert receipt.queued == 1

    def test_draft_content(self, api: respx.MockRouter, client: Crossmart) -> None:
        route = api.post(f"{WORKSPACE_PATH}/ai/content-drafts").respond(
            json={"title": "Short mug", "descriptionHtml": None}
        )

        draft = client.ai.draft_content(
            {"productId": PRODUCT_ID, "fields": [ContentField.TITLE], "instruction": "shorter"}
        )

        assert _body(route)["fields"] == ["title"]
        assert draft.title == "Short mug"

    def test_usage_sends_the_period(self, api: respx.MockRouter, client: Crossmart) -> None:
        route = api.get(f"{WORKSPACE_PATH}/ai/usage").respond(json=fixture("AiUsageReportDto"))
        start = datetime(2026, 1, 1, tzinfo=UTC)

        client.ai.usage(from_=start)

        assert route.calls.last.request.url.params["from"] == start.isoformat()

    def test_approve_suggestion(self, api: respx.MockRouter, client: Crossmart) -> None:
        route = api.post(f"{WORKSPACE_PATH}/suggestions/{SUGGESTION_ID}/approve").respond(
            json={**fixture("SuggestionDto"), "status": "APPLIED"}
        )

        suggestion = client.suggestions.approve(SUGGESTION_ID)

        assert route.called
        assert suggestion.status is SuggestionStatus.APPLIED

    def test_approve_many(self, api: respx.MockRouter, client: Crossmart) -> None:
        route = api.post(f"{WORKSPACE_PATH}/suggestions/bulk-approve").respond(
            json={"items": [fixture("SuggestionDto")], "skippedIds": []}
        )

        result = client.suggestions.approve_many([SUGGESTION_ID])

        assert _body(route) == {"suggestionIds": [SUGGESTION_ID]}
        assert len(result.items) == 1


@pytest.mark.anyio
async def test_async_client_publishes_and_reads_orders(
    api: respx.MockRouter, async_client: AsyncCrossmart
) -> None:
    publish = api.post(PRODUCT_CHANNEL_PATH).respond(json=fixture("ProductChannelDto"))
    api.get(f"{WORKSPACE_PATH}/orders").respond(json=page([fixture("OrderSummaryDto")]))

    async with async_client:
        await async_client.listings.publish(PRODUCT_ID, STORE_ID)
        orders = await async_client.orders.list()

    assert publish.called
    assert orders.total == 1
