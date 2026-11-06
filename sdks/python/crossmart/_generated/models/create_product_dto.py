from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.product_status import ProductStatus
from ..types import UNSET, Unset

if TYPE_CHECKING:
    from ..models.create_media_dto import CreateMediaDto
    from ..models.create_variant_dto import CreateVariantDto


T = TypeVar("T", bound="CreateProductDto")


@_attrs_define
class CreateProductDto:
    """
    Attributes:
        title (str):
        variants (list[CreateVariantDto]):
        description_html (str | Unset):
        vendor (str | Unset):
        product_type (str | Unset):
        tags (list[str] | Unset):
        status (ProductStatus | Unset):  Default: ProductStatus.DRAFT.
        option_names (list[str] | Unset):  Example: ['Size', 'Color'].
        media (list[CreateMediaDto] | Unset):
        handle (str | Unset): Unique in the workspace. Defaults to the slugified title, or to `product-<random id>` when
            the title has no Latin letters or digits (such as a Hebrew title).
    """

    title: str
    variants: list[CreateVariantDto]
    description_html: str | Unset = UNSET
    vendor: str | Unset = UNSET
    product_type: str | Unset = UNSET
    tags: list[str] | Unset = UNSET
    status: ProductStatus | Unset = ProductStatus.DRAFT
    option_names: list[str] | Unset = UNSET
    media: list[CreateMediaDto] | Unset = UNSET
    handle: str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        title = self.title

        variants = []
        for variants_item_data in self.variants:
            variants_item = variants_item_data.to_dict()
            variants.append(variants_item)

        description_html = self.description_html

        vendor = self.vendor

        product_type = self.product_type

        tags: list[str] | Unset = UNSET
        if not isinstance(self.tags, Unset):
            tags = self.tags

        status: str | Unset = UNSET
        if not isinstance(self.status, Unset):
            status = self.status.value

        option_names: list[str] | Unset = UNSET
        if not isinstance(self.option_names, Unset):
            option_names = self.option_names

        media: list[dict[str, Any]] | Unset = UNSET
        if not isinstance(self.media, Unset):
            media = []
            for media_item_data in self.media:
                media_item = media_item_data.to_dict()
                media.append(media_item)

        handle = self.handle

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "title": title,
                "variants": variants,
            }
        )
        if description_html is not UNSET:
            field_dict["descriptionHtml"] = description_html
        if vendor is not UNSET:
            field_dict["vendor"] = vendor
        if product_type is not UNSET:
            field_dict["productType"] = product_type
        if tags is not UNSET:
            field_dict["tags"] = tags
        if status is not UNSET:
            field_dict["status"] = status
        if option_names is not UNSET:
            field_dict["optionNames"] = option_names
        if media is not UNSET:
            field_dict["media"] = media
        if handle is not UNSET:
            field_dict["handle"] = handle

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.create_media_dto import CreateMediaDto
        from ..models.create_variant_dto import CreateVariantDto

        d = dict(src_dict)
        title = d.pop("title")

        variants = []
        _variants = d.pop("variants")
        for variants_item_data in _variants:
            variants_item = CreateVariantDto.from_dict(variants_item_data)

            variants.append(variants_item)

        description_html = d.pop("descriptionHtml", UNSET)

        vendor = d.pop("vendor", UNSET)

        product_type = d.pop("productType", UNSET)

        tags = cast(list[str], d.pop("tags", UNSET))

        _status = d.pop("status", UNSET)
        status: ProductStatus | Unset
        if isinstance(_status, Unset):
            status = UNSET
        else:
            status = ProductStatus(_status)

        option_names = cast(list[str], d.pop("optionNames", UNSET))

        _media = d.pop("media", UNSET)
        media: list[CreateMediaDto] | Unset = UNSET
        if _media is not UNSET:
            media = []
            for media_item_data in _media:
                media_item = CreateMediaDto.from_dict(media_item_data)

                media.append(media_item)

        handle = d.pop("handle", UNSET)

        create_product_dto = cls(
            title=title,
            variants=variants,
            description_html=description_html,
            vendor=vendor,
            product_type=product_type,
            tags=tags,
            status=status,
            option_names=option_names,
            media=media,
            handle=handle,
        )

        create_product_dto.additional_properties = d
        return create_product_dto

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
