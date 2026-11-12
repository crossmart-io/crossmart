from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.connect_failure import ConnectFailure

T = TypeVar("T", bound="CredentialsRejectedErrorDto")


@_attrs_define
class CredentialsRejectedErrorDto:
    """
    Attributes:
        status_code (float):  Example: 422.
        error (str):  Example: Unprocessable Entity.
        failure (ConnectFailure): Set when connecting failed
        message (str):  Example: Falabella rejected the user id or API key. Copy them again from Seller Center.: E007:
            Login failed. Signature mismatching.
    """

    status_code: float
    error: str
    failure: ConnectFailure
    message: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        status_code = self.status_code

        error = self.error

        failure = self.failure.value

        message = self.message

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "statusCode": status_code,
                "error": error,
                "failure": failure,
                "message": message,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        status_code = d.pop("statusCode")

        error = d.pop("error")

        failure = ConnectFailure(d.pop("failure"))

        message = d.pop("message")

        credentials_rejected_error_dto = cls(
            status_code=status_code,
            error=error,
            failure=failure,
            message=message,
        )

        credentials_rejected_error_dto.additional_properties = d
        return credentials_rejected_error_dto

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
