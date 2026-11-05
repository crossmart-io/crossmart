from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.entitlement_error_code import EntitlementErrorCode
from ..models.feature import Feature

T = TypeVar("T", bound="PlanLimitErrorDto")


@_attrs_define
class PlanLimitErrorDto:
    """
    Attributes:
        status_code (float):  Example: 402.
        error (str):  Example: Payment Required.
        code (EntitlementErrorCode):
        message (str):  Example: The Free plan includes 2 connected channels, and 2 are in use. Upgrade the plan to add
            more..
        feature (Feature):
        plan (str): The code of the organization’s plan Example: free.
        limit (float | None): Null is unlimited
        usage (float):
        requested (float): How many more the request asked for
    """

    status_code: float
    error: str
    code: EntitlementErrorCode
    message: str
    feature: Feature
    plan: str
    limit: float | None
    usage: float
    requested: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        status_code = self.status_code

        error = self.error

        code = self.code.value

        message = self.message

        feature = self.feature.value

        plan = self.plan

        limit: float | None
        limit = self.limit

        usage = self.usage

        requested = self.requested

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "statusCode": status_code,
                "error": error,
                "code": code,
                "message": message,
                "feature": feature,
                "plan": plan,
                "limit": limit,
                "usage": usage,
                "requested": requested,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        status_code = d.pop("statusCode")

        error = d.pop("error")

        code = EntitlementErrorCode(d.pop("code"))

        message = d.pop("message")

        feature = Feature(d.pop("feature"))

        plan = d.pop("plan")

        def _parse_limit(data: object) -> float | None:
            if data is None:
                return data
            return cast(float | None, data)

        limit = _parse_limit(d.pop("limit"))

        usage = d.pop("usage")

        requested = d.pop("requested")

        plan_limit_error_dto = cls(
            status_code=status_code,
            error=error,
            code=code,
            message=message,
            feature=feature,
            plan=plan,
            limit=limit,
            usage=usage,
            requested=requested,
        )

        plan_limit_error_dto.additional_properties = d
        return plan_limit_error_dto

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
