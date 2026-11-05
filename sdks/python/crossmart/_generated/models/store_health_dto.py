from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.channel_connection_status import ChannelConnectionStatus

if TYPE_CHECKING:
    from ..models.listing_status_count_dto import ListingStatusCountDto


T = TypeVar("T", bound="StoreHealthDto")


@_attrs_define
class StoreHealthDto:
    """
    Attributes:
        connection_id (UUID):
        channel (str):  Example: shopify.
        display_name (str):  Example: Demo Store.
        status (ChannelConnectionStatus):
        last_synced_at (datetime.datetime | None):
        listings (list[ListingStatusCountDto]): Every listing status, in order
    """

    connection_id: UUID
    channel: str
    display_name: str
    status: ChannelConnectionStatus
    last_synced_at: datetime.datetime | None
    listings: list[ListingStatusCountDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        connection_id = str(self.connection_id)

        channel = self.channel

        display_name = self.display_name

        status = self.status.value

        last_synced_at: None | str
        if isinstance(self.last_synced_at, datetime.datetime):
            last_synced_at = self.last_synced_at.isoformat()
        else:
            last_synced_at = self.last_synced_at

        listings = []
        for listings_item_data in self.listings:
            listings_item = listings_item_data.to_dict()
            listings.append(listings_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "connectionId": connection_id,
                "channel": channel,
                "displayName": display_name,
                "status": status,
                "lastSyncedAt": last_synced_at,
                "listings": listings,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.listing_status_count_dto import ListingStatusCountDto

        d = dict(src_dict)
        connection_id = UUID(d.pop("connectionId"))

        channel = d.pop("channel")

        display_name = d.pop("displayName")

        status = ChannelConnectionStatus(d.pop("status"))

        def _parse_last_synced_at(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                last_synced_at_type_0 = datetime.datetime.fromisoformat(data)

                return last_synced_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        last_synced_at = _parse_last_synced_at(d.pop("lastSyncedAt"))

        listings = []
        _listings = d.pop("listings")
        for listings_item_data in _listings:
            listings_item = ListingStatusCountDto.from_dict(listings_item_data)

            listings.append(listings_item)

        store_health_dto = cls(
            connection_id=connection_id,
            channel=channel,
            display_name=display_name,
            status=status,
            last_synced_at=last_synced_at,
            listings=listings,
        )

        store_health_dto.additional_properties = d
        return store_health_dto

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
