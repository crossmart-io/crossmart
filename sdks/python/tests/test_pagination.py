from __future__ import annotations

import pytest
import respx

from crossmart import AsyncCrossmart, Crossmart
from crossmart.models import ProductStatus

from .conftest import WORKSPACE_PATH, fixture, page

PRODUCTS_PATH = f"{WORKSPACE_PATH}/products"
SECOND_CURSOR = "44444444-4444-4444-8444-444444444444"
THIRD_CURSOR = "55555555-5555-4555-8555-555555555555"


def _product(title: str) -> dict[str, object]:
    return {**fixture("ProductSummaryDto"), "title": title}


def _stub_three_pages(api: respx.MockRouter) -> respx.Route:
    route = api.get(PRODUCTS_PATH)
    route.side_effect = lambda request: {
        None: respx.MockResponse(json=page([_product("A"), _product("B")], SECOND_CURSOR)),
        SECOND_CURSOR: respx.MockResponse(json=page([_product("C")], THIRD_CURSOR)),
        THIRD_CURSOR: respx.MockResponse(json=page([_product("D")])),
    }[request.url.params.get("cursor")]
    return route


def test_list_returns_one_page(api: respx.MockRouter, client: Crossmart) -> None:
    route = _stub_three_pages(api)

    first = client.products.list(limit=2, status=ProductStatus.ACTIVE, tags=["summer"])

    assert [product.title for product in first.items] == ["A", "B"]
    assert first.next_cursor == SECOND_CURSOR
    assert first.has_more
    params = route.calls.last.request.url.params
    assert params["limit"] == "2"
    assert params["status"] == "ACTIVE"
    assert params.get_list("tags") == ["summer"]


def test_list_passes_the_cursor(api: respx.MockRouter, client: Crossmart) -> None:
    _stub_three_pages(api)

    last = client.products.list(cursor=THIRD_CURSOR)

    assert [product.title for product in last.items] == ["D"]
    assert not last.has_more


def test_iter_follows_the_cursors(api: respx.MockRouter, client: Crossmart) -> None:
    route = _stub_three_pages(api)

    titles = [product.title for product in client.products.iter(limit=2)]

    assert titles == ["A", "B", "C", "D"]
    assert route.call_count == 3
    assert all(call.request.url.params["limit"] == "2" for call in route.calls)


def test_iter_is_lazy(api: respx.MockRouter, client: Crossmart) -> None:
    route = _stub_three_pages(api)

    iterator = client.products.iter()
    next(iterator)

    assert route.call_count == 1


@pytest.mark.anyio
async def test_async_iter_follows_the_cursors(
    api: respx.MockRouter, async_client: AsyncCrossmart
) -> None:
    _stub_three_pages(api)

    async with async_client:
        titles = [product.title async for product in async_client.products.iter()]

    assert titles == ["A", "B", "C", "D"]
