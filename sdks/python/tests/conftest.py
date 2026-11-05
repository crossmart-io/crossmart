from __future__ import annotations

import json
from collections.abc import Iterator
from pathlib import Path
from typing import Any

import pytest
import respx

import crossmart._retry
from crossmart import AsyncCrossmart, Crossmart
from crossmart._constants import EnvironmentVariable

BASE_URL = "https://api.test.crossmart.io"
API_KEY = "cm_test_key"
WORKSPACE_ID = "11111111-1111-4111-8111-111111111111"
PRODUCT_ID = "22222222-2222-4222-8222-222222222222"
STORE_ID = "33333333-3333-4333-8333-333333333333"
WORKSPACE_PATH = f"/api/v1/workspaces/{WORKSPACE_ID}"
FIXTURES_DIR = Path(__file__).parent / "fixtures"


def fixture(name: str) -> dict[str, Any]:
    """A sample response body built from the API's schemas by scripts/build_test_fixtures.py."""
    loaded: dict[str, Any] = json.loads((FIXTURES_DIR / f"{name}.json").read_text())
    return loaded


def page(items: list[dict[str, Any]], next_cursor: str | None = None) -> dict[str, Any]:
    return {"items": items, "nextCursor": next_cursor, "total": len(items)}


@pytest.fixture(autouse=True)
def _isolated_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    for variable in EnvironmentVariable:
        monkeypatch.delenv(variable, raising=False)


@pytest.fixture
def sleeps(monkeypatch: pytest.MonkeyPatch) -> list[float]:
    """Records the waits between retries instead of sleeping."""
    recorded: list[float] = []

    async def record_async(seconds: float) -> None:
        recorded.append(seconds)

    monkeypatch.setattr(crossmart._retry, "blocking_sleep", recorded.append)
    monkeypatch.setattr(crossmart._retry, "async_sleep", record_async)
    return recorded


@pytest.fixture
def api() -> Iterator[respx.MockRouter]:
    with respx.mock(base_url=BASE_URL, assert_all_called=False) as router:
        yield router


@pytest.fixture
def client(sleeps: list[float]) -> Iterator[Crossmart]:
    with Crossmart(api_key=API_KEY, base_url=BASE_URL, workspace_id=WORKSPACE_ID) as instance:
        yield instance


@pytest.fixture
def async_client(sleeps: list[float]) -> AsyncCrossmart:
    return AsyncCrossmart(api_key=API_KEY, base_url=BASE_URL, workspace_id=WORKSPACE_ID)


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"
