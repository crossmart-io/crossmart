from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.listing_display_state import ListingDisplayState

if TYPE_CHECKING:
    from ..models.channel_variant_dto import ChannelVariantDto
    from ..models.connection_summary_dto import ConnectionSummaryDto
    from ..models.listing_override_view_dto import ListingOverrideViewDto
    from ..models.listing_summary_dto import ListingSummaryDto


T = TypeVar("T", bound="ProductChannelDto")


@_attrs_define
class ProductChannelDto:
    """
    Attributes:
        connection (ConnectionSummaryDto):
        selected (bool): Whether the connection’s product selection includes it
        display_state (ListingDisplayState): The product on this store, in one state computed by the server: `draft`
            (not selected for the store), `needs_details` (selected, but the store setup or the product lacks something
            publishing needs), `ready` (publishable, not sent yet), `publishing` (queued or in flight), `published`,
            `failed`, `removing` (being taken off) or `removed`.
        display_reason (None | str): For `needs_details` and `failed`: a short, merchant-readable reason (what to add,
            or the channel’s message). Never holds secrets. Null for the other states. Example: Choose a shipping policy in
            this eBay connection’s listing defaults..
        listing (ListingSummaryDto | None):
        override (ListingOverrideViewDto | None):
        variants (list[ChannelVariantDto]):
    """

    connection: ConnectionSummaryDto
    selected: bool
    display_state: ListingDisplayState
    display_reason: None | str
    listing: ListingSummaryDto | None
    override: ListingOverrideViewDto | None
    variants: list[ChannelVariantDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.listing_override_view_dto import ListingOverrideViewDto
        from ..models.listing_summary_dto import ListingSummaryDto

        connection = self.connection.to_dict()

        selected = self.selected

        display_state = self.display_state.value

        display_reason: None | str
        display_reason = self.display_reason

        listing: dict[str, Any] | None
        if isinstance(self.listing, ListingSummaryDto):
            listing = self.listing.to_dict()
        else:
            listing = self.listing

        override: dict[str, Any] | None
        if isinstance(self.override, ListingOverrideViewDto):
            override = self.override.to_dict()
        else:
            override = self.override

        variants = []
        for variants_item_data in self.variants:
            variants_item = variants_item_data.to_dict()
            variants.append(variants_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "connection": connection,
                "selected": selected,
                "displayState": display_state,
                "displayReason": display_reason,
                "listing": listing,
                "override": override,
                "variants": variants,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.channel_variant_dto import ChannelVariantDto
        from ..models.connection_summary_dto import ConnectionSummaryDto
        from ..models.listing_override_view_dto import ListingOverrideViewDto
        from ..models.listing_summary_dto import ListingSummaryDto

        d = dict(src_dict)
        connection = ConnectionSummaryDto.from_dict(d.pop("connection"))

        selected = d.pop("selected")

        display_state = ListingDisplayState(d.pop("displayState"))

        def _parse_display_reason(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        display_reason = _parse_display_reason(d.pop("displayReason"))

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

        def _parse_override(data: object) -> ListingOverrideViewDto | None:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                override_type_0 = ListingOverrideViewDto.from_dict(data)

                return override_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(ListingOverrideViewDto | None, data)

        override = _parse_override(d.pop("override"))

        variants = []
        _variants = d.pop("variants")
        for variants_item_data in _variants:
            variants_item = ChannelVariantDto.from_dict(variants_item_data)

            variants.append(variants_item)

        product_channel_dto = cls(
            connection=connection,
            selected=selected,
            display_state=display_state,
            display_reason=display_reason,
            listing=listing,
            override=override,
            variants=variants,
        )

        product_channel_dto.additional_properties = d
        return product_channel_dto

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
