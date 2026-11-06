from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="SalesTotalsDto")


@_attrs_define
class SalesTotalsDto:
    """
    Attributes:
        sales (str): Order totals, cancelled orders left out Example: 1290.00.
        orders (float):
        units (float): Units ordered
        average_order_value (None | str): Sales per order Example: 43.00.
    """

    sales: str
    orders: float
    units: float
    average_order_value: None | str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        sales = self.sales

        orders = self.orders

        units = self.units

        average_order_value: None | str
        average_order_value = self.average_order_value

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "sales": sales,
                "orders": orders,
                "units": units,
                "averageOrderValue": average_order_value,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        sales = d.pop("sales")

        orders = d.pop("orders")

        units = d.pop("units")

        def _parse_average_order_value(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        average_order_value = _parse_average_order_value(d.pop("averageOrderValue"))

        sales_totals_dto = cls(
            sales=sales,
            orders=orders,
            units=units,
            average_order_value=average_order_value,
        )

        sales_totals_dto.additional_properties = d
        return sales_totals_dto

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
