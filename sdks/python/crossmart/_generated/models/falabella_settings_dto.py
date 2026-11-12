from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.falabella_country import FalabellaCountry

T = TypeVar("T", bound="FalabellaSettingsDto")


@_attrs_define
class FalabellaSettingsDto:
    """
    Attributes:
        country (FalabellaCountry):
        seller_id (str):  Example: SC478FA.
        user_id (str): The Seller Center user whose key is used Example: seller@example.com.
        currency_code (str): ISO 4217 code of the country’s currency Example: CLP.
    """

    country: FalabellaCountry
    seller_id: str
    user_id: str
    currency_code: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        country = self.country.value

        seller_id = self.seller_id

        user_id = self.user_id

        currency_code = self.currency_code

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "country": country,
                "sellerId": seller_id,
                "userId": user_id,
                "currencyCode": currency_code,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        country = FalabellaCountry(d.pop("country"))

        seller_id = d.pop("sellerId")

        user_id = d.pop("userId")

        currency_code = d.pop("currencyCode")

        falabella_settings_dto = cls(
            country=country,
            seller_id=seller_id,
            user_id=user_id,
            currency_code=currency_code,
        )

        falabella_settings_dto.additional_properties = d
        return falabella_settings_dto

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
