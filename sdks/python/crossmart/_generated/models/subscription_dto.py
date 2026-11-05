from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.subscription_status import SubscriptionStatus

if TYPE_CHECKING:
    from ..models.feature_usage_dto import FeatureUsageDto
    from ..models.plan_dto import PlanDto


T = TypeVar("T", bound="SubscriptionDto")


@_attrs_define
class SubscriptionDto:
    """
    Attributes:
        organization_id (UUID):
        plan (PlanDto):
        status (SubscriptionStatus):
        current_period_end (datetime.datetime | None): When the paid period ends; null until billing is connected
        enforced (bool): Whether limits block actions here (402), or are only reported
        features (list[FeatureUsageDto]): Every feature, with what the plan allows and what is in use
    """

    organization_id: UUID
    plan: PlanDto
    status: SubscriptionStatus
    current_period_end: datetime.datetime | None
    enforced: bool
    features: list[FeatureUsageDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        organization_id = str(self.organization_id)

        plan = self.plan.to_dict()

        status = self.status.value

        current_period_end: None | str
        if isinstance(self.current_period_end, datetime.datetime):
            current_period_end = self.current_period_end.isoformat()
        else:
            current_period_end = self.current_period_end

        enforced = self.enforced

        features = []
        for features_item_data in self.features:
            features_item = features_item_data.to_dict()
            features.append(features_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "organizationId": organization_id,
                "plan": plan,
                "status": status,
                "currentPeriodEnd": current_period_end,
                "enforced": enforced,
                "features": features,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.feature_usage_dto import FeatureUsageDto
        from ..models.plan_dto import PlanDto

        d = dict(src_dict)
        organization_id = UUID(d.pop("organizationId"))

        plan = PlanDto.from_dict(d.pop("plan"))

        status = SubscriptionStatus(d.pop("status"))

        def _parse_current_period_end(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                current_period_end_type_0 = datetime.datetime.fromisoformat(data)

                return current_period_end_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        current_period_end = _parse_current_period_end(d.pop("currentPeriodEnd"))

        enforced = d.pop("enforced")

        features = []
        _features = d.pop("features")
        for features_item_data in _features:
            features_item = FeatureUsageDto.from_dict(features_item_data)

            features.append(features_item)

        subscription_dto = cls(
            organization_id=organization_id,
            plan=plan,
            status=status,
            current_period_end=current_period_end,
            enforced=enforced,
            features=features,
        )

        subscription_dto.additional_properties = d
        return subscription_dto

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
