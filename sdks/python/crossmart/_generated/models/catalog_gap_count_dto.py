from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.catalog_gap import CatalogGap

T = TypeVar("T", bound="CatalogGapCountDto")


@_attrs_define
class CatalogGapCountDto:
    """
    Attributes:
        gap (CatalogGap):
        products (float): Products with this gap
    """

    gap: CatalogGap
    products: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        gap = self.gap.value

        products = self.products

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "gap": gap,
                "products": products,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        gap = CatalogGap(d.pop("gap"))

        products = d.pop("products")

        catalog_gap_count_dto = cls(
            gap=gap,
            products=products,
        )

        catalog_gap_count_dto.additional_properties = d
        return catalog_gap_count_dto

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
