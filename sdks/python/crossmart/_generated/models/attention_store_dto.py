from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.attention_store_reason import AttentionStoreReason
from ..models.channel_connection_status import ChannelConnectionStatus
from ..models.channel_type import ChannelType

T = TypeVar("T", bound="AttentionStoreDto")


@_attrs_define
class AttentionStoreDto:
    """
    Attributes:
        connection_id (UUID):
        channel (ChannelType):
        display_name (str):
        status (ChannelConnectionStatus):
        status_reason (None | str):
        reason (AttentionStoreReason):
        live_listings (float): Listings still on the channel (not delisted)
    """

    connection_id: UUID
    channel: ChannelType
    display_name: str
    status: ChannelConnectionStatus
    status_reason: None | str
    reason: AttentionStoreReason
    live_listings: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        connection_id = str(self.connection_id)

        channel = self.channel.value

        display_name = self.display_name

        status = self.status.value

        status_reason: None | str
        status_reason = self.status_reason

        reason = self.reason.value

        live_listings = self.live_listings

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "connectionId": connection_id,
                "channel": channel,
                "displayName": display_name,
                "status": status,
                "statusReason": status_reason,
                "reason": reason,
                "liveListings": live_listings,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        connection_id = UUID(d.pop("connectionId"))

        channel = ChannelType(d.pop("channel"))

        display_name = d.pop("displayName")

        status = ChannelConnectionStatus(d.pop("status"))

        def _parse_status_reason(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        status_reason = _parse_status_reason(d.pop("statusReason"))

        reason = AttentionStoreReason(d.pop("reason"))

        live_listings = d.pop("liveListings")

        attention_store_dto = cls(
            connection_id=connection_id,
            channel=channel,
            display_name=display_name,
            status=status,
            status_reason=status_reason,
            reason=reason,
            live_listings=live_listings,
        )

        attention_store_dto.additional_properties = d
        return attention_store_dto

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
