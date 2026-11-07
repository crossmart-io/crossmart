from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.entitlement_error_code import EntitlementErrorCode
from ..models.sandbox_restriction import SandboxRestriction

T = TypeVar("T", bound="SandboxRestrictedErrorDto")


@_attrs_define
class SandboxRestrictedErrorDto:
    """
    Attributes:
        status_code (float):  Example: 403.
        error (str):  Example: Forbidden.
        code (EntitlementErrorCode):
        message (str):  Example: This Crossmart account is an unclaimed sandbox, so it cannot connect a store. Ask the
            user to claim it with the link Crossmart emailed them (it works until 2026-11-21). Once claimed, you can connect
            a store..
        restriction (SandboxRestriction):
        claim_expires_at (datetime.datetime): When the claim link stops working and the sandbox is deleted
    """

    status_code: float
    error: str
    code: EntitlementErrorCode
    message: str
    restriction: SandboxRestriction
    claim_expires_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        status_code = self.status_code

        error = self.error

        code = self.code.value

        message = self.message

        restriction = self.restriction.value

        claim_expires_at = self.claim_expires_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "statusCode": status_code,
                "error": error,
                "code": code,
                "message": message,
                "restriction": restriction,
                "claimExpiresAt": claim_expires_at,
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

        restriction = SandboxRestriction(d.pop("restriction"))

        claim_expires_at = datetime.datetime.fromisoformat(d.pop("claimExpiresAt"))

        sandbox_restricted_error_dto = cls(
            status_code=status_code,
            error=error,
            code=code,
            message=message,
            restriction=restriction,
            claim_expires_at=claim_expires_at,
        )

        sandbox_restricted_error_dto.additional_properties = d
        return sandbox_restricted_error_dto

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
