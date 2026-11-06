from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="InheritedPriceDto")


@_attrs_define
class InheritedPriceDto:
    """
    Attributes:
        product (str): The catalog price, in the workspace currency Example: 89.00.
        override (None | str):  Example: 79.00.
        effective (str): In the store’s currency: the override, else the pricing rule’s result Example: 102.99.
        overridden (bool): Whether the store overrides it; reverting sets `override` to null
    """

    product: str
    override: None | str
    effective: str
    overridden: bool
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        product = self.product

        override: None | str
        override = self.override

        effective = self.effective

        overridden = self.overridden

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "product": product,
                "override": override,
                "effective": effective,
                "overridden": overridden,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        product = d.pop("product")

        def _parse_override(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        override = _parse_override(d.pop("override"))

        effective = d.pop("effective")

        overridden = d.pop("overridden")

        inherited_price_dto = cls(
            product=product,
            override=override,
            effective=effective,
            overridden=overridden,
        )

        inherited_price_dto.additional_properties = d
        return inherited_price_dto

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
