from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="ListingItemSpecificsSummaryDto")


@_attrs_define
class ListingItemSpecificsSummaryDto:
    """
    Attributes:
        supported (bool): Whether the channel has item specifics (eBay)
        count (float): How many item specifics the merchant set on the listing
        names (list[str]):  Example: ['Brand', 'Color'].
    """

    supported: bool
    count: float
    names: list[str]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        supported = self.supported

        count = self.count

        names = self.names

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "supported": supported,
                "count": count,
                "names": names,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        supported = d.pop("supported")

        count = d.pop("count")

        names = cast(list[str], d.pop("names"))

        listing_item_specifics_summary_dto = cls(
            supported=supported,
            count=count,
            names=names,
        )

        listing_item_specifics_summary_dto.additional_properties = d
        return listing_item_specifics_summary_dto

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
