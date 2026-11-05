from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.out_of_stock_policy import OutOfStockPolicy
from ..types import UNSET, Unset

T = TypeVar("T", bound="UpdateVariantDto")


@_attrs_define
class UpdateVariantDto:
    """
    Attributes:
        price (str):  Example: 19.90.
        sku (str | Unset):
        barcode (str | Unset): GTIN, UPC, EAN or ISBN
        option_values (list[str] | Unset): One value per product option, in order
        compare_at_price (str | Unset):  Example: 24.90.
        cost (str | Unset): What you pay per unit. Used for pricing floors; never shown to buyers. Example: 40.00.
        weight_grams (float | Unset):
        requires_shipping (bool | Unset):  Default: True.
        taxable (bool | Unset):  Default: True.
        out_of_stock_policy (OutOfStockPolicy | Unset):  Default: OutOfStockPolicy.STOP_SELLING.
        tracked (bool | Unset): Track stock for this variant Default: True.
        quantity (float | Unset): Opening stock Default: 0.0.
        id (UUID | Unset): The variant to edit. Leave empty to add a new variant.
    """

    price: str
    sku: str | Unset = UNSET
    barcode: str | Unset = UNSET
    option_values: list[str] | Unset = UNSET
    compare_at_price: str | Unset = UNSET
    cost: str | Unset = UNSET
    weight_grams: float | Unset = UNSET
    requires_shipping: bool | Unset = True
    taxable: bool | Unset = True
    out_of_stock_policy: OutOfStockPolicy | Unset = OutOfStockPolicy.STOP_SELLING
    tracked: bool | Unset = True
    quantity: float | Unset = 0.0
    id: UUID | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        price = self.price

        sku = self.sku

        barcode = self.barcode

        option_values: list[str] | Unset = UNSET
        if not isinstance(self.option_values, Unset):
            option_values = self.option_values

        compare_at_price = self.compare_at_price

        cost = self.cost

        weight_grams = self.weight_grams

        requires_shipping = self.requires_shipping

        taxable = self.taxable

        out_of_stock_policy: str | Unset = UNSET
        if not isinstance(self.out_of_stock_policy, Unset):
            out_of_stock_policy = self.out_of_stock_policy.value

        tracked = self.tracked

        quantity = self.quantity

        id: str | Unset = UNSET
        if not isinstance(self.id, Unset):
            id = str(self.id)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "price": price,
            }
        )
        if sku is not UNSET:
            field_dict["sku"] = sku
        if barcode is not UNSET:
            field_dict["barcode"] = barcode
        if option_values is not UNSET:
            field_dict["optionValues"] = option_values
        if compare_at_price is not UNSET:
            field_dict["compareAtPrice"] = compare_at_price
        if cost is not UNSET:
            field_dict["cost"] = cost
        if weight_grams is not UNSET:
            field_dict["weightGrams"] = weight_grams
        if requires_shipping is not UNSET:
            field_dict["requiresShipping"] = requires_shipping
        if taxable is not UNSET:
            field_dict["taxable"] = taxable
        if out_of_stock_policy is not UNSET:
            field_dict["outOfStockPolicy"] = out_of_stock_policy
        if tracked is not UNSET:
            field_dict["tracked"] = tracked
        if quantity is not UNSET:
            field_dict["quantity"] = quantity
        if id is not UNSET:
            field_dict["id"] = id

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        price = d.pop("price")

        sku = d.pop("sku", UNSET)

        barcode = d.pop("barcode", UNSET)

        option_values = cast(list[str], d.pop("optionValues", UNSET))

        compare_at_price = d.pop("compareAtPrice", UNSET)

        cost = d.pop("cost", UNSET)

        weight_grams = d.pop("weightGrams", UNSET)

        requires_shipping = d.pop("requiresShipping", UNSET)

        taxable = d.pop("taxable", UNSET)

        _out_of_stock_policy = d.pop("outOfStockPolicy", UNSET)
        out_of_stock_policy: OutOfStockPolicy | Unset
        if isinstance(_out_of_stock_policy, Unset):
            out_of_stock_policy = UNSET
        else:
            out_of_stock_policy = OutOfStockPolicy(_out_of_stock_policy)

        tracked = d.pop("tracked", UNSET)

        quantity = d.pop("quantity", UNSET)

        _id = d.pop("id", UNSET)
        id: UUID | Unset
        if isinstance(_id, Unset):
            id = UNSET
        else:
            id = UUID(_id)

        update_variant_dto = cls(
            price=price,
            sku=sku,
            barcode=barcode,
            option_values=option_values,
            compare_at_price=compare_at_price,
            cost=cost,
            weight_grams=weight_grams,
            requires_shipping=requires_shipping,
            taxable=taxable,
            out_of_stock_policy=out_of_stock_policy,
            tracked=tracked,
            quantity=quantity,
            id=id,
        )

        update_variant_dto.additional_properties = d
        return update_variant_dto

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
