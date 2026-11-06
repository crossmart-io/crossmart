from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.etsy_listing_setup_dto import EtsyListingSetupDto
    from ..models.etsy_shop_profiles_dto import EtsyShopProfilesDto


T = TypeVar("T", bound="EtsySettingsDto")


@_attrs_define
class EtsySettingsDto:
    """
    Attributes:
        shop_id (str):  Example: 87654321.
        shop_name (str):  Example: ClayAndKiln.
        currency_code (str): ISO 4217 code of the shop’s currency Example: USD.
        shop_url (None | str):  Example: https://www.etsy.com/shop/ClayAndKiln.
        profiles (EtsyShopProfilesDto):
        listing_setup (EtsyListingSetupDto | None): Null until the merchant saves it; publishing needs it
        ready_to_list (bool): Whether the listing setup is complete, so products can be listed
    """

    shop_id: str
    shop_name: str
    currency_code: str
    shop_url: None | str
    profiles: EtsyShopProfilesDto
    listing_setup: EtsyListingSetupDto | None
    ready_to_list: bool
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.etsy_listing_setup_dto import EtsyListingSetupDto

        shop_id = self.shop_id

        shop_name = self.shop_name

        currency_code = self.currency_code

        shop_url: None | str
        shop_url = self.shop_url

        profiles = self.profiles.to_dict()

        listing_setup: dict[str, Any] | None
        if isinstance(self.listing_setup, EtsyListingSetupDto):
            listing_setup = self.listing_setup.to_dict()
        else:
            listing_setup = self.listing_setup

        ready_to_list = self.ready_to_list

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "shopId": shop_id,
                "shopName": shop_name,
                "currencyCode": currency_code,
                "shopUrl": shop_url,
                "profiles": profiles,
                "listingSetup": listing_setup,
                "readyToList": ready_to_list,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.etsy_listing_setup_dto import EtsyListingSetupDto
        from ..models.etsy_shop_profiles_dto import EtsyShopProfilesDto

        d = dict(src_dict)
        shop_id = d.pop("shopId")

        shop_name = d.pop("shopName")

        currency_code = d.pop("currencyCode")

        def _parse_shop_url(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        shop_url = _parse_shop_url(d.pop("shopUrl"))

        profiles = EtsyShopProfilesDto.from_dict(d.pop("profiles"))

        def _parse_listing_setup(data: object) -> EtsyListingSetupDto | None:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                listing_setup_type_0 = EtsyListingSetupDto.from_dict(data)

                return listing_setup_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(EtsyListingSetupDto | None, data)

        listing_setup = _parse_listing_setup(d.pop("listingSetup"))

        ready_to_list = d.pop("readyToList")

        etsy_settings_dto = cls(
            shop_id=shop_id,
            shop_name=shop_name,
            currency_code=currency_code,
            shop_url=shop_url,
            profiles=profiles,
            listing_setup=listing_setup,
            ready_to_list=ready_to_list,
        )

        etsy_settings_dto.additional_properties = d
        return etsy_settings_dto

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
