from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.etsy_when_made import EtsyWhenMade
from ..models.etsy_who_made import EtsyWhoMade

T = TypeVar("T", bound="EtsyListingSetupDto")


@_attrs_define
class EtsyListingSetupDto:
    """
    Attributes:
        who_made (EtsyWhoMade):
        when_made (EtsyWhenMade):
        is_supply (bool): Whether the items are craft supplies rather than finished products
        shipping_profile_id (None | str): The shipping profile listings use; null when the shop has none or several and
            none is chosen
        processing_profile_id (None | str): The processing profile listings use
    """

    who_made: EtsyWhoMade
    when_made: EtsyWhenMade
    is_supply: bool
    shipping_profile_id: None | str
    processing_profile_id: None | str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        who_made = self.who_made.value

        when_made = self.when_made.value

        is_supply = self.is_supply

        shipping_profile_id: None | str
        shipping_profile_id = self.shipping_profile_id

        processing_profile_id: None | str
        processing_profile_id = self.processing_profile_id

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "whoMade": who_made,
                "whenMade": when_made,
                "isSupply": is_supply,
                "shippingProfileId": shipping_profile_id,
                "processingProfileId": processing_profile_id,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        who_made = EtsyWhoMade(d.pop("whoMade"))

        when_made = EtsyWhenMade(d.pop("whenMade"))

        is_supply = d.pop("isSupply")

        def _parse_shipping_profile_id(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        shipping_profile_id = _parse_shipping_profile_id(d.pop("shippingProfileId"))

        def _parse_processing_profile_id(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        processing_profile_id = _parse_processing_profile_id(
            d.pop("processingProfileId")
        )

        etsy_listing_setup_dto = cls(
            who_made=who_made,
            when_made=when_made,
            is_supply=is_supply,
            shipping_profile_id=shipping_profile_id,
            processing_profile_id=processing_profile_id,
        )

        etsy_listing_setup_dto.additional_properties = d
        return etsy_listing_setup_dto

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
