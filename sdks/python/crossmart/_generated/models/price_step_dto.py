from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.price_step_kind import PriceStepKind

T = TypeVar("T", bound="PriceStepDto")


@_attrs_define
class PriceStepDto:
    """
    Attributes:
        kind (PriceStepKind):
        label (str):  Example: +15%.
        amount (str): The price after this step Example: 102.35.
    """

    kind: PriceStepKind
    label: str
    amount: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        kind = self.kind.value

        label = self.label

        amount = self.amount

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "kind": kind,
                "label": label,
                "amount": amount,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        kind = PriceStepKind(d.pop("kind"))

        label = d.pop("label")

        amount = d.pop("amount")

        price_step_dto = cls(
            kind=kind,
            label=label,
            amount=amount,
        )

        price_step_dto.additional_properties = d
        return price_step_dto

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
