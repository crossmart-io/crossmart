from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.channel_type import ChannelType
from ..models.listing_display_state import ListingDisplayState
from ..models.listing_source import ListingSource
from ..models.listing_status import ListingStatus
from ..models.publish_requirement import PublishRequirement

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
    """

    connection_id: UUID
    channel: ChannelType
    store_name: str
    status: ListingStatus
    source: ListingSource
    display_state: ListingDisplayState
    display_reason: None | str
    display_requirement: None | PublishRequirement
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        connection_id = str(self.connection_id)

        channel = self.channel.value

        store_name = self.store_name

        status = self.status.value

        source = self.source.value

        display_state = self.display_state.value

        display_reason: None | str
        display_reason = self.display_reason

        display_requirement: None | str
        if isinstance(self.display_requirement, PublishRequirement):
            display_requirement = self.display_requirement.value
        else:
            display_requirement = self.display_requirement

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "connectionId": connection_id,
                "channel": channel,
                "storeName": store_name,
                "status": status,
                "source": source,
                "displayState": display_state,
                "displayReason": display_reason,
                "displayRequirement": display_requirement,
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

        product_store_badge_dto = cls(
            connection_id=connection_id,
            channel=channel,
            store_name=store_name,
            status=status,
            source=source,
            display_state=display_state,
            display_reason=display_reason,
            display_requirement=display_requirement,
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
