from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.workspace_event_dto import WorkspaceEventDto


T = TypeVar("T", bound="WorkspaceEventPageDto")


@_attrs_define
class WorkspaceEventPageDto:
    """
    Attributes:
        items (list[WorkspaceEventDto]): Oldest first
        cursor (str): Pass as `after` to read what happens next; it moves on even when nothing did
    """

    items: list[WorkspaceEventDto]
    cursor: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        items = []
        for items_item_data in self.items:
            items_item = items_item_data.to_dict()
            items.append(items_item)

        cursor = self.cursor

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "items": items,
                "cursor": cursor,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.workspace_event_dto import WorkspaceEventDto

        d = dict(src_dict)
        items = []
        _items = d.pop("items")
        for items_item_data in _items:
            items_item = WorkspaceEventDto.from_dict(items_item_data)

            items.append(items_item)

        cursor = d.pop("cursor")

        workspace_event_page_dto = cls(
            items=items,
            cursor=cursor,
        )

        workspace_event_page_dto.additional_properties = d
        return workspace_event_page_dto

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
