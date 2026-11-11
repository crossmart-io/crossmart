from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.product_condition import ProductCondition
from ..models.product_status import ProductStatus

if TYPE_CHECKING:
    from ..models.media_dto import MediaDto
    from ..models.variant_dto import VariantDto


T = TypeVar("T", bound="ProductDto")


@_attrs_define
class ProductDto:
    """
    Attributes:
        id (UUID):
        handle (str):
        title (str):
        description_html (str):
        vendor (None | str):
        product_type (None | str):
        tags (list[str]):
        status (ProductStatus):
        condition (None | ProductCondition): The item’s condition; null lists it in each store’s default condition
        option_names (list[str]):  Example: ['Size', 'Color'].
        variants (list[VariantDto]):
        media (list[MediaDto]):
        created_at (datetime.datetime):
        updated_at (datetime.datetime):
    """

    id: UUID
    handle: str
    title: str
    description_html: str
    vendor: None | str
    product_type: None | str
    tags: list[str]
    status: ProductStatus
    condition: None | ProductCondition
    option_names: list[str]
    variants: list[VariantDto]
    media: list[MediaDto]
    created_at: datetime.datetime
    updated_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = str(self.id)

        handle = self.handle

        title = self.title

        description_html = self.description_html

        vendor: None | str
        vendor = self.vendor

        product_type: None | str
        product_type = self.product_type

        tags = self.tags

        status = self.status.value

        condition: None | str
        if isinstance(self.condition, ProductCondition):
            condition = self.condition.value
        else:
            condition = self.condition

        option_names = self.option_names

        variants = []
        for variants_item_data in self.variants:
            variants_item = variants_item_data.to_dict()
            variants.append(variants_item)

        media = []
        for media_item_data in self.media:
            media_item = media_item_data.to_dict()
            media.append(media_item)

        created_at = self.created_at.isoformat()

        updated_at = self.updated_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "handle": handle,
                "title": title,
                "descriptionHtml": description_html,
                "vendor": vendor,
                "productType": product_type,
                "tags": tags,
                "status": status,
                "condition": condition,
                "optionNames": option_names,
                "variants": variants,
                "media": media,
                "createdAt": created_at,
                "updatedAt": updated_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.media_dto import MediaDto
        from ..models.variant_dto import VariantDto

        d = dict(src_dict)
        id = UUID(d.pop("id"))

        handle = d.pop("handle")

        title = d.pop("title")

        description_html = d.pop("descriptionHtml")

        def _parse_vendor(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        vendor = _parse_vendor(d.pop("vendor"))

        def _parse_product_type(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        product_type = _parse_product_type(d.pop("productType"))

        tags = cast(list[str], d.pop("tags"))

        status = ProductStatus(d.pop("status"))

        def _parse_condition(data: object) -> None | ProductCondition:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                condition_type_0 = ProductCondition(data)

                return condition_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | ProductCondition, data)

        condition = _parse_condition(d.pop("condition"))

        option_names = cast(list[str], d.pop("optionNames"))

        variants = []
        _variants = d.pop("variants")
        for variants_item_data in _variants:
            variants_item = VariantDto.from_dict(variants_item_data)

            variants.append(variants_item)

        media = []
        _media = d.pop("media")
        for media_item_data in _media:
            media_item = MediaDto.from_dict(media_item_data)

            media.append(media_item)

        created_at = datetime.datetime.fromisoformat(d.pop("createdAt"))

        updated_at = datetime.datetime.fromisoformat(d.pop("updatedAt"))

        product_dto = cls(
            id=id,
            handle=handle,
            title=title,
            description_html=description_html,
            vendor=vendor,
            product_type=product_type,
            tags=tags,
            status=status,
            condition=condition,
            option_names=option_names,
            variants=variants,
            media=media,
            created_at=created_at,
            updated_at=updated_at,
        )

        product_dto.additional_properties = d
        return product_dto

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
