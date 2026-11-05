from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.connection_sales_dto import ConnectionSalesDto


T = TypeVar("T", bound="SalesBucketDto")


@_attrs_define
class SalesBucketDto:
    """
    Attributes:
        starts_on (str): First day of the bucket, in the time zone Example: 2026-11-04.
        sales (str):  Example: 120.00.
        orders (float):
        previous_starts_on (str): First day of the matching earlier bucket Example: 2026-10-05.
        previous_sales (str):  Example: 80.00.
        by_connection (list[ConnectionSalesDto]): Stores with orders in the bucket
    """

    starts_on: str
    sales: str
    orders: float
    previous_starts_on: str
    previous_sales: str
    by_connection: list[ConnectionSalesDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        starts_on = self.starts_on

        sales = self.sales

        orders = self.orders

        previous_starts_on = self.previous_starts_on

        previous_sales = self.previous_sales

        by_connection = []
        for by_connection_item_data in self.by_connection:
            by_connection_item = by_connection_item_data.to_dict()
            by_connection.append(by_connection_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "startsOn": starts_on,
                "sales": sales,
                "orders": orders,
                "previousStartsOn": previous_starts_on,
                "previousSales": previous_sales,
                "byConnection": by_connection,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.connection_sales_dto import ConnectionSalesDto

        d = dict(src_dict)
        starts_on = d.pop("startsOn")

        sales = d.pop("sales")

        orders = d.pop("orders")

        previous_starts_on = d.pop("previousStartsOn")

        previous_sales = d.pop("previousSales")

        by_connection = []
        _by_connection = d.pop("byConnection")
        for by_connection_item_data in _by_connection:
            by_connection_item = ConnectionSalesDto.from_dict(by_connection_item_data)

            by_connection.append(by_connection_item)

        sales_bucket_dto = cls(
            starts_on=starts_on,
            sales=sales,
            orders=orders,
            previous_starts_on=previous_starts_on,
            previous_sales=previous_sales,
            by_connection=by_connection,
        )

        sales_bucket_dto.additional_properties = d
        return sales_bucket_dto

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
