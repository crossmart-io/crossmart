from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.channel_type import ChannelType
from ..models.publish_requirement import PublishRequirement

T = TypeVar("T", bound="AttentionListingGroupDto")


@_attrs_define
class AttentionListingGroupDto:
    """
    Attributes:
        product_id (UUID):
        product_title (str):
        image_url (None | str):
        connection_id (UUID):
        channel (ChannelType):
        store_name (str):
        failed_listings (float): Failed listings of the product on this store
        last_error (None | str): The channel’s latest refusal
        missing_requirement (None | PublishRequirement): What the channel asks for, when details are missing rather than
            an error
        updated_at (datetime.datetime):
    """

    product_id: UUID
    product_title: str
    image_url: None | str
    connection_id: UUID
    channel: ChannelType
    store_name: str
    failed_listings: float
    last_error: None | str
    missing_requirement: None | PublishRequirement
    updated_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        product_id = str(self.product_id)

        product_title = self.product_title

        image_url: None | str
        image_url = self.image_url

        connection_id = str(self.connection_id)

        channel = self.channel.value

        store_name = self.store_name

        failed_listings = self.failed_listings

        last_error: None | str
        last_error = self.last_error

        missing_requirement: None | str
        if isinstance(self.missing_requirement, PublishRequirement):
            missing_requirement = self.missing_requirement.value
        else:
            missing_requirement = self.missing_requirement

        updated_at = self.updated_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "productId": product_id,
                "productTitle": product_title,
                "imageUrl": image_url,
                "connectionId": connection_id,
                "channel": channel,
                "storeName": store_name,
                "failedListings": failed_listings,
                "lastError": last_error,
                "missingRequirement": missing_requirement,
                "updatedAt": updated_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        product_id = UUID(d.pop("productId"))

        product_title = d.pop("productTitle")

        def _parse_image_url(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        image_url = _parse_image_url(d.pop("imageUrl"))

        connection_id = UUID(d.pop("connectionId"))

        channel = ChannelType(d.pop("channel"))

        store_name = d.pop("storeName")

        failed_listings = d.pop("failedListings")

        def _parse_last_error(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        last_error = _parse_last_error(d.pop("lastError"))

        def _parse_missing_requirement(data: object) -> None | PublishRequirement:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                missing_requirement_type_0 = PublishRequirement(data)

                return missing_requirement_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | PublishRequirement, data)

        missing_requirement = _parse_missing_requirement(d.pop("missingRequirement"))

        updated_at = datetime.datetime.fromisoformat(d.pop("updatedAt"))

        attention_listing_group_dto = cls(
            product_id=product_id,
            product_title=product_title,
            image_url=image_url,
            connection_id=connection_id,
            channel=channel,
            store_name=store_name,
            failed_listings=failed_listings,
            last_error=last_error,
            missing_requirement=missing_requirement,
            updated_at=updated_at,
        )

        attention_listing_group_dto.additional_properties = d
        return attention_listing_group_dto

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
