from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.channel_type import ChannelType

T = TypeVar("T", bound="SoldProductStoreDto")


@_attrs_define
class SoldProductStoreDto:
    """
    Attributes:
        connection_id (UUID):
        channel (ChannelType):
        display_name (str):
    """

    connection_id: UUID
    channel: ChannelType
    display_name: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        connection_id = str(self.connection_id)

        channel = self.channel.value

        display_name = self.display_name

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "connectionId": connection_id,
                "channel": channel,
                "displayName": display_name,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        connection_id = UUID(d.pop("connectionId"))

        channel = ChannelType(d.pop("channel"))

        display_name = d.pop("displayName")

        sold_product_store_dto = cls(
            connection_id=connection_id,
            channel=channel,
            display_name=display_name,
        )

        sold_product_store_dto.additional_properties = d
        return sold_product_store_dto

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
