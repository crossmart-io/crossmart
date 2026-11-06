from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.listing_display_state import ListingDisplayState
from ..models.listing_source import ListingSource
from ..models.listing_status import ListingStatus
from ..models.publish_requirement import PublishRequirement

if TYPE_CHECKING:
    from ..models.channel_category_dto import ChannelCategoryDto


T = TypeVar("T", bound="StoreListingFailureDto")


@_attrs_define
class StoreListingFailureDto:
    """
    Attributes:
        id (UUID):
        status (ListingStatus):
        source (ListingSource):
        external_id (None | str): The product’s id on the channel
        external_url (None | str): Where to see it on the channel
        last_error (None | str): Why the last sync failed
        missing_requirement (None | PublishRequirement): What the channel refused the last publish for lacking (such as
            `item_specifics`), when the merchant can add it; null otherwise
        last_synced_at (datetime.datetime | None):
        sync_requested_at (datetime.datetime | None): When a sync or retry queued its publish, update or delist; null
            once that job finished or gave up. While set, a selected listing shows `displayState: publishing`.
        category (ChannelCategoryDto | None): The channel category it is listed in, on channels with categories (eBay)
        product_id (UUID):
        product_title (str):
        image_url (None | str):
        variant_count (float):
        display_state (ListingDisplayState): The product on this store, in one state computed by the server: `draft`
            (not selected for the store), `needs_details` (selected, but the store setup or the product lacks something
            publishing needs), `ready` (publishable, not sent yet), `publishing` (queued or in flight, including an update
            of a published listing that a sync or retry queued), `published`, `failed`, `removing` (being taken off) or
            `removed`.
        display_reason (None | str): For `needs_details` and `failed`: a short, merchant-readable reason (what to add,
            or the channel’s message). Never holds secrets. Null for the other states. Example: Choose a shipping policy in
            this eBay connection’s listing defaults..
        display_requirement (None | PublishRequirement): For `needs_details`: the requirement to fix first, so a client
            can open the right place. Store-setup requirements (`reconnect`, `account_settings`, `shipping_policy`,
            `payment_policy`, `return_policy`, `ship_from_location`, `listing_setup`) come before the product’s (`images`,
            `active_product`, `option_names`), which the server checks before publishing; `category` and `item_specifics`
            are known once the channel refused a publish. Null for the other states.
        connection_id (UUID): The store the listing is on
    """

    id: UUID
    status: ListingStatus
    source: ListingSource
    external_id: None | str
    external_url: None | str
    last_error: None | str
    missing_requirement: None | PublishRequirement
    last_synced_at: datetime.datetime | None
    sync_requested_at: datetime.datetime | None
    category: ChannelCategoryDto | None
    product_id: UUID
    product_title: str
    image_url: None | str
    variant_count: float
    display_state: ListingDisplayState
    display_reason: None | str
    display_requirement: None | PublishRequirement
    connection_id: UUID
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

        missing_requirement: None | str
        if isinstance(self.missing_requirement, PublishRequirement):
            missing_requirement = self.missing_requirement.value
        else:
            missing_requirement = self.missing_requirement

        last_synced_at: None | str
        if isinstance(self.last_synced_at, datetime.datetime):
            last_synced_at = self.last_synced_at.isoformat()
        else:
            last_synced_at = self.last_synced_at

        sync_requested_at: None | str
        if isinstance(self.sync_requested_at, datetime.datetime):
            sync_requested_at = self.sync_requested_at.isoformat()
        else:
            sync_requested_at = self.sync_requested_at

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

        display_state = self.display_state.value

        display_reason: None | str
        display_reason = self.display_reason

        display_requirement: None | str
        if isinstance(self.display_requirement, PublishRequirement):
            display_requirement = self.display_requirement.value
        else:
            display_requirement = self.display_requirement

        connection_id = str(self.connection_id)

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
                "missingRequirement": missing_requirement,
                "lastSyncedAt": last_synced_at,
                "syncRequestedAt": sync_requested_at,
                "category": category,
                "productId": product_id,
                "productTitle": product_title,
                "imageUrl": image_url,
                "variantCount": variant_count,
                "displayState": display_state,
                "displayReason": display_reason,
                "displayRequirement": display_requirement,
                "connectionId": connection_id,
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

        def _parse_sync_requested_at(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                sync_requested_at_type_0 = datetime.datetime.fromisoformat(data)

                return sync_requested_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        sync_requested_at = _parse_sync_requested_at(d.pop("syncRequestedAt"))

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

        display_state = ListingDisplayState(d.pop("displayState"))

        def _parse_display_reason(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        display_reason = _parse_display_reason(d.pop("displayReason"))

        def _parse_display_requirement(data: object) -> None | PublishRequirement:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                display_requirement_type_0 = PublishRequirement(data)

                return display_requirement_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | PublishRequirement, data)

        display_requirement = _parse_display_requirement(d.pop("displayRequirement"))

        connection_id = UUID(d.pop("connectionId"))

        store_listing_failure_dto = cls(
            id=id,
            status=status,
            source=source,
            external_id=external_id,
            external_url=external_url,
            last_error=last_error,
            missing_requirement=missing_requirement,
            last_synced_at=last_synced_at,
            sync_requested_at=sync_requested_at,
            category=category,
            product_id=product_id,
            product_title=product_title,
            image_url=image_url,
            variant_count=variant_count,
            display_state=display_state,
            display_reason=display_reason,
            display_requirement=display_requirement,
            connection_id=connection_id,
        )

        store_listing_failure_dto.additional_properties = d
        return store_listing_failure_dto

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
