from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.channel_type import ChannelType
from ..models.connect_failure import ConnectFailure
from ..types import UNSET, Unset

T = TypeVar("T", bound="ChannelConnectRedirectDto")


@_attrs_define
class ChannelConnectRedirectDto:
    """
    Attributes:
        connected (ChannelType | Unset):
        error (ConnectFailure | Unset): Set when connecting failed
        channel (ChannelType | Unset):
    """

    connected: ChannelType | Unset = UNSET
    error: ConnectFailure | Unset = UNSET
    channel: ChannelType | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        connected: str | Unset = UNSET
        if not isinstance(self.connected, Unset):
            connected = self.connected.value

        error: str | Unset = UNSET
        if not isinstance(self.error, Unset):
            error = self.error.value

        channel: str | Unset = UNSET
        if not isinstance(self.channel, Unset):
            channel = self.channel.value

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({})
        if connected is not UNSET:
            field_dict["connected"] = connected
        if error is not UNSET:
            field_dict["error"] = error
        if channel is not UNSET:
            field_dict["channel"] = channel

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        _connected = d.pop("connected", UNSET)
        connected: ChannelType | Unset
        if isinstance(_connected, Unset):
            connected = UNSET
        else:
            connected = ChannelType(_connected)

        _error = d.pop("error", UNSET)
        error: ConnectFailure | Unset
        if isinstance(_error, Unset):
            error = UNSET
        else:
            error = ConnectFailure(_error)

        _channel = d.pop("channel", UNSET)
        channel: ChannelType | Unset
        if isinstance(_channel, Unset):
            channel = UNSET
        else:
            channel = ChannelType(_channel)

        channel_connect_redirect_dto = cls(
            connected=connected,
            error=error,
            channel=channel,
        )

        channel_connect_redirect_dto.additional_properties = d
        return channel_connect_redirect_dto

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
