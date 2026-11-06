from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="ListingStockLimitsDto")


@_attrs_define
class ListingStockLimitsDto:
    """
    Attributes:
        inventory_buffer (float | None): Units held back from this store
        max_quantity (float | None): The most units this store shows
    """

    inventory_buffer: float | None
    max_quantity: float | None
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        inventory_buffer: float | None
        inventory_buffer = self.inventory_buffer

        max_quantity: float | None
        max_quantity = self.max_quantity

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "inventoryBuffer": inventory_buffer,
                "maxQuantity": max_quantity,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)

        def _parse_inventory_buffer(data: object) -> float | None:
            if data is None:
                return data
            return cast(float | None, data)

        inventory_buffer = _parse_inventory_buffer(d.pop("inventoryBuffer"))

        def _parse_max_quantity(data: object) -> float | None:
            if data is None:
                return data
            return cast(float | None, data)

        max_quantity = _parse_max_quantity(d.pop("maxQuantity"))

        listing_stock_limits_dto = cls(
            inventory_buffer=inventory_buffer,
            max_quantity=max_quantity,
        )

        listing_stock_limits_dto.additional_properties = d
        return listing_stock_limits_dto

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
