from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.pricing_preview_product_dto import PricingPreviewProductDto
    from ..models.pricing_preview_variant_dto import PricingPreviewVariantDto


T = TypeVar("T", bound="PricingPreviewDto")


@_attrs_define
class PricingPreviewDto:
    """
    Attributes:
        currency_code (str):  Example: USD.
        product (None | PricingPreviewProductDto):
        variants (list[PricingPreviewVariantDto]):
    """

    currency_code: str
    product: None | PricingPreviewProductDto
    variants: list[PricingPreviewVariantDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.pricing_preview_product_dto import PricingPreviewProductDto

        currency_code = self.currency_code

        product: dict[str, Any] | None
        if isinstance(self.product, PricingPreviewProductDto):
            product = self.product.to_dict()
        else:
            product = self.product

        variants = []
        for variants_item_data in self.variants:
            variants_item = variants_item_data.to_dict()
            variants.append(variants_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "currencyCode": currency_code,
                "product": product,
                "variants": variants,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.pricing_preview_product_dto import PricingPreviewProductDto
        from ..models.pricing_preview_variant_dto import PricingPreviewVariantDto

        d = dict(src_dict)
        currency_code = d.pop("currencyCode")

        def _parse_product(data: object) -> None | PricingPreviewProductDto:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                product_type_0 = PricingPreviewProductDto.from_dict(data)

                return product_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | PricingPreviewProductDto, data)

        product = _parse_product(d.pop("product"))

        variants = []
        _variants = d.pop("variants")
        for variants_item_data in _variants:
            variants_item = PricingPreviewVariantDto.from_dict(variants_item_data)

            variants.append(variants_item)

        pricing_preview_dto = cls(
            currency_code=currency_code,
            product=product,
            variants=variants,
        )

        pricing_preview_dto.additional_properties = d
        return pricing_preview_dto

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
