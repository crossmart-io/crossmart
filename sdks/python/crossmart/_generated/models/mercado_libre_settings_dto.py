from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.mercado_libre_site_id import MercadoLibreSiteId

T = TypeVar("T", bound="MercadoLibreSettingsDto")


@_attrs_define
class MercadoLibreSettingsDto:
    """
    Attributes:
        user_id (str): The seller’s Mercado Libre user id Example: 1008002397.
        nickname (str):  Example: TESTSELLER.
        site_id (MercadoLibreSiteId): The country site the seller sells on
        currency_code (str): ISO 4217 code of the site’s currency Example: MXN.
        permalink (None | str):  Example: http://perfil.mercadolibre.com.mx/TESTSELLER.
        user_product_seller (bool): Whether the seller lists under User Products: one item per variant, each with its
            own price
    """

    user_id: str
    nickname: str
    site_id: MercadoLibreSiteId
    currency_code: str
    permalink: None | str
    user_product_seller: bool
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        user_id = self.user_id

        nickname = self.nickname

        site_id = self.site_id.value

        currency_code = self.currency_code

        permalink: None | str
        permalink = self.permalink

        user_product_seller = self.user_product_seller

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "userId": user_id,
                "nickname": nickname,
                "siteId": site_id,
                "currencyCode": currency_code,
                "permalink": permalink,
                "userProductSeller": user_product_seller,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        user_id = d.pop("userId")

        nickname = d.pop("nickname")

        site_id = MercadoLibreSiteId(d.pop("siteId"))

        currency_code = d.pop("currencyCode")

        def _parse_permalink(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        permalink = _parse_permalink(d.pop("permalink"))

        user_product_seller = d.pop("userProductSeller")

        mercado_libre_settings_dto = cls(
            user_id=user_id,
            nickname=nickname,
            site_id=site_id,
            currency_code=currency_code,
            permalink=permalink,
            user_product_seller=user_product_seller,
        )

        mercado_libre_settings_dto.additional_properties = d
        return mercado_libre_settings_dto

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
