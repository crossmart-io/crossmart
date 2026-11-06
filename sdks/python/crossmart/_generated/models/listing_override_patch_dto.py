from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.listing_visibility import ListingVisibility
from ..types import UNSET, Unset

if TYPE_CHECKING:
    from ..models.variant_price_override_dto import VariantPriceOverrideDto


T = TypeVar("T", bound="ListingOverridePatchDto")


@_attrs_define
class ListingOverridePatchDto:
    """
    Attributes:
        title (None | str | Unset):
        description_html (None | str | Unset):
        vendor (None | str | Unset): The brand this channel shows instead of the product’s vendor
        tags (list[str] | None | Unset): Replaces the product’s tags
        media_urls (list[str] | None | Unset): The product’s image URLs to show, in order
        visibility (ListingVisibility | None | Unset): Show or hide on this channel, whatever the product’s status
        inventory_buffer (float | None | Unset): Units held back
        max_quantity (float | None | Unset): Most units shown
        variant_prices (list[VariantPriceOverrideDto] | Unset):
    """

    title: None | str | Unset = UNSET
    description_html: None | str | Unset = UNSET
    vendor: None | str | Unset = UNSET
    tags: list[str] | None | Unset = UNSET
    media_urls: list[str] | None | Unset = UNSET
    visibility: ListingVisibility | None | Unset = UNSET
    inventory_buffer: float | None | Unset = UNSET
    max_quantity: float | None | Unset = UNSET
    variant_prices: list[VariantPriceOverrideDto] | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        title: None | str | Unset
        if isinstance(self.title, Unset):
            title = UNSET
        else:
            title = self.title

        description_html: None | str | Unset
        if isinstance(self.description_html, Unset):
            description_html = UNSET
        else:
            description_html = self.description_html

        vendor: None | str | Unset
        if isinstance(self.vendor, Unset):
            vendor = UNSET
        else:
            vendor = self.vendor

        tags: list[str] | None | Unset
        if isinstance(self.tags, Unset):
            tags = UNSET
        elif isinstance(self.tags, list):
            tags = self.tags

        else:
            tags = self.tags

        media_urls: list[str] | None | Unset
        if isinstance(self.media_urls, Unset):
            media_urls = UNSET
        elif isinstance(self.media_urls, list):
            media_urls = self.media_urls

        else:
            media_urls = self.media_urls

        visibility: None | str | Unset
        if isinstance(self.visibility, Unset):
            visibility = UNSET
        elif isinstance(self.visibility, ListingVisibility):
            visibility = self.visibility.value
        else:
            visibility = self.visibility

        inventory_buffer: float | None | Unset
        if isinstance(self.inventory_buffer, Unset):
            inventory_buffer = UNSET
        else:
            inventory_buffer = self.inventory_buffer

        max_quantity: float | None | Unset
        if isinstance(self.max_quantity, Unset):
            max_quantity = UNSET
        else:
            max_quantity = self.max_quantity

        variant_prices: list[dict[str, Any]] | Unset = UNSET
        if not isinstance(self.variant_prices, Unset):
            variant_prices = []
            for variant_prices_item_data in self.variant_prices:
                variant_prices_item = variant_prices_item_data.to_dict()
                variant_prices.append(variant_prices_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({})
        if title is not UNSET:
            field_dict["title"] = title
        if description_html is not UNSET:
            field_dict["descriptionHtml"] = description_html
        if vendor is not UNSET:
            field_dict["vendor"] = vendor
        if tags is not UNSET:
            field_dict["tags"] = tags
        if media_urls is not UNSET:
            field_dict["mediaUrls"] = media_urls
        if visibility is not UNSET:
            field_dict["visibility"] = visibility
        if inventory_buffer is not UNSET:
            field_dict["inventoryBuffer"] = inventory_buffer
        if max_quantity is not UNSET:
            field_dict["maxQuantity"] = max_quantity
        if variant_prices is not UNSET:
            field_dict["variantPrices"] = variant_prices

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.variant_price_override_dto import VariantPriceOverrideDto

        d = dict(src_dict)

        def _parse_title(data: object) -> None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(None | str | Unset, data)

        title = _parse_title(d.pop("title", UNSET))

        def _parse_description_html(data: object) -> None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(None | str | Unset, data)

        description_html = _parse_description_html(d.pop("descriptionHtml", UNSET))

        def _parse_vendor(data: object) -> None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(None | str | Unset, data)

        vendor = _parse_vendor(d.pop("vendor", UNSET))

        def _parse_tags(data: object) -> list[str] | None | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            try:
                if not isinstance(data, list):
                    raise TypeError()
                tags_type_0 = cast(list[str], data)

                return tags_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(list[str] | None | Unset, data)

        tags = _parse_tags(d.pop("tags", UNSET))

        def _parse_media_urls(data: object) -> list[str] | None | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            try:
                if not isinstance(data, list):
                    raise TypeError()
                media_urls_type_0 = cast(list[str], data)

                return media_urls_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(list[str] | None | Unset, data)

        media_urls = _parse_media_urls(d.pop("mediaUrls", UNSET))

        def _parse_visibility(data: object) -> ListingVisibility | None | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                visibility_type_0 = ListingVisibility(data)

                return visibility_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(ListingVisibility | None | Unset, data)

        visibility = _parse_visibility(d.pop("visibility", UNSET))

        def _parse_inventory_buffer(data: object) -> float | None | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(float | None | Unset, data)

        inventory_buffer = _parse_inventory_buffer(d.pop("inventoryBuffer", UNSET))

        def _parse_max_quantity(data: object) -> float | None | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(float | None | Unset, data)

        max_quantity = _parse_max_quantity(d.pop("maxQuantity", UNSET))

        _variant_prices = d.pop("variantPrices", UNSET)
        variant_prices: list[VariantPriceOverrideDto] | Unset = UNSET
        if _variant_prices is not UNSET:
            variant_prices = []
            for variant_prices_item_data in _variant_prices:
                variant_prices_item = VariantPriceOverrideDto.from_dict(
                    variant_prices_item_data
                )

                variant_prices.append(variant_prices_item)

        listing_override_patch_dto = cls(
            title=title,
            description_html=description_html,
            vendor=vendor,
            tags=tags,
            media_urls=media_urls,
            visibility=visibility,
            inventory_buffer=inventory_buffer,
            max_quantity=max_quantity,
            variant_prices=variant_prices,
        )

        listing_override_patch_dto.additional_properties = d
        return listing_override_patch_dto

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
