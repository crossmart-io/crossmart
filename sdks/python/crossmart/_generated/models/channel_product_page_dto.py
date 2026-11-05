from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.channel_product_counts_dto import ChannelProductCountsDto
    from ..models.channel_product_dto import ChannelProductDto


T = TypeVar("T", bound="ChannelProductPageDto")


@_attrs_define
class ChannelProductPageDto:
    """
    Attributes:
        items (list[ChannelProductDto]):
        counts (ChannelProductCountsDto):
        next_cursor (None | str):
        total (float): How many match in all, for page numbers
    """

    items: list[ChannelProductDto]
    counts: ChannelProductCountsDto
    next_cursor: None | str
    total: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        items = []
        for items_item_data in self.items:
            items_item = items_item_data.to_dict()
            items.append(items_item)

        counts = self.counts.to_dict()

        next_cursor: None | str
        next_cursor = self.next_cursor

        total = self.total

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "items": items,
                "counts": counts,
                "nextCursor": next_cursor,
                "total": total,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.channel_product_counts_dto import ChannelProductCountsDto
        from ..models.channel_product_dto import ChannelProductDto

        d = dict(src_dict)
        items = []
        _items = d.pop("items")
        for items_item_data in _items:
            items_item = ChannelProductDto.from_dict(items_item_data)

            items.append(items_item)

        counts = ChannelProductCountsDto.from_dict(d.pop("counts"))

        def _parse_next_cursor(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        next_cursor = _parse_next_cursor(d.pop("nextCursor"))

        total = d.pop("total")

        channel_product_page_dto = cls(
            items=items,
            counts=counts,
            next_cursor=next_cursor,
            total=total,
        )

        channel_product_page_dto.additional_properties = d
        return channel_product_page_dto

    @property
    def additional_keys(self) -> list[str]:
        return list(self.additional_properties.keys())

    def __getitem__(self, key: str) -> Any:
        return self.additional_properties[key]

    def __setitem__(self, key: str, value: Any) -> None:
        self.additional_properties[key] = value

    def __delitem__(self, key: str) -> None:
        del self.additional_properties[key]

    def __contains__(self, key: str) -> bool:
        return key in self.additional_properties
