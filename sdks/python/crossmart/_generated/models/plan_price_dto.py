from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.billing_interval import BillingInterval

T = TypeVar("T", bound="PlanPriceDto")


@_attrs_define
class PlanPriceDto:
    """
    Attributes:
        interval (BillingInterval):
        amount (float): Each charge, in the currency’s minor unit (cents) Example: 27600.
        monthly_amount (float): The charge spread over the months it covers, in minor units, to compare intervals
            Example: 2300.
        currency (str): Lower-case ISO 4217 code Example: usd.
    """

    interval: BillingInterval
    amount: float
    monthly_amount: float
    currency: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        interval = self.interval.value

        amount = self.amount

        monthly_amount = self.monthly_amount

        currency = self.currency

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "interval": interval,
                "amount": amount,
                "monthlyAmount": monthly_amount,
                "currency": currency,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        interval = BillingInterval(d.pop("interval"))

        amount = d.pop("amount")

        monthly_amount = d.pop("monthlyAmount")

        currency = d.pop("currency")

        plan_price_dto = cls(
            interval=interval,
            amount=amount,
            monthly_amount=monthly_amount,
            currency=currency,
        )

        plan_price_dto.additional_properties = d
        return plan_price_dto

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
