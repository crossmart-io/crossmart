from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.resolved_price_dto import ResolvedPriceDto


T = TypeVar("T", bound="ChannelVariantDto")


@_attrs_define
class ChannelVariantDto:
    """
    Attributes:
        variant_id (UUID):
        title (str):  Example: Blue / Large.
        price (ResolvedPriceDto):
        quantity (float | None): The stock the channel shows; null when the variant does not track stock
    """

    variant_id: UUID
    title: str
    price: ResolvedPriceDto
    quantity: float | None
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        variant_id = str(self.variant_id)

        title = self.title

        price = self.price.to_dict()

        quantity: float | None
        quantity = self.quantity

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "variantId": variant_id,
                "title": title,
                "price": price,
                "quantity": quantity,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.resolved_price_dto import ResolvedPriceDto

        d = dict(src_dict)
        variant_id = UUID(d.pop("variantId"))

        title = d.pop("title")

        price = ResolvedPriceDto.from_dict(d.pop("price"))

        def _parse_quantity(data: object) -> float | None:
            if data is None:
                return data
            return cast(float | None, data)

        quantity = _parse_quantity(d.pop("quantity"))

        channel_variant_dto = cls(
            variant_id=variant_id,
            title=title,
            price=price,
            quantity=quantity,
        )

        channel_variant_dto.additional_properties = d
        return channel_variant_dto

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
