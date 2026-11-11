from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.attention_listing_group_dto import AttentionListingGroupDto


T = TypeVar("T", bound="AttentionListingsDto")


@_attrs_define
class AttentionListingsDto:
    """
    Attributes:
        count (float): Failed listings across the stores, as the Channels page counts them
        items (list[AttentionListingGroupDto]): The latest products with failed listings, one per product and store
    """

    count: float
    items: list[AttentionListingGroupDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        count = self.count

        items = []
        for items_item_data in self.items:
            items_item = items_item_data.to_dict()
            items.append(items_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "count": count,
                "items": items,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.attention_listing_group_dto import AttentionListingGroupDto

        d = dict(src_dict)
        count = d.pop("count")

        items = []
        _items = d.pop("items")
        for items_item_data in _items:
            items_item = AttentionListingGroupDto.from_dict(items_item_data)

            items.append(items_item)

        attention_listings_dto = cls(
            count=count,
            items=items,
        )

        attention_listings_dto.additional_properties = d
        return attention_listings_dto

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
