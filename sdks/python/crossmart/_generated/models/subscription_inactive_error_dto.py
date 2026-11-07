from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.entitlement_error_code import EntitlementErrorCode
from ..models.subscription_access_state import SubscriptionAccessState

T = TypeVar("T", bound="SubscriptionInactiveErrorDto")


@_attrs_define
class SubscriptionInactiveErrorDto:
    """
    Attributes:
        status_code (float):  Example: 402.
        error (str):  Example: Payment Required.
        code (EntitlementErrorCode):
        message (str):  Example: This organization's Crossmart subscription is canceled, so the account is read-only:
            data can be read, but not changed, published or synced. Ask an owner or admin of the organization to choose a
            plan in Settings > Billing..
        state (SubscriptionAccessState):
    """

    status_code: float
    error: str
    code: EntitlementErrorCode
    message: str
    state: SubscriptionAccessState
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        status_code = self.status_code

        error = self.error

        code = self.code.value

        message = self.message

        state = self.state.value

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "statusCode": status_code,
                "error": error,
                "code": code,
                "message": message,
                "state": state,
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

        state = SubscriptionAccessState(d.pop("state"))

        subscription_inactive_error_dto = cls(
            status_code=status_code,
            error=error,
            code=code,
            message=message,
            state=state,
        )

        subscription_inactive_error_dto.additional_properties = d
        return subscription_inactive_error_dto

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
