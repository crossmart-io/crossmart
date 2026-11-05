from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.product_summary_dto import ProductSummaryDto


T = TypeVar("T", bound="SelectionPreviewDto")


@_attrs_define
class SelectionPreviewDto:
    """
    Attributes:
        total (float): Products the selection lists
        matching_filter (float): Products the filter matches, before the manual lists
        added_manually (float): Products added by hand that the filter does not match
        removed_manually (float): Products the filter matches that were removed by hand
        items (list[ProductSummaryDto]):
        next_cursor (None | str):
        to_publish (float): Products saving this rule publishes now
        to_remove (float): Products saving this rule delists now
    """

    total: float
    matching_filter: float
    added_manually: float
    removed_manually: float
    items: list[ProductSummaryDto]
    next_cursor: None | str
    to_publish: float
    to_remove: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        total = self.total

        matching_filter = self.matching_filter

        added_manually = self.added_manually

        removed_manually = self.removed_manually

        items = []
        for items_item_data in self.items:
            items_item = items_item_data.to_dict()
            items.append(items_item)

        next_cursor: None | str
        next_cursor = self.next_cursor

        to_publish = self.to_publish

        to_remove = self.to_remove

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "total": total,
                "matchingFilter": matching_filter,
                "addedManually": added_manually,
                "removedManually": removed_manually,
                "items": items,
                "nextCursor": next_cursor,
                "toPublish": to_publish,
                "toRemove": to_remove,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.product_summary_dto import ProductSummaryDto

        d = dict(src_dict)
        total = d.pop("total")

        matching_filter = d.pop("matchingFilter")

        added_manually = d.pop("addedManually")

        removed_manually = d.pop("removedManually")

        items = []
        _items = d.pop("items")
        for items_item_data in _items:
            items_item = ProductSummaryDto.from_dict(items_item_data)

            items.append(items_item)

        def _parse_next_cursor(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        next_cursor = _parse_next_cursor(d.pop("nextCursor"))

        to_publish = d.pop("toPublish")

        to_remove = d.pop("toRemove")

        selection_preview_dto = cls(
            total=total,
            matching_filter=matching_filter,
            added_manually=added_manually,
            removed_manually=removed_manually,
            items=items,
            next_cursor=next_cursor,
            to_publish=to_publish,
            to_remove=to_remove,
        )

        selection_preview_dto.additional_properties = d
        return selection_preview_dto

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
