from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

T = TypeVar("T", bound="UpdateVariantPriceDto")


@_attrs_define
class UpdateVariantPriceDto:
    """
    Attributes:
        price (str | Unset): In the workspace currency Example: 19.90.
        compare_at_price (None | str | Unset): The "was" price buyers see struck through; null removes it Example:
            24.90.
    """

    price: str | Unset = UNSET
    compare_at_price: None | str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        price = self.price

        compare_at_price: None | str | Unset
        if isinstance(self.compare_at_price, Unset):
            compare_at_price = UNSET
        else:
            compare_at_price = self.compare_at_price

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({})
        if price is not UNSET:
            field_dict["price"] = price
        if compare_at_price is not UNSET:
            field_dict["compareAtPrice"] = compare_at_price

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        price = d.pop("price", UNSET)

        def _parse_compare_at_price(data: object) -> None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(None | str | Unset, data)

        compare_at_price = _parse_compare_at_price(d.pop("compareAtPrice", UNSET))

        update_variant_price_dto = cls(
            price=price,
            compare_at_price=compare_at_price,
        )

        update_variant_price_dto.additional_properties = d
        return update_variant_price_dto

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
