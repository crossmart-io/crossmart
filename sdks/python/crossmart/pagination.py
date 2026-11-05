"""Cursor pagination.

List endpoints return one page at a time with a ``next_cursor``. Each resource offers ``list()``,
which returns a single :class:`Page`, and ``iter()``, which follows the cursors and yields every
item::

    page = client.products.list(limit=50)
    print(page.total, len(page.items), page.has_more)

    for product in client.products.iter(status=ProductStatus.ACTIVE):
        print(product.title)
"""

from __future__ import annotations

from collections.abc import AsyncIterator, Awaitable, Callable, Iterator, Sequence
from dataclasses import dataclass
from typing import Generic, Protocol, TypeVar

T = TypeVar("T")
T_co = TypeVar("T_co", covariant=True)


class PageDto(Protocol[T_co]):
    """The shape every generated ``*PageDto`` shares."""

    @property
    def items(self) -> Sequence[T_co]: ...

    @property
    def next_cursor(self) -> str | None: ...

    @property
    def total(self) -> float: ...


@dataclass(frozen=True)
class Page(Generic[T]):
    """One page of a list.

    Attributes:
        items: The items on this page.
        next_cursor: Pass it as ``cursor`` to get the next page. ``None`` on the last page.
        total: How many items match the filters across all pages.

    """

    items: list[T]
    next_cursor: str | None
    total: int

    @property
    def has_more(self) -> bool:
        return self.next_cursor is not None

    @classmethod
    def from_dto(cls, dto: PageDto[T]) -> Page[T]:
        return cls(items=list(dto.items), next_cursor=dto.next_cursor, total=int(dto.total))


def iterate_pages(fetch_page: Callable[[str | None], Page[T]]) -> Iterator[T]:
    """Yields every item, fetching the next page when the current one runs out."""
    cursor: str | None = None
    while True:
        page = fetch_page(cursor)
        yield from page.items
        if page.next_cursor is None:
            return
        cursor = page.next_cursor


async def aiterate_pages(
    fetch_page: Callable[[str | None], Awaitable[Page[T]]],
) -> AsyncIterator[T]:
    """The asynchronous counterpart of :func:`iterate_pages`."""
    cursor: str | None = None
    while True:
        page = await fetch_page(cursor)
        for item in page.items:
            yield item
        if page.next_cursor is None:
            return
        cursor = page.next_cursor
