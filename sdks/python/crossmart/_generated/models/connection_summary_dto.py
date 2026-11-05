from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.channel_connection_status import ChannelConnectionStatus
from ..models.channel_type import ChannelType

T = TypeVar("T", bound="ConnectionSummaryDto")


@_attrs_define
class ConnectionSummaryDto:
    """
    Attributes:
        id (UUID):
        channel (ChannelType):
        display_name (str):
        status (ChannelConnectionStatus):
        currency_code (str):  Example: USD.
    """

    id: UUID
    channel: ChannelType
    display_name: str
    status: ChannelConnectionStatus
    currency_code: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = str(self.id)

        channel = self.channel.value

        display_name = self.display_name

        status = self.status.value

        currency_code = self.currency_code

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "channel": channel,
                "displayName": display_name,
                "status": status,
                "currencyCode": currency_code,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        id = UUID(d.pop("id"))

        channel = ChannelType(d.pop("channel"))

        display_name = d.pop("displayName")

        status = ChannelConnectionStatus(d.pop("status"))

        currency_code = d.pop("currencyCode")

        connection_summary_dto = cls(
            id=id,
            channel=channel,
            display_name=display_name,
            status=status,
            currency_code=currency_code,
        )

        connection_summary_dto.additional_properties = d
        return connection_summary_dto

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
