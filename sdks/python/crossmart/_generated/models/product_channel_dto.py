from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

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
        listing (ListingSummaryDto | None):
        override (ListingOverrideViewDto | None):
        variants (list[ChannelVariantDto]):
    """

    connection: ConnectionSummaryDto
    selected: bool
    listing: ListingSummaryDto | None
    override: ListingOverrideViewDto | None
    variants: list[ChannelVariantDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.listing_override_view_dto import ListingOverrideViewDto
        from ..models.listing_summary_dto import ListingSummaryDto

        connection = self.connection.to_dict()

        selected = self.selected

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
