from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.billing_interval import BillingInterval

T = TypeVar("T", bound="StartCheckoutDto")


@_attrs_define
class StartCheckoutDto:
    """
    Attributes:
        plan_code (str): The `code` of an offered, self-serve plan Example: growth.
        interval (BillingInterval):
    """

    plan_code: str
    interval: BillingInterval
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        plan_code = self.plan_code

        interval = self.interval.value

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "planCode": plan_code,
                "interval": interval,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        plan_code = d.pop("planCode")

        interval = BillingInterval(d.pop("interval"))

        start_checkout_dto = cls(
            plan_code=plan_code,
            interval=interval,
        )

        start_checkout_dto.additional_properties = d
        return start_checkout_dto

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
