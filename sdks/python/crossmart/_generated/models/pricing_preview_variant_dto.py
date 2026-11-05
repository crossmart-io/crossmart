from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.resolved_price_dto import ResolvedPriceDto


T = TypeVar("T", bound="PricingPreviewVariantDto")


@_attrs_define
class PricingPreviewVariantDto:
    """
    Attributes:
        variant_id (UUID):
        title (str):  Example: Blue / Large.
        base_price (str):  Example: 89.00.
        cost (None | str):
        resolved (ResolvedPriceDto):
    """

    variant_id: UUID
    title: str
    base_price: str
    cost: None | str
    resolved: ResolvedPriceDto
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        variant_id = str(self.variant_id)

        title = self.title

        base_price = self.base_price

        cost: None | str
        cost = self.cost

        resolved = self.resolved.to_dict()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "variantId": variant_id,
                "title": title,
                "basePrice": base_price,
                "cost": cost,
                "resolved": resolved,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.resolved_price_dto import ResolvedPriceDto

        d = dict(src_dict)
        variant_id = UUID(d.pop("variantId"))

        title = d.pop("title")

        base_price = d.pop("basePrice")

        def _parse_cost(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        cost = _parse_cost(d.pop("cost"))

        resolved = ResolvedPriceDto.from_dict(d.pop("resolved"))

        pricing_preview_variant_dto = cls(
            variant_id=variant_id,
            title=title,
            base_price=base_price,
            cost=cost,
            resolved=resolved,
        )

        pricing_preview_variant_dto.additional_properties = d
        return pricing_preview_variant_dto

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
