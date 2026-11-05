from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.shopify_location_dto import ShopifyLocationDto


T = TypeVar("T", bound="ShopifySettingsDto")


@_attrs_define
class ShopifySettingsDto:
    """
    Attributes:
        shop_name (str):
        currency_code (str): ISO 4217 code of the store’s currency Example: USD.
        iana_timezone (None | str):  Example: America/New_York.
        primary_domain_url (None | str): The storefront’s public URL
        primary_location (None | ShopifyLocationDto): Where Crossmart reads and writes stock
    """

    shop_name: str
    currency_code: str
    iana_timezone: None | str
    primary_domain_url: None | str
    primary_location: None | ShopifyLocationDto
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.shopify_location_dto import ShopifyLocationDto

        shop_name = self.shop_name

        currency_code = self.currency_code

        iana_timezone: None | str
        iana_timezone = self.iana_timezone

        primary_domain_url: None | str
        primary_domain_url = self.primary_domain_url

        primary_location: dict[str, Any] | None
        if isinstance(self.primary_location, ShopifyLocationDto):
            primary_location = self.primary_location.to_dict()
        else:
            primary_location = self.primary_location

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "shopName": shop_name,
                "currencyCode": currency_code,
                "ianaTimezone": iana_timezone,
                "primaryDomainUrl": primary_domain_url,
                "primaryLocation": primary_location,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.shopify_location_dto import ShopifyLocationDto

        d = dict(src_dict)
        shop_name = d.pop("shopName")

        currency_code = d.pop("currencyCode")

        def _parse_iana_timezone(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        iana_timezone = _parse_iana_timezone(d.pop("ianaTimezone"))

        def _parse_primary_domain_url(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        primary_domain_url = _parse_primary_domain_url(d.pop("primaryDomainUrl"))

        def _parse_primary_location(data: object) -> None | ShopifyLocationDto:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                primary_location_type_0 = ShopifyLocationDto.from_dict(data)

                return primary_location_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | ShopifyLocationDto, data)

        primary_location = _parse_primary_location(d.pop("primaryLocation"))

        shopify_settings_dto = cls(
            shop_name=shop_name,
            currency_code=currency_code,
            iana_timezone=iana_timezone,
            primary_domain_url=primary_domain_url,
            primary_location=primary_location,
        )

        shopify_settings_dto.additional_properties = d
        return shopify_settings_dto

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
