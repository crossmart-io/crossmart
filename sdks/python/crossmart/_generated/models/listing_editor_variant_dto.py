from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.inherited_compare_at_price_dto import InheritedCompareAtPriceDto
    from ..models.inherited_price_dto import InheritedPriceDto
    from ..models.resolved_price_dto import ResolvedPriceDto


T = TypeVar("T", bound="ListingEditorVariantDto")


@_attrs_define
class ListingEditorVariantDto:
    """
    Attributes:
        variant_id (UUID):
        title (str):  Example: Blue / Large.
        sku (None | str):
        price (InheritedPriceDto):
        compare_at_price (InheritedCompareAtPriceDto):
        resolved_price (ResolvedPriceDto):
        quantity (float | None): The stock the store shows; null when the variant does not track stock
    """

    variant_id: UUID
    title: str
    sku: None | str
    price: InheritedPriceDto
    compare_at_price: InheritedCompareAtPriceDto
    resolved_price: ResolvedPriceDto
    quantity: float | None
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        variant_id = str(self.variant_id)

        title = self.title

        sku: None | str
        sku = self.sku

        price = self.price.to_dict()

        compare_at_price = self.compare_at_price.to_dict()

        resolved_price = self.resolved_price.to_dict()

        quantity: float | None
        quantity = self.quantity

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "variantId": variant_id,
                "title": title,
                "sku": sku,
                "price": price,
                "compareAtPrice": compare_at_price,
                "resolvedPrice": resolved_price,
                "quantity": quantity,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.inherited_compare_at_price_dto import InheritedCompareAtPriceDto
        from ..models.inherited_price_dto import InheritedPriceDto
        from ..models.resolved_price_dto import ResolvedPriceDto

        d = dict(src_dict)
        variant_id = UUID(d.pop("variantId"))

        title = d.pop("title")

        def _parse_sku(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        sku = _parse_sku(d.pop("sku"))

        price = InheritedPriceDto.from_dict(d.pop("price"))

        compare_at_price = InheritedCompareAtPriceDto.from_dict(d.pop("compareAtPrice"))

        resolved_price = ResolvedPriceDto.from_dict(d.pop("resolvedPrice"))

        def _parse_quantity(data: object) -> float | None:
            if data is None:
                return data
            return cast(float | None, data)

        quantity = _parse_quantity(d.pop("quantity"))

        listing_editor_variant_dto = cls(
            variant_id=variant_id,
            title=title,
            sku=sku,
            price=price,
            compare_at_price=compare_at_price,
            resolved_price=resolved_price,
            quantity=quantity,
        )

        listing_editor_variant_dto.additional_properties = d
        return listing_editor_variant_dto

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
