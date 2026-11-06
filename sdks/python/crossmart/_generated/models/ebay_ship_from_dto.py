from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="EbayShipFromDto")


@_attrs_define
class EbayShipFromDto:
    """
    Attributes:
        postal_code (str):  Example: 95125.
        country (str): ISO 3166 alpha-2 country code Example: US.
        city (None | str):  Example: San Jose.
    """

    postal_code: str
    country: str
    city: None | str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        postal_code = self.postal_code

        country = self.country

        city: None | str
        city = self.city

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "postalCode": postal_code,
                "country": country,
                "city": city,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        postal_code = d.pop("postalCode")

        country = d.pop("country")

        def _parse_city(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        city = _parse_city(d.pop("city"))

        ebay_ship_from_dto = cls(
            postal_code=postal_code,
            country=country,
            city=city,
        )

        ebay_ship_from_dto.additional_properties = d
        return ebay_ship_from_dto

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
