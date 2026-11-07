from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.billing_plan_dto import BillingPlanDto


T = TypeVar("T", bound="BillingPlanCatalogDto")


@_attrs_define
class BillingPlanCatalogDto:
    """
    Attributes:
        plans (list[BillingPlanDto]): The offered plans, in order
        sales_email (str): Where to ask about other plans Example: hello@crossmart.io.
    """

    plans: list[BillingPlanDto]
    sales_email: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        plans = []
        for plans_item_data in self.plans:
            plans_item = plans_item_data.to_dict()
            plans.append(plans_item)

        sales_email = self.sales_email

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "plans": plans,
                "salesEmail": sales_email,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.billing_plan_dto import BillingPlanDto

        d = dict(src_dict)
        plans = []
        _plans = d.pop("plans")
        for plans_item_data in _plans:
            plans_item = BillingPlanDto.from_dict(plans_item_data)

            plans.append(plans_item)

        sales_email = d.pop("salesEmail")

        billing_plan_catalog_dto = cls(
            plans=plans,
            sales_email=sales_email,
        )

        billing_plan_catalog_dto.additional_properties = d
        return billing_plan_catalog_dto

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
