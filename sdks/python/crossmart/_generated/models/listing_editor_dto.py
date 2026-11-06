from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.listing_display_state import ListingDisplayState
from ..models.publish_requirement import PublishRequirement

if TYPE_CHECKING:
    from ..models.connection_summary_dto import ConnectionSummaryDto
    from ..models.inherited_text_dto import InheritedTextDto
    from ..models.inherited_text_list_dto import InheritedTextListDto
    from ..models.inherited_visibility_dto import InheritedVisibilityDto
    from ..models.listing_category_field_dto import ListingCategoryFieldDto
    from ..models.listing_editor_variant_dto import ListingEditorVariantDto
    from ..models.listing_item_specifics_summary_dto import (
        ListingItemSpecificsSummaryDto,
    )
    from ..models.listing_stock_limits_dto import ListingStockLimitsDto
    from ..models.listing_summary_dto import ListingSummaryDto


T = TypeVar("T", bound="ListingEditorDto")


@_attrs_define
class ListingEditorDto:
    """
    Attributes:
        product_id (UUID):
        connection (ConnectionSummaryDto):
        selected (bool): Whether the connection’s product selection includes it
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
        title (InheritedTextDto):
        description_html (InheritedTextDto):
        tags (InheritedTextListDto):
        images (InheritedTextListDto):
        visibility (InheritedVisibilityDto):
        stock (ListingStockLimitsDto):
        variants (list[ListingEditorVariantDto]):
        category (ListingCategoryFieldDto):
        item_specifics (ListingItemSpecificsSummaryDto):
        override_updated_at (datetime.datetime | None): When the overrides last changed; null when there are none
    """

    product_id: UUID
    connection: ConnectionSummaryDto
    selected: bool
    display_state: ListingDisplayState
    display_reason: None | str
    display_requirement: None | PublishRequirement
    listing: ListingSummaryDto | None
    title: InheritedTextDto
    description_html: InheritedTextDto
    tags: InheritedTextListDto
    images: InheritedTextListDto
    visibility: InheritedVisibilityDto
    stock: ListingStockLimitsDto
    variants: list[ListingEditorVariantDto]
    category: ListingCategoryFieldDto
    item_specifics: ListingItemSpecificsSummaryDto
    override_updated_at: datetime.datetime | None
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.listing_summary_dto import ListingSummaryDto

        product_id = str(self.product_id)

        connection = self.connection.to_dict()

        selected = self.selected

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

        title = self.title.to_dict()

        description_html = self.description_html.to_dict()

        tags = self.tags.to_dict()

        images = self.images.to_dict()

        visibility = self.visibility.to_dict()

        stock = self.stock.to_dict()

        variants = []
        for variants_item_data in self.variants:
            variants_item = variants_item_data.to_dict()
            variants.append(variants_item)

        category = self.category.to_dict()

        item_specifics = self.item_specifics.to_dict()

        override_updated_at: None | str
        if isinstance(self.override_updated_at, datetime.datetime):
            override_updated_at = self.override_updated_at.isoformat()
        else:
            override_updated_at = self.override_updated_at

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "productId": product_id,
                "connection": connection,
                "selected": selected,
                "displayState": display_state,
                "displayReason": display_reason,
                "displayRequirement": display_requirement,
                "listing": listing,
                "title": title,
                "descriptionHtml": description_html,
                "tags": tags,
                "images": images,
                "visibility": visibility,
                "stock": stock,
                "variants": variants,
                "category": category,
                "itemSpecifics": item_specifics,
                "overrideUpdatedAt": override_updated_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.connection_summary_dto import ConnectionSummaryDto
        from ..models.inherited_text_dto import InheritedTextDto
        from ..models.inherited_text_list_dto import InheritedTextListDto
        from ..models.inherited_visibility_dto import InheritedVisibilityDto
        from ..models.listing_category_field_dto import ListingCategoryFieldDto
        from ..models.listing_editor_variant_dto import ListingEditorVariantDto
        from ..models.listing_item_specifics_summary_dto import (
            ListingItemSpecificsSummaryDto,
        )
        from ..models.listing_stock_limits_dto import ListingStockLimitsDto
        from ..models.listing_summary_dto import ListingSummaryDto

        d = dict(src_dict)
        product_id = UUID(d.pop("productId"))

        connection = ConnectionSummaryDto.from_dict(d.pop("connection"))

        selected = d.pop("selected")

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

        title = InheritedTextDto.from_dict(d.pop("title"))

        description_html = InheritedTextDto.from_dict(d.pop("descriptionHtml"))

        tags = InheritedTextListDto.from_dict(d.pop("tags"))

        images = InheritedTextListDto.from_dict(d.pop("images"))

        visibility = InheritedVisibilityDto.from_dict(d.pop("visibility"))

        stock = ListingStockLimitsDto.from_dict(d.pop("stock"))

        variants = []
        _variants = d.pop("variants")
        for variants_item_data in _variants:
            variants_item = ListingEditorVariantDto.from_dict(variants_item_data)

            variants.append(variants_item)

        category = ListingCategoryFieldDto.from_dict(d.pop("category"))

        item_specifics = ListingItemSpecificsSummaryDto.from_dict(
            d.pop("itemSpecifics")
        )

        def _parse_override_updated_at(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                override_updated_at_type_0 = datetime.datetime.fromisoformat(data)

                return override_updated_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        override_updated_at = _parse_override_updated_at(d.pop("overrideUpdatedAt"))

        listing_editor_dto = cls(
            product_id=product_id,
            connection=connection,
            selected=selected,
            display_state=display_state,
            display_reason=display_reason,
            display_requirement=display_requirement,
            listing=listing,
            title=title,
            description_html=description_html,
            tags=tags,
            images=images,
            visibility=visibility,
            stock=stock,
            variants=variants,
            category=category,
            item_specifics=item_specifics,
            override_updated_at=override_updated_at,
        )

        listing_editor_dto.additional_properties = d
        return listing_editor_dto

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
