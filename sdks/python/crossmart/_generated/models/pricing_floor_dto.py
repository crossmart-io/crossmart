from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="PricingFloorDto")


@_attrs_define
class PricingFloorDto:
    """
    Attributes:
        min_margin_percent (str): Never price below cost plus this percentage (0 to 1000) Example: 30.
    """

    min_margin_percent: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        min_margin_percent = self.min_margin_percent

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "minMarginPercent": min_margin_percent,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        min_margin_percent = d.pop("minMarginPercent")

        pricing_floor_dto = cls(
            min_margin_percent=min_margin_percent,
        )

        pricing_floor_dto.additional_properties = d
        return pricing_floor_dto

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
