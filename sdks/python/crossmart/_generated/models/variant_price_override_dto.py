from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="VariantPriceOverrideDto")


@_attrs_define
class VariantPriceOverrideDto:
    """
    Attributes:
        variant_id (UUID):
        price (None | str):  Example: 79.00.
        compare_at_price (None | str):  Example: 99.00.
    """

    variant_id: UUID
    price: None | str
    compare_at_price: None | str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        variant_id = str(self.variant_id)

        price: None | str
        price = self.price

        compare_at_price: None | str
        compare_at_price = self.compare_at_price

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "variantId": variant_id,
                "price": price,
                "compareAtPrice": compare_at_price,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        variant_id = UUID(d.pop("variantId"))

        def _parse_price(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        price = _parse_price(d.pop("price"))

        def _parse_compare_at_price(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        compare_at_price = _parse_compare_at_price(d.pop("compareAtPrice"))

        variant_price_override_dto = cls(
            variant_id=variant_id,
            price=price,
            compare_at_price=compare_at_price,
        )

        variant_price_override_dto.additional_properties = d
        return variant_price_override_dto

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
