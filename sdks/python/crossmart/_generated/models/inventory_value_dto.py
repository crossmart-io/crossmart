from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="InventoryValueDto")


@_attrs_define
class InventoryValueDto:
    """
    Attributes:
        at_cost (str): Units on hand times cost; no-cost variants left out Example: 4120.50.
        at_price (str): Units on hand times price Example: 9800.00.
        units_on_hand (float): Available plus held for orders
        variants_without_cost (float): Variants with stock on hand but no cost
    """

    at_cost: str
    at_price: str
    units_on_hand: float
    variants_without_cost: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        at_cost = self.at_cost

        at_price = self.at_price

        units_on_hand = self.units_on_hand

        variants_without_cost = self.variants_without_cost

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "atCost": at_cost,
                "atPrice": at_price,
                "unitsOnHand": units_on_hand,
                "variantsWithoutCost": variants_without_cost,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        at_cost = d.pop("atCost")

        at_price = d.pop("atPrice")

        units_on_hand = d.pop("unitsOnHand")

        variants_without_cost = d.pop("variantsWithoutCost")

        inventory_value_dto = cls(
            at_cost=at_cost,
            at_price=at_price,
            units_on_hand=units_on_hand,
            variants_without_cost=variants_without_cost,
        )

        inventory_value_dto.additional_properties = d
        return inventory_value_dto

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
