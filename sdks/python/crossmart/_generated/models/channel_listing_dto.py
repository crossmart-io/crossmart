from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.listing_source import ListingSource
from ..models.listing_status import ListingStatus

if TYPE_CHECKING:
    from ..models.channel_category_dto import ChannelCategoryDto


T = TypeVar("T", bound="ChannelListingDto")


@_attrs_define
class ChannelListingDto:
    """
    Attributes:
        id (UUID):
        status (ListingStatus):
        source (ListingSource):
        external_id (None | str): The product’s id on the channel
        external_url (None | str): Where to see it on the channel
        last_error (None | str): Why the last sync failed
        last_synced_at (datetime.datetime | None):
        category (ChannelCategoryDto | None): The channel category it is listed in, on channels with categories (eBay)
        product_id (UUID):
        product_title (str):
        image_url (None | str):
        variant_count (float):
    """

    id: UUID
    status: ListingStatus
    source: ListingSource
    external_id: None | str
    external_url: None | str
    last_error: None | str
    last_synced_at: datetime.datetime | None
    category: ChannelCategoryDto | None
    product_id: UUID
    product_title: str
    image_url: None | str
    variant_count: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.channel_category_dto import ChannelCategoryDto

        id = str(self.id)

        status = self.status.value

        source = self.source.value

        external_id: None | str
        external_id = self.external_id

        external_url: None | str
        external_url = self.external_url

        last_error: None | str
        last_error = self.last_error

        last_synced_at: None | str
        if isinstance(self.last_synced_at, datetime.datetime):
            last_synced_at = self.last_synced_at.isoformat()
        else:
            last_synced_at = self.last_synced_at

        category: dict[str, Any] | None
        if isinstance(self.category, ChannelCategoryDto):
            category = self.category.to_dict()
        else:
            category = self.category

        product_id = str(self.product_id)

        product_title = self.product_title

        image_url: None | str
        image_url = self.image_url

        variant_count = self.variant_count

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "status": status,
                "source": source,
                "externalId": external_id,
                "externalUrl": external_url,
                "lastError": last_error,
                "lastSyncedAt": last_synced_at,
                "category": category,
                "productId": product_id,
                "productTitle": product_title,
                "imageUrl": image_url,
                "variantCount": variant_count,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.channel_category_dto import ChannelCategoryDto

        d = dict(src_dict)
        id = UUID(d.pop("id"))

        status = ListingStatus(d.pop("status"))

        source = ListingSource(d.pop("source"))

        def _parse_external_id(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        external_id = _parse_external_id(d.pop("externalId"))

        def _parse_external_url(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        external_url = _parse_external_url(d.pop("externalUrl"))

        def _parse_last_error(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        last_error = _parse_last_error(d.pop("lastError"))

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

        def _parse_category(data: object) -> ChannelCategoryDto | None:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                category_type_0 = ChannelCategoryDto.from_dict(data)

                return category_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(ChannelCategoryDto | None, data)

        category = _parse_category(d.pop("category"))

        product_id = UUID(d.pop("productId"))

        product_title = d.pop("productTitle")

        def _parse_image_url(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        image_url = _parse_image_url(d.pop("imageUrl"))

        variant_count = d.pop("variantCount")

        channel_listing_dto = cls(
            id=id,
            status=status,
            source=source,
            external_id=external_id,
            external_url=external_url,
            last_error=last_error,
            last_synced_at=last_synced_at,
            category=category,
            product_id=product_id,
            product_title=product_title,
            image_url=image_url,
            variant_count=variant_count,
        )

        channel_listing_dto.additional_properties = d
        return channel_listing_dto

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
