from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.channel_type import ChannelType
from ..models.listing_source import ListingSource
from ..models.listing_status import ListingStatus

T = TypeVar("T", bound="ProductStoreBadgeDto")


@_attrs_define
class ProductStoreBadgeDto:
    """
    Attributes:
        connection_id (UUID):
        channel (ChannelType):
        store_name (str):  Example: Demo Store.
        status (ListingStatus):
        source (ListingSource):
    """

    connection_id: UUID
    channel: ChannelType
    store_name: str
    status: ListingStatus
    source: ListingSource
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        connection_id = str(self.connection_id)

        channel = self.channel.value

        store_name = self.store_name

        status = self.status.value

        source = self.source.value

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "connectionId": connection_id,
                "channel": channel,
                "storeName": store_name,
                "status": status,
                "source": source,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        connection_id = UUID(d.pop("connectionId"))

        channel = ChannelType(d.pop("channel"))

        store_name = d.pop("storeName")

        status = ListingStatus(d.pop("status"))

        source = ListingSource(d.pop("source"))

        product_store_badge_dto = cls(
            connection_id=connection_id,
            channel=channel,
            store_name=store_name,
            status=status,
            source=source,
        )

        product_store_badge_dto.additional_properties = d
        return product_store_badge_dto

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
