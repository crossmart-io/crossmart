from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.channel_connection_status import ChannelConnectionStatus

if TYPE_CHECKING:
    from ..models.listing_state_count_dto import ListingStateCountDto


T = TypeVar("T", bound="StoreListingHealthDto")


@_attrs_define
class StoreListingHealthDto:
    """
    Attributes:
        connection_id (UUID):
        channel (str):  Example: shopify.
        display_name (str):  Example: Demo Store.
        status (ChannelConnectionStatus):
        status_reason (None | str): Why the store needs reconnecting or is in error; null otherwise
        last_synced_at (datetime.datetime | None):
        states (list[ListingStateCountDto]): Every display state, in order, with how many products are in it: the same
            states and rule as the store’s product list (`draft` counts the catalog products not in the store)
        failed_listings (float): Listings the channel refused on their last sync
    """

    connection_id: UUID
    channel: str
    display_name: str
    status: ChannelConnectionStatus
    status_reason: None | str
    last_synced_at: datetime.datetime | None
    states: list[ListingStateCountDto]
    failed_listings: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        connection_id = str(self.connection_id)

        channel = self.channel

        display_name = self.display_name

        status = self.status.value

        status_reason: None | str
        status_reason = self.status_reason

        last_synced_at: None | str
        if isinstance(self.last_synced_at, datetime.datetime):
            last_synced_at = self.last_synced_at.isoformat()
        else:
            last_synced_at = self.last_synced_at

        states = []
        for states_item_data in self.states:
            states_item = states_item_data.to_dict()
            states.append(states_item)

        failed_listings = self.failed_listings

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "connectionId": connection_id,
                "channel": channel,
                "displayName": display_name,
                "status": status,
                "statusReason": status_reason,
                "lastSyncedAt": last_synced_at,
                "states": states,
                "failedListings": failed_listings,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.listing_state_count_dto import ListingStateCountDto

        d = dict(src_dict)
        connection_id = UUID(d.pop("connectionId"))

        channel = d.pop("channel")

        display_name = d.pop("displayName")

        status = ChannelConnectionStatus(d.pop("status"))

        def _parse_status_reason(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        status_reason = _parse_status_reason(d.pop("statusReason"))

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

        states = []
        _states = d.pop("states")
        for states_item_data in _states:
            states_item = ListingStateCountDto.from_dict(states_item_data)

            states.append(states_item)

        failed_listings = d.pop("failedListings")

        store_listing_health_dto = cls(
            connection_id=connection_id,
            channel=channel,
            display_name=display_name,
            status=status,
            status_reason=status_reason,
            last_synced_at=last_synced_at,
            states=states,
            failed_listings=failed_listings,
        )

        store_listing_health_dto.additional_properties = d
        return store_listing_health_dto

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
