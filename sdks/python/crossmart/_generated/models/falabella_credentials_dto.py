from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.falabella_country import FalabellaCountry

T = TypeVar("T", bound="FalabellaCredentialsDto")


@_attrs_define
class FalabellaCredentialsDto:
    """
    Attributes:
        seller_id (str): The seller id, under Mi cuenta in Seller Center Example: SC478FA.
        user_id (str): The Seller Center user’s email (Mi cuenta, Usuarios). See
            https://developers.falabella.com/docs/operate-with-apis Example: seller@example.com.
        api_key (str): The user’s API key, from the Api Key column of Mi cuenta, Usuarios. Stored encrypted; never
            returned.
        country (FalabellaCountry):
    """

    seller_id: str
    user_id: str
    api_key: str
    country: FalabellaCountry
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        seller_id = self.seller_id

        user_id = self.user_id

        api_key = self.api_key

        country = self.country.value

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "sellerId": seller_id,
                "userId": user_id,
                "apiKey": api_key,
                "country": country,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        seller_id = d.pop("sellerId")

        user_id = d.pop("userId")

        api_key = d.pop("apiKey")

        country = FalabellaCountry(d.pop("country"))

        falabella_credentials_dto = cls(
            seller_id=seller_id,
            user_id=user_id,
            api_key=api_key,
            country=country,
        )

        falabella_credentials_dto.additional_properties = d
        return falabella_credentials_dto

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
