from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="StockLevelCountsDto")


@_attrs_define
class StockLevelCountsDto:
    """
    Attributes:
        in_stock (float):
        low_stock (float):
        out_of_stock (float):
        untracked (float): Variants that do not track stock
    """

    in_stock: float
    low_stock: float
    out_of_stock: float
    untracked: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        in_stock = self.in_stock

        low_stock = self.low_stock

        out_of_stock = self.out_of_stock

        untracked = self.untracked

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "inStock": in_stock,
                "lowStock": low_stock,
                "outOfStock": out_of_stock,
                "untracked": untracked,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        in_stock = d.pop("inStock")

        low_stock = d.pop("lowStock")

        out_of_stock = d.pop("outOfStock")

        untracked = d.pop("untracked")

        stock_level_counts_dto = cls(
            in_stock=in_stock,
            low_stock=low_stock,
            out_of_stock=out_of_stock,
            untracked=untracked,
        )

        stock_level_counts_dto.additional_properties = d
        return stock_level_counts_dto

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
