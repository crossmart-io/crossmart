from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.etsy_profile_dto import EtsyProfileDto


T = TypeVar("T", bound="EtsyShopProfilesDto")


@_attrs_define
class EtsyShopProfilesDto:
    """
    Attributes:
        shipping (list[EtsyProfileDto]):
        processing (list[EtsyProfileDto]): Processing profiles: whether items are ready to ship or made to order, and
            how long they take
    """

    shipping: list[EtsyProfileDto]
    processing: list[EtsyProfileDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        shipping = []
        for shipping_item_data in self.shipping:
            shipping_item = shipping_item_data.to_dict()
            shipping.append(shipping_item)

        processing = []
        for processing_item_data in self.processing:
            processing_item = processing_item_data.to_dict()
            processing.append(processing_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "shipping": shipping,
                "processing": processing,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.etsy_profile_dto import EtsyProfileDto

        d = dict(src_dict)
        shipping = []
        _shipping = d.pop("shipping")
        for shipping_item_data in _shipping:
            shipping_item = EtsyProfileDto.from_dict(shipping_item_data)

            shipping.append(shipping_item)

        processing = []
        _processing = d.pop("processing")
        for processing_item_data in _processing:
            processing_item = EtsyProfileDto.from_dict(processing_item_data)

            processing.append(processing_item)

        etsy_shop_profiles_dto = cls(
            shipping=shipping,
            processing=processing,
        )

        etsy_shop_profiles_dto.additional_properties = d
        return etsy_shop_profiles_dto

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
