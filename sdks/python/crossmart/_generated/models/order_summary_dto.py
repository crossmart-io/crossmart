from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, Self, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.order_status import OrderStatus

T = TypeVar("T", bound="OrderSummaryDto")


@_attrs_define
class OrderSummaryDto:
    """
    Attributes:
        id (UUID):
        name (str): The number the merchant and buyer see Example: #1001.
        status (OrderStatus):
        currency_code (str):  Example: USD.
        total (str): What the buyer pays now Example: 130.00.
        placed_at (datetime.datetime):
        connection_id (UUID):
        store_name (str):  Example: Demo Store.
        channel (str):  Example: shopify.
        item_count (float): Units ordered, over every line
        unmatched_lines (float): Lines that match no catalog variant, so their stock is not tracked
    """

    id: UUID
    name: str
    status: OrderStatus
    currency_code: str
    total: str
    placed_at: datetime.datetime
    connection_id: UUID
    store_name: str
    channel: str
    item_count: float
    unmatched_lines: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = str(self.id)

        name = self.name

        status = self.status.value

        currency_code = self.currency_code

        total = self.total

        placed_at = self.placed_at.isoformat()

        connection_id = str(self.connection_id)

        store_name = self.store_name

        channel = self.channel

        item_count = self.item_count

        unmatched_lines = self.unmatched_lines

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "name": name,
                "status": status,
                "currencyCode": currency_code,
                "total": total,
                "placedAt": placed_at,
                "connectionId": connection_id,
                "storeName": store_name,
                "channel": channel,
                "itemCount": item_count,
                "unmatchedLines": unmatched_lines,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        id = UUID(d.pop("id"))

        name = d.pop("name")

        status = OrderStatus(d.pop("status"))

        currency_code = d.pop("currencyCode")

        total = d.pop("total")

        placed_at = datetime.datetime.fromisoformat(d.pop("placedAt"))

        connection_id = UUID(d.pop("connectionId"))

        store_name = d.pop("storeName")

        channel = d.pop("channel")

        item_count = d.pop("itemCount")

        unmatched_lines = d.pop("unmatchedLines")

        order_summary_dto = cls(
            id=id,
            name=name,
            status=status,
            currency_code=currency_code,
            total=total,
            placed_at=placed_at,
            connection_id=connection_id,
            store_name=store_name,
            channel=channel,
            item_count=item_count,
            unmatched_lines=unmatched_lines,
        )

        order_summary_dto.additional_properties = d
        return order_summary_dto

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
