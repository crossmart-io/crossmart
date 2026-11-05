from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.google_target_country import GoogleTargetCountry

if TYPE_CHECKING:
    from ..models.google_listing_setup_dto import GoogleListingSetupDto


T = TypeVar("T", bound="GoogleMerchantSettingsDto")


@_attrs_define
class GoogleMerchantSettingsDto:
    """
    Attributes:
        account_id (str):  Example: 123456789.
        account_name (str):  Example: Acme Goods.
        homepage_uri (None | str): The website the account claimed; product links must be on it
        homepage_claimed (bool): Whether the account verified and claimed its website
        country (GoogleTargetCountry):
        currency_code (str): ISO 4217 code of the country’s currency Example: USD.
        content_language (str): The language listings are written in Example: en.
        listing_setup (GoogleListingSetupDto | None): Null until the merchant saves it; publishing needs it
        ready_to_list (bool): Whether the listing setup is saved, so products can be listed
    """

    account_id: str
    account_name: str
    homepage_uri: None | str
    homepage_claimed: bool
    country: GoogleTargetCountry
    currency_code: str
    content_language: str
    listing_setup: GoogleListingSetupDto | None
    ready_to_list: bool
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.google_listing_setup_dto import GoogleListingSetupDto

        account_id = self.account_id

        account_name = self.account_name

        homepage_uri: None | str
        homepage_uri = self.homepage_uri

        homepage_claimed = self.homepage_claimed

        country = self.country.value

        currency_code = self.currency_code

        content_language = self.content_language

        listing_setup: dict[str, Any] | None
        if isinstance(self.listing_setup, GoogleListingSetupDto):
            listing_setup = self.listing_setup.to_dict()
        else:
            listing_setup = self.listing_setup

        ready_to_list = self.ready_to_list

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "accountId": account_id,
                "accountName": account_name,
                "homepageUri": homepage_uri,
                "homepageClaimed": homepage_claimed,
                "country": country,
                "currencyCode": currency_code,
                "contentLanguage": content_language,
                "listingSetup": listing_setup,
                "readyToList": ready_to_list,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.google_listing_setup_dto import GoogleListingSetupDto

        d = dict(src_dict)
        account_id = d.pop("accountId")

        account_name = d.pop("accountName")

        def _parse_homepage_uri(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        homepage_uri = _parse_homepage_uri(d.pop("homepageUri"))

        homepage_claimed = d.pop("homepageClaimed")

        country = GoogleTargetCountry(d.pop("country"))

        currency_code = d.pop("currencyCode")

        content_language = d.pop("contentLanguage")

        def _parse_listing_setup(data: object) -> GoogleListingSetupDto | None:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                listing_setup_type_0 = GoogleListingSetupDto.from_dict(data)

                return listing_setup_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(GoogleListingSetupDto | None, data)

        listing_setup = _parse_listing_setup(d.pop("listingSetup"))

        ready_to_list = d.pop("readyToList")

        google_merchant_settings_dto = cls(
            account_id=account_id,
            account_name=account_name,
            homepage_uri=homepage_uri,
            homepage_claimed=homepage_claimed,
            country=country,
            currency_code=currency_code,
            content_language=content_language,
            listing_setup=listing_setup,
            ready_to_list=ready_to_list,
        )

        google_merchant_settings_dto.additional_properties = d
        return google_merchant_settings_dto

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
