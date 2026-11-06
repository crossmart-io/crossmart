from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.listing_visibility import ListingVisibility

if TYPE_CHECKING:
    from ..models.variant_price_override_dto import VariantPriceOverrideDto


T = TypeVar("T", bound="ListingOverrideViewDto")


@_attrs_define
class ListingOverrideViewDto:
    """
    Attributes:
        title (None | str):
        description_html (None | str):
        tags (list[str] | None):
        media_urls (list[str] | None):
        visibility (ListingVisibility | None):
        inventory_buffer (float | None):
        max_quantity (float | None):
        variant_prices (list[VariantPriceOverrideDto]):
        updated_at (datetime.datetime):
    """

    title: None | str
    description_html: None | str
    tags: list[str] | None
    media_urls: list[str] | None
    visibility: ListingVisibility | None
    inventory_buffer: float | None
    max_quantity: float | None
    variant_prices: list[VariantPriceOverrideDto]
    updated_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        title: None | str
        title = self.title

        description_html: None | str
        description_html = self.description_html

        tags: list[str] | None
        if isinstance(self.tags, list):
            tags = self.tags

        else:
            tags = self.tags

        media_urls: list[str] | None
        if isinstance(self.media_urls, list):
            media_urls = self.media_urls

        else:
            media_urls = self.media_urls

        visibility: None | str
        if isinstance(self.visibility, ListingVisibility):
            visibility = self.visibility.value
        else:
            visibility = self.visibility

        inventory_buffer: float | None
        inventory_buffer = self.inventory_buffer

        max_quantity: float | None
        max_quantity = self.max_quantity

        variant_prices = []
        for variant_prices_item_data in self.variant_prices:
            variant_prices_item = variant_prices_item_data.to_dict()
            variant_prices.append(variant_prices_item)

        updated_at = self.updated_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "title": title,
                "descriptionHtml": description_html,
                "tags": tags,
                "mediaUrls": media_urls,
                "visibility": visibility,
                "inventoryBuffer": inventory_buffer,
                "maxQuantity": max_quantity,
                "variantPrices": variant_prices,
                "updatedAt": updated_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.variant_price_override_dto import VariantPriceOverrideDto

        d = dict(src_dict)

        def _parse_title(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        title = _parse_title(d.pop("title"))

        def _parse_description_html(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        description_html = _parse_description_html(d.pop("descriptionHtml"))

        def _parse_tags(data: object) -> list[str] | None:
            if data is None:
                return data
            try:
                if not isinstance(data, list):
                    raise TypeError()
                tags_type_0 = cast(list[str], data)

                return tags_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(list[str] | None, data)

        tags = _parse_tags(d.pop("tags"))

        def _parse_media_urls(data: object) -> list[str] | None:
            if data is None:
                return data
            try:
                if not isinstance(data, list):
                    raise TypeError()
                media_urls_type_0 = cast(list[str], data)

                return media_urls_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(list[str] | None, data)

        media_urls = _parse_media_urls(d.pop("mediaUrls"))

        def _parse_visibility(data: object) -> ListingVisibility | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                visibility_type_0 = ListingVisibility(data)

                return visibility_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(ListingVisibility | None, data)

        visibility = _parse_visibility(d.pop("visibility"))

        def _parse_inventory_buffer(data: object) -> float | None:
            if data is None:
                return data
            return cast(float | None, data)

        inventory_buffer = _parse_inventory_buffer(d.pop("inventoryBuffer"))

        def _parse_max_quantity(data: object) -> float | None:
            if data is None:
                return data
            return cast(float | None, data)

        max_quantity = _parse_max_quantity(d.pop("maxQuantity"))

        variant_prices = []
        _variant_prices = d.pop("variantPrices")
        for variant_prices_item_data in _variant_prices:
            variant_prices_item = VariantPriceOverrideDto.from_dict(
                variant_prices_item_data
            )

            variant_prices.append(variant_prices_item)

        updated_at = datetime.datetime.fromisoformat(d.pop("updatedAt"))

        listing_override_view_dto = cls(
            title=title,
            description_html=description_html,
            tags=tags,
            media_urls=media_urls,
            visibility=visibility,
            inventory_buffer=inventory_buffer,
            max_quantity=max_quantity,
            variant_prices=variant_prices,
            updated_at=updated_at,
        )

        listing_override_view_dto.additional_properties = d
        return listing_override_view_dto

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
