from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.ebay_marketplace_id import EbayMarketplaceId

if TYPE_CHECKING:
    from ..models.ebay_business_policies_dto import EbayBusinessPoliciesDto
    from ..models.ebay_listing_defaults_dto import EbayListingDefaultsDto


T = TypeVar("T", bound="EbaySettingsDto")


@_attrs_define
class EbaySettingsDto:
    """
    Attributes:
        marketplace_id (EbayMarketplaceId):
        currency_code (str): ISO 4217 code of the marketplace’s currency Example: USD.
        username (str):  Example: demo_seller.
        user_id (str): eBay’s immutable id of the user
        business_policies_enabled (bool): False when the account has not opted in to business policies on eBay
        policies (EbayBusinessPoliciesDto):
        listing_defaults (EbayListingDefaultsDto):
        ready_to_list (bool): Whether listings can be published: policies of each type and a ship-from set
    """

    marketplace_id: EbayMarketplaceId
    currency_code: str
    username: str
    user_id: str
    business_policies_enabled: bool
    policies: EbayBusinessPoliciesDto
    listing_defaults: EbayListingDefaultsDto
    ready_to_list: bool
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        marketplace_id = self.marketplace_id.value

        currency_code = self.currency_code

        username = self.username

        user_id = self.user_id

        business_policies_enabled = self.business_policies_enabled

        policies = self.policies.to_dict()

        listing_defaults = self.listing_defaults.to_dict()

        ready_to_list = self.ready_to_list

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "marketplaceId": marketplace_id,
                "currencyCode": currency_code,
                "username": username,
                "userId": user_id,
                "businessPoliciesEnabled": business_policies_enabled,
                "policies": policies,
                "listingDefaults": listing_defaults,
                "readyToList": ready_to_list,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.ebay_business_policies_dto import EbayBusinessPoliciesDto
        from ..models.ebay_listing_defaults_dto import EbayListingDefaultsDto

        d = dict(src_dict)
        marketplace_id = EbayMarketplaceId(d.pop("marketplaceId"))

        currency_code = d.pop("currencyCode")

        username = d.pop("username")

        user_id = d.pop("userId")

        business_policies_enabled = d.pop("businessPoliciesEnabled")

        policies = EbayBusinessPoliciesDto.from_dict(d.pop("policies"))

        listing_defaults = EbayListingDefaultsDto.from_dict(d.pop("listingDefaults"))

        ready_to_list = d.pop("readyToList")

        ebay_settings_dto = cls(
            marketplace_id=marketplace_id,
            currency_code=currency_code,
            username=username,
            user_id=user_id,
            business_policies_enabled=business_policies_enabled,
            policies=policies,
            listing_defaults=listing_defaults,
            ready_to_list=ready_to_list,
        )

        ebay_settings_dto.additional_properties = d
        return ebay_settings_dto

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
