from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="SalesStoreDto")


@_attrs_define
class SalesStoreDto:
    """
    Attributes:
        connection_id (UUID):
        sales (str):  Example: 120.00.
        orders (float):
        channel (str):  Example: shopify.
        display_name (str):  Example: Demo Store.
    """

    connection_id: UUID
    sales: str
    orders: float
    channel: str
    display_name: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        connection_id = str(self.connection_id)

        sales = self.sales

        orders = self.orders

        channel = self.channel

        display_name = self.display_name

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "connectionId": connection_id,
                "sales": sales,
                "orders": orders,
                "channel": channel,
                "displayName": display_name,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        connection_id = UUID(d.pop("connectionId"))

        sales = d.pop("sales")

        orders = d.pop("orders")

        channel = d.pop("channel")

        display_name = d.pop("displayName")

        sales_store_dto = cls(
            connection_id=connection_id,
            sales=sales,
            orders=orders,
            channel=channel,
            display_name=display_name,
        )

        sales_store_dto.additional_properties = d
        return sales_store_dto

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
