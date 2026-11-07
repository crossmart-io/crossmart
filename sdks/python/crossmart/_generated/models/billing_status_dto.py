from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.billing_interval import BillingInterval
from ..models.subscription_status import SubscriptionStatus

if TYPE_CHECKING:
    from ..models.plan_dto import PlanDto
    from ..models.subscription_access_dto import SubscriptionAccessDto


T = TypeVar("T", bound="BillingStatusDto")


@_attrs_define
class BillingStatusDto:
    """
    Attributes:
        organization_id (UUID):
        enabled (bool): Whether this instance bills customers; false when self-hosting, where all is free
        plan (PlanDto):
        status (SubscriptionStatus):
        interval (BillingInterval | None): How often the subscription renews; null before one starts
        current_period_end (datetime.datetime | None): When the subscription renews, or ends when `cancelAtPeriodEnd` is
            true
        trial_end (datetime.datetime | None): When the trial ends (the card is charged then), or ended
        cancel_at_period_end (bool): The subscription ends at `currentPeriodEnd` instead of renewing
        access (SubscriptionAccessDto):
        has_billing_account (bool): Whether the billing portal can open (a plan was chosen before)
        trial_available (bool): Whether choosing a plan now starts with a free trial
    """

    organization_id: UUID
    enabled: bool
    plan: PlanDto
    status: SubscriptionStatus
    interval: BillingInterval | None
    current_period_end: datetime.datetime | None
    trial_end: datetime.datetime | None
    cancel_at_period_end: bool
    access: SubscriptionAccessDto
    has_billing_account: bool
    trial_available: bool
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        organization_id = str(self.organization_id)

        enabled = self.enabled

        plan = self.plan.to_dict()

        status = self.status.value

        interval: None | str
        if isinstance(self.interval, BillingInterval):
            interval = self.interval.value
        else:
            interval = self.interval

        current_period_end: None | str
        if isinstance(self.current_period_end, datetime.datetime):
            current_period_end = self.current_period_end.isoformat()
        else:
            current_period_end = self.current_period_end

        trial_end: None | str
        if isinstance(self.trial_end, datetime.datetime):
            trial_end = self.trial_end.isoformat()
        else:
            trial_end = self.trial_end

        cancel_at_period_end = self.cancel_at_period_end

        access = self.access.to_dict()

        has_billing_account = self.has_billing_account

        trial_available = self.trial_available

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "organizationId": organization_id,
                "enabled": enabled,
                "plan": plan,
                "status": status,
                "interval": interval,
                "currentPeriodEnd": current_period_end,
                "trialEnd": trial_end,
                "cancelAtPeriodEnd": cancel_at_period_end,
                "access": access,
                "hasBillingAccount": has_billing_account,
                "trialAvailable": trial_available,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.plan_dto import PlanDto
        from ..models.subscription_access_dto import SubscriptionAccessDto

        d = dict(src_dict)
        organization_id = UUID(d.pop("organizationId"))

        enabled = d.pop("enabled")

        plan = PlanDto.from_dict(d.pop("plan"))

        status = SubscriptionStatus(d.pop("status"))

        def _parse_interval(data: object) -> BillingInterval | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                interval_type_0 = BillingInterval(data)

                return interval_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(BillingInterval | None, data)

        interval = _parse_interval(d.pop("interval"))

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

        def _parse_trial_end(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                trial_end_type_0 = datetime.datetime.fromisoformat(data)

                return trial_end_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        trial_end = _parse_trial_end(d.pop("trialEnd"))

        cancel_at_period_end = d.pop("cancelAtPeriodEnd")

        access = SubscriptionAccessDto.from_dict(d.pop("access"))

        has_billing_account = d.pop("hasBillingAccount")

        trial_available = d.pop("trialAvailable")

        billing_status_dto = cls(
            organization_id=organization_id,
            enabled=enabled,
            plan=plan,
            status=status,
            interval=interval,
            current_period_end=current_period_end,
            trial_end=trial_end,
            cancel_at_period_end=cancel_at_period_end,
            access=access,
            has_billing_account=has_billing_account,
            trial_available=trial_available,
        )

        billing_status_dto.additional_properties = d
        return billing_status_dto

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
