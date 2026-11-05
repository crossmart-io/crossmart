from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.stock_level import StockLevel

T = TypeVar("T", bound="InventoryItemDto")


@_attrs_define
class InventoryItemDto:
    """
    Attributes:
        inventory_item_id (UUID):
        variant_id (UUID):
        product_id (UUID):
        product_title (str):
        option_values (list[str]): One value per product option, in order
        sku (None | str):
        image_url (None | str): The product’s first image
        tracked (bool): Whether Crossmart tracks stock for this variant
        on_hand (float): Units in stock: available plus reserved
        reserved (float): Units held for open orders
        available (float): Units that can still be sold, and what channels receive
        stock_level (StockLevel):
        updated_at (datetime.datetime):
    """

    inventory_item_id: UUID
    variant_id: UUID
    product_id: UUID
    product_title: str
    option_values: list[str]
    sku: None | str
    image_url: None | str
    tracked: bool
    on_hand: float
    reserved: float
    available: float
    stock_level: StockLevel
    updated_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        inventory_item_id = str(self.inventory_item_id)

        variant_id = str(self.variant_id)

        product_id = str(self.product_id)

        product_title = self.product_title

        option_values = self.option_values

        sku: None | str
        sku = self.sku

        image_url: None | str
        image_url = self.image_url

        tracked = self.tracked

        on_hand = self.on_hand

        reserved = self.reserved

        available = self.available

        stock_level = self.stock_level.value

        updated_at = self.updated_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "inventoryItemId": inventory_item_id,
                "variantId": variant_id,
                "productId": product_id,
                "productTitle": product_title,
                "optionValues": option_values,
                "sku": sku,
                "imageUrl": image_url,
                "tracked": tracked,
                "onHand": on_hand,
                "reserved": reserved,
                "available": available,
                "stockLevel": stock_level,
                "updatedAt": updated_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        inventory_item_id = UUID(d.pop("inventoryItemId"))

        variant_id = UUID(d.pop("variantId"))

        product_id = UUID(d.pop("productId"))

        product_title = d.pop("productTitle")

        option_values = cast(list[str], d.pop("optionValues"))

        def _parse_sku(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        sku = _parse_sku(d.pop("sku"))

        def _parse_image_url(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        image_url = _parse_image_url(d.pop("imageUrl"))

        tracked = d.pop("tracked")

        on_hand = d.pop("onHand")

        reserved = d.pop("reserved")

        available = d.pop("available")

        stock_level = StockLevel(d.pop("stockLevel"))

        updated_at = datetime.datetime.fromisoformat(d.pop("updatedAt"))

        inventory_item_dto = cls(
            inventory_item_id=inventory_item_id,
            variant_id=variant_id,
            product_id=product_id,
            product_title=product_title,
            option_values=option_values,
            sku=sku,
            image_url=image_url,
            tracked=tracked,
            on_hand=on_hand,
            reserved=reserved,
            available=available,
            stock_level=stock_level,
            updated_at=updated_at,
        )

        inventory_item_dto.additional_properties = d
        return inventory_item_dto

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
