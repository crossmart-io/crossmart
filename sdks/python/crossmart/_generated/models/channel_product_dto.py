from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.channel_product_state import ChannelProductState
from ..models.listing_display_state import ListingDisplayState
from ..models.publish_requirement import PublishRequirement

if TYPE_CHECKING:
    from ..models.listing_summary_dto import ListingSummaryDto
    from ..models.product_summary_dto import ProductSummaryDto


T = TypeVar("T", bound="ChannelProductDto")


@_attrs_define
class ChannelProductDto:
    """
    Attributes:
        product (ProductSummaryDto):
        state (ChannelProductState):
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
        listing (ListingSummaryDto | None):
    """

    product: ProductSummaryDto
    state: ChannelProductState
    display_state: ListingDisplayState
    display_reason: None | str
    display_requirement: None | PublishRequirement
    listing: ListingSummaryDto | None
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.listing_summary_dto import ListingSummaryDto

        product = self.product.to_dict()

        state = self.state.value

        display_state = self.display_state.value

        display_reason: None | str
        display_reason = self.display_reason

        display_requirement: None | str
        if isinstance(self.display_requirement, PublishRequirement):
            display_requirement = self.display_requirement.value
        else:
            display_requirement = self.display_requirement

        listing: dict[str, Any] | None
        if isinstance(self.listing, ListingSummaryDto):
            listing = self.listing.to_dict()
        else:
            listing = self.listing

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "product": product,
                "state": state,
                "displayState": display_state,
                "displayReason": display_reason,
                "displayRequirement": display_requirement,
                "listing": listing,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.listing_summary_dto import ListingSummaryDto
        from ..models.product_summary_dto import ProductSummaryDto

        d = dict(src_dict)
        product = ProductSummaryDto.from_dict(d.pop("product"))

        state = ChannelProductState(d.pop("state"))

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

        def _parse_listing(data: object) -> ListingSummaryDto | None:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                listing_type_0 = ListingSummaryDto.from_dict(data)

                return listing_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(ListingSummaryDto | None, data)

        listing = _parse_listing(d.pop("listing"))

        channel_product_dto = cls(
            product=product,
            state=state,
            display_state=display_state,
            display_reason=display_reason,
            display_requirement=display_requirement,
            listing=listing,
        )

        channel_product_dto.additional_properties = d
        return channel_product_dto

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
