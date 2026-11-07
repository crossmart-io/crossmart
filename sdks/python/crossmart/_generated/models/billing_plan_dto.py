from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.plan_grant_dto import PlanGrantDto
    from ..models.plan_price_dto import PlanPriceDto


T = TypeVar("T", bound="BillingPlanDto")


@_attrs_define
class BillingPlanDto:
    """
    Attributes:
        code (str):  Example: growth.
        name (str):  Example: Growth.
        version (float): The plan version new subscriptions get
        features (list[PlanGrantDto]): What the plan includes, every feature
        prices (list[PlanPriceDto]): Monthly first; empty for a plan that is not sold online
        self_serve (bool): False for plans sold by contacting sales, such as Enterprise
    """

    code: str
    name: str
    version: float
    features: list[PlanGrantDto]
    prices: list[PlanPriceDto]
    self_serve: bool
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        code = self.code

        name = self.name

        version = self.version

        features = []
        for features_item_data in self.features:
            features_item = features_item_data.to_dict()
            features.append(features_item)

        prices = []
        for prices_item_data in self.prices:
            prices_item = prices_item_data.to_dict()
            prices.append(prices_item)

        self_serve = self.self_serve

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "code": code,
                "name": name,
                "version": version,
                "features": features,
                "prices": prices,
                "selfServe": self_serve,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.plan_grant_dto import PlanGrantDto
        from ..models.plan_price_dto import PlanPriceDto

        d = dict(src_dict)
        code = d.pop("code")

        name = d.pop("name")

        version = d.pop("version")

        features = []
        _features = d.pop("features")
        for features_item_data in _features:
            features_item = PlanGrantDto.from_dict(features_item_data)

            features.append(features_item)

        prices = []
        _prices = d.pop("prices")
        for prices_item_data in _prices:
            prices_item = PlanPriceDto.from_dict(prices_item_data)

            prices.append(prices_item)

        self_serve = d.pop("selfServe")

        billing_plan_dto = cls(
            code=code,
            name=name,
            version=version,
            features=features,
            prices=prices,
            self_serve=self_serve,
        )

        billing_plan_dto.additional_properties = d
        return billing_plan_dto

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
