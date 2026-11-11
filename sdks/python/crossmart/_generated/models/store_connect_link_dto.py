from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.channel_type import ChannelType

T = TypeVar("T", bound="StoreConnectLinkDto")


@_attrs_define
class StoreConnectLinkDto:
    """
    Attributes:
        channel (ChannelType):
        url (str): Opens the Stores page with this channel’s connect dialog
    """

    channel: ChannelType
    url: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        channel = self.channel.value

        url = self.url

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "channel": channel,
                "url": url,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        channel = ChannelType(d.pop("channel"))

        url = d.pop("url")

        store_connect_link_dto = cls(
            channel=channel,
            url=url,
        )

        store_connect_link_dto.additional_properties = d
        return store_connect_link_dto

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
