from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="TopProductDto")


@_attrs_define
class TopProductDto:
    """
    Attributes:
        product_id (UUID):
        title (str):
        units (float):
        sales (str): Line prices times units Example: 240.00.
    """

    product_id: UUID
    title: str
    units: float
    sales: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        product_id = str(self.product_id)

        title = self.title

        units = self.units

        sales = self.sales

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "productId": product_id,
                "title": title,
                "units": units,
                "sales": sales,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        product_id = UUID(d.pop("productId"))

        title = d.pop("title")

        units = d.pop("units")

        sales = d.pop("sales")

        top_product_dto = cls(
            product_id=product_id,
            title=title,
            units=units,
            sales=sales,
        )

        top_product_dto.additional_properties = d
        return top_product_dto

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
