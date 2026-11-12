from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.channel_type import ChannelType

if TYPE_CHECKING:
    from ..models.falabella_credentials_dto import FalabellaCredentialsDto


T = TypeVar("T", bound="ConnectWithCredentialsDto")


@_attrs_define
class ConnectWithCredentialsDto:
    """
    Attributes:
        channel (ChannelType):
        credentials (FalabellaCredentialsDto):
    """

    channel: ChannelType
    credentials: FalabellaCredentialsDto
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        channel = self.channel.value

        credentials = self.credentials.to_dict()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "channel": channel,
                "credentials": credentials,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.falabella_credentials_dto import FalabellaCredentialsDto

        d = dict(src_dict)
        channel = ChannelType(d.pop("channel"))

        credentials = FalabellaCredentialsDto.from_dict(d.pop("credentials"))

        connect_with_credentials_dto = cls(
            channel=channel,
            credentials=credentials,
        )

        connect_with_credentials_dto.additional_properties = d
        return connect_with_credentials_dto

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
