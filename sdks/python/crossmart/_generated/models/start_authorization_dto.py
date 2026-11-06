from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.channel_type import ChannelType

T = TypeVar("T", bound="StartAuthorizationDto")


@_attrs_define
class StartAuthorizationDto:
    """
    Attributes:
        channel (ChannelType):
        account_handle (str): The account to connect. For Shopify, the store’s myshopify.com domain or handle. For eBay,
            the marketplace id, such as `EBAY_US`. For Etsy, the shop name (the merchant must sign in to that shop).
            Example: demo-store.myshopify.com.
    """

    channel: ChannelType
    account_handle: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        channel = self.channel.value

        account_handle = self.account_handle

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "channel": channel,
                "accountHandle": account_handle,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        channel = ChannelType(d.pop("channel"))

        account_handle = d.pop("accountHandle")

        start_authorization_dto = cls(
            channel=channel,
            account_handle=account_handle,
        )

        start_authorization_dto.additional_properties = d
        return start_authorization_dto

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
