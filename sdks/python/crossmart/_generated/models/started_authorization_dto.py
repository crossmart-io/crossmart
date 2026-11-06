from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="StartedAuthorizationDto")


@_attrs_define
class StartedAuthorizationDto:
    """
    Attributes:
        authorization_url (str): Send the merchant here to approve the app on the channel
        account_handle (str): The account handle, normalized: a myshopify.com domain, an eBay marketplace id, or a
            lower-cased Etsy shop name Example: demo-store.myshopify.com.
        external_account_id (str): The same value as `accountHandle`. Use `accountHandle` instead. Example: demo-
            store.myshopify.com.
    """

    authorization_url: str
    account_handle: str
    external_account_id: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        authorization_url = self.authorization_url

        account_handle = self.account_handle

        external_account_id = self.external_account_id

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "authorizationUrl": authorization_url,
                "accountHandle": account_handle,
                "externalAccountId": external_account_id,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        authorization_url = d.pop("authorizationUrl")

        account_handle = d.pop("accountHandle")

        external_account_id = d.pop("externalAccountId")

        started_authorization_dto = cls(
            authorization_url=authorization_url,
            account_handle=account_handle,
            external_account_id=external_account_id,
        )

        started_authorization_dto.additional_properties = d
        return started_authorization_dto

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
