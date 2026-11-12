from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.channel_connection_dto import ChannelConnectionDto


T = TypeVar("T", bound="ConnectedChannelDto")


@_attrs_define
class ConnectedChannelDto:
    """
    Attributes:
        connection (ChannelConnectionDto):
        reconnected (bool): True when the account was connected before and got new keys
    """

    connection: ChannelConnectionDto
    reconnected: bool
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        connection = self.connection.to_dict()

        reconnected = self.reconnected

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "connection": connection,
                "reconnected": reconnected,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.channel_connection_dto import ChannelConnectionDto

        d = dict(src_dict)
        connection = ChannelConnectionDto.from_dict(d.pop("connection"))

        reconnected = d.pop("reconnected")

        connected_channel_dto = cls(
            connection=connection,
            reconnected=reconnected,
        )

        connected_channel_dto.additional_properties = d
        return connected_channel_dto

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
