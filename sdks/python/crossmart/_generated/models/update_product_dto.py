from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.product_condition import ProductCondition
from ..models.product_status import ProductStatus
from ..types import UNSET, Unset

if TYPE_CHECKING:
    from ..models.create_media_dto import CreateMediaDto
    from ..models.update_variant_dto import UpdateVariantDto


T = TypeVar("T", bound="UpdateProductDto")


@_attrs_define
class UpdateProductDto:
    """
    Attributes:
        title (str):
        handle (str):
        variants (list[UpdateVariantDto]):
        description_html (str | Unset):
        vendor (str | Unset):
        product_type (str | Unset):
        tags (list[str] | Unset):
        status (ProductStatus | Unset):  Default: ProductStatus.DRAFT.
        condition (None | ProductCondition | Unset): The item’s condition, mapped to each store’s own conditions. Left
            out, an update keeps the current one; null clears it. Without one, each store lists it in its default condition.
        option_names (list[str] | Unset):  Example: ['Size', 'Color'].
        media (list[CreateMediaDto] | Unset):
    """

    title: str
    handle: str
    variants: list[UpdateVariantDto]
    description_html: str | Unset = UNSET
    vendor: str | Unset = UNSET
    product_type: str | Unset = UNSET
    tags: list[str] | Unset = UNSET
    status: ProductStatus | Unset = ProductStatus.DRAFT
    condition: None | ProductCondition | Unset = UNSET
    option_names: list[str] | Unset = UNSET
    media: list[CreateMediaDto] | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        title = self.title

        handle = self.handle

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

        condition: None | str | Unset
        if isinstance(self.condition, Unset):
            condition = UNSET
        elif isinstance(self.condition, ProductCondition):
            condition = self.condition.value
        else:
            condition = self.condition

        option_names: list[str] | Unset = UNSET
        if not isinstance(self.option_names, Unset):
            option_names = self.option_names

        media: list[dict[str, Any]] | Unset = UNSET
        if not isinstance(self.media, Unset):
            media = []
            for media_item_data in self.media:
                media_item = media_item_data.to_dict()
                media.append(media_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "title": title,
                "handle": handle,
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
        if condition is not UNSET:
            field_dict["condition"] = condition
        if option_names is not UNSET:
            field_dict["optionNames"] = option_names
        if media is not UNSET:
            field_dict["media"] = media

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.create_media_dto import CreateMediaDto
        from ..models.update_variant_dto import UpdateVariantDto

        d = dict(src_dict)
        title = d.pop("title")

        handle = d.pop("handle")

        variants = []
        _variants = d.pop("variants")
        for variants_item_data in _variants:
            variants_item = UpdateVariantDto.from_dict(variants_item_data)

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

        def _parse_condition(data: object) -> None | ProductCondition | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                condition_type_0 = ProductCondition(data)

                return condition_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | ProductCondition | Unset, data)

        condition = _parse_condition(d.pop("condition", UNSET))

        option_names = cast(list[str], d.pop("optionNames", UNSET))

        _media = d.pop("media", UNSET)
        media: list[CreateMediaDto] | Unset = UNSET
        if _media is not UNSET:
            media = []
            for media_item_data in _media:
                media_item = CreateMediaDto.from_dict(media_item_data)

                media.append(media_item)

        update_product_dto = cls(
            title=title,
            handle=handle,
            variants=variants,
            description_html=description_html,
            vendor=vendor,
            product_type=product_type,
            tags=tags,
            status=status,
            condition=condition,
            option_names=option_names,
            media=media,
        )

        update_product_dto.additional_properties = d
        return update_product_dto

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
