from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.channel_product_state import ChannelProductState

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
        listing (ListingSummaryDto | None):
    """

    product: ProductSummaryDto
    state: ChannelProductState
    listing: ListingSummaryDto | None
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.listing_summary_dto import ListingSummaryDto

        product = self.product.to_dict()

        state = self.state.value

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
