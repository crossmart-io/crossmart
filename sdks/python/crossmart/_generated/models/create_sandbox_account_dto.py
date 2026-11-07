from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="CreateSandboxAccountDto")


@_attrs_define
class CreateSandboxAccountDto:
    """
    Attributes:
        email (str): The person the account is for. The claim link goes to this address. Example: ana@example.com.
        store_name (str): What to call the store; the person can rename it later Example: Ana Ceramics.
    """

    email: str
    store_name: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        email = self.email

        store_name = self.store_name

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "email": email,
                "storeName": store_name,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        email = d.pop("email")

        store_name = d.pop("storeName")

        create_sandbox_account_dto = cls(
            email=email,
            store_name=store_name,
        )

        create_sandbox_account_dto.additional_properties = d
        return create_sandbox_account_dto

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
