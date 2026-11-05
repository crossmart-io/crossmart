from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.out_of_stock_policy import OutOfStockPolicy

T = TypeVar("T", bound="VariantDto")


@_attrs_define
class VariantDto:
    """
    Attributes:
        id (UUID):
        position (float):
        sku (None | str):
        barcode (None | str): GTIN, UPC, EAN or ISBN
        option_values (list[str]): One value per product option, in order
        price (str): Decimal string in the workspace currency Example: 89.00.
        compare_at_price (None | str):  Example: 99.00.
        cost (None | str): What you pay per unit; never shown to buyers Example: 40.00.
        weight_grams (float | None):
        requires_shipping (bool):
        taxable (bool):
        out_of_stock_policy (OutOfStockPolicy):
        tracked (bool): Whether Crossmart tracks stock for this variant
        available (float):
    """

    id: UUID
    position: float
    sku: None | str
    barcode: None | str
    option_values: list[str]
    price: str
    compare_at_price: None | str
    cost: None | str
    weight_grams: float | None
    requires_shipping: bool
    taxable: bool
    out_of_stock_policy: OutOfStockPolicy
    tracked: bool
    available: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = str(self.id)

        position = self.position

        sku: None | str
        sku = self.sku

        barcode: None | str
        barcode = self.barcode

        option_values = self.option_values

        price = self.price

        compare_at_price: None | str
        compare_at_price = self.compare_at_price

        cost: None | str
        cost = self.cost

        weight_grams: float | None
        weight_grams = self.weight_grams

        requires_shipping = self.requires_shipping

        taxable = self.taxable

        out_of_stock_policy = self.out_of_stock_policy.value

        tracked = self.tracked

        available = self.available

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "position": position,
                "sku": sku,
                "barcode": barcode,
                "optionValues": option_values,
                "price": price,
                "compareAtPrice": compare_at_price,
                "cost": cost,
                "weightGrams": weight_grams,
                "requiresShipping": requires_shipping,
                "taxable": taxable,
                "outOfStockPolicy": out_of_stock_policy,
                "tracked": tracked,
                "available": available,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        id = UUID(d.pop("id"))

        position = d.pop("position")

        def _parse_sku(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        sku = _parse_sku(d.pop("sku"))

        def _parse_barcode(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        barcode = _parse_barcode(d.pop("barcode"))

        option_values = cast(list[str], d.pop("optionValues"))

        price = d.pop("price")

        def _parse_compare_at_price(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        compare_at_price = _parse_compare_at_price(d.pop("compareAtPrice"))

        def _parse_cost(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        cost = _parse_cost(d.pop("cost"))

        def _parse_weight_grams(data: object) -> float | None:
            if data is None:
                return data
            return cast(float | None, data)

        weight_grams = _parse_weight_grams(d.pop("weightGrams"))

        requires_shipping = d.pop("requiresShipping")

        taxable = d.pop("taxable")

        out_of_stock_policy = OutOfStockPolicy(d.pop("outOfStockPolicy"))

        tracked = d.pop("tracked")

        available = d.pop("available")

        variant_dto = cls(
            id=id,
            position=position,
            sku=sku,
            barcode=barcode,
            option_values=option_values,
            price=price,
            compare_at_price=compare_at_price,
            cost=cost,
            weight_grams=weight_grams,
            requires_shipping=requires_shipping,
            taxable=taxable,
            out_of_stock_policy=out_of_stock_policy,
            tracked=tracked,
            available=available,
        )

        variant_dto.additional_properties = d
        return variant_dto

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
