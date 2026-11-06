from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.listing_retry_error_code import ListingRetryErrorCode

T = TypeVar("T", bound="ListingRetryErrorDto")


@_attrs_define
class ListingRetryErrorDto:
    """
    Attributes:
        status_code (float):  Example: 409.
        error (str):  Example: Conflict.
        code (ListingRetryErrorCode): `store_not_connected`: the store needs re-auth, was disconnected or is in error;
            reconnect it. `product_not_in_store`: the store does not select the product; add it.
        message (str):  Example: Connect this store again before publishing to it.
    """

    status_code: float
    error: str
    code: ListingRetryErrorCode
    message: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        status_code = self.status_code

        error = self.error

        code = self.code.value

        message = self.message

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "statusCode": status_code,
                "error": error,
                "code": code,
                "message": message,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        status_code = d.pop("statusCode")

        error = d.pop("error")

        code = ListingRetryErrorCode(d.pop("code"))

        message = d.pop("message")

        listing_retry_error_dto = cls(
            status_code=status_code,
            error=error,
            code=code,
            message=message,
        )

        listing_retry_error_dto.additional_properties = d
        return listing_retry_error_dto

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
